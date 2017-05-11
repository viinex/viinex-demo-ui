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
    <div *ngIf="videoTrackData != null">
    <h5>Summary for {{videoTrack.videoSource.name}} @ {{videoTrack.videoArchive.name}}</h5>

    Disk space used: {{gb(videoTrackData.summary.diskUsage)}}<br/>
    Depth: {{formatDepth(videoTrackData.summary.timeBoundaries)}} ({{formatInterval(videoTrackData.summary.timeBoundaries)}}) <br/>
    Total video fragments length: {{formatTemporalLength(totalTemporalLength(videoTrackData.timeLine))}} <br/>

    <div class="list-group pre-scrollable intervals">
        <a class="list-group-item list-group-item-action" 
            *ngFor="let i of videoTrackData.timeLine"
            (click)="gotoInterval(i)"
            >{{formatInterval(i)}}</a>
    </div>
    <br class="archivevideocontrol"/>
    <div id="ArchiveVideoDiv"></div>
    <!--video class="archivevideocontrol" id="ArchiveVideoViewComponent" controls>
        <source src="{{currentStreamUrl}}"/>
    </video-->
    </div>
    `,
    styles: [".intervals { max-height: 200px }"]
})
export class VideoArchiveViewComponent implements OnInit{
    errorMessage: string;
    videoSource: VideoSource;
    readonly isAndroid: boolean;

    videoTrack: VideoTrack;
    videoTrackData: VideoTrackData;

    currentStreamUrl: string;

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
                this.videoTrack=vt;
                return this.videoTrack.getTrackData();
            })
            .subscribe(vtd => this.videoTrackData=vtd);
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
    }

    startPlayback() {
        this.clearVideo();
        let videoDiv = <HTMLDivElement>document.getElementById("ArchiveVideoDiv");
        while(videoDiv.firstChild){
            videoDiv.removeChild(videoDiv.firstChild);
        }

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