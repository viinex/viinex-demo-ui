import { CommonModule, DatePipe, JsonPipe, NgForOf, NgIf, NgSwitch, NgSwitchCase } from "@angular/common";
import { AfterContentChecked, Component, Input } from "@angular/core";
import { Fact } from "./fact";
import { AcpLogRecordComponent } from "./acp-log-record.component";
import { of } from "rxjs";
import { delay } from "rxjs/operators";

@Component({
    selector: 'acp-fact',
    standalone: true,
    imports: [CommonModule, NgIf, NgForOf, DatePipe, AcpLogRecordComponent],
    templateUrl: 'acp-fact.component.html',
    styleUrl: 'acp-fact.component.css'
})
export class AcpFactComponent implements AfterContentChecked {
    private _fact: Fact = null;
    @Input('fact')
    public set fact(f: Fact){
        this._fact=f;
        this._snapshotRequested=false;
    }
    public get fact(){ return this._fact; }
    @Input('snapshotRequestDelay')
    public snapshotRequestDelay: number = 0;

    private _snapshotRequested: boolean = false;

    ngAfterContentChecked(): void {
        this.checkLoadSnapshot();
    }

    private checkLoadSnapshot(this: AcpFactComponent){
        if(this._fact && !this._fact.car_photo && !this._snapshotRequested && this._fact.direction){
            let tracks = this._fact.direction.videoSource.videoTracks;
            if(tracks && tracks.length>0){
                this._snapshotRequested=true;
                of({}).pipe(delay(this.snapshotRequestDelay)).subscribe(_ => {
                    tracks[0].getSnapshotImage(this._fact.timestamp, {}).subscribe((image: string) => {
                        this._fact.car_photo = image;
                    });
                });
            }
        }
    }
}
