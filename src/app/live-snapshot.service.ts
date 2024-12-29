import { Injectable } from '@angular/core';
import { VideoObjects, VideoSource } from './video-objects';
import { VideoObjectsService } from './video-objects.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, mergeMap, mergeAll } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LiveSnapshotService {
  constructor(private videoObjectsService: VideoObjectsService) { 
  }

  private mkKey(videoSourceId: string): string {
    return "LiveSnapshot-"+videoSourceId;
  }

  private outputs: Map<string, BehaviorSubject<string>>=new Map<string, BehaviorSubject<string>>();
  private ages: Map<string, Date>=new Map<string, Date>();

  public get(this: LiveSnapshotService, videoSourceId: string): Observable<string>{
    return new Observable(observer => {
      let subj=this.outputs.get(videoSourceId);
      if(!subj){
        subj = new BehaviorSubject('assets/novideo.png');
        this.outputs.set(videoSourceId, subj);
      }
      let subscription = subj.subscribe(observer);
      
      let renew = true;
      let sres=localStorage.getItem(this.mkKey(videoSourceId));
      if(sres){
        let {date, image} = JSON.parse(sres);
        date=Date.parse(date);
        let now = Date.now();
        subj.next(image); // send a stored snapshot anyway even if it's outdated
        if(now.valueOf() - date.valueOf() < 60000){
          console.debug("using cached snapshot for ", videoSourceId, now, date, now.valueOf() - date.valueOf());
          renew=false;
        }
      }
      if(renew){
        this.videoObjectsService.getVideoSource(videoSourceId).subscribe(vs =>{
          if(!vs.getSnapshotImage){
            subj.next('assets/novideo.png');
            return;            
          }
          vs.getSnapshotImage({width: 320}).subscribe(image => {
            console.log("got new live snapshot for ", videoSourceId, image.length);
            subj.next(image);
          }, e => {
            subj.next('assets/novideo.png');
          })
        })
      }

      return subscription;
    });
  }

  public get1(this: LiveSnapshotService, videoSourceId: string): Observable<string> {
    let res=this.outputs.get(videoSourceId);

    let sres=localStorage.getItem(this.mkKey(videoSourceId));
    if(sres){
      let {date, image} = JSON.parse(sres);
      let now = Date.now();
      if(!res || (now.valueOf() - date.valueOf() < 60000)){
        console.log("using cached snapshot for ", videoSourceId);
        if(!res){
          res = new BehaviorSubject(image);
          this.outputs.set(videoSourceId, res);
        }
        else{
          res.next(image);
        }
        return res;
      }
    }
    else {
      return this.videoObjectsService.getVideoSource(videoSourceId).pipe(
        mergeMap((vs: VideoSource) => {
          return vs.getSnapshotImage({ width: 320 }).pipe(map(image => {
            if(!res){
              if(!res){
                res = new BehaviorSubject(image);
                this.outputs.set(videoSourceId, res);
              }
              else{
                res.next(image);
              }
            }
            localStorage.setItem(this.mkKey(videoSourceId), JSON.stringify({date: new Date(), image: image}));
            return image;
          }))
        })
      )
    }
}

}
