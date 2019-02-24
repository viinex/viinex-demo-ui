import { NgModule }      from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {VideoObjectsService} from '../video-objects.service'
import {WebrtcVideoRoutingModule} from './webrtc-video-routing.module'
import {WebrtcVideoListComponent} from './webrtc-video-list.component'
import {WebrtcVideoViewComponent} from './webrtc-video-view.component'
import {WebrtcVideoComponent} from './webrtc-video.component'


@NgModule({
  imports:      [ CommonModule, WebrtcVideoRoutingModule, FormsModule ],
  declarations: [ WebrtcVideoComponent, WebrtcVideoListComponent, WebrtcVideoViewComponent]
})
export class WebrtcVideoModule { }
