import {Component, OnInit} from '@angular/core';

import {VideoObjectsService} from './video-objects.service'
import {VideoSource,VideoArchive,VideoObjects,VideoTrack} from './video-objects'
import {Format} from './format'
import { forkJoin, of } from 'rxjs';
import { LoginService } from './login.service';

@Component({
    selector: 'video-objects',
    templateUrl: './video-objects.component.html'
})
export class VideoObjectsComponent implements OnInit {
    errorMessage: string;
    videoSources: VideoSource[];
    videoArchives: VideoArchive[];
    liveSnapshots: any;
    isHttp: boolean;

    constructor(private videoObjectsService: VideoObjectsService, private login: LoginService){
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
                forkJoin(this.videoSources.map(vs => {
                    if(vs.getSnapshotImage){
                        return vs.getSnapshotImage({scale:[160,0]});
                    }
                    else{
                        return of("");
                    }
                })).subscribe(ss => {
                    for(let k=0; k<this.videoSources.length; ++k){
                        this.liveSnapshots[this.videoSources[k].name]=ss[k];
                    }
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