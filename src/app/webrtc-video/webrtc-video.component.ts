import {Component} from '@angular/core';

@Component({
    standalone: false,
    template: `
    <h1>WebRTC video</h1>
    <p>Viinex provides WebRTC support for viewing live ard archive video in a browser window. </p>
    <router-outlet></router-outlet>
    `
})
export class WebrtcVideoComponent { }