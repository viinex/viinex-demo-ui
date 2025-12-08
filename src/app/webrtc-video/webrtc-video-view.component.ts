import {Component, AfterContentInit, ChangeDetectorRef, ViewChild, ElementRef, OnInit, OnDestroy} from '@angular/core';

import { ActivatedRoute,Router } from '@angular/router';

import 'webrtc-adapter'

import {VideoObjectsService} from '../video-objects.service'
import {VideoObjects, VideoSource, WebRTCServer} from '../video-objects'
import { WebrtcViewportComponent } from '../viewport/webrtc-viewport.component';
import { Subscription } from 'rxjs';

@Component({
    standalone: false,
    templateUrl: "webrtc-video-view.component.html"
})
export class WebrtcVideoViewComponent implements OnInit, OnDestroy {
    webrtcServerId: string = null;
    videoSourceId: string = null;

    webrtcServer: WebRTCServer = null;
    videoSource: VideoSource = null;

    //@ViewChild("viewport") viewport: WebrtcViewportComponent;

    constructor(private route: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService){
    }
    
    private subscriptions: Array<Subscription>=[];
    private videoObjects : VideoObjects = null;

    private complete(){
        if(!this.videoObjects){
            this.videoSource=null;
            return;
        }
        if(!this.videoSourceId){
            this.videoSource=null;
            return;
        }
        this.videoSource=this.videoObjects.allVideoSources.find(s => s.name==this.videoSourceId);
        if(this.webrtcServerId){
            this.webrtcServer=this.videoSource.webrtcServers.find(s => s.name==this.webrtcServerId);
        }
        else if(this.videoSource.webrtcServers.length>0){
            this.webrtcServer=this.videoSource.webrtcServers[0];
        }
        else{
            this.webrtcServer=null;
        }
        console.log("WebrtcVideoViewComponent.complete: video source and webrtc server set: ", this.videoSource, this.webrtcServer);
    }

    ngOnDestroy(this: WebrtcVideoViewComponent): void {
        this.subscriptions.forEach(s => {s.unsubscribe();});
    }
    ngOnInit(this: WebrtcVideoViewComponent): void {
        this.videoObjectsService.objects.subscribe(vo => { this.videoObjects=vo; this.complete(); });
        this.route.params.subscribe(params => {
            this.webrtcServerId = this.route.parent.snapshot.params["webrtcServerId"];
            this.videoSourceId = params["videoSourceId"];
            this.complete();
        });
    }
}
