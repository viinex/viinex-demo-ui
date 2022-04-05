import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormsModule} from '@angular/forms';

import { ActivatedRoute,Router }       from '@angular/router';

import {mergeMap} from 'rxjs/operators'

import Hls from 'hls.js'

import {VideoObjectsService} from '../video-objects.service'
import {VideoSource,VideoObjects, VideoTrack, VideoTrackData, VideoTrackSummary} from '../video-objects'
import { LoginService, Transport } from '../login.service';
import { IViinexRpc } from '../viinex-rpc';
import {Format} from '../format'

import {NgbDate, NgbCalendar, NgbDateNativeAdapter, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';

const MAX_WINDOW_SIZE_MINUTES=10;

@Component({
    templateUrl: "video-archive-view.component.html",
    styleUrls: ["./video-archive-view.component.css"]
})
export class VideoArchiveViewComponent implements OnInit {
    errorMessage: string;
    videoSource: VideoSource;
    readonly isAndroid: boolean;

    isHttp: boolean = false;
    isWamp: boolean = false;
    isNativeArchive = false;

    videoTrack: VideoTrack;
    videoTrackData: VideoTrackData;

    currentInterval: [Date,Date];
    subintervals: Array<[Date, Date]>;
    refinedInterval: [Date,Date];
    interval: [Date,Date] = null;

    public searchBegin: Date;
    public searchEnd: Date;
    hoveredDate: NgbDate | null = null;
  
    constructor(private route: ActivatedRoute, private router: Router, private videoObjectsService: VideoObjectsService,
        private login: LoginService){
        this.isAndroid = /(android)/i.test(navigator.userAgent);
        this.searchEnd=new Date();
        this.searchBegin=new Date(this.searchEnd.valueOf() - 24*60*60*1000);
      }
    ngOnInit(): void {
        this.login.loginStatus.subscribe((ls) => {
            this.isWamp = ls.transport == Transport.Wamp;
            this.isHttp = ls.transport == Transport.Http;
        });
        this.route.params.pipe(
            mergeMap(params => {
                let archId = this.route.parent.snapshot.params["videoArchiveId"];
                if(archId=="vms__external"){
                    archId=null;
                    this.isNativeArchive=false;
                }
                else{
                    this.isNativeArchive=true;
                }
                let srcId = params["videoSourceId"];
                let t=this.videoObjectsService.getVideoTrack(archId, srcId);
                return t;
            }),
            mergeMap(vt => {
                let oldvt=this.videoTrack;
                this.videoTrack=vt;
                if(oldvt!=null && vt !=null){
                    if(oldvt.videoArchive?.name!=vt.videoArchive?.name || oldvt.videoSource.name!=vt.videoSource.name){
                        this.currentInterval=null;
                    }
                }
                else{
                    if(this.currentInterval!=null){
                        this.gotoInterval();
                    }
                }
                return this.videoTrack.getTrackData([this.searchBegin, this.searchEnd]);
            })).subscribe(vtd => this.videoTrackData=vtd);
        this.route.queryParams.subscribe(qp => {
            if(qp.begin!=null && qp.end!=null){
                this.currentInterval=[new Date(+qp.begin), new Date(+qp.end)];
                this.subintervals=this.expandInterval(this.currentInterval);
                this.refinedInterval=this.makeSubinterval(this.currentInterval[0], this.currentInterval);
                if(this.videoTrack!=null){
                    this.gotoInterval();
                }
            }
            else{
                this.currentInterval=null;
                this.interval=null;
            }
        })
    }

    formatInterval(x: any): string {
        if(x==null || x.length!=2 || x[0]==null || x[1]==null){
            return "no data";            
        }
        else {
            return Format.interval(x);
        }
    }
    gb = Format.gb;
    formatTemporalLength = Format.temporalLength;
    formatDepth(x: any): string{
        if(x==null || x.length!=2 || x[0]==null || x[1]==null){
            return "0";
        }
        else {
            let [b, e] = <[Date, Date]>x;
            let s=Math.floor((e.valueOf()-b.valueOf())/1000);
            return Format.temporalLength(s);
        }
    }
    totalTemporalLength(timeline: Array<[Date, Date]>): number{
        if(timeline==null || timeline.length==0){
            return 0;
        }
        else
        {
            return Math.floor(timeline.map(([b,e]) => e.valueOf()-b.valueOf()).reduce((s,v) => s+v)/1000);
        }
    }

    makeSubinterval(x: Date, [b,e]:[Date,Date]): [Date,Date]{
        let [xb,xe]=[x, new Date(x.valueOf()+MAX_WINDOW_SIZE_MINUTES*60*1000)];
        if(xb<b){ xb=b; }
        if(xb>e){ xb=e; }
        if(xe<b){ xe=b; }
        if(xe>e){ xe=e; }
        return [xb,xe];
    }
    shouldRefine(x: any): boolean{
        if(x==null || x.length!=2 || x[0]==null || x[1]==null){
            return false;
        }
        else {
            let [b, e] = <[Date, Date]>x;
            if(b==null || e==null){
                return false;
            }
            else{
                return (e.valueOf() - b.valueOf()) > MAX_WINDOW_SIZE_MINUTES*60*1000;
            }
        }
    }
    expandInterval(ii:[Date,Date]): Array<[Date,Date]>{
        let [b,e]=ii;
        let r=new Array<[Date,Date]>();
        let x=b;
        while(x<e){
            let i=this.makeSubinterval(x, ii);
            r.push(i);
            x=i[1];
        }
        return r;
    }

    setRefinedInterval(i: [Date, Date]){
        this.refinedInterval=i;
        this.gotoInterval();
    }

    gotoInterval(){
        let [b,e]=this.currentInterval;
        if(this.refinedInterval!=null){
            let [rb,re]=this.refinedInterval;
            b=new Date(Math.max(rb.valueOf(), b.valueOf()));
            e=new Date(Math.min(re.valueOf(), e.valueOf()));
        }
        this.interval = [b,e];
    }

    exportUrl(interval: [Date,Date], format: string){
        return "v1/svc/"+this.videoTrack.videoArchive.name+"/"+
            this.videoTrack.videoSource.name+"/export?format="+format+
            "&begin="+interval[0].valueOf()+"&end="+interval[1].valueOf();
    }

    public get fromDate() : NgbDateStruct { return this.fromModel(this.searchBegin); }
    public set fromDate(date: NgbDateStruct){ this.searchBegin=this.toModel(date, true); }
    public get toDate() : NgbDateStruct { return this.fromModel(this.searchEnd); }
    public set toDate(date: NgbDateStruct){this.searchEnd=this.toModel(date, false); }
    public fromModel(x: Date): NgbDateStruct {
        if (x == null) {
            return null;
        }
        let v = new Date(x);
        v.setHours(12, 0, 0, 0);
        return this.dateAdapter.fromModel(v);
    }
    private dateAdapter: NgbDateNativeAdapter = new NgbDateNativeAdapter();

    public toModel(x: NgbDateStruct, begin: boolean): Date {
        if (x == null) {
            return null;
        }
        let res = this.dateAdapter.toModel(x);
        if (begin) {
            res.setHours(0, 0, 0, 0);
        }
        else {
            res.setHours(23, 59, 59, 999);
        }
        return res;
    }
      
    // datepicker stuff
    public onDateSelection(date: NgbDate) {
        if (!this.fromDate && !this.toDate) {
            this.fromDate = date;
        } else if (this.fromDate && !this.toDate && !date.before(this.fromDate)) {
            this.toDate = date;
        } else {
            this.toDate = null;
            this.fromDate = date;
        }

        if(this.fromDate!=null && this.toDate!=null && this.videoTrack!=null){
            this.videoTrackData=null;
            this.videoTrack.getTrackData([this.searchBegin, this.searchEnd]).subscribe(vtd => this.videoTrackData=vtd);
        }
    }
    isHovered(date: NgbDate) {
        return this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);
    }
    isInside(date: NgbDate) {
        return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
    }
    isRange(date: NgbDate) {
        return date.equals(this.fromDate) || (this.toDate && date.equals(this.toDate)) || this.isInside(date) || this.isHovered(date);
    }
    //end datepicker stuff
}