import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormsModule} from '@angular/forms';

import { ActivatedRoute,Router }       from '@angular/router';

import {mergeMap} from 'rxjs/operators'

import Hls from 'hls.js'

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource,VideoObjects, VideoTrack, VideoTrackData, VideoTrackSummary} from '../video-objects'
import { LoginService, Transport } from '../login.service';
import { IViinexRpc } from '../viinex-rpc';
import {Format} from '../format'

const MAX_WINDOW_SIZE_MINUTES=10;

@Component({
    templateUrl: "video-archive-view.component.html",
    styles: [".intervals { max-height: 200px; overflow-y: scroll }",
    ".ainterval.active  { color: white !important }",
    ".archive-refine-menu { max-height: 300px; overflow-y: scroll }",
    `.interval-item {
        overflow:visible;  
        display: block;
        padding: .25rem .25rem;
    }`
    ]
})
export class VideoArchiveViewComponent implements OnInit, OnDestroy{
    errorMessage: string;
    videoSource: VideoSource;
    readonly isAndroid: boolean;

    isHttp: boolean = false;
    isWamp: boolean = false;

    videoTrack: VideoTrack;
    videoTrackData: VideoTrackData;

    currentInterval: [Date,Date];
    subintervals: Array<[Date, Date]>;
    refinedInterval: [Date,Date];
    interval: [Date,Date] = null;

    currentStreamUrl: string;

    private hls: Hls; // for destroying the player

    constructor(private route: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService,
        private login: LoginService){
        this.isAndroid = /(android)/i.test(navigator.userAgent);
    }
    ngOnInit(): void {
        this.login.loginStatus.subscribe((ls) => {
            this.isWamp = ls.transport == Transport.Wamp;
            this.isHttp = ls.transport == Transport.Http;
        });
        this.route.params.pipe(
            mergeMap(params => {
                let archId = this.route.parent.snapshot.params["videoArchiveId"];
                let srcId = params["videoSourceId"];
                let t=this.videoObjectsService.getVideoTrack(archId, srcId);
                return t;
            }),
            mergeMap(vt => {
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
            })).subscribe(vtd => this.videoTrackData=vtd);
        this.route.queryParams.subscribe(qp => {
            if(qp.begin!=null && qp.end!=null){
                this.currentInterval=[new Date(+qp.begin), new Date(+qp.end)];
                this.subintervals=this.expandInterval(this.currentInterval);
                this.refinedInterval=this.makeSubinterval(this.currentInterval[0], this.currentInterval);
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

    makeSubinterval(x: Date, [b,e]:[Date,Date]): [Date,Date]{
        let [xb,xe]=[x, new Date(x.valueOf()+MAX_WINDOW_SIZE_MINUTES*60*1000)];
        if(xb<b){ xb=b; }
        if(xb>e){ xb=e; }
        if(xe<b){ xe=b; }
        if(xe>e){ xe=e; }
        return [xb,xe];
    }
    shouldRefine([b,e]:[Date,Date]): boolean{
        return (e.valueOf() - b.valueOf()) > MAX_WINDOW_SIZE_MINUTES*60*1000;
    }
    expandInterval(ii:[Date,Date]): Array<[Date,Date]>{
        let [b,e]=ii;
        let r=new Array<[Date,Date]>();
        let x=b;
        while(x<e){
            let i=this.makeSubinterval(x, ii);
            r.push(i);
            x=i[1];
        }
        return r;
    }

    setRefinedInterval(i: [Date, Date]){
        this.refinedInterval=i;
        this.gotoInterval();
    }

    gotoInterval(){
        let [b,e]=this.currentInterval;
        if(this.refinedInterval!=null){
            let [rb,re]=this.refinedInterval;
            b=new Date(Math.max(rb.valueOf(), b.valueOf()));
            e=new Date(Math.min(re.valueOf(), e.valueOf()));
        }
        this.interval = [b,e];
        if(this.isHttp){
            this.currentStreamUrl='v1/svc/' + this.videoTrack.videoArchive.name + "/" + this.videoTrack.videoSource.name + '/stream.m3u8'
            + '?begin=' + b.valueOf() + '&end=' + e.valueOf();
            this.showVideo();
        }
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
        video.setAttribute("playsinline", "true");
        let source=<HTMLSourceElement>document.createElement("source");
        source.src=this.currentStreamUrl;
        video.appendChild(source);
        videoDiv.appendChild(video);

        if (Hls.isSupported) {
            let hls = new Hls({enableWorker:false});
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