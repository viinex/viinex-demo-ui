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
    VideoTrackSummary,
    LiveStreamDetails
} from './video-objects'

@Injectable()
export class VideoObjectsService {
    constructor(private http: Http){}
    getObjects(): Observable<VideoObjects>{
        return this.http.get("/v1/svc")
                        .map((res:Response) => VideoObjectsService.extractSvcData(this.http, res))
                        .mergeMap((vo:VideoObjects) => VideoObjectsService.createAllTracks(this.http, vo));
    }
    getVideoSource(videoSourceId: string) : Observable<VideoSource> {
        return this.getObjects().map(vo => vo.videoSources.find(vs => vs.name==videoSourceId));
    }
    getVideoArchive(videoArchiveId: string) : Observable <VideoArchive>
    {
        return this.getObjects().map(vo => vo.videoArchives.find(va => va.name==videoArchiveId));
    }
    getVideoTrack(videoArchiveId: string, videoSourceId: string){
        return this.getVideoArchive(videoArchiveId).map(va => va.videoTracks.find(vt => vt.videoSource.name==videoSourceId));
    }
    private static extractSvcData(http: Http, res: Response){
        let body=res.json();
        let vo=new VideoObjects();
        let vs=new Array<VideoSource>();
        let va=new Array<VideoArchive>();
        for(let n in body){
            switch(body[n]){
                case "VideoSource": {
                    let s=new VideoSource(n, true);
                    s.getStreamDetails=http.get("/v1/svc/"+n).map(VideoObjectsService.extractLiveStreamDetails);
                    vs.push(s);
                    break;
                }
                case "VideoStorage": {
                    let x=new VideoArchive(n); 
                    x.getSummary=function(){
                        return http.get("/v1/svc/"+n).map(r => {
                            let s=VideoObjectsService.extractArchiveSummary(r);
                            x.summarySnapshot=s;
                            return s;
                        })
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
    private static extractLiveStreamDetails(res: Response){
        let body=<any>res.json();
        let d=new LiveStreamDetails();
        d.bitrate=body.bitrate;
        d.resolution=body.resolution;
        d.lastFrame=new Date(body.last_frame);
        return d;
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
            let ts=new VideoTrackSummary(VideoObjectsService.jsonDateInterval(c.time_boundaries), c.disk_usage);
            vas.tracks.set(tn, ts);
        }
        return vas;
    }
    private static createTracks(http: Http, vs:Array<VideoSource>, a: VideoArchive, vas:VideoArchiveSummary){
        vas.tracks.forEach((t: VideoTrackSummary, n:string) => {
            let vsrc=this.lookupOrAddArchiveVideoSource(vs, n);
            let vt=new VideoTrack(vsrc, a);
            vt.getTrackData=function(){ return http.get("/v1/svc/"+a.name+"/"+n).map(VideoObjectsService.extractTrackData) };
            a.videoTracks.push(vt);
            vsrc.videoTracks.push(vt);
        });
    }

    private static extractTrackData(res:Response): VideoTrackData {
        let body=<any>res.json();
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
            res=new VideoSource(n, false);
            vs.push(res);
        }
        return res;
    }
}