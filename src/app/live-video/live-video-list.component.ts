import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource,VideoObjects} from '../video-objects'

@Component({
    templateUrl: 'live-video-list.component.html'
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
                this.errorMessage=<any>error
            }
        );
    }
    onSelect(vs:VideoSource){
        this.router.navigate([vs.name], { relativeTo: this.route })
    }
}