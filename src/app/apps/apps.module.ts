import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AppsRoutingModule } from './apps-routing.module';
import { NgxMasonryComponent, NgxMasonryDirective, NgxMasonryModule } from 'ngx-masonry';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { NgIconsModule } from '@ng-icons/core';
import { bootstrapCalendar3, 
  bootstrapCheckCircle, bootstrapExclamationCircle, bootstrapXCircle, bootstrapThreeDotsVertical, 
  bootstrapThreeDots, bootstrapCameraVideo, bootstrapCameraReels, bootstrapHddStack,
  bootstrapWindowDock, bootstrapWindowStack, bootstrapBinoculars, bootstrapAppIndicator, bootstrapBoxArrowRight
 } from '@ng-icons/bootstrap-icons';
import { NgModel } from '@angular/forms';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    NgxMasonryModule,
    AppsRoutingModule,
    CommonModule,
    NgbCarouselModule,
    NgIconsModule.withIcons({bootstrapCalendar3, 
      bootstrapExclamationCircle, bootstrapXCircle, bootstrapCheckCircle, bootstrapThreeDotsVertical, bootstrapThreeDots, 
      bootstrapCameraVideo, bootstrapCameraReels, bootstrapHddStack,
      bootstrapWindowDock, bootstrapWindowStack, bootstrapBinoculars, bootstrapAppIndicator, bootstrapBoxArrowRight,
    })
  ]
})
export class AppsModule { }
