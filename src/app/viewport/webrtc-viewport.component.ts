import { Component, ElementRef, Input, OnDestroy, AfterViewInit, AfterViewChecked, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { VideoSource, WebRTCServer } from '../video-objects';
import { VideoObjectsService } from '../video-objects.service';

@Component({
    selector: 'webrtc-viewport',
    template: `
    <div style="position: relative;">
        <div #VideoDiv></div>
        <span class="connstatus">&nbsp;{{connectionState}}&nbsp;</span>
    </div>
    `,
    styles: [`span.connstatus { 
        position: absolute; 
        top: 10px; right: 40px; 
        background: #888; 
        color: #fff; 
        opacity: 0.7; 
        font-family: monospace; 
    }`]
})
export class WebrtcViewportComponent implements AfterViewInit, AfterViewChecked, OnDestroy {
    constructor(private videoObjectsService: VideoObjectsService, private zone: NgZone){
        console.log("webrtc viewport component");
    }
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
        if(this.peerConnection){
            this.peerConnection.close();
            this.peerConnection=null;
            let s=this.sessionId;
            this.sessionId=null;
            this.webrtcServer.dropSession(s).subscribe(r => {
                console.log("Session "+s+" dropped");
            });
            this.connectionState="none";
        }
    }

    initVideo() {
        this.clearVideo();
        let videoDiv = <HTMLDivElement>this.videoDiv.nativeElement;

        let video=<HTMLVideoElement>document.createElement("video"); 
        video.controls=true;
        video.setAttribute("width", "100%");
        video.muted=true;
        video.autoplay=true;
        video.playsInline=true;
        videoDiv.appendChild(video);

        this.sessionId=WebrtcViewportComponent.uuidv4();
        this.peerConnection=this.createPeerConnection(video);
        this.webrtcServer.requestOffer(this.sessionId, this.makeMediaCommand()).subscribe(
            sdp => {
                console.log("Got remote offer: ", sdp);
                this.setRemoteOffer(this.peerConnection, sdp);
            }
        );
    }
    createPeerConnection(video: HTMLVideoElement) : RTCPeerConnection {
        let pc=new RTCPeerConnection({iceServers:this.webrtcServer.iceServers});
        console.log(this.webrtcServer.iceServers);
        pc.onicecandidate = e => {
            if(e.candidate==null){
                console.log("last candidate received");
                console.log(pc.localDescription.sdp);
                this.webrtcServer.sendAnswer(this.sessionId, pc.localDescription.sdp).subscribe((res:any) => {
                    if(res.ok){
                        this.errorMessage=null;
                        console.log("ice gathering state:", pc.iceGatheringState);
                    }
                    else{
                        this.errorMessage=res.toString();
                        console.log("ice gathering state:", pc.iceGatheringState);
                    }
                });
            }
            else{
                console.log("next onicecandidate: ", e);
            }
        };
        let pcany = <any>pc;
        pcany.ontrack = (e : any) => {
            //let e = <RTCTrackEvent>ev;
            console.log("ontrack event received: ");
            console.log(e.streams[0]);
            video.srcObject=e.streams[0];
            console.log(e.track);
            console.log("ice gathering state:", pc.iceGatheringState);
        }
        pc.onsignalingstatechange = e => {
            console.log("signalingState:", pc.signalingState);
        }
        pc.oniceconnectionstatechange = (e) => {
            console.log("RTCPeerConnection.iceConnectionState: ", pc.iceConnectionState);
            this.zone.run(() => {
                this.connectionState=pc.iceConnectionState;
                this.updateMedia();
            });
        }
        return pc;
    }

    setRemoteOffer(pc: RTCPeerConnection, sdp: string){
        let rsd = new RTCSessionDescription({ type: "offer", sdp: sdp });
        pc.setRemoteDescription(rsd).then(() => {
            console.log("Remote offer description set successfully");
            pc.createAnswer().then((d) => {
                console.log("Got answer description: ", d);
                console.log(d.sdp);

                pc.setLocalDescription(d).then(() => {
                    console.log("local answer set successfully");
                    console.log(pc);
                }).catch((e) => {
                    console.log("setting local answer failed: ", e);
                });
            });
        }).catch((e) => {
            console.log("Failed to set remote offer description: ", e);
        });
    }

    @Input('video-source')
    get videoSource(): VideoSource { 
        return this._videoSource; 
    }
    set videoSource(s: any){
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
                if(this._videoSource != null && this._videoSource.webrtcServers.length>0){
                    let newWebrtcServer = this._videoSource.webrtcServers[0];
                    if(this.webrtcServer!==newWebrtcServer){
                        this.clearVideo();
                        this.webrtcServer=newWebrtcServer;
                    }
                }
                else {
                    this.clearVideo();
                    this.webrtcServer=null;
                }
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

    @Input('speed')
    get speed() { return this._speed; }
    set speed(s: Number){
        if(this._speed==s){
            return;
        }
        this._speed=s;
        this.shouldUpdateMedia=true;
    }

    private updateMedia(): void {
        if(this.peerConnection === null){
            this.initVideo();
        }
        else if(this.peerConnection && this.connectionState==="connected"){
            if(this.shouldUpdateMedia){
                if(this.mediaBeingUpdated){
                    return; // no overlapping updates
                }
                this.shouldUpdateMedia=false;
                this.mediaBeingUpdated = true;
                this.webrtcServer.updateSession(this.sessionId, this.makeMediaCommand()).subscribe(_ => {
                    console.log("Media updated for session "+this.sessionId);
                    this.mediaBeingUpdated = false; // video is not actually updated yet, -- status should be acquired and cookie compared to this.cookie
                    if(this.shouldUpdateMedia){ // in case if an overlapping update was requested during rpc
                        this.updateMedia();
                    }
                });
            }
        }
    }

    private makeMediaCommand() : Object {
        this.cookie = this.cookie + 1;
        if(this._videoSource){
            if(this._speed == 0){
                return { command: "stop", cookie: this.cookie };
            }
            else{
                if(this._interval){
                    return {
                        command: "play", 
                        source: this._videoSource.name, 
                        range: this._interval,
                        speed: this._speed
                    };
                }
                else{
                    return {
                        command: "play", 
                        source: this._videoSource.name, 
                        range: "now-"
                    };
                }
            }
        }
        return {};
    }

    static uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

    connectionState: string = "none";
    errorMessage: string = null;

    private peerConnection : RTCPeerConnection = null;
    private sessionId : string = null;

    private _videoSource: VideoSource = null;
    private webrtcServer: WebRTCServer = null;

    private _interval: [Date, Date] = null;
    private _speed: Number = 1.0;

    private cookie: number = 0;

    private shouldUpdateMedia : boolean = false;
    public mediaBeingUpdated : boolean = false;
}