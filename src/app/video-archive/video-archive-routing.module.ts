import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginGuardService } from '../login-guard.service';

import { VideoArchiveComponent } from './video-archive.component';
import { VideoArchiveListComponent } from './video-archive-list.component';
import { VideoArchiveViewComponent } from './video-archive-view.component';

const routes: Routes = [
    { 
        path: 'video-archive',
        component: VideoArchiveComponent,
        children: [
            {
                path: '',
                component: VideoArchiveListComponent,
            },
            {
                path: ':videoArchiveId',
                component: VideoArchiveListComponent,
                children: [
                    {
                        path: ':videoSourceId',
                        component: VideoArchiveViewComponent
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
export class VideoArchiveRoutingModule { }