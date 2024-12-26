import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';

import {VideoObjectsService} from './video-objects.service'
import {VideoSource,VideoArchive,VideoObjects,VideoTrack} from './video-objects'
import {Format} from './format'
import { forkJoin, of } from 'rxjs';
import { LoginService } from './login.service';
import { LiveSnapshotService } from './live-snapshot.service';
import { NgxMasonryComponent } from 'ngx-masonry';

@Component({
    standalone: false,
    selector: 'video-objects',
    templateUrl: './video-objects.component.html',
    styleUrl: './video-objects.component.css'
})
export class VideoObjectsComponent implements OnInit {
    errorMessage: string;
    videoSources: VideoSource[];
    videoArchives: VideoArchive[];
    liveSnapshots: any;
    isHttp: boolean;

    public masonryConfig = {
        columnWidth: 320, 
        gutter: 8,
        horizontalOrder: false,
        transitionDuration: 0,
    }

    constructor(private videoObjectsService: VideoObjectsService, private login: LoginService, private liveSnapshotsService: LiveSnapshotService){
        this.videoSources=new Array<VideoSource>();
        this.videoArchives=new Array<VideoArchive>();
        this.liveSnapshots={};
    }
    @ViewChild('masonry') masonry: NgxMasonryComponent;

    ngOnInit(): void {
        this.login.loginStatus.subscribe(ls => { this.isHttp = ls.isHttp });
        this.videoObjectsService.objects.subscribe(
            objs => {
                this.videoSources=objs.videoSources;
                this.videoArchives=objs.videoArchives;
                objs.videoSources.forEach(vs => {
                    this.liveSnapshotsService.get(vs.name).subscribe(image => {
                        this.liveSnapshots[vs.name]=image;
                    }, e => { console.log(e); this.liveSnapshots[vs.name]='assets/novideo.jpg'; });
                });
                this.masonry.layout();
            },
            error => this.errorMessage=<any>error
        );
    }
    gb = Format.gb;

    onSnapshotError(event: any){
        event.target.src='./assets/novideo.png';
    }
}