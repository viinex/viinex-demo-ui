import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginGuardService } from '../login-guard.service';

import { LiveVideoComponent } from './live-video.component';
import { LiveVideoListComponent } from './live-video-list.component';
import { LiveVideoViewComponent } from './live-video-view.component';

const routes: Routes = [
    { 
        path: 'live-video',
        component: LiveVideoComponent,
        children: [
            {
                path: '', 
                component: LiveVideoListComponent, 
                children: [
                    {
                        path: ':videoSourceId',
                        component: LiveVideoViewComponent
                    }
                ]
            }
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
export class LiveVideoRoutingModule { }