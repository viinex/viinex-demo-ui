import {Component} from '@angular/core';

@Component({
    template: `
    <h1>Video archive</h1>
    Video archive view shows video storages configured at the Viinex instance, and the video sources associated with them.
    <p>
    The media data as well as information on video storage contents is available via HTTP calls to such URLs as
    <pre>
    /v1/svc/STORAGE, /v1/svc/STORAGE/VIDEOSOURCE,
    /v1/svc/STORAGE/VIDEOSOURCE[/stream | /export | /snapshot].</pre>
    Their use is pretty simple, please refer to Viinex 2.0 documentation for more details.
    <p>
    <router-outlet></router-outlet>
    `
})
export class VideoArchiveComponent { }