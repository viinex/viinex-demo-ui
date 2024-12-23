import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from '../app.component';
import { LoginGuardService } from '../login-guard.service';
import { RailwayTrackComponent } from './railway-track/railway-track.component';
import { AutoCheckpointComponent } from './auto-checkpoint/auto-checkpoint.component';
import { AppsComponent } from './apps.component';
import { AppsListComponent } from './apps-list.component';

const routes: Routes = [{
  path: 'apps',
  component: AppsComponent,
  canActivate:[LoginGuardService],
  children:[
    {
      path: '',
      component: AppsListComponent
    },
    {
      path: 'RailwayTrack/:railwayTrackId',
      component: RailwayTrackComponent
    },
    {
      path: 'AutoCheckpoint/:autoCheckpointId',
      component: AutoCheckpointComponent
    }
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppsRoutingModule { }
