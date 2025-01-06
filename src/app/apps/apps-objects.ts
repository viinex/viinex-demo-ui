import { Observable } from "rxjs";
import { EventArchive, Stateful, Updateable, VideoObjects, VideoSource, VideoTrack } from "../video-objects";

export class AppsObject {
    public get name(): string { return this.stateful.name; }
    public get displayName() : string { return this.stateful.displayName; }
    public get description() : string { return this.stateful.description; }

    public readonly stateful: Stateful=null;
    public readonly updateable: Updateable=null;

    public videoSources: Array<VideoSource>=[];

    constructor(stateful: Stateful, private vo: VideoObjects){
        this.stateful=stateful;
        this.updateable=vo.updateables.find(u => u.name==this.stateful.name);
    }
}

export class RailwayTrack extends AppsObject {
    public static type : string = 'RailwayTrack';
    constructor(stateful: Stateful, vo: VideoObjects) {
        super(stateful, vo);
        if(stateful.metaData.channels){
            stateful.metaData.channels.forEach((c: string) => {
                let vs=vo.videoSources.find(vs => vs.name==c);
                if(vs){
                    this.videoSources.push(vs);
                }
            });
        }
    }
}

export class AutoCheckpoint extends AppsObject {
    public static type : string = 'AutoCheckpoint';
    public directions: Array<AcpDirection>=[];
    public eventArchive: EventArchive;
    //public eventFilter(this: AutoCheckpoint, src: Observable<any>): Observable<any>;
    constructor(stateful: Stateful, vo: VideoObjects) {
        super(stateful, vo);
        this.eventArchive=vo.eventArchives.length>0?vo.eventArchives[0]:null;
        if(stateful.metaData.directions){
            stateful.metaData.directions.forEach((d: any) => {
                let r = new AcpDirection();
                r.name=d.name;
                r.videoSource=vo.videoSources.find(vs => vs.name==d.video_source);
                if(r.videoSource)
                    this.videoSources.push(r.videoSource);
                r.io_type=d.io_type;
                this.directions.push(r);
            });
        }
    }
}

enum AcpDirectionEnum { Entrance = 'entrance', Exit = 'exit' };
export class AcpDirection {
    public name: string;
    public videoSource: VideoSource;
    public io_type: number;
    public get  direction(): AcpDirectionEnum{
        switch(this.io_type){
            case 1: return AcpDirectionEnum.Entrance;
            case 2: return AcpDirectionEnum.Exit;
        }
    }
    public get videoTrack() : VideoTrack {
        if(this.videoSource.videoTracks.length>0)
            return this.videoSource.videoTracks[0];
        else
            return null;
    }
}
