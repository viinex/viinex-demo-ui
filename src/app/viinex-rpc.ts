import { Observable, throwError, of, Subject, from } from "rxjs";
import {map, share} from "rxjs/operators";

import { HttpClient } from '@angular/common/http';
import { WampClient } from './wamp-client'
import { WebRTCServerSummary } from "./video-objects";

export interface IViinexRpc {
    svc() : Observable<Object>;
    meta() : Observable<Object>;

    onvifDiscover(): Observable<Object>;
    onvifProbe(url: string, auth: [string, string]): Observable<Object>;

    webrtcServerSummary(name: string) : Observable<WebRTCServerSummary>;
    webrtcSessionCreate(server: string, peerId: string, cmd: Object) : Observable<string>;
    webrtcSessionAnswer(server: string, peerId: string, sdp: string) : Observable<Object>;
    webrtcSessionUpdate(server: string, peerId: string, cmd: Object) : Observable<Object>;
    webrtcSessionDrop(server: string, peerId: string) : Observable<Object>;

    liveStreamDetails(name: string): Observable<Object>;
    liveSnapshotImage(name: string, spatial: any): Observable<string>;

    archiveSummary(name: string): Observable<Object>;
    archiveChannelSummary(name: string, channel: string, interval?: [Date,Date]): Observable<Object>;
    archiveSnapshotImage(name: string, channel: string, when: any, spatial: any): Observable<string>;


    close(): void;
}

export class HttpRpc implements IViinexRpc {
    constructor(private http: HttpClient){
        console.log("RPC implementation is HTTP");
    }
    svc() : Observable<Object>{
        return this.http.get("v1/svc");
    }
    meta() : Observable<Object> {
        return this.http.get("v1/svc/meta");
    }

    onvifDiscover(): Observable<Object>{
        return this.http.get("v1/env/onvif");
    }
    onvifProbe(url: string, auth: [string, string]): Observable<Object>{
        return this.http.post("v1/env/onvif/probe", {url: url, auth: auth});
    }

    webrtcServerSummary(name: string){
        return this.http.get<WebRTCServerSummary>("v1/svc/"+name);
    }
    webrtcSessionCreate(server: string, peerId: string, cmd: Object) : Observable<string>{
        return this.http.put("v1/svc/"+server+"/"+peerId, cmd, {responseType: 'text'});
    }
    webrtcSessionAnswer(server: string, peerId: string, sdp: string) : Observable<Object>{
        return this.http.post<Object>("v1/svc/"+server+"/"+peerId+"/answer", sdp);
    }
    webrtcSessionUpdate(server: string, peerId: string, cmd: Object) : Observable<Object>{
        return this.http.post("v1/svc/"+server+"/"+peerId, cmd);
    }
    webrtcSessionDrop(server: string, peerId: string) : Observable<Object>{
        return this.http.delete<Object>("v1/svc/"+server+"/"+peerId);
    }

    liveStreamDetails(name: string){
        return this.http.get("v1/svc/"+name);
    }
    liveSnapshotImage(name: string, spatial: any): Observable<string> {
        return of("v1/svc/"+name+"/snapshot"+HttpRpc.snapshotRequestParams(null, spatial));
    }

    archiveSummary(name: string){
        return this.http.get("v1/svc/"+name);
    }
    archiveChannelSummary(name: string, channel: string, interval?: [Date,Date]): Observable<Object>{
        let path="v1/svc/";
        if(name==null){
            path=path+channel+"/timeline"
        }
        else{
            path=path+name+"/"+channel;
        }
        let query = interval==null?"":"?begin="+interval[0].toISOString()+"&end="+interval[1].toISOString();
        return this.http.get(path+query);
    }
    archiveSnapshotImage(name: string, channel: string, when: any, spatial: any): Observable<string>{
        let namep = (name==null) ? "" : name+"/"; // name==null means vms channel
        return of("v1/svc/"+namep+channel+"/snapshot"+HttpRpc.snapshotRequestParams(when, spatial))
    }

    close(){}

