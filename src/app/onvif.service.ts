import { Injectable } from '@angular/core';

import { Observable, throwError } from "rxjs";
import {map, mergeMap} from 'rxjs/operators';

import {OnvifDevice, 
        OnvifDeviceDetails, 
        OnvifDeviceInfo, 
        OnvifDiscoveryResult, 
        OnvifProfileInfo, 
        OnvifVideoCodecInfo, 
        OnvifVideoSourceInfo 
    } from './onvif-device'
import { LoginService } from './login.service';

@Injectable()
export class OnvifService {
    constructor(private login: LoginService){}
    getDevices(): Observable<OnvifDevice[]>{
        return this.login.loginStatus.pipe(mergeMap(ls => ls.rpc.onvifDiscover()), map(this.extractDiscoveryData));
    }
    probeFor(url:string, auth:[string,string]): Observable<any>{
        return this.login.loginStatus.pipe(mergeMap(ls => ls.rpc.onvifProbe(url, auth)), map(this.extractProbeData));
    }
    private extractProbeData(res: Object){
        let body=<any>res;
        if(body != null && body.error!=null){
            throw body.error;
        }
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
    private extractDiscoveryData(res: Array<OnvifDiscoveryResult>){
        return res.map(function(b: OnvifDiscoveryResult) {
            let o=new OnvifDevice();
            o.hardware=b.scopes.hardware;
            o.location=b.scopes.location;
            o.name=b.scopes.name;
            o.url=b.xaddrs[0];
            return o;
        });
    }
}