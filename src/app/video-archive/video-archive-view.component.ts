import {Component, OnInit, OnDestroy} from '@angular/core';

import { ActivatedRoute,Router }       from '@angular/router';

import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/mergeMap'

import * as Hls from 'hls.js'

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource,VideoObjects, VideoTrack, VideoTrackData, VideoTrackSummary} from '../video-objects'
import {Format} from '../format'

@Component({
    template: `
    <div *ngIf="videoTrack != null">
    <h5>Summary for {{videoTrack.videoSource.name}} @ {{videoTrack.videoArchive.name}}</h5>

    <div *ngIf="videoTrackData != null">
        Disk space used: {{gb(videoTrackData.summary.diskUsage)}}<br/>
        Depth: {{formatDepth(videoTrackData.summary.timeBoundaries)}} ({{formatInterval(videoTrackData.summary.timeBoundaries)}}) <br/>
        Total video fragments length: {{formatTemporalLength(totalTemporalLength(videoTrackData.timeLine))}} <br/>
    </div>

    <div class="row">
        <div class="col-md-4" *ngIf="videoTrackData != null">
            <ul class="list-group intervals">
                <li class="list-group-item list-group-item-action" *ngFor="let i of videoTrackData.timeLine" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <a routerLink="." [queryParams]="{begin: i[0].valueOf(), end:i[1].valueOf() }" class="ainterval"
                    routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">{{formatInterval(i)}}</a>
                </li>
            </ul>
        </div>
        <div class="col-md-8" *ngIf="currentInterval != null">
            <h4>{{formatInterval(currentInterval)}}</h4>
            <a 
            href="/v1/svc/{{videoTrack.videoArchive.name}}/{{videoTrack.videoSource.name}}/export?format=isom&begin={{currentInterval[0].valueOf()}}&end={{currentInterval[1].valueOf()}}"
            class="btn btn-primary" role="button" download target="_blank">Download as MP4</a>
            <br/><br/>
            <a href="/v1/svc/{{videoTrack.videoArchive.name}}/{{videoTrack.videoSource.name}}/export?format=ts&begin={{currentInterval[0].valueOf()}}&end={{currentInterval[1].valueOf()}}"
            class="btn btn-primary" role="button" download target="_blank">Download as MPEG TS</a>
        </div>
    </div> <!--row-->
    <br/>
    </div>
    <div id="ArchiveVideoDiv"></div>
    `,
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
                        this.gotoInterval(this.currentInterval);
                    }
                }
                return this.videoTrack.getTrackData();
            })
            .subscribe(vtd => this.videoTrackData=vtd);
        this.route.queryParams.subscribe(qp => {
            console.log(qp);
            if(qp.begin!=null && qp.end!=null){
                this.currentInterval=[new Date(+qp.begin), new Date(+qp.end)];
                if(this.videoTrack!=null){
                    this.gotoInterval(this.currentInterval);
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

    gotoInterval([b,e]:[Date,Date]){
        this.currentStreamUrl='v1/svc/' + this.videoTrack.videoArchive.name + "/" + this.videoTrack.videoSource.name + '/stream.m3u8'
        + '?begin=' + b.valueOf() + '&end=' + e.valueOf();
        this.startPlayback();
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

    startPlayback() {
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