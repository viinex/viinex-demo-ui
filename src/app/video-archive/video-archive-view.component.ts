import {Component, OnInit, OnDestroy} from '@angular/core';

import { ActivatedRoute,Router }       from '@angular/router';

import 'rxjs/add/operator/switchMap'

import * as Hls from 'hls.js'

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource,VideoObjects} from '../video-objects'

@Component({
    template: `
    <div>
    <video class="livevideocontrol" id="LiveVideoViewComponent" controls>
        <source src="{{streamUrl(videoSource)}}"/>
    </video>
    </div>
    `,
    styles: [".livevideocontrol { width: 100% }"]
})
export class VideoArchiveViewComponent implements OnInit, OnDestroy {
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
    ngOnDestroy(): void {
        if(Hls.isSupported){
            let video = <any>document.getElementById("LiveVideoViewComponent");
            if(null!=video){
                video.stop();
            }

        }
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
        if(vs!=null){
            return 'v1/svc/' + vs.name + '/stream.m3u8';
        }
        else {
            return "";
        }
    }
}