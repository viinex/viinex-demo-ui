import { Observable, throwError } from "rxjs";
import { Injectable, NgZone, OnDestroy } from "@angular/core";
import * as nacl from 'tweetnacl';
import * as bb from 'bytebuffer';

import * as autobahn from 'autobahn-browser';

@Injectable()
export class WampClient implements OnDestroy {
    connection : autobahn.Connection;

    constructor(private zone: NgZone){}

    public connect(uri: string, realm: string, login : string, password : string) : Observable<void> {
        if(this.connection!=null){
            this.connection.close();
        }
        return new Observable(subscriber => {
            let seed = new Uint8Array(bb.fromHex(password).toArrayBuffer());
            let key = nacl.sign.keyPair.fromSeed(seed);

            this.connection = new autobahn.Connection({
                url: uri,
                onchallenge: (session: autobahn.Session, method: string, extra: any) => {
                    return bb.wrap(nacl.sign(new Uint8Array(bb.fromHex(extra.challenge).toArrayBuffer()), key.secretKey)).toHex();
                },
                realm: realm,
                authid: login,
                authmethods: ["cryptosign"],
                authextra: {
                    pubkey: bb.wrap(key.publicKey).toHex()
                }, 
            });
            this.connection.onopen = (session, details) => { 
                console.debug("WAMP session established, id = ", session.id, details);
                // enable autoreconnect
                this.connection.onclose = (reason, details) => {
                    return false;
                };
                this.zone.run(() => {
                    if(!subscriber.closed){
                        subscriber.next();
                        subscriber.complete();
                    }
                });
            };
            this.connection.onclose = (reason, details) => {
                console.debug("WAMP connection closed, reason: ", reason, details);
                this.zone.run(() => {
                    if(!subscriber.closed){
                        subscriber.error(reason);
                    }
                });
                return true;
            }
            this.connection.open();
        });
    }
    public close() {
        if(this.connection){
            this.connection.onclose = (reason, details) => {
                console.debug("WampClient.close(): WAMP connection closed, ", reason);
                return true;
            };
            this.connection.close();
            this.connection=null;
        }
    }

    ngOnDestroy(): void {
        this.close();
        console.debug("WampClient instance destroyed");
    }

    public call<T>(procedure: string, args?: Array<any>) : Observable<T>{
        let s=this.connection?.session;
        if(!s){
            return throwError("WAMP client is not connected");
        }

        // copied from https://github.com/ReactiveX/rxjs/blob/ff5a748b31ee73a6517e2f4220c920c73fbdd1fc/src/internal/observable/innerFrom.ts#L83
        return new Observable<T>(subscriber => {
            s.call(procedure, args).then(v => {
                this.zone.run(() => {
                    if(!subscriber.closed){
                        subscriber.next(<T>v);
                        subscriber.complete();
                    }
                });
            },
            (err: any) => this.zone.run(() => { subscriber.error(err) }));
        });
    }
}