    private static snapshotTimestamp(when: any): string {
        if(when !== null){
            if(when instanceof Date){
                return "timestamp="+when.toISOString();
            }
            else if(when instanceof String){
                return "timestamp="+when;
            }
            else if(!isNaN(+when)){
                return "cached="+when;
            }
            else if('when' in when){
                return HttpRpc.snapshotTimestamp(when.when);
            }
        }
        return "";
    }
    private static snapshotRequestParams(when: any, spatial: any): string {
        let a="";
        if(when){
            let ts=HttpRpc.snapshotTimestamp(when);
            a=ts.length?"?"+ts:a;
        }
        if(spatial){
            if(spatial.scale){
                a+=a.length?"&":"?";
                if(Array.isArray(spatial.scale)){
                    a+="width="+spatial.scale[0]+"&height="+spatial.scale[1];
                }
                else{
                    a+="scale="+spatial.scale;
                }
            }
            if(spatial.roi){
                a+=a.length?"&":"?";
                a+="roi=("+spatial.roi[0]+","+spatial.roi[1]+","+spatial.roi[2]+","+spatial.roi[3]+")";
            }
        }
        return a;
    }

}

export class WampRpc implements IViinexRpc {
    readonly prefix: string;
    constructor(private wamp: WampClient){
        this.prefix = "com.viinex.api.wamp0.";
        console.log("RPC implementation is WAMP");
    }
    svc() : Observable<Object>{
        return this.wamp.call(this.prefix+"svc");
    }
    meta() : Observable<Object> {
        return this.wamp.call(this.prefix+"svc.meta");
    }

    onvifDiscover(): Observable<Object>{
        return this.wamp.call(this.prefix+"discovery.onvif.discover");
    }
    onvifProbe(url: string, auth: [string, string]): Observable<Object>{
        return this.wamp.call(this.prefix+"discovery.onvif.probe", [url, auth]);
    }

    webrtcServerSummary(name: string){
        return this.wamp.call<WebRTCServerSummary>(this.prefix+name+".get_status");
    }
    webrtcSessionCreate(server: string, peerId: string, cmd: Object) : Observable<string>{
        return this.wamp.call<string>(this.prefix+WampRpc.toQuietSnake(server)+".create_session", [peerId, cmd]);
    }
    webrtcSessionAnswer(server: string, peerId: string, sdp: string) : Observable<Object>{
        return this.wamp.call<Object>(this.prefix+WampRpc.toQuietSnake(server)+".set_answer", [peerId, sdp]);
    }
    webrtcSessionUpdate(server: string, peerId: string, cmd: Object) : Observable<Object>{
        return this.wamp.call<Object>(this.prefix+WampRpc.toQuietSnake(server)+".update_session", [peerId, cmd]);
    }
    webrtcSessionDrop(server: string, peerId: string) : Observable<Object>{
        return this.wamp.call<Object>(this.prefix+WampRpc.toQuietSnake(server)+".drop_session", [peerId]);
    }

    liveStreamDetails(name: string){
        return of({});
    }
    archiveSummary(name: string){
        return this.wamp.call<Object>(this.prefix+WampRpc.toQuietSnake(name)+".summary");
    }
    archiveChannelSummary(name: string, channel: string, interval?: [Date,Date]): Observable<Object>{
        if(name!=null){ // call to video archive
            return this.wamp.call<Object>(this.prefix+WampRpc.toQuietSnake(name)+".video_storage.channel_summary", [channel, interval]);
        }
        else{ // call to vms channel
            return this.wamp.call<Object>(this.prefix+WampRpc.toQuietSnake(channel)+".timeline_provider.timeline", [interval]);
        }
    }

    liveSnapshotImage(name: string, spatial: any): Observable<string> {
        return this.wamp.call<string>(this.prefix+WampRpc.toQuietSnake(name)+".snapshot_base64", [null, spatial]).pipe(map(v => "data:image/jpeg;base64,"+v));
    }
    archiveSnapshotImage(name: string, channel: string, when: any, spatial: any): Observable<string>{
        if(name!=null){ // name!=null means call to video archive
            return this.wamp.call<string>(this.prefix+WampRpc.toQuietSnake(name)+".video_storage.channel_snapshot_base64", [channel,when,spatial]).pipe(map(v => "data:image/jpeg;base64,"+v));
        }
        else{ //otherwise it's call to vms channel
            return this.wamp.call<string>(this.prefix+WampRpc.toQuietSnake(channel)+".snapshot_source.snapshot_base64", [when, spatial]).pipe(map(v => "data:image/jpeg;base64,"+v));
        }
    }

    close(): void {
        this.wamp.close();
    }

    private static toQuietSnake(name: string) : string{
        return name; // todo: fix this
    }
}