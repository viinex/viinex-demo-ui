import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource,VideoObjects} from '../video-objects'

@Component({
    template: `
    <div class="row">
    <div class="col-md-4">
    <h3>Select a live video source</h3>
    <a class="btn" *ngFor="let vs of videoSources" routerLink="./{{vs.name}}" routerLinkActive="btn-primary">{{vs.name}}</a>
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
                this.videoSources=objs.videoSources.filter(vs => vs.isLive);
            },
            error => {
                console.log("error");
                console.log(error);
                this.errorMessage=<any>error
            }
        );
    }
    onSelect(vs:VideoSource){
        this.router.navigate([vs.name], { relativeTo: this.route })
    }
}