import { Component, ElementRef, Input, OnDestroy, AfterViewInit, AfterViewChecked, ViewChild, NgZone } from '@angular/core';
import { VideoSource, VideoTrack } from '../video-objects';
import { VideoObjectsService } from '../video-objects.service';

import Hls from 'hls.js'

@Component({
    standalone: false,
    selector: 'hls-viewport',
    template: `<div #VideoDiv></div>`
})
export class HlsViewportComponent implements AfterViewInit, AfterViewChecked, OnDestroy {
    constructor(private videoObjectsService: VideoObjectsService, private zone: NgZone){
    }

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
        let videoDiv = <HTMLDivElement>this.videoDiv?.nativeElement;
        while(videoDiv && videoDiv.firstChild){
            videoDiv.removeChild(videoDiv.firstChild);
        }
        if(this.hls){
            let hls=this.hls;
            this.hls=null;
            hls.on(Hls.Events.DESTROYING, function(){
            });
            hls.on(Hls.Events.MEDIA_DETACHED, function(){
            });
            hls.stopLoad(); 
            hls.detachMedia();
            hls.destroy();
        }        
    }

    initVideo() {
        this.clearVideo();
        let videoDiv = <HTMLDivElement>this.videoDiv.nativeElement;

        let video=<HTMLVideoElement>document.createElement("video"); 
        video.controls=this._interval != null;
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
            if(this._interval){
                let t=this._videoTrack;
                if(t == null && vs.videoTracks.length>0){
                    t = vs.videoTracks[0];
                }
                if(t==null) {
                    console.error("No video archive for video source",vs.name);
                    return null;
                }
                return "v1/svc/" + t.videoArchive.name + "/" + vs.name + "/stream.m3u8"
                    + '?begin=' + this._interval[0].valueOf() + '&end=' + this._interval[1].valueOf();
            }
            else {
                return 'v1/svc/' + vs.name + '/stream.m3u8';
            }
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
        if(typeof s === 'string' || s instanceof String){
            if(this._videoSource?.name !== s){
                this.videoObjectsService.objects.subscribe(vo => {
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

    @Input('video-track')
    get videoTrack(): VideoTrack {
        return this._videoTrack;
    }
    set videoTrack(t: VideoTrack) {
        if (this._videoTrack?.videoSource?.name == t?.videoSource?.name && this._videoTrack?.videoArchive?.name == t?.videoArchive?.name) {
            return;
        }
        else {
            this._videoTrack = t;
            this._videoSource = t?.videoSource;
            this.shouldUpdateMedia = true;
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
    private _videoTrack: VideoTrack = null;
    private _interval: [Date, Date] = null;

    private shouldUpdateMedia : boolean = false;
    public mediaBeingUpdated : boolean = false;
}