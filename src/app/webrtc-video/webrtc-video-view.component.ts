import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormsModule} from '@angular/forms';

import { ActivatedRoute,Router }       from '@angular/router';

import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/mergeMap'

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource,VideoObjects, WebRTCServer} from '../video-objects'
import { parseCookieValue } from '@angular/common/src/cookie';

@Component({
    templateUrl: "webrtc-video-view.component.html"
})
export class WebrtcVideoViewComponent implements OnInit, OnDestroy{
    errorMessage: string;

    // selected objects
    webrtcServer: WebRTCServer;
    videoSource: VideoSource;

    private peerConnection : RTCPeerConnection;
    private sessionId : string;

    constructor(private route: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService){
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
            this.webrtcServer.dropSession(this.sessionId);
            this.sessionId=null;
        }
    }

    showVideo() {
        this.clearVideo();
        let videoDiv = <HTMLDivElement>document.getElementById("VideoDiv");

        let video=<HTMLVideoElement>document.createElement("video"); 
        video.controls=true;
        video.setAttribute("width", "100%");
        video.setAttribute("playsinline", "true");
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
        let pc=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});
        pc.onicecandidate = e => {
            if(e.candidate==null){
                console.log("last candidate received");
                console.log(pc.localDescription.sdp);
                this.webrtcServer.sendAnswer(this.sessionId, pc.localDescription.sdp).subscribe(res => {
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
        pc.ontrack = e => {
            console.log("ontrack event received: ");
            console.log(e.streams[0]);
            video.srcObject=e.streams[0];
            console.log(e.track);
            //labelElement.innerHTML= e.track.label.id;
            console.log("ice gathering state:", pc.iceGatheringState);
        }
        pc.onsignalingstatechange = e => {
            console.log("signalingState:", pc.signalingState);
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