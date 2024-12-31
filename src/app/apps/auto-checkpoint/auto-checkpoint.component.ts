import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoObjectsService } from '../../video-objects.service';
import { Subscription, merge, of } from 'rxjs';
import { delay, mergeAll } from 'rxjs/operators';
import { EventArchive, VideoObjects, VnxEvent } from '../../video-objects';
import { AutoCheckpoint } from '../apps-objects';
import { NgForOf, NgIf } from '@angular/common';
import { WebrtcViewportComponent } from '../../viewport/webrtc-viewport.component';
import { ViewportModule } from '../../viewport/viewport.module';
import { DatePipe } from '@angular/common';
import { AcpLogRecordComponent } from './acp-log-record.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { Fact, ReduceCtx } from './fact';

@Component({
  selector: 'app-auto-checkpoint',
  standalone: true,
  imports: [NgIf, NgForOf, ViewportModule, DatePipe, AcpLogRecordComponent],
  templateUrl: './auto-checkpoint.component.html',
  styleUrl: './auto-checkpoint.component.css',
  animations: [
    trigger('fadeOut', [
      transition(':leave', [
        animate('1s', style({opacity: 0}))
      ]),
    ])
  ]
})
export class AutoCheckpointComponent implements OnInit, OnDestroy {
  constructor(private activatedRoute: ActivatedRoute, private videoObjectsService: VideoObjectsService){
  }

  private subscriptions: Array<Subscription>=[];
  private autoCheckpointId: string = null;
  private videoObjects: VideoObjects = null;
  private eventArchive: EventArchive = null;

  private initialized=false;
  public autoCheckpoint: AutoCheckpoint=null;

  public current : Fact = null;
  public history: Array<Fact> = [];
  
  ngOnInit(): void {
    this.subscriptions.push(this.activatedRoute.params.subscribe(p => {
      this.autoCheckpointId = p["autoCheckpointId"];
      this.completeInit();
    }));
    this.videoObjectsService.objects.subscribe(vo => {
      this.videoObjects=vo;
      this.completeInit();
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(s => { s.unsubscribe(); })
  }

  private completeInit(this: AutoCheckpointComponent){
    if(this.initialized)
      return;
    if(this.videoObjects && this.autoCheckpointId){
      this.autoCheckpoint=this.videoObjects.appsAutoCheckpoint.find(a => a.name==this.autoCheckpointId);
      this.eventArchive=this.videoObjects.eventArchives[0];
      let now: Date = new Date();
      let begin=new Date(now.valueOf()-3600000);
      let end = new Date(now.valueOf()+360000);
      this.eventArchive.query(null, [this.autoCheckpointId], begin,end, 10000, 0).subscribe((events: Array<VnxEvent>) => {
        this.arrangeEvents(events);

        this.autoCheckpoint.stateful.read().subscribe(s => {
          if(s.processing && this.current && !this.current.car_photo){
            this.current.car_photo="data:image/jpeg;base64,"+s.car_photo;
            //console.log("COMPARE", this.current, Fact.fromCheckpointResponse(this.autoCheckpoint.directions, s));
          }
        });
        this.subscriptions.push(this.videoObjectsService.events.subscribe(event => {
          if(event.origin.name===this.autoCheckpointId){
            this.processEvent(event);
          }
          this.initialized=true;
        }));
      });
    }
  }

  private arrangeEvents(this: AutoCheckpointComponent, events: Array<any>){
    let ctx=events.reduce((ctx, e) => this.appendEvent(ctx, e), new ReduceCtx());
    this.history=ctx.history;
    this.current=ctx.current;
  }
  private appendEvent(this: AutoCheckpointComponent, ctx: ReduceCtx, e: VnxEvent) {
    if(Fact.isInitial(e)){
      if(ctx.current){
        ctx.history.push(ctx.current);
      }
      ctx.current=new Fact(this.autoCheckpoint.directions, e);
    }
    else {
      if(ctx.current){
        ctx.current.append(e);
        if(ctx.current.complete){
          ctx.history.push(ctx.current);
          console.log("Moving Fact to history: ", ctx.current)
          ctx.current=null;
        }
      }
    }
    return ctx;
  }

  processEvent(this: AutoCheckpointComponent, e: any){
    if(!this.autoCheckpoint)
      return;

    let {current, history}=this.appendEvent({current: this.current, history: this.history}, e);
    this.current=current;
    this.history=history;

    if(this.current && Fact.isInitial(e)){
      let tracks = this.current.direction.videoSource.videoTracks;
      if(tracks && tracks.length>0){
        of({}).pipe(delay(2000)).subscribe(_ => {
          tracks[0].getSnapshotImage(this.current.timestamp, {}).subscribe((image: string) => {
            this.current.car_photo = image;
          });
        });
                      
      }
    }

    if(this.history.length>100){
      this.history=this.history.slice(50);
    }
  }
}
