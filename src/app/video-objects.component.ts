import {Component, OnInit} from '@angular/core';

import {VideoObjectsService} from './video-objects.service'
import {VideoSource,VideoArchive,VideoObjects,VideoArchiveContext} from './video-objects'

@Component({
    selector: 'video-objects',
    templateUrl: './video-objects.component.html'
})
export class VideoObjectsComponent implements OnInit {
    errorMessage: string;
    videoSources: VideoSource[];
    videoArchives: VideoArchive[];

    constructor(private videoObjectsService: VideoObjectsService){}
    ngOnInit(): void {
        this.videoObjectsService.getObjects().subscribe(
            objs => {
                this.videoSources=objs.videoSources;
                this.videoArchives=objs.videoArchives;
            },
            error => this.errorMessage=<any>error
        );
    }
}