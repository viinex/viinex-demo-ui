import {Component, OnInit} from '@angular/core';

import { ActivatedRoute,Router }       from '@angular/router';

import 'rxjs/add/operator/switchMap'

import * as Hls from 'hls.js'

import {VideoObjectsService} from './video-objects.service'
import {VideoSource,VideoObjects} from './video-objects'

@Component({
    template: `
    <div height="40%">
    <video id="LiveVideoViewComponent" controls>
    </video>
    </div>
    `
})
export class LiveVideoViewComponent implements OnInit {
    errorMessage: string;
    videoSource: VideoSource;
    readonly isAndroid: boolean;

    constructor(private route: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService){
        this.isAndroid = /(android)/i.test(navigator.userAgent);
    }
    ngOnInit(): void {
        this.route.params.switchMap(params => 
                this.videoObjectsService.getVideoSource(params["videoSourceId"]))
            .subscribe(vs => { this.videoSource=vs; this.startLive(); });
    }
    startLive() {
        if (Hls.isSupported) {
            let video = <any>document.getElementById("LiveVideoViewComponent");
            let hls = new Hls();
            hls.loadSource(this.streamUrl(this.videoSource));
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                if (!this.isAndroid) {
                    video.controls = false;
                }
                video.play();
            });
        }
    }
    streamUrl(vs: VideoSource): string {
        return 'v1/svc/' + vs.name + '/stream.m3u8';
    }
}