import { CommonModule, DatePipe, JsonPipe, NgForOf, NgIf, NgSwitch, NgSwitchCase } from "@angular/common";
import { AfterContentChecked, Component, Input } from "@angular/core";
import { Fact } from "./fact";
import { AcpLogRecordComponent } from "./acp-log-record.component";
import { of } from "rxjs";
import { delay } from "rxjs/operators";
import { NgIcon, NgIconsModule, provideIcons, provideNgIconsConfig, withExceptionLogger } from '@ng-icons/core';
import { bootstrapCheckCircle, bootstrapExclamationCircle, bootstrapXCircle, bootstrapBug } from '@ng-icons/bootstrap-icons';

@Component({
    selector: 'acp-fact-short',
    standalone: true,
    imports: [CommonModule, NgIf, NgForOf, DatePipe, AcpLogRecordComponent, NgIcon],
    providers:[provideIcons({bootstrapExclamationCircle, bootstrapCheckCircle, bootstrapXCircle, bootstrapBug})],
    templateUrl: 'acp-fact-short.component.html',
    styleUrl: 'acp-fact-short.component.css'
})
export class AcpFactShortComponent {
    private _fact: Fact = null;
    @Input('fact')
    fact: Fact
}
