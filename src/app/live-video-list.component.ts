import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

import {VideoObjectsService} from './video-objects.service'
import {VideoSource,VideoObjects} from './video-objects'

@Component({
    template: `
    <ul>
      <li *ngFor="let vs of videoSources">
        <a (click)="onSelect(vs)">{{vs.name}}</a>
      </li>
    </ul>
    <router-outlet></router-outlet>
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