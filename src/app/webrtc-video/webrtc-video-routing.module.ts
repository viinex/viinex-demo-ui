import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WebrtcVideoComponent } from './webrtc-video.component';
import { WebrtcVideoListComponent } from './webrtc-video-list.component';
import { WebrtcVideoViewComponent } from './webrtc-video-view.component';

const routes: Routes = [
    { 
        path: '',
        component: WebrtcVideoComponent,
        children: [
            {
                path: '',
                component: WebrtcVideoListComponent,
            },
            {
                path: ':webrtcServerId',
                component: WebrtcVideoListComponent,
                children: [
                    {
                        path: ':videoSourceId',
                        component: WebrtcVideoViewComponent
                    }
                ]
            }
        ]
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class WebrtcVideoRoutingModule { }