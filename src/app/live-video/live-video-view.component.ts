import {Component, OnInit, OnDestroy} from '@angular/core';

import { ActivatedRoute,Router }       from '@angular/router';

import { Observable, Subscription, timer } from "rxjs";
import {switchMap } from 'rxjs/operators';

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource, LiveStreamDetails} from '../video-objects'

@Component({
    template: `
    <div>
    <hls-viewport [video-source]="videoSource?.name"></hls-viewport>
    <div *ngIf="streamDetails!=null && streamDetails.resolution!=null">
    Resolution: {{streamDetails.resolution?" "+streamDetails.resolution[0]+"x"+streamDetails.resolution[1]:""}} |
    Bitrate: {{(streamDetails.bitrate/1000000).toFixed(2)}} Mbps |
    Framerate: {{(streamDetails.framerate).toFixed(2)}} fps
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

    constructor(private route: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService){
    }
    ngOnInit(): void {
        this.route.params.pipe(switchMap(params => 
                this.videoObjectsService.getVideoSource(params["videoSourceId"])))
            .subscribe(vs => { 
                this.videoSource=vs; 
                this.subscribeStreamDetails(vs.getStreamDetails);
            });
    }
    ngOnDestroy(): void {
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
        this.subscription=timer(0, 10000).pipe(switchMap(() => sdo)).subscribe(d => {
            this.streamDetails=d;
            this.isOfflineOrStalled= (d==null)|| (Math.abs(Date.now()-this.streamDetails.lastFrame.valueOf()) > 20000); // 20 seconds
        }, (error:any) => {
            this.isOfflineOrStalled=true;
        });
    }
}