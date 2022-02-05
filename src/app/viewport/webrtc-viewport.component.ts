import { Component, ElementRef, Input, OnDestroy, AfterContentInit, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { VideoSource, WebRTCServer } from '../video-objects';
import { VideoObjectsService } from '../video-objects.service';

@Component({
    selector: 'webrtc-viewport',
    template: `webrtc viewport for {{videoSource?.displayName}}
    <div #VideoDiv></div>
    Connection state is: {{connectionState}}
    `
})
export class WebrtcViewportComponent implements AfterContentInit, OnDestroy {
    constructor(private videoObjectsService: VideoObjectsService, private changeDetector: ChangeDetectorRef, private zone: NgZone){
        console.log("webrtc viewport component");
    }
    ngAfterContentInit(): void {
        this.clearVideo();
        this.showVideo();
    }
    ngOnDestroy(): void{
        this.clearVideo();
    }

//    private videoDiv : HTMLDivElement; 
    @ViewChild('VideoDiv') videoDiv: ElementRef;

    clearVideo(){
        let videoDiv = <HTMLDivElement>this.videoDiv.nativeElement;
        while(videoDiv && videoDiv.firstChild){
            videoDiv.removeChild(videoDiv.firstChild);
        }
        if(this.peerConnection){
            this.peerConnection.close();
            this.peerConnection=null;
            this.webrtcServer.dropSession(this.sessionId).subscribe(r => {
                console.log("Session "+this.sessionId+" dropped");
            });
            this.sessionId=null;
            this.connectionState="none";
        }
    }

    showVideo() {
        this.clearVideo();
        let videoDiv = <HTMLDivElement>this.videoDiv.nativeElement;

        let video=<HTMLVideoElement>document.createElement("video"); 
        video.controls=true;
        video.setAttribute("width", "100%");
        video.setAttribute("playsinline", "true");
        video.setAttribute("muted", "true");
        video.setAttribute("autoplay", "true");
        videoDiv.appendChild(video);

        this.sessionId=WebrtcViewportComponent.uuidv4();
        this.peerConnection=this.createPeerConnection(video);
        this.webrtcServer.requestOffer(this.sessionId, this.videoSource).subscribe(
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
            this.zone.run(() => {this.connectionState=pc.iceConnectionState;});
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
        if( typeof s === 'string' || s instanceof String){
            this.videoObjectsService.getObjects().subscribe(vo => {
                this.videoSource=vo.videoSources.find(v => v.name == s);
            });
        }
        else {
            console.log("11111SET VIDEO SOURCE ", s);
            this._videoSource=<VideoSource>s;
            this.changeDetector.detectChanges();
            console.log("SET VIDEO SOURCE ", this._videoSource);
            if(this._videoSource != null && this._videoSource.webrtcServers.length>0){
                this.webrtcServer=this._videoSource.webrtcServers[0];
                console.log("SETTINH WEBRTC SERVER", this.webrtcServer);
            }
            else {
                this.webrtcServer=null;
            }
        }
    }

    static uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

    connectionState: string;
    errorMessage: string;

    private peerConnection : RTCPeerConnection;
    private sessionId : string;
  
    private _videoSource: VideoSource;
    private webrtcServer: WebRTCServer;

}