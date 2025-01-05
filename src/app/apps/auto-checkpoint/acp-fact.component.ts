import { CommonModule, DatePipe, JsonPipe, NgForOf, NgIf, NgSwitch, NgSwitchCase } from "@angular/common";
import { Component, Input } from "@angular/core";
import { Fact } from "./fact";
import { AcpLogRecordComponent } from "./acp-log-record.component";

@Component({
    selector: 'acp-fact',
    standalone: true,
    imports: [CommonModule, NgIf, NgForOf, DatePipe, AcpLogRecordComponent],
    templateUrl: 'acp-fact.component.html',
    styleUrl: 'acp-fact.component.css'
})
export class AcpFactComponent {
    @Input('fact')
    public fact: Fact = null;
}
