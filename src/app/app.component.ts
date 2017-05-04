import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  template: `
<nav class="navbar navbar-toggleable-md nav-fixed-top bg-primary navbar-inverse">
<div class="container">
<h1 class="navbar-brand">Viinex 2.0 demo</h1>
<ul class="navbar-nav">
  <li class="nav-item">
    <a class="nav-link" routerLinkActive="active" routerLink="/video-objects">Overview</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" routerLinkActive="active" routerLink="/live-video">Live video</a> 
  </li>
  <li class="nav-item">
    <a class="nav-link" routerLinkActive="active" routerLink="/onvif">ONVIF discovery tool</a>
  </li>
</ul>
</div>
</nav>

<div class="fixed-bottom">
  <div class="container">
    <p class="text-muted">This is a demo user interface for Viinex 2.0 video management SDK. 
    (c) Viinex, 2017. All rights reserved.</p>
  </div>
</div>

<div class="container">
<router-outlet></router-outlet>
</div> <!--container-->
  `,
  styles: ['.active { font-weight: bold; }']
})
export class AppComponent  { }
/*
<nav class="navbar navbar-fixed-top navbar-dark bg-inverse">
    <div class="container">
        <a class="navbar-brand">Angular Router</a>
        <ul class="nav navbar-nav" routerLinkActive="active">
            <li class="nav-item"><a class="nav-link" routerLink="home">Home</a></li>
            <li class="nav-item"><a class="nav-link" routerLink="about">About</a></li>
            <li class="nav-item"><a class="nav-link" routerLink="courses">Courses</a></li>
        </ul>
    </div>
</nav>
*/