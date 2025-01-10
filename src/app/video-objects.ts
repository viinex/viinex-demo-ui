import { Observable, of } from "rxjs";
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { IViinexRpc } from "./viinex-rpc";
import { AutoCheckpoint, RailwayTrack } from "./apps/apps-objects";

export class ViinexSvcObject{
    constructor(protected rpc: IViinexRpc, public name:string, public metaData: any) {

        if(null!=metaData){
            this.displayName = metaData.name;
            this.description = metaData.desc;
        }
        if(!this.displayName)
            this.displayName = name;
    }
    public readonly displayName : string;
    public readonly description : string = null;
}

export class VideoSource extends ViinexSvcObject {
    constructor(rpc: IViinexRpc, public name:string, public metaData: any, public isLive: boolean, types: Array<string>){
        super(rpc, name, metaData);

        this.getStreamDetails=rpc.liveStreamDetails(name).pipe(map(VideoSource.extractLiveStreamDetails));

        this.videoTracks=new Array<VideoTrack>();
        this.webrtcServers=new Array<WebRTCServer>();

        this.getSnapshotImage=null;
        if(types.indexOf("SnapshotSource")>=0) {
            this.getSnapshotImage = (spatial: any) => rpc.liveSnapshotImage(name, spatial);
        }
        if(types.indexOf("TimelineProvider")>=0){
            let t=new VideoTrack(rpc, this, null);
            this.videoTracks.push(t);
        }

    }
    videoTracks: Array<VideoTrack>;
    webrtcServers: Array<WebRTCServer>;

    getStreamDetails: Observable<LiveStreamDetails>;
    getSnapshotImage: (spatial: any) => Observable<string>;

    private static extractLiveStreamDetails(body: any){
        let d=new LiveStreamDetails();
        d.bitrate=body["bitrate"];
        d.framerate=body["framerate"];
        d.resolution=body["resolution"];
        d.lastFrame=new Date(body["last_frame"]);
        return d;
    }

}

export class LiveStreamDetails {
    lastFrame: Date;
    resolution: [number,number];
    bitrate: number;
    framerate: number;
}

export class VideoTrack {
    constructor(private rpc: IViinexRpc, public videoSource: VideoSource, public videoArchive?: VideoArchive){
        //this.getSnapshotImage = (temporal,spatial) => of("./assets/novideo.png");
    }
    getTrackData(this: VideoTrack, interval?: [Date, Date]): Observable<VideoTrackData> {
        return this.rpc.archiveChannelSummary(this.videoArchive?.name, this.videoSource.name, interval).pipe(map(VideoTrack.extractTrackData));
    }
    getSnapshotImage(this: VideoTrack, temporal: any, spatial: any): Observable<string> {
        return this.rpc.archiveSnapshotImage(this.videoArchive.name, this.videoSource.name, temporal, spatial)
    }

    private static extractTrackData(res:Object): VideoTrackData {
        let body=<any>res;
        let td=new VideoTrackData();
        if(body.timeline!=null){ // response from Viinex native archive
            td.summary=new VideoTrackSummary(Misc.jsonDateInterval(body.time_boundaries), body.disk_usage);
            td.timeLine=body.timeline!=null?body.timeline.map(Misc.jsonDateInterval):null;
        }
        else { // response from timeline provider
            let bb: [Date,Date]=[null,null];
            if(body.length){
                bb=Misc.jsonDateInterval([body[0][0], body[body.length-1][1]]);
            }
            td.summary=new VideoTrackSummary(bb, 0);
            td.timeLine=body.map(Misc.jsonDateInterval);
        }
        return td;
    }
    public get routerLink(): string {
        if(this.videoArchive){
            return `/video-archive/${this.videoArchive.name}/${this.videoSource.name}`;
        }
        else{
            return `/video-archive/vms__external/${this.videoSource.name}`;
        }
    }
}

export class VideoTrackSummary {
    constructor(public timeBoundaries: [Date, Date], public diskUsage: number){}
}

