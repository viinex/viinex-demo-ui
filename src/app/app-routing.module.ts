import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OnvifDiscoveryComponent } from './onvif-discovery.component';
import { VideoObjectsComponent } from './video-objects.component';
import { PageNotFoundComponent } from './not-found.component';
import { LoginComponent } from './login.component';
import { LoginGuardService } from './login-guard.service';

const appRoutes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'onvif', component: OnvifDiscoveryComponent, canActivate: [LoginGuardService] },
    { path: 'video-objects', component: VideoObjectsComponent, canActivate: [LoginGuardService] },
    { path: 'live-video', loadChildren: 'app/live-video/live-video.module#LiveVideoModule', canActivate: [LoginGuardService] },
    { path: 'webrtc-video', loadChildren: 'app/webrtc-video/webrtc-video.module#WebrtcVideoModule', canActivate: [LoginGuardService] },
    { path: 'video-archive', loadChildren: 'app/video-archive/video-archive.module#VideoArchiveModule', canActivate: [LoginGuardService] },
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