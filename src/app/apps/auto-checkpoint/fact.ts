import { VnxEvent } from "../../video-objects";
import { AcpDirection } from "../apps-objects"

export class Acp {
    static readonly CheckpointLog = "CheckpointLog";
    static readonly ProcessingStarted = "ProcessingStarted";
    static readonly ProcessingComplete = "ProcessingComplete";
    static readonly RecognizedWhileBusy = "RecognizedWhileBusy";

    static readonly CheckpointAcsDecision = "CheckpointAcsDecision";
}

export class Fact {
    public alpr_result: AlprResult = null;
    public timestamp: Date = null;
    public direction: AcpDirection = null;
    public acs_response: any = null;
    public acs_decision: {allow: boolean} = null;
    public car_photo: string = null;
    public log: Array<VnxEvent> = [];

    public constructor(directions: Array<AcpDirection>, e: VnxEvent){
        if(Fact.isInitial(e)){
            this.alpr_result = e.data.alpr_result;
            this.timestamp = e.data.timestamp;
            this.direction = directions.find(d => d.io_type === e.data.io_type);
            this.log.push(e);
        }
        else {
            throw new Error("can only create Fact from a CheckpointLog event with subject of ProcessingStarted");
        }
    }
    public static fromCheckpointResponse(directions: Array<AcpDirection>, s: any){
        let res=new Fact(directions, new VnxEvent(Acp.CheckpointLog, null, s.timestamp, {
            subject: Acp.ProcessingStarted,
            alpr_result: s.alpr_result,
            timestamp: s.timestamp
        }));
        res.car_photo="data:image/jpeg;base64,"+s.car_photo;
        res.acs_response=s.acs_response;
        return res;
    }

    public static isInitial(e: VnxEvent): boolean{
        return e.topic === Acp.CheckpointLog && e.data.subject === Acp.ProcessingStarted;
    }

    public append(this: Fact, e: VnxEvent){
        if(this.complete){
            throw new Error("cannot append to a Fact with completed processing status");
        }
        if(Fact.isInitial(e)){
            throw new Error("cannot append initial event to an existing Fact");
        }
        if(e.topic === Acp.CheckpointAcsDecision){
            this.acs_response=e.data.acs_response;
            this.acs_decision={allow: e.data.acs_decision_allow};
        }
        this.log.push(e);
    }

    public get complete() : boolean {
        if(this.log && this.log.length){
            let last = this.log[this.log.length-1];
            return last.topic==="CheckpointLog" && last.data.subject === "ProcessingComplete";
        }
        else
            return false;
    }
}

export class ReduceCtx {
    current: Fact = null;
    history: Array<Fact> = [];    
}

export class AlprResult {
    public plate_text: string;
    public country? : string;
    public template?: string;
    public confidence: number;
    public plate_rect: PlateRect;
}

export class PlateRect {
    public left: number;
    public top: number;
    public right: number;
    public bottom: number;
}