export class VideoTrackData {
    summary: VideoTrackSummary;
    timeLine: Array<[Date,Date]>;
}

export class Misc{
    static jsonDateInterval(ii: any): [Date,Date]{
        if(ii!=null){
            return [new Date(ii[0]), new Date(ii[1])];
        } 
        else {
            return null;
        }
    }
}

export class VideoArchive extends ViinexSvcObject {
    constructor(rpc: IViinexRpc, name: string, metaData: any){
        super(rpc,name,metaData);
        this.videoTracks=new Array<VideoTrack>();

    }
    videoTracks: Array<VideoTrack>;

    getSummary(this: VideoArchive): Observable<VideoArchiveSummary>{
        return this.rpc.archiveSummary(this.name).pipe(map(r => {
            let s=VideoArchive.extractArchiveSummary(r);
            this.summarySnapshot=s;
            return s;
        }));

    }
    summarySnapshot: VideoArchiveSummary;
    private static extractArchiveSummary(res: Object): VideoArchiveSummary{
        let body=<any>res;
        let vas=new VideoArchiveSummary();
        vas.diskFreeSpace=body.disk_free_space;
        vas.diskUsage=body.disk_usage;
        vas.tracks=new Map<string,VideoTrackSummary>();
        for(let tn in body.contexts){
            let c=<any>body.contexts[tn];
            let ts=new VideoTrackSummary(Misc.jsonDateInterval(c.time_boundaries), c.disk_usage);
            vas.tracks.set(tn, ts);
        }
        return vas;
    }
}

export class VideoArchiveSummary {
    diskUsage: number;
    diskFreeSpace: number;
    tracks: Map<string, VideoTrackSummary>;
}

export class WebRTCServer extends ViinexSvcObject {
    constructor(rpc: IViinexRpc, name: string, metaData: any){
        super(rpc, name, metaData);
        this.videoSources=new Array<VideoSource>();

        if(null!=metaData){
            this.iceServers=[];
            if(location.hostname.toLowerCase() != "localhost" && location.hostname != "127.0.0.1" && null != metaData.stunsrv){
                this.iceServers.push({urls:"stun:"+location.hostname+":"+metaData.stunsrv});
            }
            if(null != metaData.ice_servers){
                this.iceServers=this.iceServers.concat(metaData.ice_servers);
            }
            else if(null != metaData.stun){
                for(let ss of metaData.stun){
                    let [host,port] = ss;
                    this.iceServers.push({urls:"stun:"+host+":"+port});
                }
            }
        }
    }
    videoSources: Array<VideoSource>;

    public readonly iceServers : Array<any>;

    public requestOffer(sessionId: string, cmd: Object) : Observable<string>{
        return this.rpc.webrtcSessionCreate(this.name, sessionId, cmd).pipe(map(res => res.replace(/\r\n/g,'\n')+"\n"));
    }
    public sendAnswer(sessionId: string, sdp: string) : Observable<Object>{
        return this.rpc.webrtcSessionAnswer(this.name, sessionId, sdp);
    }
    public updateSession(sessionId: string, cmd: Object) : Observable<Object> {
        return this.rpc.webrtcSessionUpdate(this.name, sessionId, cmd);
    }
    public dropSession(sessionId: string) : Observable<Object>{
        return this.rpc.webrtcSessionDrop(this.name, sessionId);
    }
}

export class WebRTCServerSummary {
    sessions: number;
    live: Array<string>;
}

export class VnxEventOrigin {
    constructor(public name: string, public type: string){}
}
export class VnxEvent {
    constructor(public topic: string, public origin: any, public timestamp: Date, public data: any){}
}

export class EventArchive extends ViinexSvcObject {
    constructor(rpc: IViinexRpc, name: string, metaData: any){
        super(rpc, name, metaData);
    }
    summary(this: EventArchive, subjects?: Array<string>, origins?: Array<string>, begin?: Date, end?: Date) : Observable<EventArchiveSummary>{
        return this.rpc.eventsSummary(this.name, subjects, origins, begin, end).pipe(map(v => new EventArchiveSummary(v, begin, end)));
    }
    query(this: EventArchive, subjects?: Array<string>, origins?: Array<string>, begin?: Date, end?: Date, limit?: number, offset?: number){
        return this.rpc.eventsQuery(this.name, subjects,origins, begin, end, limit, offset);
    }
}

