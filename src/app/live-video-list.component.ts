import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

import {VideoObjectsService} from './video-objects.service'
import {VideoSource,VideoObjects} from './video-objects'

@Component({
    template: `
    <div class="row">
    <div class="col-md-4">
    <ul class="nav nav-pills flex-column">
      <li class="nav-item" *ngFor="let vs of videoSources">
        <a class="nav-link" routerLink="./{{vs.name}}" routerLinkActive="active">{{vs.name}}</a>
      </li>
    </ul>
    </div>
    <div class="col-md-7">
    <router-outlet></router-outlet>
    </div>
    `
})
export class LiveVideoListComponent implements OnInit {
    errorMessage: string;
    videoSources: VideoSource[];

    constructor(private router: Router, 
                private route: ActivatedRoute,
                private videoObjectsService: VideoObjectsService){}
    ngOnInit(): void {
        this.videoObjectsService.getObjects().subscribe(
            objs => {
                this.videoSources=objs.videoSources;
            },
            error => this.errorMessage=<any>error
        );
    }
    onSelect(vs:VideoSource){
        this.router.navigate([vs.name], { relativeTo: this.route })
    }
}