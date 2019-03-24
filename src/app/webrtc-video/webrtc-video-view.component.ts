import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';

import { ActivatedRoute,Router } from '@angular/router';

import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/mergeMap'

import 'webrtc-adapter'
//import '@types/webrtc'

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource, WebRTCServer} from '../video-objects'

@Component({
    templateUrl: "webrtc-video-view.component.html"
})
export class WebrtcVideoViewComponent implements OnInit, OnDestroy{
    errorMessage: string;

    // selected objects
    webrtcServer: WebRTCServer;
    videoSource: VideoSource;

    connectionState: string; // to be displayed on the view

    private peerConnection : RTCPeerConnection;
    private sessionId : string;

    constructor(private route: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService, private changeDetector: ChangeDetectorRef){
        this.connectionState="none";
    }
    ngOnInit(): void {
        this.videoObjectsService.getObjects().subscribe(vo => {
            this.route.params.subscribe(params => {
                    let webrtcServerId = this.route.parent.snapshot.params["webrtcServerId"];
                    let videoSourceId = params["videoSourceId"];
                    console.log(webrtcServerId,videoSourceId);
                    this.webrtcServer=vo.webrtcServers.find(wr => wr.name==webrtcServerId);
                    console.log(this.webrtcServer);
                    this.videoSource=this.webrtcServer.videoSources.find(vs => vs.name==videoSourceId);
                    this.clearVideo();
                    this.showVideo();
                });
        });
    }
    ngOnDestroy(): void{
        this.clearVideo();
    }

    clearVideo(){
        let videoDiv = <HTMLDivElement>document.getElementById("VideoDiv");
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
        let videoDiv = <HTMLDivElement>document.getElementById("VideoDiv");

        let video=<HTMLVideoElement>document.createElement("video"); 
        video.controls=true;
        video.setAttribute("width", "100%");
        video.setAttribute("playsinline", "true");
        video.setAttribute("muted", "true");
        video.setAttribute("autoplay", "true");
        videoDiv.appendChild(video);

        this.sessionId=WebrtcVideoViewComponent.uuidv4();
        this.peerConnection=this.createPeerConnection(video);
        this.webrtcServer.requestOffer(this.sessionId, this.videoSource).subscribe(
            sdp => {
                console.log("Got remote offer: ", sdp);
                this.setRemoteOffer(this.peerConnection, sdp);
            }
        );
    }

    createPeerConnection(video: HTMLVideoElement) : RTCPeerConnection {
        let iceServers = [];
        // public Google STUN server
        iceServers.push({urls:"stun:stun.l.google.com:19302"});
        // a STUN server enabled at the instance of Viinex we're connecting to
        if(location.hostname.toLowerCase() != "localhost" && location.hostname != "127.0.0.1"){
            iceServers.push({urls:"stun:"+location.hostname+":3478"});
        }
        let pc=new RTCPeerConnection({iceServers:iceServers});
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
            this.connectionState=pc.iceConnectionState;
            this.changeDetector.detectChanges();
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

    static uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
  
}
