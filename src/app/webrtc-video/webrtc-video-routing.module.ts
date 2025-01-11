import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginGuardService } from '../login-guard.service';

import { WebrtcVideoComponent } from './webrtc-video.component';
import { WebrtcVideoListComponent } from './webrtc-video-list.component';
import { WebrtcVideoViewComponent } from './webrtc-video-view.component';

const routes: Routes = [
    { 
        path: 'webrtc-video',
        component: WebrtcVideoComponent,
        children: [
            {
                path: '',
                component: WebrtcVideoListComponent,
            },
            {
                path: 'srv/:webrtcServerId',
                component: WebrtcVideoListComponent,
                children: [
                    {
                        path: 'src/:videoSourceId',
                        component: WebrtcVideoViewComponent
                    }
                ]
            },
            {
                path: 'src',
                component: WebrtcVideoListComponent,
                children: [
                    {
                        path:":videoSourceId",
                        component: WebrtcVideoViewComponent
                    }                    
                ]
            },
        ],
        canActivate: [LoginGuardService]
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