import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { VideoObjects, VideoArchive, VideoSource } from './video-objects'

@Injectable()
export class VideoObjectsService {
    constructor(private http: Http){}
    getObjects(): Observable<VideoObjects>{
        return this.http.get("/v1/svc")
                        .map(this.extractData);
    }
    getVideoSource(videoSourceId: string) : Observable<VideoSource>
    {
        return this.getObjects().map(vo => vo.videoSources.find(vs => vs.name==videoSourceId));
    }
    private extractData(res: Response){
        let body=res.json();
        let vo=new VideoObjects();
        let vs=new Array<VideoSource>();
        let va=new Array<VideoArchive>();
        for(var n in body){
            switch(body[n]){
                case "VideoSource": {
                    let x=new VideoSource(); 
                    x.name=n; 
                    x.isLive=true;
                    vs.push(x);
                    break;
                }
                case "VideoStorage": {
                    let x=new VideoArchive(); 
                    x.name=n; 
                    va.push(x);
                    break;
                }
            }
        }
        vo.videoSources=vs;
        vo.videoArchives=va;
        return vo;
    }
    private lookupOrAddArchiveVideoSource(vs: Array<VideoSource>, n:string): VideoSource
    {
        let res=vs.find(x => {
            return x.name==n;
        });
        if(!res){
            res=new VideoSource();
            res.name=n;
            res.isLive=false;
        }
        return res;
    }
}