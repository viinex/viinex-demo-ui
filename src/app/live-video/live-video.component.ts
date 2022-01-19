import {Component} from '@angular/core';

@Component({
    template: `
    <h1>Live video</h1>
    <p>This view shows the HLS streaming from Viinex server to the &lt;video&gt; tag in a browser.</p>
    <router-outlet></router-outlet>
    `
})
export class LiveVideoComponent { }