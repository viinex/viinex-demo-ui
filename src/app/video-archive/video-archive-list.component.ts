import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

import {VideoObjectsService} from '../video-objects.service'
import {VideoArchive,VideoTrack,VideoObjects,VideoArchiveSummary} from '../video-objects'

import {Format} from '../format'
import { forkJoin } from 'rxjs';
import { fstatSync } from 'fs';

@Component({
    templateUrl: "./video-archive-list.component.html"
})
export class VideoArchiveListComponent implements OnInit {
    errorMessage: string;
    videoArchives: VideoArchive[];
    selectedArchive: VideoArchive;
    selectedArchiveSummary: VideoArchiveSummary;
    externalVideoTracks: Array<VideoTrack> = [];
    previewImages: Object;
    selectedVideoTracks : Array<VideoTrack>;

    constructor(private router: Router, 
                private route: ActivatedRoute,
                private videoObjectsService: VideoObjectsService){
                    let fmt=new Intl.DateTimeFormat();
                    fmt.format()
    }

    ngOnInit(): void {
        this.videoObjectsService.getObjects().subscribe(
            objs => {
                this.videoArchives=objs.videoArchives;
                objs.videoSources.forEach(vs => {
                    vs.videoTracks.forEach(vt => {
                        if(vt.videoArchive==null){
                            this.externalVideoTracks.push(vt);
                        }
                    })
                });
                this.route.params.subscribe(params => {
                    let archId = params["videoArchiveId"];
                    let arch = this.videoArchives.find(va => va.name==archId);
                    if(null!=arch){
                        this.selectArchive(arch);
                    }
                    else if(archId=="vms__external"){
                        this.selectArchive(null);
                    }
                },
                error => this.errorMessage=<any>error
            );
        });
    }
    private selectArchive(va:VideoArchive){
        if(!va){
            this.selectedArchive=null;
            this.selectedArchiveSummary=null;
            this.selectedVideoTracks = this.externalVideoTracks;
        }
        else{
            this.selectedArchive=va; // set selected archive only after archive summary was fetched
            this.selectedVideoTracks=this.selectedArchive.videoTracks;
            va.getSummary().subscribe(s => { 
                this.selectedArchiveSummary=s;
            });
        }
        this.previewImages={};
        forkJoin(this.selectedVideoTracks.map(t => t.getSnapshotImage({cached:0},{width:160}))).subscribe(a => {
            for(let k=0; k<this.selectedVideoTracks.length; ++k){
                this.previewImages[this.selectedVideoTracks[k].videoSource.name]=a[k];
            }
        });
    }

    onSnapshotError(event: any){
        event.target.src='./assets/novideo.png';
    }

    formatInterval(trackName: string): string {
        if(this.selectedArchiveSummary==null){
            return "";
        }
        let res="no data";
        let ii=this.selectedArchiveSummary.tracks.get(trackName).timeBoundaries;
        if(null!=ii && ii.length==2){
            res=Format.interval([new Date(ii[0]), new Date(ii[1])]);
        }
        return res;
    }
    gb = Format.gb;
}