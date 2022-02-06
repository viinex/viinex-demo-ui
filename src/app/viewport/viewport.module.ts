import { NgModule }      from '@angular/core';
import { WebrtcViewportComponent } from './webrtc-viewport.component';
import { HlsViewportComponent } from './hls-viewport.component';


@NgModule({
  declarations: [ WebrtcViewportComponent, HlsViewportComponent ],
  exports: [ WebrtcViewportComponent, HlsViewportComponent ]
})
export class ViewportModule { }
