import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, IsActiveMatchOptions, Router, RouterLink, RouterLinkActive } from '@angular/router';
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
import { NgbDate, NgbDatepicker, NgbModule, NgbTimepicker } from '@ng-bootstrap/ng-bootstrap';
import { NgIcon, provideIcons, provideNgIconsConfig, withExceptionLogger } from '@ng-icons/core';
import { bootstrapCalendar3, bootstrapPlayBtn } from '@ng-icons/bootstrap-icons';
import { FormsModule, NgModel } from '@angular/forms';
import { AcpFactComponent } from './acp-fact.component';
import { AcpFactShortComponent } from './acp-fact-short.component';

@Component({
  selector: 'app-auto-checkpoint',
  standalone: true,
  imports: [NgIf, NgForOf, ViewportModule, DatePipe, RouterLink, RouterLinkActive, NgbModule, NgIcon, FormsModule, 
    AcpFactComponent, AcpFactShortComponent],
  providers:[provideIcons({bootstrapCalendar3, bootstrapPlayBtn}), NgModel],
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
  constructor(private activatedRoute: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService){
  }

  private subscriptions: Array<Subscription>=[];
  private subscriptionEvents: Subscription=null;
  private autoCheckpointId: string = null;
  private queryTimestamp: Date = null;
  private queryInterval: [Date, Date] = null;
  private selectedDate: NgbDate = null;
  private videoObjects: VideoObjects = null;
  private eventArchive: EventArchive = null;

  private loaded: boolean = false; // means that data
  // which corresponds to current query params has already been obtained from DB

  public autoCheckpoint: AutoCheckpoint=null;

  public loading: boolean = false;
  public current : Fact = null;
  public selectedFact : Fact = null;

  private _history: Array<Fact> = [];
  public historyWindow : Array<Fact>;

  public get history(): Array<Fact> { return this._history; }
  public set history(h: Array<Fact>){ 
    this._history = h;
    this.updateHistoryWindow();
  }
  public updateHistoryWindow() {
    if(this.isFollowingCurrentEvents)
      this.historyWindow = this._history.slice().reverse().slice(0, 200);
    else
      this.historyWindow=this._history;
  }
  public get isFollowingCurrentEvents(): boolean{
    return !this.queryInterval;
  }

  public playbackInterval : [Date,Date] = null;
  
  public readonly historyLinkActiveOptions: IsActiveMatchOptions = {
    paths:'exact',
    queryParams:'subset',
    matrixParams:'ignored',
    fragment:'ignored'
  }

  ngOnInit(): void {
    this.subscriptions.push(this.activatedRoute.params.subscribe(p => {
      this.autoCheckpointId = p["autoCheckpointId"];
      this.completeInit();
    }));
    this.subscriptions.push(this.activatedRoute.queryParams.subscribe(qp => {
      if(qp["timestamp"]){
        let queryTimestamp=new Date(Date.parse(qp["timestamp"]));
        if(!this.queryTimestamp || this.queryTimestamp != queryTimestamp){
          this.queryTimestamp=queryTimestamp;
          this.updateSelectedFact();
        }
      }
      else{
        this.queryTimestamp=null;
        this.selectedFact=null;
        this.playbackInterval=null;
      }
      if(qp["begin"] && qp["end"]) {
        let begin: Date=new Date(Date.parse(qp["begin"]));
        let end : Date=new Date(Date.parse(qp["end"]));
      if(!this.selectedDate){
          let mid : Date = new Date((begin.valueOf()+end.valueOf())/2);
          this.selectedDate=new NgbDate(mid.getUTCFullYear(), mid.getUTCMonth()+1, mid.getUTCDate());
        }
        if(!this.queryInterval || this.queryInterval[0].valueOf()!=begin.valueOf() || this.queryInterval[1].valueOf()!=end.valueOf()){
          this.loaded=false;
          this.queryInterval=[begin, end];
        }
      }
      else {
        this.selectedDate=null;
        if(this.queryInterval)
          this.loaded=false;
        this.queryInterval=null;
      }

      if(!this.loaded)
        this.completeInit();
    }))
    this.videoObjectsService.objects.subscribe(vo => {
      this.videoObjects=vo;
      if(!vo){
        this.autoCheckpoint=null;
        this.eventArchive=null;
        return;
      }
      this.autoCheckpoint=this.videoObjects.appsAutoCheckpoint.find(a => a.name==this.autoCheckpointId);
      if(this.autoCheckpoint)
        this.eventArchive=this.autoCheckpoint.localVideoObjects.eventArchives[0];
      this.completeInit();
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(s => { s.unsubscribe(); })
    this.subscriptions=[];
    if(this.subscriptionEvents){
      this.subscriptionEvents.unsubscribe();
      this.subscriptionEvents=null;
    }
  }

  private completeInit(this: AutoCheckpointComponent){
    if(this.queryInterval){
      if(this.subscriptionEvents){
        this.subscriptionEvents.unsubscribe();
        this.subscriptionEvents=null;
      }
      this.loadInterval();
    }
    else
      this.loadCurrent();
  }
  private loadInterval(){
    if(this.videoObjects && this.autoCheckpoint && this.eventArchive){
      this.history=[];
      this.loading=true;
      this.eventArchive.query(null, [this.autoCheckpointId], this.queryInterval[0],this.queryInterval[1], 20000, 0)
        .subscribe((events: Array<VnxEvent>) => {
          console.debug("Loaded archive events: ", this.autoCheckpointId, this.queryInterval, events.length);
          this.arrangeEvents(events);
          this.current=null;
          this.loading=false;
          this.loaded=true;
          this.updateSelectedFact();
        });
    }
  }
  private loadCurrent() {
    if(this.videoObjects && this.autoCheckpoint && this.eventArchive){
      let now: Date = new Date();
      let begin=new Date(now.valueOf()-3600000);
      let end = new Date(now.valueOf()+360000);
      this.history=[];
      this.loading=true;
      this.eventArchive.query(null, [this.autoCheckpointId], begin,end, 10000, 0).subscribe((events: Array<VnxEvent>) => {
        console.debug("Loaded current events: ", this.autoCheckpointId, begin, end, events.length);
        this.arrangeEvents(events);
        this.loading=false;
        this.loaded=true;
        this.updateSelectedFact();        

        this.autoCheckpoint.stateful.read().subscribe(s => {
          if(s.processing && this.current && !this.current.car_photo){
            this.current.car_photo="data:image/jpeg;base64,"+s.car_photo;
          }
        });
        if(!this.subscriptionEvents){
          this.subscriptionEvents=this.videoObjectsService.events.subscribe(event => {
            if(event.origin.name===this.autoCheckpointId){
              this.processEvent(event);
            }
          });
        }
      });
    }
  }

  private arrangeEvents(this: AutoCheckpointComponent, events: Array<any>){
    let ctx=events.reduce((ctx, e) => this.appendEvent(ctx, e), new ReduceCtx());
    this.history=ctx.history;
    this.current=ctx.current;
  }
  private appendEvent(this: AutoCheckpointComponent, ctx: ReduceCtx, e: VnxEvent) {
    if(Fact.shouldIgnore(e)){
      return ctx;
    }
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
          ctx.current=null;
        }
      }
    }
    return ctx;
  }
  private updateSelectedFact(){
    if(this.loaded && this.queryTimestamp){
      // plain "==" doesn't work because JS Date rouds to 1ms while viinex may produce values with up to 6 digits after decimal point
      this.selectedFact=this._history.find(f => Math.abs(f.timestamp.valueOf() - this.queryTimestamp.valueOf()) < 1);
      console.log(this.selectedFact);
      if(this.selectedFact){
        let lastEvent = this.selectedFact.log[this.selectedFact.log.length-1];
        this.playbackInterval=[this.selectedFact.timestamp, new Date(Date.parse(lastEvent.timestamp))];
      }
    }
  }

  onDateSelect(this: AutoCheckpointComponent, e: any){
    if(this.selectedDate){
      let begin=new Date(this.selectedDate.year, this.selectedDate.month-1, this.selectedDate.day);
      let end=new Date(begin.valueOf()+24*3600*1000);
      let qp={
        begin: begin.toISOString(), 
        end: end.toISOString()
      };
      this.router.navigate([], {relativeTo: this.activatedRoute, queryParams: qp});
    }
  }

  processEvent(this: AutoCheckpointComponent, e: any){
    if(!this.autoCheckpoint)
      return;

    let {current, history}=this.appendEvent({current: this.current, history: this.history}, e);
    this.current=current;
    this.history=history;

    if(this.history.length>100){
      this.history=this.history.slice(50);
    }
  }
}
