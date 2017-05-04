import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LiveVideoComponent } from './live-video.component';
import { LiveVideoListComponent } from './live-video-list.component';
import { LiveVideoViewComponent } from './live-video-view.component';

const routes: Routes = [
    { 
        path: '',
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
export class LiveVideoRoutingModule { }