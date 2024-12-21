import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OnvifDiscoveryComponent } from './onvif-discovery.component';
import { VideoObjectsComponent } from './video-objects.component';
import { PageNotFoundComponent } from './not-found.component';
import { LoginComponent } from './login.component';
import { LoginGuardService } from './login-guard.service';
import { EventsComponent } from './events/events.component';

const appRoutes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'onvif', component: OnvifDiscoveryComponent, canActivate: [LoginGuardService] },
    { path: 'events', component: EventsComponent, canActivate: [LoginGuardService] },
    { path: 'video-objects', component: VideoObjectsComponent, canActivate: [LoginGuardService] },
    { path: '', redirectTo: '/video-objects', pathMatch: 'full' },
    { path: '**', component: PageNotFoundComponent }
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes, { useHash: true }),
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule { }