import {Component} from '@angular/core';

@Component({
    standalone: false,
    template: `
    <h1>Video archive</h1>
    <p>Video archive view shows video storages configured at the Viinex instance, and the video sources associated with them.</p>
    <router-outlet></router-outlet>
    `
})
export class VideoArchiveComponent { }