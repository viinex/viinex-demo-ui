import { Observable, throwError, of, Subject, from } from "rxjs";
import * as nacl from 'tweetnacl';
import * as bb from 'bytebuffer';

import * as autobahn from 'autobahn-browser';

export class WampClient {
    connection : autobahn.Connection;

    public connect(login : string, password : string) : Observable<boolean> {
        let res=new Subject<boolean>();
        let seed = new Uint8Array(bb.fromHex(password).toArrayBuffer());
        let key = nacl.sign.keyPair.fromSeed(seed);

        this.connection = new autobahn.Connection({
            url: "ws://demo.viinex.com:8080/ws",
            onchallenge: (session: autobahn.Session, method: string, extra: any) => {
                console.log("WAMP cryptosign onchallenge ", extra.challenge, key);
                return bb.wrap(nacl.sign(new Uint8Array(bb.fromHex(extra.challenge).toArrayBuffer()), key.secretKey)).toHex();
            },
            realm: "demo1",
            authid: login,
            authmethods: ["cryptosign"],
            authextra: {
                pubkey: bb.wrap(key.publicKey).toHex()
            }
        });
        this.connection.onopen = (session, details) => { 
            console.log("WAMP session established, id = ", session.id, details);
            res.next(true);
        };
        this.connection.onclose = (reason, details) => {
            console.log("WAMP connection closed, reason: ", reason);
            res.next(false);
            return false;
        }
        this.connection.open();
        return res.asObservable();
    }
    public call<T>(procedure: string, args?: Array<any>) : Observable<T>{
        let s=this.connection.session;
        if(!s){
            return throwError("WAMP client is not connected");
        }
        let res=new Subject<T>();
        return from(s.call(procedure, args).then(v => <T>v));
    }
}
