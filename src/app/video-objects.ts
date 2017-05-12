import { Observable } from "rxjs/Observable";

export class VideoSource {
    constructor(public name:string, public isLive: boolean){
        this.videoTracks=new Array<VideoTrack>();
    }
    videoTracks: Array<VideoTrack>;

    getStreamDetails: Observable<LiveStreamDetails>;
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
    constructor(public name: string){
        this.videoTracks=new Array<VideoTrack>();
    }
    videoTracks: Array<VideoTrack>;

    getSummary: () => Observable<VideoArchiveSummary>;
    summarySnapshot: VideoArchiveSummary;
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

