import { Observable, of } from "rxjs";
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { IViinexRpc } from "./viinex-rpc";

export class VideoSource {
    constructor(public name:string, public isLive: boolean, public metaData: any){
        this.videoTracks=new Array<VideoTrack>();
        this.webrtcServers=new Array<WebRTCServer>();

        if(null!=metaData){
            this.displayName = metaData.name;
            this.description = metaData.desc || null ;
        }
        else{
            this.displayName = name;
            this.description = null;
        }

        this.getSnapshotImage=null;
    }
    videoTracks: Array<VideoTrack>;
    webrtcServers: Array<WebRTCServer>;

    getStreamDetails: Observable<LiveStreamDetails>;
    getSnapshotImage: (spatial: any) => Observable<string>;

    public readonly displayName : string;
    public readonly description : string;
}

export class LiveStreamDetails {
    lastFrame: Date;
    resolution: [number,number];
    bitrate: number;
    framerate: number;
}

export class VideoTrack {
    constructor(public videoSource: VideoSource, public videoArchive: VideoArchive){
        this.getSnapshotImage = (temporal,spatial) => of("./assets/novideo.png");
    }
    getTrackData: (interval?: [Date,Date]) => Observable<VideoTrackData>;
    getSnapshotImage: (temporal: any, spatial: any) => Observable<string>;
}

export class VideoTrackSummary {
    constructor(public timeBoundaries: [Date, Date], public diskUsage: number){}
}

export class VideoTrackData {
    summary: VideoTrackSummary;
    timeLine: Array<[Date,Date]>;
}

export class VideoArchive {
    constructor(public name: string, public metaData: any){
        this.videoTracks=new Array<VideoTrack>();

        if(null!=metaData){
            this.displayName = metaData.name;
            this.description = metaData.desc;
        }
        else{
            this.displayName = name;
            this.description = null;
        }
    }
    videoTracks: Array<VideoTrack>;

    getSummary: () => Observable<VideoArchiveSummary>;
    summarySnapshot: VideoArchiveSummary;

    public readonly displayName : string;
    public readonly description : string;
}

export class VideoArchiveSummary {
    diskUsage: number;
    diskFreeSpace: number;
    tracks: Map<string, VideoTrackSummary>;
}

export class WebRTCServer {
    constructor(private rpc: IViinexRpc, public name: string, public metaData: any){
        this.videoSources=new Array<VideoSource>();

        if(null!=metaData){
            this.displayName = metaData.name || name;
            this.description = metaData.desc || null;

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
        else{
            this.displayName = name;
            this.description = null;
        }
    }
    videoSources: Array<VideoSource>;
    public readonly displayName : string;
    public readonly description : string;

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

export class VideoObjects {
    constructor(){}
    videoSources: Array<VideoSource> = [];
    videoArchives: Array<VideoArchive> = [];
    webrtcServers: Array<WebRTCServer> = [];
}

