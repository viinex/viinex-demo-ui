import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from "rxjs";
import { map, mergeMap, catchError } from 'rxjs/operators';

import * as Crypto from 'crypto-js';
import * as Cookies from 'js-cookie';

import jwtDecode, { JwtPayload } from 'jwt-decode'
import { HttpClient } from '@angular/common/http'
import { WampClient } from './wamp-client'
import { IViinexRpc, HttpRpc, WampRpc } from './viinex-rpc'

export enum Transport { None = 'none', Http = 'http', Wamp = 'wamp' };

export class LoginStatus {
    public readonly transport: Transport = null;
    public readonly anonymous: boolean = true; // if anonymous access *TO VIINEX* is allowed
    public readonly loginName: string = null;
    constructor(t: Transport, a: boolean, l?: string){
        this.transport=t;
        this.anonymous=a;
        if(l){
            this.loginName=l;
        }
    }
    public isServerAccessible(){
        return this.transport != Transport.None;
    }
    public isLoginPageRelevant(){
        return this.transport!=Transport.None && !(this.transport==Transport.Http && this.anonymous);
    }
    public isLoginRequired(){
        return this.loginName == null &&
            (   (this.transport==Transport.Wamp) || 
                (this.transport==Transport.Http && !this.anonymous)
            );
    }
    public isHttp(){
        return this.transport==Transport.Http;
    }
}

@Injectable()
export class LoginService {
    constructor(private http: HttpClient, private wamp: WampClient){
        this.lastLoginStatus=new LoginStatus(Transport.None, false);
        this.loginStatus=new BehaviorSubject(this.lastLoginStatus);
        this.errorMessage=new BehaviorSubject(null);
    }

    private lastLoginStatus : LoginStatus;

    private loginStatus : BehaviorSubject<LoginStatus>;
    private errorMessage : BehaviorSubject<string>;

    public getLoginStatus() : Observable<LoginStatus>{
        return this.loginStatus.asObservable();
    }
    public getErrorMessage() : Observable<string>{
        return this.errorMessage.asObservable();
    }

    private setLoginStatus(ls : LoginStatus){
        this.lastLoginStatus=ls;
        this.loginStatus.next(ls);
        console.log("LOGIN STATUS:" , ls, ls.isLoginRequired());
    }
    private setErrorMessage(e : string){
        this.errorMessage.next(e);
    }

    public initialCheckLoginStatus() {
        if(this.lastLoginStatus.transport==Transport.None){
            this.checkLoginStatus();
        }
    }

    private setLoginStatusFromCookie(){
        var c=this;
        var authCookie=Cookies.get('auth');
        if(null != authCookie){
            let d =  jwtDecode<Object>(authCookie);
            console.debug("JWT content:", d);
            this.setLoginStatus(new LoginStatus(Transport.Http, false, (<any>d).sub)); // non-anonymous login was allowed over http
        }
        else{
            this.setLoginStatus(new LoginStatus(Transport.Http, true)); // anonymous login was allowed over http
        }
        this.setErrorMessage(null);
    }

    public checkLoginStatus() {
        this.http.get("v1/svc").subscribe(
            (res:Response) => { 
                this.setLoginStatusFromCookie();
            },
            (error: Response) => { this.handleErrorObservable(error); }
        );
    }

    private handleErrorObservable (error: Response) {
        if(error.status==403) {
            this.setLoginStatus(new LoginStatus(Transport.Http, false)); 
            this.setErrorMessage(null);
        }
        else if(error.status==404){
            this.setLoginStatus(new LoginStatus(Transport.Wamp, true)); 
            this.setErrorMessage(null);
        }
        else {
            this.setLoginStatus(new LoginStatus(Transport.None, false)); 
            this.setErrorMessage(error.toString());
        }
    }

    private _rpc : IViinexRpc;
    public get rpc() : IViinexRpc {
        return this._rpc;
    }

    public login(isWamp : boolean, login : string, password : string){
        if(!isWamp){
            return this.loginHttp(login, password).pipe(map(v => {
                if(v){
                    this._rpc = new HttpRpc(this.http);
                }
                else{
                    this._rpc=null;
                }
                return v;
            }));
        }
        else{
            return this.loginWamp(login, password).pipe(map(v => {
                if(v){
                    this._rpc = new WampRpc(this.wamp);
                }
                else{
                    this._rpc=null;
                }
                return v;
            }));
        }
    }
    private loginWamp(login : string, password : string){
        return this.wamp.connect(login, password).pipe(map(() =>{
            this.setLoginStatus(new LoginStatus(Transport.Wamp, true, login));
            return true;
        }), catchError((e) => {
            this.setLoginStatus(new LoginStatus(Transport.Wamp, true));
            this.setErrorMessage(e);
            return of(false);
        }));
    }
    private loginHttp(login : string, password : string){
        return this.http.post("v1/authGetChallenge?login="+login, '')
            .pipe(mergeMap(
                (res:Object) => {
                    let challenge=<any>res;
                    let secret = challenge.realm ? Crypto.MD5(login + ':' + challenge.realm + ':' + password).toString(Crypto.enc.Hex) : password;
                    let responseStr = Crypto.HmacMD5(challenge.challenge, secret).toString(Crypto.enc.Hex);
                    let response = {
                        login: login,
                        when: challenge.when, 
                        challenge: challenge.challenge,
                        signature: challenge.signature,
                        response: responseStr
                    };
                    return this.http.post("v1/authCheckResponse", response).pipe(map((res:Object)=>{
                        this.setLoginStatusFromCookie();
                        return true;
                    }));
                })).pipe(catchError((err) => {
                    console.log("Caught error:",err);
                    if(err.status == 403){
                        this.setErrorMessage("Invalid credentials");
                    }
                    else{
                        this.setErrorMessage("Failure while contacting logon server (it could be that server is unreachable; see console log for details)");
                    }
                    return of(false);
                }));
    }
    public logout(){
        Cookies.remove("auth");
        if(this.rpc){
            this.rpc.close();
            this._rpc=null;
        }
        this.setLoginStatus(new LoginStatus(Transport.None, false));
        this.checkLoginStatus();
    }

}