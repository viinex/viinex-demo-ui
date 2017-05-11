import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { VideoArchiveComponent } from './video-archive.component';
import { VideoArchiveListComponent } from './video-archive-list.component';
import { VideoArchiveViewComponent } from './video-archive-view.component';

const routes: Routes = [
    { 
        path: '',
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
export class VideoArchiveRoutingModule { }