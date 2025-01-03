import {Component, AfterContentInit, ChangeDetectorRef, ViewChild, ElementRef} from '@angular/core';

import { ActivatedRoute,Router } from '@angular/router';

import 'webrtc-adapter'

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource, WebRTCServer} from '../video-objects'
import { WebrtcViewportComponent } from '../viewport/webrtc-viewport.component';

@Component({
    standalone: false,
    templateUrl: "webrtc-video-view.component.html"
})
export class WebrtcVideoViewComponent implements AfterContentInit {
    // selected objects
    webrtcServer: WebRTCServer;
    videoSource: VideoSource;

    //@ViewChild("viewport") viewport: WebrtcViewportComponent;

    constructor(private route: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService){
    }
    ngAfterContentInit(): void {
        this.videoObjectsService.objects.subscribe(vo => {
            this.route.params.subscribe(params => {
                    let webrtcServerId = this.route.parent.snapshot.params["webrtcServerId"];
                    let videoSourceId = params["videoSourceId"];
                    this.webrtcServer=vo.webrtcServers.find(wr => wr.name==webrtcServerId);
                    this.videoSource=this.webrtcServer.videoSources.find(vs => vs.name==videoSourceId);
                    console.log("SETTING VIDEO SOURCE", this.videoSource);
                    //this.viewport.videoSource=this.videoSource;
                });
        });
    }
}
