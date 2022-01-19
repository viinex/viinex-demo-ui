import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

import {VideoObjectsService} from '../video-objects.service'
import {VideoArchive,VideoTrack,VideoObjects,VideoArchiveSummary} from '../video-objects'

import {Format} from '../format'
import { forkJoin } from 'rxjs';

@Component({
    templateUrl: "./video-archive-list.component.html"
})
export class VideoArchiveListComponent implements OnInit {
    errorMessage: string;
    videoArchives: VideoArchive[];
    selectedArchive: VideoArchive;
    selectedArchiveSummary: VideoArchiveSummary;
    previewImages: Object;

    constructor(private router: Router, 
                private route: ActivatedRoute,
                private videoObjectsService: VideoObjectsService){
                    let fmt=new Intl.DateTimeFormat();
                    fmt.format()
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            let archId = params["videoArchiveId"];
            if(null==this.videoArchives){
                this.videoObjectsService.getObjects().subscribe(
                    objs => {
                        this.videoArchives=objs.videoArchives;
                        let arch = this.videoArchives.find(va => va.name==archId);
                        if(null!=arch){
                            this.selectArchive(arch);
                        }
                        else {
                            this.selectArchive(null);
                        }
                    },
                    error => this.errorMessage=<any>error
                );
            }
            else {
                this.selectedArchive = this.videoArchives.find(va => va.name==archId);
            }
        });
    }
    private selectArchive(va:VideoArchive){
        if(!va){
            this.selectedArchive=null;
            this.selectedArchiveSummary=null;
            this.previewImages=null;
            return;
        }
        va.getSummary().subscribe(s => { 
            this.selectedArchiveSummary=s;
            this.selectedArchive=va; // set selected archive only after archive summary was fetched
            this.previewImages={};
            forkJoin(this.selectedArchive.videoTracks.map(t => t.getSnapshotImage({cached:0},{width:160}))).subscribe(a => {
                for(let k=0; k<this.selectedArchive.videoTracks.length; ++k){
                    this.previewImages[this.selectedArchive.videoTracks[k].videoSource.name]=a[k];
                }
            });
        });
    }

    onSnapshotError(event: any){
        event.target.src='./assets/novideo.png';
    }

    formatInterval(trackName: string): string {
        let res="no data";
        let ii=this.selectedArchiveSummary.tracks.get(trackName).timeBoundaries;
        if(null!=ii && ii.length==2){
            res=Format.interval([new Date(ii[0]), new Date(ii[1])]);
        }
        return res;
    }
    gb = Format.gb;
}