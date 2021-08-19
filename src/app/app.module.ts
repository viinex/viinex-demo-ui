import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes }  from '@angular/router';
import {FormsModule} from '@angular/forms';

//import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {AppRoutingModule} from './app-routing.module'

import {LoginService} from './login.service';
import {OnvifService} from './onvif.service';
import {OnvifDiscoveryComponent} from './onvif-discovery.component';
import {VideoObjectsService} from './video-objects.service'
import {VideoObjectsComponent} from './video-objects.component';
import {PageNotFoundComponent} from './not-found.component';
import {LoginComponent} from './login.component';

import { AppComponent }  from './app.component';
import { Component } from '@angular/core';
import { LoginGuardService } from './login-guard.service';


@NgModule({
  imports:      [ BrowserModule, 
                  HttpClientModule, 
                  AppRoutingModule, 
                  FormsModule
                  //,NgbModule.forRoot() 
                  ],
  declarations: [ AppComponent, OnvifDiscoveryComponent, VideoObjectsComponent, PageNotFoundComponent, LoginComponent ],
  providers:    [ OnvifService, VideoObjectsService, LoginService, LoginGuardService ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
