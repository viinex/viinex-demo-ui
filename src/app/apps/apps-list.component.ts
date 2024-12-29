import { Component, OnInit, ViewChild } from '@angular/core';
import { VideoObjectsService } from '../video-objects.service';
import { Stateful } from '../video-objects';
import { AutoCheckpoint, RailwayTrack } from './apps-objects';
import { NgFor, NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbCarousel, NgbCarouselConfig, NgbSlide } from '@ng-bootstrap/ng-bootstrap';
import { LiveSnapshotService } from '../live-snapshot.service';
import { NgxMasonryComponent, NgxMasonryModule, NgxMasonryOptions } from 'ngx-masonry';

@Component({
  selector: 'app-apps-list',
  standalone: true,
  imports: [NgIf, NgForOf, NgFor, RouterLink, NgbCarousel, NgbSlide, NgxMasonryModule],
  providers:[NgbCarouselConfig],
  templateUrl: './apps-list.component.html',
  styleUrl: './apps-list.component.css',
})
export class AppsListComponent implements OnInit {
  appsAutoCheckpoint: Array<AutoCheckpoint>=[];
  appsRailwayTrack: Array<RailwayTrack>=[];

  public liveSnapshots: any={};

  public masonryConfig: NgxMasonryOptions = {
    columnWidth: 320,
    gutter: 8,
    horizontalOrder: true,
    fitWidth: true,
    originLeft: true,
    originTop: true,
    resize: true,
    animations: {}
  };
  @ViewChild('masonryRailwayTracks') masonryRailwayTracks: NgxMasonryComponent;
  @ViewChild('masonryAutoCheckpoints') masonryAutoCheckpoints: NgxMasonryComponent;

  constructor(private videoObjectsService: VideoObjectsService, private liveSnapshotsService: LiveSnapshotService,
    carouselConfig: NgbCarouselConfig){
    carouselConfig.showNavigationArrows=true;
    carouselConfig.animation=false;
    carouselConfig.showNavigationIndicators=true;
    carouselConfig.wrap=true;
  }
  ngOnInit(): void {
    this.videoObjectsService.objects.subscribe(vo => {
      this.appsAutoCheckpoint=vo.appsAutoCheckpoint;
      this.appsRailwayTrack=vo.appsRailwayTrack;

      vo.appsRailwayTrack.forEach(a =>{
        a.videoSources.forEach(v => {
          this.liveSnapshotsService.get(v.name).subscribe(res => {
            this.liveSnapshots[v.name]=res;
          })
        })
      })
      vo.appsAutoCheckpoint.forEach(a =>{
        a.videoSources.forEach(v => {
          this.liveSnapshotsService.get(v.name).subscribe(res => {
            this.liveSnapshots[v.name]=res;
          })
        })
      })
      if(this.masonryRailwayTracks)
        this.masonryRailwayTracks.layout();
      if(this.masonryAutoCheckpoints)
        this.masonryAutoCheckpoints.layout();
    });
  }
}
