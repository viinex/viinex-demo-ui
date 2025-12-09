import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

import {VideoObjectsService} from '../video-objects.service'
import {WebRTCServer,VideoObjects, VideoSource} from '../video-objects'

@Component({
    standalone: false,
    templateUrl: "./webrtc-video-list.component.html",
    styles: [`
        .substream {
            padding-left: 3rem;
        }
    `],
})
export class WebrtcVideoListComponent implements OnInit {
    errorMessage: string;
    webrtcServers: Array<WebRTCServer> = [];
    allVideoSources: Array<VideoSource> = [];
    selectedServer: WebRTCServer;
    videoObjects: VideoObjects = null;
    //anyServer: boolean = false;


    webrtcServerId: string = null;
    videoSourceId: string = null;

    constructor(private router: Router, 
                private route: ActivatedRoute,
                private videoObjectsService: VideoObjectsService){
    }

    ngOnInit(): void {
        this.videoObjectsService.objects.subscribe(vo => { 
            this.videoObjects=vo;
            this.complete();
        });
        this.route.params.subscribe(params => {
            this.webrtcServerId = params["webrtcServerId"];
            this.videoSourceId = params["videoSourceId"];
            if(this.videoObjects)
                this.complete()
        });
    }
    complete(){
        if(!this.videoObjects)
            return;
        this.webrtcServers=this.videoObjects.webrtcServers;
        this.selectedServer = this.videoObjects.webrtcServers.find(s => s.name==this.webrtcServerId);
        this.allVideoSources = this.videoObjects.videoSources.filter(vs => vs.webrtcServers.length>0);
    }
    // onSelectServer(va:VideoArchive){
    //     this.selectedArchive=va; 
    //     //this.selectedArchiveSummary.tracks.
    //     //this.router.navigate([vs.name], { relativeTo: this.route })
    // }
}