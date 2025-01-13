import { Observable, throwError, of, Subject, from, forkJoin, merge, EMPTY, zip, NEVER, Subscriber } from "rxjs";
import {catchError, filter, flatMap, map, mergeMap, share, switchMap, take, timeoutWith} from "rxjs/operators";
import { webSocket,WebSocketSubjectConfig, WebSocketSubject } from 'rxjs/webSocket';


import { HttpClient } from '@angular/common/http';
import { WampClient } from './wamp-client'
import { WebRTCServerSummary } from "./video-objects";
import { OnvifDiscoveryResult } from "./onvif-device";

export enum Transport { Http = 'http', Wamp = 'wamp' };

export interface IViinexRpc {
    get transport() : Transport;

    clusters(): Observable<Array<IViinexRpc>>;

    svc() : Observable<Object>;
    meta() : Observable<Object>;

    onvifDiscover(): Observable<Array<OnvifDiscoveryResult>>;
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

    statefulRead(name: string): Observable<any>;
    updateableUpdate(name: string, value: any): Observable<any>;

    eventsSummary(name: string, subjects?: Array<string>, origins?: Array<string>, begin?: Date, end?: Date): Observable<Array<any>>;
    eventsQuery(name: string, subjects?: Array<string>, origins?: Array<string>, begin?: Date, end?: Date, limit?: number, offset?: number): Observable<Array<any>>;

    kvstoreGet(name: string, key: string): Observable<any>;
    kvstorePut(name: string, key: string, value: any): Observable<void>;
    kvstoreDelete(name: string, key: string): Observable<void>;

    get events () : Observable<any>;

    close(): void;
}

export class HttpRpc implements IViinexRpc {
    private _webSocket : WebSocketSubject<any>;    
    constructor(private http: HttpClient){
        console.log("RPC implementation is HTTP");
        let cfg : WebSocketSubjectConfig<any>={
            url: location.origin.replace(/^http:/,"ws:").replace(/^https:/,"wss:"),
            openObserver:{
              next: ()=>{
                console.log("websocket connected");
                // let token = this.cookieService.get("auth");
                // if(token != null){
                //     this.webSocket.next(["authenticate", token]);
                // }
                this._webSocket.next(["subscribe",{}]);
                //this.webSocket.next(JSON.stringify(["subscribe",{"topics":["RailcarNumberRecognition"]}]));
              }
            }
          };
          this._webSocket=webSocket(cfg);        
    }
    get transport() { return Transport.Http; }

    clusters() {
        return of<Array<IViinexRpc>>([this]);
    }

    svc() : Observable<Object>{
        return this.http.get("v1/svc");
    }
    meta() : Observable<Object> {
        return this.http.get("v1/svc/meta");
    }

