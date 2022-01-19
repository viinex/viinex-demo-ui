import { Injectable } from '@angular/core';

import { Observable, throwError } from "rxjs";
import {map, mergeMap} from 'rxjs/operators';

import {OnvifDevice, 
        OnvifDeviceDetails, 
        OnvifDeviceInfo, 
        OnvifProfileInfo, 
        OnvifVideoCodecInfo, 
        OnvifVideoSourceInfo 
    } from './onvif-device'
import { LoginService } from './login.service';

@Injectable()
export class OnvifService {
    constructor(private login: LoginService){}
    getDevices(): Observable<OnvifDevice[]>{
        return this.login.rpc.pipe(mergeMap(rpc => rpc.onvifDiscover()), map(this.extractDiscoveryData));
    }
    probeFor(url:string, auth:[string,string]): Observable<any>{
        return this.login.rpc.pipe(mergeMap(rpc => rpc.onvifProbe(url, auth)), map(this.extractProbeData));
    }
    private extractProbeData(res: Object){
        let body=<any>res;
        let r=new OnvifDeviceDetails();
        r.videoSources=new Array<OnvifVideoSourceInfo>();
        r.profiles=new Array<OnvifProfileInfo>();

        r.info=<OnvifDeviceInfo>body.info;
        for(let s in body.video_sources){
            r.videoSources.push(<OnvifVideoSourceInfo>body.video_sources[s]);
        }
        for(let p in body.profiles){
            r.profiles.push(<OnvifProfileInfo>body.profiles[p]);
        }
        return r;
    }
    private extractDiscoveryData(res: Object){
        let body=<any[]>res;
        return body.map(function(b: any) {
            let o=new OnvifDevice();
            o.hardware=b.scopes.hardware;
            o.location=b.scopes.location;
            o.name=b.scopes.name;
            o.url=b.xaddrs[0];
            return o;
        });
    }
    private handleError(error: Response | any){
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || '';
            const err = body || JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        return throwError(errMsg);
    }
}