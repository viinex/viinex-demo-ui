import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes }  from '@angular/router';

import {AppRoutingModule} from './app-routing.module'

import {OnvifService} from './onvif.service';
import {OnvifDiscoveryComponent} from './onvif-discovery.component';
import {VideoObjectsService} from './video-objects.service'
import {VideoObjectsComponent} from './video-objects.component';
import {PageNotFoundComponent} from './not-found.component';

import { AppComponent }  from './app.component';
import { Component } from '@angular/core';


@NgModule({
  imports:      [ BrowserModule, HttpModule, AppRoutingModule ],
  declarations: [ AppComponent, OnvifDiscoveryComponent, VideoObjectsComponent, PageNotFoundComponent ],
  providers:    [ OnvifService, VideoObjectsService ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