    onvifDiscover(): Observable<Array<OnvifDiscoveryResult>>{
        return this.http.get<Array<OnvifDiscoveryResult>>("v1/env/onvif");
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

    statefulRead(name: string): Observable<any> {
        return this.http.get("v1/svc/"+name);
    }
    updateableUpdate(name: string, value: any): Observable<any> {
        return this.http.post("v1/svc/"+name, value);
    }

    eventsSummary(name: string, subjects?: Array<string>, origins?: Array<string>, begin?: Date, end?: Date): Observable<Array<any>>{
        return this.http.get<Array<Object>>("v1/svc/"+name+"/events/summary"+this._formatEventsQuery(subjects, origins, begin, end));
    }
    eventsQuery(name: string, subjects?: Array<string>, origins?: Array<string>, begin?: Date, end?: Date, limit?: number, offset?: number): Observable<Array<any>>{
        return this.http.get<Array<Object>>("v1/svc/"+name+"/events"+this._formatEventsQuery(subjects, origins, begin, end, limit, offset));
    }
    _formatEventsQuery(subjects?: Array<string>, origins?: Array<string>, begin?: Date, end?: Date, limit?: number, offset?: number): string {
        let qsubjects = subjects ? "&topic=" + subjects.join(",") : "";
        let qorigins = origins ? "&origin=" + origins.join(",") : "";
        let qbegin = begin ? "&begin=" + begin.toISOString() : "";
        let qend = end ? "&end=" + end.toISOString() : "";
        let qlimit = limit ? "&limit=" + limit : "";
        let qoffset = offset ? "&offset=" + offset : "";
        let query = (qsubjects + qorigins + qbegin + qend + qlimit + qoffset).slice(1);
        if(query) {
            return "?"+query;
        }
        else {
            return "";
        }
    }

    kvstoreGet(name: string, key: string) : Observable<any> {
        return this.http.get<any>("v1/svc/"+name+"/kvs/data/"+key);
    }
    kvstorePut(name: string, key: string, value: any): Observable<void> {
        return this.http.post<void>("v1/svc/"+name+"/kvs/data/"+key, value);
    }
    kvstoreDelete(name: string, key: string): Observable<void>{
        return this.http.delete<void>("v1/svc/"+name+"/kvs/data/"+key);
    }
    
    get events () : Observable<any>{
        return this._webSocket.asObservable();
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

class WampRegListInfo {
    public exact: Array<number>;
    public prefix: Array<number>;
    public widlcard: Array<number>;
}
class WampRegInfo {
    id: number;
    created: string; //date
    uri: string;
    match: string;
    invoke: string;
}

export class WampRpc implements IViinexRpc {
    constructor(private wamp: WampClient, private readonly prefix: string = null){
        console.log("RPC implementation is WAMP, prefix", prefix);
    }
    get transport() { return Transport.Wamp; }

    clusters(){
        return this.wamp.call<WampRegListInfo>("wamp.registration.list", []).pipe(
            mergeMap((rli: WampRegListInfo) => 
                forkJoin(rli.prefix.map((rid: number) => 
                    this.wamp.call<WampRegInfo>("wamp.registration.get", [rid])))),
            map((registrations: Array<WampRegInfo>) => 
                registrations.filter(r => r.uri.startsWith(WampClient.VIINEX_API_PREFIX)).map(r => new WampRpc(this.wamp, r.uri+".")))
        );
    }

    svc() : Observable<Object>{
        return this.wamp.call(this.prefix+"svc");
    }
    meta() : Observable<Object> {
        return this.wamp.call(this.prefix+"svc.meta");
    }

    onvifDiscover(): Observable<Array<OnvifDiscoveryResult>>{
        if(this.prefix)
            return this.wamp.call<Array<OnvifDiscoveryResult>>(this.prefix+"discovery.onvif.discover");
        else {
            return this.clusters().pipe(
                mergeMap((rpcs: Array<IViinexRpc>) => 
                    forkJoin(rpcs.map(rpc => rpc.onvifDiscover()))),
                map((o: Array<Array<OnvifDiscoveryResult>>) => o.reduce((a, b) => a.concat(b), []))
            );
        }
    }
    onvifProbe(url: string, auth: [string, string]): Observable<Object>{
        if(this.prefix)
            return this.wamp.call(this.prefix+"discovery.onvif.probe", [url, auth]);
        else {
            let errors: Array<Error>=[];
            let reportError = new Observable((s: Subscriber<Object>) => {
                console.log("Following errors occured while attempt to probe an ONVIF device:", errors); 
                if(errors.length)
                    s.error(errors[0]);
                else
                    s.error({error:{code:'Timeout', reason:"Probe operation for specified ONVIF device has timed out"}})
            });
            return this.clusters().pipe(
                mergeMap((rpcs: Array<IViinexRpc>) => 
                    merge(...rpcs.map(rpc => rpc.onvifProbe(url, auth).pipe(catchError(err => {
                        errors.push(err); 
                        return NEVER;
                    }))))),
                //map(v => {console.log("PROBE RESULT: ", v); return v;}),
                take(1),
                timeoutWith(3000, reportError),
            );
        }
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
        return this.wamp.call<string>(this.prefix+WampRpc.toQuietSnake(name)+".snapshot_base64", [null, spatial]).pipe(map(v => {
            if(typeof v === "object" && v && "error" in v){
                console.debug("error while trying to get live snapshot for ", name, v);
                return "assets/novideo.png";
            }
            else
                return "data:image/jpeg;base64,"+v;

        }));
    }
    archiveSnapshotImage(name: string, channel: string, when: any, spatial: any): Observable<string>{
        if(name!=null){ // name!=null means call to video archive
            return this.wamp.call<string>(this.prefix+WampRpc.toQuietSnake(name)+".video_storage.channel_snapshot_base64", [channel,when,spatial]).pipe(map(WampRpc.toDataUrl));
        }
        else{ //otherwise it's call to vms channel
            return this.wamp.call<string>(this.prefix+WampRpc.toQuietSnake(channel)+".snapshot_source.snapshot_base64", [when, spatial]).pipe(map(WampRpc.toDataUrl));
        }
    }

    statefulRead(name: string): Observable<any>{
        return this.wamp.call<any>(this.prefix+WampRpc.toQuietSnake(name)+".stateful.read");
    }
    updateableUpdate(name: string, value: any): Observable<any>{
        return this.wamp.call<any>(this.prefix+WampRpc.toQuietSnake(name)+".updateable.update", [value]);
    }

    eventsSummary(name: string, subjects?: Array<string>, origins?: Array<string>, begin?: Date, end?: Date): Observable<Array<any>>{
        return this.wamp.call<Array<any>>(this.prefix + WampRpc.toQuietSnake(name) + ".event_archive.summary",
            [{ begin: begin.toISOString(), end: end.toISOString(), origin: origins, topic: subjects }]);
    }
    eventsQuery(name: string, subjects?: Array<string>, origins?: Array<string>, begin?: Date, end?: Date, limit?: number, offset?: number): Observable<Array<Object>>{
        console.log(this.prefix + WampRpc.toQuietSnake(name) + ".event_archive.query", 
        [{ begin: begin.toISOString(), end: end.toISOString(), origin: origins, topic: subjects, limit: limit, offset: offset }]);
        return this.wamp.call<Array<any>>(this.prefix + WampRpc.toQuietSnake(name) + ".event_archive.query",
            [{ begin: begin.toISOString(), end: end.toISOString(), origin: origins, topic: subjects, limit: limit, offset: offset }]);
    }

    kvstoreGet(name: string, key: string) : Observable<any> {
        return this.wamp.call<any>(this.prefix + WampRpc.toQuietSnake(name) + ".key_value_store.get", [key]); 
    }
    kvstorePut(name: string, key: string, value: any): Observable<void> {
        return this.wamp.call<any>(this.prefix + WampRpc.toQuietSnake(name) + ".key_value_store.put", [key, value]); 
    }
    kvstoreDelete(name: string, key: string): Observable<void>{
        return this.wamp.call<any>(this.prefix + WampRpc.toQuietSnake(name) + ".key_value_store.delete", [key]); 
    }

    get events () : Observable<any>{
        return this.wamp.events;
    }

    close(): void {
        this.wamp.close();
    }

    private static toQuietSnake(name: string) : string{
        return name; // todo: fix this
    }
    private static toDataUrl(image: string): string{
        if(image)
            return "data:image/jpeg;base64,"+image;
        else
            return null;
    }
}