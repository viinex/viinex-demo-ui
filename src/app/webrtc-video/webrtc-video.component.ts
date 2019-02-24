import {Component} from '@angular/core';

@Component({
    template: `
    <h1>WebRTC video</h1>
    Viinex provides WebRTC support for viewing live video source in a browser window.
    <p>
    To get a live video stream using WebRTC from Viinex, one does create a session, and gets an SDP offer from Viinex. 
    This offer is then processed by the browser, and the result of such processing is an SDP answer
    which should be produced back to WebRTC server in Viinex. After that, browser and server should be able to
    start video data interchange.
    <p>
    <router-outlet></router-outlet>
    `
})
export class WebrtcVideoComponent { }