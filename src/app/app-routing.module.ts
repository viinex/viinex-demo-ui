import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OnvifDiscoveryComponent } from './onvif-discovery.component';
import { VideoObjectsComponent } from './video-objects.component';
import { PageNotFoundComponent } from './not-found.component';
import { LoginComponent } from './login.component';

const appRoutes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'onvif', component: OnvifDiscoveryComponent },
    { path: 'video-objects', component: VideoObjectsComponent },
    { path: 'live-video', loadChildren: 'app/live-video/live-video.module#LiveVideoModule'},
    { path: 'video-archive', loadChildren: 'app/video-archive/video-archive.module#VideoArchiveModule'},
    { path: '', redirectTo: '/video-objects', pathMatch: 'full' },
    { path: '**', component: PageNotFoundComponent }
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes, { useHash: true })
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule { }