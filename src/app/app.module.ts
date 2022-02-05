import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes }  from '@angular/router';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {LoginService} from './login.service';
import {OnvifService} from './onvif.service';
import {OnvifDiscoveryComponent} from './onvif-discovery.component';
import {VideoObjectsService} from './video-objects.service'
import {VideoObjectsComponent} from './video-objects.component';
import {PageNotFoundComponent} from './not-found.component';
import {LoginComponent} from './login.component';

import {LiveVideoRoutingModule} from './live-video/live-video-routing.module'
import { VideoArchiveRoutingModule } from './video-archive/video-archive-routing.module';
import { WebrtcVideoRoutingModule } from './webrtc-video/webrtc-video-routing.module';
import {AppRoutingModule} from './app-routing.module'


import { LiveVideoModule } from './live-video/live-video.module';
import { VideoArchiveModule } from './video-archive/video-archive.module';
import { WebrtcVideoModule } from './webrtc-video/webrtc-video.module';

import { AppComponent }  from './app.component';
import { Component } from '@angular/core';
import { LoginGuardService } from './login-guard.service';
import { WampClient } from './wamp-client';
import { ViewportModule } from './viewport/viewport.module';


@NgModule({
  imports:      [ BrowserModule, 
                  HttpClientModule, 
                  FormsModule,
                  RouterModule,
                  NgbModule,

                  LiveVideoModule,
                  VideoArchiveModule,
                  WebrtcVideoModule,

                  LiveVideoRoutingModule,
                  VideoArchiveRoutingModule,
                  WebrtcVideoRoutingModule,
                  ViewportModule,

                  AppRoutingModule
                ],
  declarations: [ AppComponent, OnvifDiscoveryComponent, VideoObjectsComponent, PageNotFoundComponent, LoginComponent ],
  providers:    [ OnvifService, VideoObjectsService, LoginService, LoginGuardService, WampClient ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
