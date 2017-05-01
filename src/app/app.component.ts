import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  template: `<h1>Viinex 2.0</h1>
  <nav>
  <a routerLink="/video-objects" routerLinkActive="active">Video objects overview</a>
  <a routerLink="/live-video" routerLinkActive="active">Live video</a> 
  <a routerLink="/onvif" routerLinkActive="active">ONVIF discovery tool</a>
  </nav>
  <p>  
  This is a demo user interface for Viinex 2.0 video management SDK.
  <p>
  <router-outlet></router-outlet>
  `,
  styles: ['.active { font-weight: bold; }']
})
export class AppComponent  { }
