import { Injectable, OnInit } from '@angular/core';
import { Observable, ReplaySubject, of } from "rxjs";
import { map, mergeMap, catchError } from 'rxjs/operators';

import * as Crypto from 'crypto-js';
import * as Cookies from 'js-cookie';

import jwtDecode, { JwtPayload } from 'jwt-decode'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { WampClient } from './wamp-client'
import { IViinexRpc, HttpRpc, WampRpc, Transport } from './viinex-rpc'
import { trace } from 'console';

export interface LoginParams {
    login: string,
    password: string,
    isWamp: boolean,
    uri: string,
    realm: string
}

export class LoginStatus {
    public readonly anonymous: boolean = false; // if anonymous access *TO VIINEX* is allowed
    public readonly loginName: string = null;
    public readonly rpc: IViinexRpc = null;

    constructor(rpc: IViinexRpc, anonymous: boolean, loginName: string = null){
        this.anonymous=anonymous;
        this.loginName=loginName;
        this.rpc=rpc;
    }
    public get isAccessGranted(): boolean {
        return (this.rpc?.transport != null) && ((this.anonymous && this.rpc?.transport==Transport.Http) || this.loginName != null);
    }
    public get isServerAccessible() {
        return this.rpc?.transport != null;
    }
    public get isLoginPageRelevant() {
        return this.rpc != null && !(this.rpc?.transport==Transport.Http && this.anonymous);
    }
    public get isLoginRequired(){
        return this.loginName == null &&
            (   (this.rpc?.transport==Transport.Wamp) || 
                (this.rpc?.transport==Transport.Http && !this.anonymous)
            );
    }
    public get isHttp(){
        return this.rpc?.transport==Transport.Http;
    }
}

@Injectable()
export class LoginService {
    constructor(private http: HttpClient, private wamp: WampClient){
        this.lastLoginStatus=new LoginStatus(null, false);
        this._loginStatus=new ReplaySubject(1);
        this._errorMessage=new ReplaySubject(1);
        console.debug("LoginService ctor");
        this.initialCheckLoginStatus().subscribe(()=>{
            console.debug("Login status initialized");
        });
    }

    private lastLoginStatus : LoginStatus;

    private _loginStatus : ReplaySubject<LoginStatus>;
    private _errorMessage : ReplaySubject<string>;

    public get loginStatus() : Observable<LoginStatus>{
        return this._loginStatus.asObservable();
    }
    public getErrorMessage() : Observable<string>{
        return this._errorMessage.asObservable();
    }

    private setLoginStatus(ls : LoginStatus){
        this.lastLoginStatus=ls;
        this._loginStatus.next(ls);
    }
    private setErrorMessage(e : string){
        this._errorMessage.next(e);
    }

    private initialCheckLoginStatus(): Observable<void> {
        console.debug("initialCheckLoginStatus", this.lastLoginStatus);
        if(this.lastLoginStatus.rpc==null){
            console.debug("initial check login status");
            return this.checkLoginStatus();
        }
        else {
            console.debug("empty");
            return of();
        }
    }

    private setLoginStatusFromCookie(){
        console.debug("setLoginStatusFromCookie");
        var c=this;
        var authCookie=Cookies.get('auth');
        if(null != authCookie){
            let d =  jwtDecode<Object>(authCookie);
            console.debug("JWT content:", d);
            this.setLoginStatus(new LoginStatus(new HttpRpc(this.http), false, (<any>d).sub)); // non-anonymous login was allowed over http
        }
        else{
            this.setLoginStatus(new LoginStatus(new HttpRpc(this.http), true)); // anonymous login was allowed over http
        }
        this.setErrorMessage(null);
    }

    private checkLoginStatus(): Observable<void> {
        return this.http.get<Array<Array<string>>>("v1/svc").pipe(map(
            (_) => { 
                this.setLoginStatusFromCookie();
            }),
            catchError((error: any, caught: Observable<void>) => { 
                this.handleErrorObservable(error); 
                return of<void>(); 
            })
        );
    }

    private handleErrorObservable (error: Response) {
        console.log(error);
        if(error.status==403) {
            this.setLoginStatus(new LoginStatus(new HttpRpc(this.http), false)); 
            this.setErrorMessage(null);
        }
        else if(error.status==404 || error.status==200 ){ // not found or found yet error -- probably cannot parse
            this.setLoginStatus(new LoginStatus(new WampRpc(this.wamp), true)); 
            this.setErrorMessage(null);
        }
        else {
            this.setLoginStatus(new LoginStatus(null, false)); 
            this.setErrorMessage(error.toString());
        }
    }

    public login({ login, password, isWamp = false, uri, realm } : LoginParams){
        if(!isWamp){
            return this.loginHttp(login, password);
        }
        else{
            return this.loginWamp(uri, realm, login, password);
        }
    }
    private loginWamp(uri: string, realm: string, login : string, password : string){
        return this.wamp.connect(uri, realm, login, password).pipe(map(() =>{
            console.log("loginWamp",login,password);
            console.trace();
            this.setLoginStatus(new LoginStatus(new WampRpc(this.wamp), false, login));
            return true;
        }), catchError((e) => {
            console.log("loginWamp catchError",e);
            console.trace();
            this.setLoginStatus(new LoginStatus(new WampRpc(this.wamp), true));
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
                    console.error("Caught error when logging in via HTTP:",err);
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
        if(this.lastLoginStatus?.rpc!=null){
            this.lastLoginStatus.rpc.close();
        }
        let ls=new LoginStatus(null, false);
        this.lastLoginStatus=ls;
        this.setLoginStatus(ls);
        this.initialCheckLoginStatus().subscribe(()=>{
            console.debug("Login status initialized");
        });
       //return this.checkLoginStatus();
    }

}