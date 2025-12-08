import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule, Routes }  from '@angular/router';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbCarousel, NgbCarouselConfig, NgbSlide } from '@ng-bootstrap/ng-bootstrap';


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
import { AppsModule } from './apps/apps.module';
import { AppsRoutingModule } from './apps/apps-routing.module';
import { NgxMasonryModule } from 'ngx-masonry';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NgIconsModule } from '@ng-icons/core';
import { bootstrapCalendar3, bootstrapCheckCircle, bootstrapExclamationCircle, bootstrapXCircle } from '@ng-icons/bootstrap-icons';


@NgModule({ 
    declarations: [AppComponent, OnvifDiscoveryComponent, VideoObjectsComponent, PageNotFoundComponent, LoginComponent],
    bootstrap: [AppComponent], 
    imports: [BrowserModule,
        FormsModule,
        RouterModule,
        NgbModule,
        NgbDropdownModule,
        NgbCarousel,
        NgxMasonryModule,
        LiveVideoModule,
        VideoArchiveModule,
        WebrtcVideoModule,
        LiveVideoRoutingModule,
        VideoArchiveRoutingModule,
        WebrtcVideoRoutingModule,
        ViewportModule,
        AppsModule,
        AppsRoutingModule,
        AppRoutingModule,
        NgIconsModule.withIcons({bootstrapCalendar3, bootstrapExclamationCircle, bootstrapXCircle, bootstrapCheckCircle})
    ], 
    providers: [OnvifService, 
        VideoObjectsService, 
        LoginService, 
        LoginGuardService, 
        WampClient, 
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimationsAsync()
    ] 
})
export class AppModule { }
