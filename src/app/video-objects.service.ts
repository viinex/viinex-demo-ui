import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/forkJoin';

import { 
    VideoObjects, 
    VideoArchive, 
    VideoSource, 
    VideoArchiveSummary, 
    VideoTrack, 
    VideoTrackData, 
    VideoTrackSummary 
} from './video-objects'

@Injectable()
export class VideoObjectsService {
    constructor(private http: Http){}
    getObjects(): Observable<VideoObjects>{
        return this.http.get("/v1/svc")
                        .map((res:Response) => VideoObjectsService.extractSvcData(this.http, res))
                        .mergeMap((vo:VideoObjects) => VideoObjectsService.createAllTracks(this.http, vo));
    }
    getVideoSource(videoSourceId: string) : Observable<VideoSource>
    {
        return this.getObjects().map(vo => vo.videoSources.find(vs => vs.name==videoSourceId));
    }
    private static extractSvcData(http: Http, res: Response){
        let body=res.json();
        let vo=new VideoObjects();
        let vs=new Array<VideoSource>();
        let va=new Array<VideoArchive>();
        for(let n in body){
            switch(body[n]){
                case "VideoSource": {
                    vs.push(new VideoSource(n, true));
                    break;
                }
                case "VideoStorage": {
                    let x=new VideoArchive(n); 
                    x.getSummary=function(){
                        return http.get("/v1/svc/"+n).map(VideoObjectsService.extractArchiveSummary)
                    };
                    va.push(x);
                    break;
                }
            }
        }
        vo.videoSources=vs;
        vo.videoArchives=va;
        return vo;
    }
    private static createAllTracks(http: Http, vo: VideoObjects): Observable<VideoObjects> {
        return Observable.forkJoin(vo.videoArchives.map(a => { return a.getSummary() })).map(
            res => {
                for(let k=0; k<vo.videoArchives.length; ++k){
                    VideoObjectsService.createTracks(http, vo.videoSources, vo.videoArchives[k], res[k]);
                }
                return vo;
            }
        );
    }

    private static extractArchiveSummary(res: Response): VideoArchiveSummary{
        let body=<any>res.json();
        let vas=new VideoArchiveSummary();
        vas.diskFreeSpace=body.disk_free_space;
        vas.diskUsage=body.disk_usage;
        vas.tracks=new Map<string,VideoTrackSummary>();
        for(let tn in body.contexts){
            let c=<any>body.contexts[tn];
            let ts=new VideoTrackSummary(c.time_boundaries, c.disk_usage);
            vas.tracks[tn]=ts;
        }
        return vas;
    }
    private static createTracks(http: Http, vs:Array<VideoSource>, a: VideoArchive, vas:VideoArchiveSummary){
        for(let n in vas.tracks) {
            let vsrc=this.lookupOrAddArchiveVideoSource(vs, n);
            let vt=new VideoTrack(vsrc, a);
            vt.getTrackData=function(){ return http.get("/v1/svc/"+a.name+"/"+n).map(VideoObjectsService.extractTrackData) };
            a.videoTracks.push(vt);
            vsrc.videoTracks.push(vt);
        }
    }

    private static extractTrackData(res:Response): VideoTrackData {
        let body=<any>res.json();
        let td=new VideoTrackData();
        td.summary=new VideoTrackSummary(body.time_boundaries, body.disk_usage);
        td.timeLine=body.timeline;
        return td;
    }

    private static lookupOrAddArchiveVideoSource(vs: Array<VideoSource>, n:string): VideoSource
    {
        let res=vs.find(x => {
            return x.name==n;
        });
        if(!res){
            res=new VideoSource(n, false);
            vs.push(res);
        }
        return res;
    }
}