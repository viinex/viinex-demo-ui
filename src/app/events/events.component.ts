import { Component } from '@angular/core';
import { VideoObjectsService } from '../video-objects.service';
import { NgFor, NgIf } from '@angular/common';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent {
  constructor(private videoObjectsService: VideoObjectsService){
    this.videoObjectsService.events.subscribe(e => this._appendEvent(e));
  }

  public lastEvents: Array<any> = [];
  public pause: boolean = false;
  public skipped: number = 0;

  _appendEvent(e: any){
    if(this.pause){
      this.skipped++;
      return;
    }
    this.lastEvents.unshift(this._toViewRep(e));
    if(this.lastEvents.length>100){
      this.lastEvents.splice(50);
    }
  }
  public togglePause(){
    if(this.pause){
      this.skipped=0;
    }
    this.pause=!this.pause;
  }
  _toViewRep(e: any) : any{
    return {
      topic: e.topic,
      origin: e.origin.name,
      timestamp: e.timestamp,
      data: JSON.stringify(e.data)
    }
  }
}
