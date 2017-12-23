import {Component, OnInit, OnDestroy} from '@angular/core';

import { ActivatedRoute,Router }       from '@angular/router';

import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import {timer} from 'rxjs/observable/timer'
import 'rxjs/add/operator/switchMap'

import * as Hls from 'hls.js'

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource,VideoObjects, LiveStreamDetails} from '../video-objects'

@Component({
    template: `
    <div>
    <div id="LiveVideoDiv"></div>
    <div *ngIf="null != streamDetails">
    Resolution: {{streamDetails.resolution[0]}}x{{streamDetails.resolution[1]}}<br/>
    Bitrate: {{(streamDetails.bitrate/1000000).toFixed(2)}} Mbps
    </div>
    <div *ngIf="isOfflineOrStalled" class="alert alert-danger">The stream appears to be offline or stalled</div>
    </div>
    `,
    styles: [".livevideocontrol { width: 100% }"]
})
export class LiveVideoViewComponent implements OnInit, OnDestroy {
    errorMessage: string;
    videoSource: VideoSource;

    subscription: Subscription;
    streamDetails: LiveStreamDetails;
    isOfflineOrStalled: boolean;

    readonly isAndroid: boolean;

    private hls: Hls;

    constructor(private route: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService){
        this.isAndroid = /(android)/i.test(navigator.userAgent);
    }
    ngOnInit(): void {
        this.route.params.switchMap(params => 
                this.videoObjectsService.getVideoSource(params["videoSourceId"]))
            .subscribe(vs => { 
                this.videoSource=vs; 
                this.startPlayback(); 
                this.subscribeStreamDetails(vs.getStreamDetails);
            });
    }
    ngOnDestroy(): void {
        this.clearVideo();
        this.unsubscribe();
    }
    unsubscribe(){
        if(this.subscription){
            this.subscription.unsubscribe();
            this.subscription=null;
        }
    }
    subscribeStreamDetails(sdo: Observable<LiveStreamDetails>){
        this.unsubscribe();
        this.streamDetails=null;
        this.subscription=timer(0, 10000).switchMap(() => sdo).subscribe(d => {
            this.streamDetails=d;
            this.isOfflineOrStalled= (d==null)|| (Math.abs(Date.now()-this.streamDetails.lastFrame.valueOf()) > 20000); // 20 seconds
        }, (error:any) => {
            this.isOfflineOrStalled=true;
        });
    }

    streamUrl(vs: VideoSource): string {
        if(vs!=null){
            return 'v1/svc/' + vs.name + '/stream.m3u8';
        }
        else {
            return "";
        }
    }

    clearVideo(){
        let videoDiv = <HTMLDivElement>document.getElementById("LiveVideoDiv");
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
        let videoDiv = <HTMLDivElement>document.getElementById("LiveVideoDiv");
        let video=<HTMLVideoElement>document.createElement("video"); 
        video.controls=this.isAndroid;
        video.autoplay=true;
        video.setAttribute("width", "100%");
        let source=<HTMLSourceElement>document.createElement("source");
        let streamUrl=this.streamUrl(this.videoSource);
        source.src=streamUrl;
        video.appendChild(source);
        videoDiv.appendChild(video);

        if (Hls.isSupported) {
            let hls = new Hls();
            hls.loadSource(streamUrl);
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
    
}