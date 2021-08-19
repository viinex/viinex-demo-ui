import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, of, forkJoin } from "rxjs";
import {map, mergeMap} from 'rxjs/operators'

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

@Injectable()
export class VideoObjectsService {
    constructor(private http: HttpClient){}

    getObjects(): Observable<VideoObjects>{
        let svcs = forkJoin(
            [this.http.get("v1/svc"), 
            this.http.get("v1/svc/meta")]);
        return svcs.pipe(
            map(([res,resMeta]) => VideoObjectsService.extractSvcData(this.http, res, resMeta)),
            mergeMap((vo:VideoObjects) => VideoObjectsService.linkWebRTCServers(this.http, vo)),
            mergeMap((vo:VideoObjects) => VideoObjectsService.createAllTracks(this.http, vo))
        );
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
    private static extractSvcData(http: HttpClient, res: Object, resMeta: Object){
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
                    s.getStreamDetails=http.get("v1/svc/"+n).pipe(map(VideoObjectsService.extractLiveStreamDetails));
                    for(let tn1 of body){
                        let [t1,n1]=tn1;
                        if(t1=="SnapshotSource" && n1==n){
                            s.getSnapshotImage="v1/svc/"+n+"/snapshot";
                        }
                    }
                    vs.push(s);
                    break;
                }
                case "VideoStorage": {
                    let x=new VideoArchive(n, bodyMeta[n]); 
                    x.getSummary=function(){
                        return http.get("v1/svc/"+n).pipe(map(r => {
                            let s=VideoObjectsService.extractArchiveSummary(r);
                            x.summarySnapshot=s;
                            return s;
                        }));
                    };
                    va.push(x);
                    break;
                }
                case "WebRTC": {
                    let w = new WebRTCServer(http, n, bodyMeta[n]);
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
    private static createAllTracks(http: HttpClient, vo: VideoObjects): Observable<VideoObjects> {
        if(vo.videoArchives==null || vo.videoArchives.length==0){
            return of(vo);
        }
        return forkJoin(vo.videoArchives.map(a => { return a.getSummary() })).pipe(map(
            res => {
                for(let k=0; k<vo.videoArchives.length; ++k){
                    VideoObjectsService.createTracks(http, vo.videoSources, vo.videoArchives[k], res[k]);
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
    private static createTracks(http: HttpClient, vs:Array<VideoSource>, a: VideoArchive, vas:VideoArchiveSummary){
        vas.tracks.forEach((t: VideoTrackSummary, n:string) => {
            let vsrc=this.lookupOrAddArchiveVideoSource(vs, n);
            let vt=new VideoTrack(vsrc, a);
            vt.getTrackData=function(){ return http.get("v1/svc/"+a.name+"/"+n).pipe(map(VideoObjectsService.extractTrackData)); }
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

    private static linkWebRTCServers(http: HttpClient, vo: VideoObjects): Observable<VideoObjects> {
        if(vo.webrtcServers==null || vo.webrtcServers.length==0){
            return of(vo);
        }
        let summaries = vo.webrtcServers.map((w: WebRTCServer) => { 
            return http.get<WebRTCServerSummary>("v1/svc/"+w.name);
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