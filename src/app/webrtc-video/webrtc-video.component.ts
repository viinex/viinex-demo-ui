import {Component} from '@angular/core';

@Component({
    standalone: false,
    template: `
    <h1>WebRTC live video</h1>
    <router-outlet></router-outlet>
    `
})
export class WebrtcVideoComponent { }