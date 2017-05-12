import {Component, OnInit, OnDestroy} from '@angular/core';

import { ActivatedRoute,Router }       from '@angular/router';

import 'rxjs/add/operator/switchMap'

import * as Hls from 'hls.js'

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource,VideoObjects} from '../video-objects'

@Component({
    template: `
    <div>
    <div id="LiveVideoDiv"></div>
    </div>
    `,
    styles: [".livevideocontrol { width: 100% }"]
})
export class LiveVideoViewComponent implements OnInit, OnDestroy {
    errorMessage: string;
    videoSource: VideoSource;
    readonly isAndroid: boolean;

    private hls: Hls;

    constructor(private route: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService){
        this.isAndroid = /(android)/i.test(navigator.userAgent);
    }
    ngOnInit(): void {
        this.route.params.switchMap(params => 
                this.videoObjectsService.getVideoSource(params["videoSourceId"]))
            .subscribe(vs => { this.videoSource=vs; this.startPlayback(); });
    }
    ngOnDestroy(): void {
        this.clearVideo();
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
        while(videoDiv.firstChild){
            let video=<HTMLVideoElement>videoDiv.firstChild; 
            if(video){
                
            }
            videoDiv.removeChild(videoDiv.firstChild);
        }

        let video=<HTMLVideoElement>document.createElement("video"); 
        video.controls=false;
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