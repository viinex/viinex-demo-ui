import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';

import {OnvifService} from './onvif.service';
import {OnvifDiscoveryComponent} from './onvif-discovery.component';

import { AppComponent }  from './app.component';
import { Component } from '@angular/core';


@NgModule({
  imports:      [ BrowserModule, HttpModule ],
  declarations: [ AppComponent, OnvifDiscoveryComponent ],
  providers:    [ OnvifService ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
