import { NgModule }      from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {VideoObjectsService} from '../video-objects.service'
import {VideoArchiveRoutingModule} from './video-archive-routing.module'
import {VideoArchiveListComponent} from './video-archive-list.component'
import {VideoArchiveViewComponent} from './video-archive-view.component'
import {VideoArchiveComponent} from './video-archive.component'
import { ViewportModule } from '../viewport/viewport.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  imports:      [ CommonModule, VideoArchiveRoutingModule, FormsModule, ViewportModule, NgbModule ],
  declarations: [ VideoArchiveComponent, VideoArchiveListComponent, VideoArchiveViewComponent]
})
export class VideoArchiveModule { }
