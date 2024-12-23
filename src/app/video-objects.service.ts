import { Injectable } from '@angular/core';

import { Observable, of, forkJoin, throwError, ReplaySubject, Subject } from "rxjs";
import {map, mergeMap, shareReplay} from 'rxjs/operators'

import { 
    VideoObjects, 
    VideoArchive, 
    VideoSource, 
    VideoArchiveSummary, 
    VideoTrack, 
    VideoTrackData, 
    VideoTrackSummary,
    LiveStreamDetails,
    WebRTCServer,
    WebRTCServerSummary,
    Misc,
    EventArchive,
    Stateful,
    Updateable,
    KeyValueStore
} from './video-objects'
import { LoginService } from './login.service';
import { IViinexRpc } from './viinex-rpc';
import { AutoCheckpoint, RailwayTrack } from './apps/apps-objects';

function trace(msg : string) {
    return (o: Observable<any>) => {
        return o.pipe(map(v => {
            console.log(msg,v);
            return v;
        }));
    }
}


@Injectable()
export class VideoObjectsService {
    constructor(private login: LoginService){
        login.loginStatus.subscribe(ls => {
            if(ls.rpc==null){
                this._videoObjects.next(new VideoObjects());
            }
            else{
                this.rebuildVideoObjects(ls.rpc);
                ls.rpc.events.subscribe(e => this._events.next(e));
            }
        });
    }

    private _videoObjects: ReplaySubject<VideoObjects> = new ReplaySubject(1);
    private _events : Subject<any> = new Subject();

    public get events () : Observable<any> {
        return this._events.asObservable();
    }

    private rebuildVideoObjects(rpc:IViinexRpc){
        let svcs = forkJoin([rpc.svc(), rpc.meta()]);
        svcs.pipe(
            //trace("TRACE svc meta"),
            map(([res,resMeta]) => VideoObjectsService.extractSvcData(rpc, res, resMeta)),
            //trace("TRACE extract svc data"),
            mergeMap((vo:VideoObjects) => VideoObjectsService.linkWebRTCServers(rpc, vo)),
            //trace("TRACE link webrtc servers"),
            mergeMap((vo:VideoObjects) => VideoObjectsService.createAllTracks(rpc, vo)),
            //trace("TRACE create all tracks")
        ).subscribe(vo => this._videoObjects.next(vo));
    }

    get objects(): Observable<VideoObjects>{
        return this._videoObjects.asObservable()
    }
    getVideoSource(videoSourceId: string) : Observable<VideoSource> {
        return this.objects.pipe(map(vo => vo.videoSources.find(vs => vs.name==videoSourceId)));
    }
    getVideoArchive(videoArchiveId: string) : Observable <VideoArchive>
    {
        return this.objects.pipe(map(vo => vo.videoArchives.find(va => va.name==videoArchiveId)));
    }
    getVideoTrack(videoArchiveId: string, videoSourceId: string){
        if(videoArchiveId!=null){
            return this.getVideoArchive(videoArchiveId).pipe(map(va => va.videoTracks.find(vt => vt.videoSource.name==videoSourceId)));
        }
        else{
            return this.getVideoSource(videoSourceId).pipe(map(vs => vs.videoTracks.find(vt => vt.videoArchive==null)));
        }
    }
    private static extractSvcData(rpc: IViinexRpc, res: Object, resMeta: Object){
        let body=res as Array<Array<string>>;
        let bodyMeta : any = resMeta;
        let typesByName: Map<string, Array<string>>=new Map<string, Array<string>>();
        for (let [type, name] of body) {
            let types : Array<string> =typesByName.get(name);
            if(!types){
                types = [];
                typesByName.set(name, types);
            }
            types.push(type);
        }
        let vo=new VideoObjects();
        for(let [type, name] of body){
            let meta = bodyMeta[name];
            switch(type){
                case "VideoSource": {
                    vo.videoSources.push(new VideoSource(rpc, name, meta, true, typesByName.get(name)));
                    break;
                }
                case "VideoStorage": {
                    vo.videoArchives.push(new VideoArchive(rpc, name, meta));
                    break;
                }
                case "WebRTC": {
                    vo.webrtcServers.push(new WebRTCServer(rpc, name, meta));
                    break;
                }
                case "EventArchive":{
                    vo.eventArchives.push(new EventArchive(rpc, name, meta));
                    break;
                }
                case "Stateful":{
                    let s = new Stateful(rpc, name,meta);
                    vo.statefuls.push(s);
                    if(["RailwayTrack","AutoCheckpoint"].indexOf(s.metaData?.type)>=0){
                        vo.applications.push(s);
                    }
                    break;
                }
                case "Updateable":{
                    vo.updateables.push(new Updateable(rpc, name,meta));
                    break;
                }
                case "KeyValueStore":{
                    vo.keyValueStores.push(new KeyValueStore(rpc, name, meta));
                    break;
                }
            }
        }
        // assembly "vertical applications" objects
        vo.applications.forEach(a => {
            if(a.metaData.type===AutoCheckpoint.type){
                vo.appsAutoCheckpoint.push(new AutoCheckpoint(a, vo));
            }
            if(a.metaData.type===RailwayTrack.type){
                vo.appsRailwayTrack.push(new RailwayTrack(a, vo));
            }
        });
        return vo;
    }
    private static createAllTracks(rpc: IViinexRpc, vo: VideoObjects): Observable<VideoObjects> {
        if(vo.videoArchives==null || vo.videoArchives.length==0){
            return of(vo);
        }
        return forkJoin(vo.videoArchives.map(a => { return a.getSummary() })).pipe(map(
            res => {
                for(let k=0; k<vo.videoArchives.length; ++k){
                    VideoObjectsService.createTracks(rpc, vo.videoSources, vo.videoArchives[k], res[k]);
                }
                return vo;
            }
        ));
    }

    private static createTracks(rpc: IViinexRpc, vs:Array<VideoSource>, a: VideoArchive, vas:VideoArchiveSummary){
        vas.tracks.forEach((t: VideoTrackSummary, n:string) => {
            let vsrc=this.lookupOrAddArchiveVideoSource(rpc, vs, n);
            let vt=new VideoTrack(rpc, vsrc, a);
            a.videoTracks.push(vt);
            vsrc.videoTracks.push(vt);
        });
    }

    private static lookupOrAddArchiveVideoSource(rpc: IViinexRpc, vs: Array<VideoSource>, n:string): VideoSource
    {
        let res=vs.find(x => {
            return x.name==n;
        });
        if(!res){
            res=new VideoSource(rpc, n, null, false, []);
            vs.push(res);
        }
        return res;
    }

    private static linkWebRTCServers(rpc: IViinexRpc, vo: VideoObjects): Observable<VideoObjects> {
        if(vo.webrtcServers==null || vo.webrtcServers.length==0){
            return of(vo);
        }
        let summaries = vo.webrtcServers.map((w: WebRTCServer) => { 
            return rpc.webrtcServerSummary(w.name);
        });
        return forkJoin(summaries).pipe(map(res => {
                for(let k=0; k<vo.webrtcServers.length; ++k){
                    let w = vo.webrtcServers[k];
                    let r = res[k];
                    r.live.forEach(src => {
                        let vs = vo.videoSources.find(e => e.name==src);
                        if(vs){
                            vs.webrtcServers.push(w);
                            w.videoSources.push(vs);
                        }
                    });
                }
                return vo;
            })
        );
    }

}