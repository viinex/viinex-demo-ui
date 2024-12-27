import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AppsRoutingModule } from './apps-routing.module';
import { NgxMasonryComponent, NgxMasonryDirective, NgxMasonryModule } from 'ngx-masonry';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    NgxMasonryModule,
    AppsRoutingModule,
    CommonModule,
    NgbCarouselModule
  ]
})
export class AppsModule { }
