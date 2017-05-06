import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

import {VideoObjectsService} from '../video-objects.service'
import {VideoArchive,VideoArchiveContext,VideoObjects} from '../video-objects'

@Component({
    template: `
    <div class="row">
    <div class="col-md-4">
    <div class="card">
      <div class="card-block">
        <h3 class="card-title">Video storage</h3>
        <p class="card-text">Select a video archive to extract video data from. A single video source may be written into multiple video archives.</p>
      </div>
      <ul class="nav nav-pills flex-column">
      <li class="nav-item" *ngFor="let va of videoArchives">
          <a class="nav-link" (click)="onSelectArchive(va)">{{va.name}}</a>
      </li>
      </ul>
    </div>
    <div class="card" *ngIf="selectedArchive != null">
      <div class="card-block">
        <h3>Video source</h3>
        <p>Select a video source written to the video archive to display data from.</p>
      </div>
      <ul class="nav nav-pills flex-column">
        <li class="nav-item" *ngFor="let vc of selectedArchive.videoSources">
          <a class="nav-link" routerLink="./{{va.name}}/{{vc.name}}" routerLinkActive="active">{{vc.name}}</a>
          {{vc.diskUsage/1000000}} MB, {{vc.timeBoundaries[0]}}-{{vc.timeBoundaries[1]}}
        </li>
      </ul>
    
    </div>
    <div class="col-md-7">
    <router-outlet></router-outlet>
    </div>
    `
})
export class VideoArchiveListComponent implements OnInit {
    errorMessage: string;
    videoArchives: VideoArchive[];
    selectedArchive: VideoArchive;

    constructor(private router: Router, 
                private route: ActivatedRoute,
                private videoObjectsService: VideoObjectsService){}
    ngOnInit(): void {
        this.videoObjectsService.getObjects().subscribe(
            objs => {
                this.videoArchives=objs.videoArchives;
            },
            error => this.errorMessage=<any>error
        );
        //this.route.data.subscribe()
    }
    onSelectArchive(va:VideoArchive){
        this.selectedArchive=va;
        //this.router.navigate([vs.name], { relativeTo: this.route })
    }
}