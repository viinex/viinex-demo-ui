import { NgModule }      from '@angular/core';
import { CommonModule } from '@angular/common';

import {VideoObjectsService} from './video-objects.service'
import {LiveVideoRoutingModule} from './live-video-routing.module'
import {LiveVideoListComponent} from './live-video-list.component'
import {LiveVideoViewComponent} from './live-video-view.component'
import {LiveVideoComponent} from './live-video.component'


@NgModule({
  imports:      [ CommonModule, LiveVideoRoutingModule ],
  declarations: [ LiveVideoComponent, LiveVideoListComponent, LiveVideoViewComponent]
})
export class LiveVideoModule { }
