import { Observable } from "rxjs/Observable";

export class VideoSource {
    name: string;
    isLive: boolean;
    videoArchives: Array<VideoArchive>;
}

export class LiveStreamDetails {
    lastFrame: Date;
    resolution: [number,number];
    bitrate: number;
}

export class VideoArchiveContext {
    videoSource: VideoSource;
    timeBoundaries: [Date, Date];
    diskUsage: number;
    timeLine: Observable<Array<[Date,Date]>>;
}

export class VideoArchive {
    name: string;
    diskFreeSpace: number;
    diskUsage: number;
    videoSources: Array<VideoArchiveContext>;
}

export class VideoObjects {
    videoSources: Array<VideoSource>;
    videoArchives: Array<VideoArchive>;
}

