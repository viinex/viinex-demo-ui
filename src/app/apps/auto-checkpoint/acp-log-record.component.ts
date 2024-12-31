import { CommonModule, DatePipe, JsonPipe, NgIf, NgSwitch, NgSwitchCase } from "@angular/common";
import { Component, Input } from "@angular/core";

@Component({
    selector: 'acp-log-record',
    standalone: true,
    imports: [CommonModule],
    templateUrl: 'acp-log-record.component.html',
    styleUrl: 'acp-log-record.component.css'
})
export class AcpLogRecordComponent {
    @Input('log-record')
    set logRecord(lr: any){
        this.timestamp=lr.timestamp;
        this.topic=lr.topic;
        this.data=lr.data;
        this.subject=this.data?.subject;
    }
    timestamp: Date;
    topic: string;
    data: any;
    subject: string;
    @Input('lr-is-current')
    set isCurrent(c : boolean) {
        if(c) 
            this.dateFormat = 'HH:mm:ss';
        else
            this.dateFormat = 'dd-mm-yyyy HH:mm:ss';
    }
    get isCurrent(): boolean {
        return this.dateFormat=='HH:mm:ss';
    }
    dateFormat: string = 'dd-mm-yyyy HH:mm:ss';
}