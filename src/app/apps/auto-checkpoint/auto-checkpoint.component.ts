import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoObjectsService } from '../../video-objects.service';
import { Subscription } from 'rxjs';
import { VideoObjects } from '../../video-objects';
import { AutoCheckpoint } from '../apps-objects';
import { NgForOf, NgIf } from '@angular/common';
import { WebrtcViewportComponent } from '../../viewport/webrtc-viewport.component';
import { ViewportModule } from '../../viewport/viewport.module';

@Component({
  selector: 'app-auto-checkpoint',
  standalone: true,
  imports: [NgIf, NgForOf, ViewportModule],
  templateUrl: './auto-checkpoint.component.html',
  styleUrl: './auto-checkpoint.component.css'
})
export class AutoCheckpointComponent implements OnInit, OnDestroy {
  constructor(private activatedRoute: ActivatedRoute, private videoObjectsService: VideoObjectsService){
  }

  private subscriptions: Array<Subscription>=[];
  private autoCheckpointId: string = null;
  private videoObjects: VideoObjects = null;

  private initialized=false;
  public autoCheckpoint: AutoCheckpoint=null;
  
  ngOnInit(): void {
    this.subscriptions.push(this.activatedRoute.params.subscribe(p => {
      console.log("auto checkpoint component ctor", p);
      this.autoCheckpointId = p["autoCheckpointId"];
      this.completeInit();
    }));
    this.videoObjectsService.objects.subscribe(vo => {
      this.videoObjects=vo;
      this.completeInit();
    })
    this.subscriptions.push(this.videoObjectsService.events.subscribe(event => {

    }));
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(s => { s.unsubscribe(); })
  }

  private completeInit(this: AutoCheckpointComponent){
    if(this.initialized)
      return;
    if(this.videoObjects && this.autoCheckpointId){
      this.autoCheckpoint=this.videoObjects.appsAutoCheckpoint.find(a => a.name==this.autoCheckpointId);
      
      this.initialized=true;
    }
  }
}