export class EventArchiveSummaryRow {
    public constructor(public topic: string, public origin: string, public count: number){}
}

export class EventArchiveSummary {
    public constructor(public rows: Array<EventArchiveSummaryRow>, public begin?: Date, public end?: Date){}
}

export class Stateful extends ViinexSvcObject {
    constructor(rpc: IViinexRpc, name: string, metaData: any){
        super(rpc, name, metaData);
    }
    read(this: Stateful): Observable<any> {
        return this.rpc.statefulRead(this.name);
    }
}
export class Updateable extends ViinexSvcObject {
    constructor(rpc: IViinexRpc, name: string, metaData: any){
        super(rpc, name, metaData);
    }
    update(this: Updateable, value: any): Observable<any>{
        return this.rpc.updateableUpdate(this.name, value);
    }
}

export class KeyValueStore extends ViinexSvcObject {
    constructor(rpc: IViinexRpc, name: string, metaData: any){
        super(rpc, name, metaData);
    }
    get(this: KeyValueStore, key: string): Observable<any> {
        return this.rpc.kvstoreGet(this.name, key);
    }
    set(this: KeyValueStore, key: string, value: any): Observable<void> {
        return this.rpc.kvstorePut(this.name, key, value);
    }
    delete(this: KeyValueStore, key: string): Observable<void> {
        return this.rpc.kvstoreDelete(this.name, key);
    }
}

export class VideoObjects {
    constructor(){}
    videoSources: Array<VideoSource> = [];
    videoArchives: Array<VideoArchive> = [];
    webrtcServers: Array<WebRTCServer> = [];
    eventArchives: Array<EventArchive> = [];
    statefuls: Array<Stateful> = [];
    updateables: Array<Updateable> = [];
    keyValueStores: Array<KeyValueStore> = [];

    // the objects exposing Stateful endpoint and having a property "type" set in metadata
    applications: Array<Stateful> = [];
    appsAutoCheckpoint: Array<AutoCheckpoint> = [];
    appsRailwayTrack: Array<RailwayTrack> = [];

    static concat(x: VideoObjects, y: VideoObjects) : VideoObjects {
        const selectors = [
            { get: (v: VideoObjects) => v.videoSources,       set: (v: VideoObjects, x: any) => { v.videoSources=x; }},
            { get: (v: VideoObjects) => v.videoArchives,      set: (v: VideoObjects, x: any) => { v.videoArchives=x; }},
            { get: (v: VideoObjects) => v.webrtcServers,      set: (v: VideoObjects, x: any) => { v.webrtcServers=x; }},
            { get: (v: VideoObjects) => v.eventArchives,      set: (v: VideoObjects, x: any) => { v.eventArchives=x; }},
            { get: (v: VideoObjects) => v.statefuls,          set: (v: VideoObjects, x: any) => { v.statefuls=x; }},
            { get: (v: VideoObjects) => v.updateables,        set: (v: VideoObjects, x: any) => { v.updateables=x; }},
            { get: (v: VideoObjects) => v.keyValueStores,     set: (v: VideoObjects, x: any) => { v.keyValueStores=x; }},
            { get: (v: VideoObjects) => v.applications,       set: (v: VideoObjects, x: any) => { v.applications=x; }},
            { get: (v: VideoObjects) => v.appsAutoCheckpoint, set: (v: VideoObjects, x: any) => { v.appsAutoCheckpoint=x; }},
            { get: (v: VideoObjects) => v.appsRailwayTrack,   set: (v: VideoObjects, x: any) => { v.appsRailwayTrack=x; }},
        ]
        let res=new VideoObjects();
        selectors.forEach(s => { s.set(res, s.get(x).concat(s.get(y))); });
        return res;
    }
}
