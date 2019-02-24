import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormsModule} from '@angular/forms';

import { ActivatedRoute,Router }       from '@angular/router';

import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/mergeMap'

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource,VideoObjects, WebRTCServer} from '../video-objects'

@Component({
    templateUrl: "webrtc-video-view.component.html"
})
export class WebrtcVideoViewComponent implements OnInit, OnDestroy{
    errorMessage: string;

    // selected objects
    webrtcServer: WebRTCServer;
    videoSource: VideoSource;

    pc : RTCPeerConnection;
    sessionId : string;

    constructor(private route: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService){
    }
    ngOnInit(): void {
        this.videoObjectsService.getObjects().subscribe(vo => {
            this.route.params.subscribe(params => {
                    let webrtcServerId = this.route.parent.snapshot.params["webrtcServerId"];
                    let videoSourceId = params["videoSourceId"];
                    console.log(webrtcServerId,videoSourceId);
                    this.webrtcServer=vo.webrtcServers.find(wr => wr.name==webrtcServerId);
                    console.log(this.webrtcServer);
                    this.videoSource=this.webrtcServer.videoSources.find(vs => vs.name==videoSourceId);
                    this.clearVideo();
                    this.showVideo();
                });
        });
    }
    ngOnDestroy(): void{
        this.clearVideo();
    }

    clearVideo(){
        let videoDiv = <HTMLDivElement>document.getElementById("VideoDiv");
        while(videoDiv && videoDiv.firstChild){
            videoDiv.removeChild(videoDiv.firstChild);
        }
    }

    showVideo() {
        this.clearVideo();
        let videoDiv = <HTMLDivElement>document.getElementById("VideoDiv");

        let video=<HTMLVideoElement>document.createElement("video"); 
        video.controls=true;
        video.setAttribute("width", "100%");
        video.setAttribute("playsinline", "true");
        videoDiv.appendChild(video);
    }
}