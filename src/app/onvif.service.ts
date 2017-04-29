import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { OnvifDevice } from './onvif-device'

@Injectable()
export class OnvifService {
    constructor(private http: Http){}
    getDevices(): Observable<OnvifDevice[]>{
        return this.http.get("/v1/env/onvif")
                        .map(this.extractData);
    }
    private extractData(res: Response){
        let body=<any[]>res.json();
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
        return Observable.throw(errMsg);
    }
}