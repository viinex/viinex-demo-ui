import { Observable } from "rxjs/Observable";

export class VideoSource {
    constructor(public name:string, public isLive: boolean, public metaData: any){
        this.videoTracks=new Array<VideoTrack>();

        if(null!=metaData){
            this.displayName = metaData.name;
            this.description = metaData.desc;
        }
        else{
            this.displayName = name;
            this.description = null;
        }

        this.getSnapshotImage=null;
    }
    videoTracks: Array<VideoTrack>;

    getStreamDetails: Observable<LiveStreamDetails>;
    getSnapshotImage: string;

    public readonly displayName : string;
    public readonly description : string;
}

export class LiveStreamDetails {
    lastFrame: Date;
    resolution: [number,number];
    bitrate: number;
}

export class VideoTrack {
    constructor(public videoSource: VideoSource, public videoArchive: VideoArchive){}
    getTrackData: () => Observable<VideoTrackData>;
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

export class VideoObjects {
    videoSources: Array<VideoSource>;
    videoArchives: Array<VideoArchive>;
}

