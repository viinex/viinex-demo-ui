import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormsModule} from '@angular/forms';

import { ActivatedRoute,Router }       from '@angular/router';

import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/mergeMap'

import * as Hls from 'hls.js'

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource,VideoObjects, VideoTrack, VideoTrackData, VideoTrackSummary} from '../video-objects'
import {Format} from '../format'

@Component({
    templateUrl: "video-archive-view.component.html",
    styles: [".intervals { max-height: 200px; overflow-y: scroll }",
    ".ainterval.active  { color: white !important }"]
})
export class VideoArchiveViewComponent implements OnInit, OnDestroy{
    errorMessage: string;
    videoSource: VideoSource;
    readonly isAndroid: boolean;

    videoTrack: VideoTrack;
    videoTrackData: VideoTrackData;

    currentInterval: [Date,Date];
    timeOffset: Date;

    currentStreamUrl: string;

    private hls: Hls; // for destroying the player

    constructor(private route: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService){
        this.isAndroid = /(android)/i.test(navigator.userAgent);
    }
    ngOnInit(): void {
        this.route.params
            .mergeMap(params => {
                let archId = this.route.parent.snapshot.params["videoArchiveId"];
                let srcId = params["videoSourceId"];
                let t=this.videoObjectsService.getVideoTrack(archId, srcId);
                return t;
            })
            .mergeMap(vt => {
                let oldvt=this.videoTrack;
                this.videoTrack=vt;
                if(oldvt!=null && vt !=null){
                    if(oldvt.videoArchive.name!=vt.videoArchive.name || oldvt.videoSource.name!=vt.videoSource.name){
                        this.currentInterval=null;
                        this.clearVideo();
                    }
                }
                else{
                    if(this.currentInterval!=null){
                        this.gotoInterval();
                    }
                }
                return this.videoTrack.getTrackData();
            })
            .subscribe(vtd => this.videoTrackData=vtd);
        this.route.queryParams.subscribe(qp => {
            if(qp.begin!=null && qp.end!=null){
                this.currentInterval=[new Date(+qp.begin), new Date(+qp.end)];
                this.timeOffset=this.currentInterval[0];
                if(this.videoTrack!=null){
                    this.gotoInterval();
                }
            }
            else{
                this.currentInterval=null;
                this.clearVideo();
            }
        })
    }
    ngOnDestroy(): void{
        this.clearVideo();
    }

    formatInterval(x: any): string {
        if(x==null){
            return "no data";            
        }
        else {
            return Format.interval(x);
        }
    }
    gb = Format.gb;
    formatTemporalLength = Format.temporalLength;
    formatDepth(x: any): string{
        if(x==null){
            return "0"
        }
        else {
            let [b, e] = <[Date, Date]>x;
            let s=Math.floor((e.valueOf()-b.valueOf())/1000);
            return Format.temporalLength(s);
        }
    }
    totalTemporalLength(timeline: Array<[Date, Date]>): number{
        if(timeline==null || timeline.length==0){
            return 0;
        }
        else
        {
            return Math.floor(timeline.map(([b,e]) => e.valueOf()-b.valueOf()).reduce((s,v) => s+v)/1000);
        }
    }

    shouldRefine([b,e]:[Date,Date]): boolean{
        return (e.valueOf() - b.valueOf()) > 10*60*1000;
    }
    expandInterval([b,e]:[Date,Date]): Array<[Date,Date]>{
        let r=new Array<[Date,Date]>();
        let x=b;
        while(x<e){
            let y=new Date(x.valueOf()+10*60*1000);
            r.push([x, y]);
            x=y;
        }
        return r;
    }

    gotoInterval(){
        let [b,e]=this.currentInterval;
        if(this.timeOffset!=null){
            b=new Date(Math.max(this.timeOffset.valueOf(), b.valueOf()));
            e=new Date(Math.min(b.valueOf()+10*60*1000, e.valueOf()));
            console.log([b,e]);
        }
        this.currentStreamUrl='v1/svc/' + this.videoTrack.videoArchive.name + "/" + this.videoTrack.videoSource.name + '/stream.m3u8'
        + '?begin=' + b.valueOf() + '&end=' + e.valueOf();
        this.showVideo();
    }

    exportUrl(interval: [Date,Date], format: string){
        return "v1/svc/"+this.videoTrack.videoArchive.name+"/"+
            this.videoTrack.videoSource.name+"/export?format="+format+
            "&begin="+interval[0].valueOf()+"&end="+interval[1].valueOf();
    }

    clearVideo(){
        let videoDiv = <HTMLDivElement>document.getElementById("ArchiveVideoDiv");
        while(videoDiv && videoDiv.firstChild){
            videoDiv.removeChild(videoDiv.firstChild);
        }
        if(this.hls){
            let hls=this.hls;
            this.hls=null;
            hls.on(Hls.Events.DESTROYING, function(){
                //console.log("destroying");
            });
            hls.on(Hls.Events.MEDIA_DETACHED, function(){
                //console.log("media detached");
            });
            hls.stopLoad(); 
            hls.detachMedia();
            hls.destroy();
            //console.log(hls);
        }        
    }

    showVideo() {
        this.clearVideo();
        let videoDiv = <HTMLDivElement>document.getElementById("ArchiveVideoDiv");

        let video=<HTMLVideoElement>document.createElement("video"); 
        video.controls=true;
        video.setAttribute("width", "100%");
        let source=<HTMLSourceElement>document.createElement("source");
        source.src=this.currentStreamUrl;
        video.appendChild(source);
        videoDiv.appendChild(video);

        if (Hls.isSupported) {
            let hls = new Hls();
            hls.loadSource(this.currentStreamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                //video.play();
            });
            this.hls=hls;
        }
        else{
            //this.video.childNodes.item(0).attributes[0]=this.currentStreamUrl;
            //this.video.currentTime=0;
        }
    }
    streamUrl(vs: VideoSource): string {
        if(vs!=null){
            return 'v1/svc/' + vs.name + '/stream.m3u8';
        }
        else {
            return "";
        }
    }
}