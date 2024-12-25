import {Component, OnInit} from '@angular/core';

import {VideoObjectsService} from './video-objects.service'
import {VideoSource,VideoArchive,VideoObjects,VideoTrack} from './video-objects'
import {Format} from './format'
import { forkJoin, of } from 'rxjs';
import { LoginService } from './login.service';
import { LiveSnapshotService } from './live-snapshot.service';

@Component({
    standalone: false,
    selector: 'video-objects',
    templateUrl: './video-objects.component.html'
})
export class VideoObjectsComponent implements OnInit {
    errorMessage: string;
    videoSources: VideoSource[];
    videoArchives: VideoArchive[];
    liveSnapshots: any;
    isHttp: boolean;

    constructor(private videoObjectsService: VideoObjectsService, private login: LoginService, private liveSnapshotsService: LiveSnapshotService){
        this.videoSources=new Array<VideoSource>();
        this.videoArchives=new Array<VideoArchive>();
        this.liveSnapshots={};
    }
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
            },
            error => this.errorMessage=<any>error
        );
    }
    gb = Format.gb;

    onSnapshotError(event: any){
        event.target.src='./assets/novideo.png';
    }
}