import { Injectable } from '@angular/core';

import { Observable, of, forkJoin, throwError, BehaviorSubject } from "rxjs";
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
    WebRTCServerSummary
} from './video-objects'
import { LoginService } from './login.service';
import { IViinexRpc } from './viinex-rpc';

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
        login.rpc.subscribe(rpc => {
            if(rpc==null){
                this._videoObjects.next(new VideoObjects());
            }
            else{
                this.rebuildVideoObjects(rpc);
            }
        });
    }

    private _videoObjects: BehaviorSubject<VideoObjects> = new BehaviorSubject(new VideoObjects());

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

    getObjects(): Observable<VideoObjects>{
        return this._videoObjects.asObservable()
    }
    getVideoSource(videoSourceId: string) : Observable<VideoSource> {
        return this.getObjects().pipe(map(vo => vo.videoSources.find(vs => vs.name==videoSourceId)));
    }
    getVideoArchive(videoArchiveId: string) : Observable <VideoArchive>
    {
        return this.getObjects().pipe(map(vo => vo.videoArchives.find(va => va.name==videoArchiveId)));
    }
    getVideoTrack(videoArchiveId: string, videoSourceId: string){
        return this.getVideoArchive(videoArchiveId).pipe(map(va => va.videoTracks.find(vt => vt.videoSource.name==videoSourceId)));
    }
    private static extractSvcData(rpc: IViinexRpc, res: Object, resMeta: Object){
        let body=res as Array<Array<string>>;
        let bodyMeta=resMeta;
        let vo=new VideoObjects();
        let vs=new Array<VideoSource>();
        let va=new Array<VideoArchive>();
        let wr=new Array<WebRTCServer>();
        for(let tn of body){
            let [t,n]=tn;
            switch(t){
                case "VideoSource": {
                    let s=new VideoSource(n, true, bodyMeta[n]);
                    s.getStreamDetails=rpc.liveStreamDetails(n).pipe(map(VideoObjectsService.extractLiveStreamDetails));
                    for(let tn1 of body){
                        let [t1,n1]=tn1;
                        if(t1=="SnapshotSource" && n1==n){
                            s.getSnapshotImage = (spatial: any) => rpc.liveSnapshotImage(n, spatial);
                        }
                    }
                    vs.push(s);
                    break;
                }
                case "VideoStorage": {
                    let x=new VideoArchive(n, bodyMeta[n]); 
                    x.getSummary=function(){
                        return rpc.archiveSummary(n).pipe(map(r => {
                            let s=VideoObjectsService.extractArchiveSummary(r);
                            x.summarySnapshot=s;
                            return s;
                        }));
                    };
                    va.push(x);
                    break;
                }
                case "WebRTC": {
                    let w = new WebRTCServer(rpc, n, bodyMeta[n]);
                    wr.push(w);
                    break;
                }
            }
        }
        vo.videoSources=vs;
        vo.videoArchives=va;
        vo.webrtcServers=wr;
        return vo;
    }
    private static extractLiveStreamDetails(body: Object){
        let d=new LiveStreamDetails();
        d.bitrate=body["bitrate"];
        d.framerate=body["framerate"];
        d.resolution=body["resolution"];
        d.lastFrame=new Date(body["last_frame"]);
        return d;
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

    private static extractArchiveSummary(res: Object): VideoArchiveSummary{
        let body=<any>res;
        let vas=new VideoArchiveSummary();
        vas.diskFreeSpace=body.disk_free_space;
        vas.diskUsage=body.disk_usage;
        vas.tracks=new Map<string,VideoTrackSummary>();
        for(let tn in body.contexts){
            let c=<any>body.contexts[tn];
            let ts=new VideoTrackSummary(VideoObjectsService.jsonDateInterval(c.time_boundaries), c.disk_usage);
            vas.tracks.set(tn, ts);
        }
        return vas;
    }
    private static createTracks(rpc: IViinexRpc, vs:Array<VideoSource>, a: VideoArchive, vas:VideoArchiveSummary){
        vas.tracks.forEach((t: VideoTrackSummary, n:string) => {
            let vsrc=this.lookupOrAddArchiveVideoSource(vs, n);
            let vt=new VideoTrack(vsrc, a);
            vt.getTrackData=function(){ return rpc.archiveChannelSummary(a.name,n).pipe(map(VideoObjectsService.extractTrackData)); }
            a.videoTracks.push(vt);
            vsrc.videoTracks.push(vt);
        });
    }

    private static extractTrackData(res:Object): VideoTrackData {
        let body=<any>res;
        let td=new VideoTrackData();
        td.summary=new VideoTrackSummary(VideoObjectsService.jsonDateInterval(body.time_boundaries), body.disk_usage);
        td.timeLine=body.timeline!=null?body.timeline.map(VideoObjectsService.jsonDateInterval):null;
        return td;
    }

    static jsonDateInterval(ii: any): [Date,Date]{
        if(ii!=null){
            return [new Date(ii[0]), new Date(ii[1])];
        } 
        else {
            return null;
        }
    }

    private static lookupOrAddArchiveVideoSource(vs: Array<VideoSource>, n:string): VideoSource
    {
        let res=vs.find(x => {
            return x.name==n;
        });
        if(!res){
            res=new VideoSource(n, false, null);
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