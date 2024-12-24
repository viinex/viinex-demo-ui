import { Component, OnInit } from '@angular/core';
import { VideoObjectsService } from '../video-objects.service';
import { Stateful } from '../video-objects';
import { AutoCheckpoint, RailwayTrack } from './apps-objects';
import { NgFor, NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbCarousel, NgbSlide } from '@ng-bootstrap/ng-bootstrap';
import { LiveSnapshotService } from '../live-snapshot.service';

@Component({
  selector: 'app-apps-list',
  standalone: true,
  imports: [NgIf, NgForOf, NgFor, RouterLink, NgbCarousel, NgbSlide],
  templateUrl: './apps-list.component.html',
  styleUrl: './apps-list.component.css'
})
export class AppsListComponent implements OnInit {
  appsAutoCheckpoint: Array<AutoCheckpoint>=[];
  appsRailwayTrack: Array<RailwayTrack>=[];

  public liveSnapshots: any={};

  constructor(private videoObjectsService: VideoObjectsService, private liveSnapshotsService: LiveSnapshotService){}
  ngOnInit(): void {
    this.videoObjectsService.objects.subscribe(vo => {
      this.appsAutoCheckpoint=vo.appsAutoCheckpoint;
      this.appsRailwayTrack=vo.appsRailwayTrack;

      vo.appsAutoCheckpoint.forEach(a =>{
        a.videoSources.forEach(v => {
          this.liveSnapshotsService.get(v.name).subscribe(res => {
            this.liveSnapshots[v.name]=res;
          })
        })
      })

      console.log("this.appsAutoCheckpoint:", this.appsAutoCheckpoint);
    });
  }
}
