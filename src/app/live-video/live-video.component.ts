import {Component} from '@angular/core';

@Component({
    template: `
    <h1>Live video</h1>
    This view shows the HLS streaming from Viinex server to the &lt;video&gt; tag in a browser.
    <p>
    HLS stream is served by an URL like <pre>/v1/svc/VIDEOSOURCE/stream.m3u8</pre>
    -- just substitute the configured video source name instead of "VIDEOSOURCE" placeholder 
    in your application, and you're done.
    <p><p>
    <router-outlet></router-outlet>
    `
})
export class LiveVideoComponent { }