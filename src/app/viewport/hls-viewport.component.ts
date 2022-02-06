import { Component, ElementRef, Input, OnDestroy, AfterViewInit, AfterViewChecked, ViewChild, NgZone } from '@angular/core';
import { VideoSource } from '../video-objects';
import { VideoObjectsService } from '../video-objects.service';

import Hls from 'hls.js'

@Component({
    selector: 'hls-viewport',
    template: `<div #VideoDiv></div>`
})
export class HlsViewportComponent implements AfterViewInit, AfterViewChecked, OnDestroy {
    constructor(private videoObjectsService: VideoObjectsService, private zone: NgZone){
        this.isAndroid = /(android)/i.test(navigator.userAgent);
        console.log("hls viewport ctor");
    }
    readonly isAndroid: boolean;
    private hls: Hls;

    ngAfterViewInit(): void {
        this.updateMedia();
    }
    ngAfterViewChecked(): void {
        this.updateMedia();
    }
    ngOnDestroy(): void{
        this.clearVideo();
    }

    @ViewChild('VideoDiv') videoDiv: ElementRef;

    clearVideo(){
        console.log("hls viewport clear");
        let videoDiv = <HTMLDivElement>this.videoDiv?.nativeElement;
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

    initVideo() {
        this.clearVideo();
        console.log("hls viewport init");
        let videoDiv = <HTMLDivElement>this.videoDiv.nativeElement;

        let video=<HTMLVideoElement>document.createElement("video"); 
        video.controls=this.isAndroid;
        video.setAttribute("width", "100%");
        video.muted=true;
        video.autoplay=true;
        video.playsInline=true;

        let source=<HTMLSourceElement>document.createElement("source");
        let streamUrl=this.streamUrl(this.videoSource);
        source.src=streamUrl;

        video.appendChild(source);
        videoDiv.appendChild(video);

        if (Hls.isSupported) {
            let hls = new Hls({enableWorker:false});
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                video.play();
            });
            this.hls=hls;
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

    @Input('video-source')
    get videoSource(): VideoSource { 
        return this._videoSource; 
    }
    set videoSource(s: any){
        console.log("hls viewport set video source",s);
        if(typeof s === 'string' || s instanceof String){
            if(this._videoSource?.name !== s){
                this.videoObjectsService.getObjects().subscribe(vo => {
                    this.videoSource=vo.videoSources.find(v => v.name == s);
                });
            }
        }
        else {
            let newVideoSource = <VideoSource>s;
            if(this._videoSource !== newVideoSource){
                this.shouldUpdateMedia = true;
                this._videoSource=<VideoSource>s;
            }
        }
    }

    @Input('interval')
    get interval() { return this._interval; }
    set interval(i: [Date,Date]){
        if(this._interval==null && i==null){
            return;
        }
        if(this._interval && i && this._interval[0] == i[0] && this._interval[1] == i[1]){
            return;
        }
        this._interval=i;
        this.shouldUpdateMedia=true;
    }

    private updateMedia(): void {
        if(this.shouldUpdateMedia){
            this.shouldUpdateMedia=false;
            this.initVideo();
        }
    }

    connectionState: string = "none";
    errorMessage: string = null;

    private _videoSource: VideoSource = null;
    private _interval: [Date, Date] = null;

    private shouldUpdateMedia : boolean = false;
    public mediaBeingUpdated : boolean = false;
}