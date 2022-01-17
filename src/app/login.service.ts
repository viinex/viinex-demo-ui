import { Injectable } from '@angular/core';
import { Observable, Observer, of } from "rxjs";
import { map,shareReplay,concatMap, mergeMap, catchError } from 'rxjs/operators';

import * as Crypto from 'crypto-js';
import * as Cookies from 'js-cookie';

import jwtDecode, { JwtPayload } from 'jwt-decode'
import { HttpClient } from '@angular/common/http'
import { WampClient } from './wamp-client'
import { IViinexRpc, HttpRpc, WampRpc } from './viinex-rpc'


@Injectable()
export class LoginService {
    public static isServerAccessible(loginStatus : any[]){
        return loginStatus!=null;
    }
    public static isLoginApplicable(loginStatus : any[]){
        return loginStatus==null || loginStatus[0] || (loginStatus[1]!=null);
    }
    public static isLoginRequired(loginStatus : any[]){
        return loginStatus!=null && loginStatus[0]=='http';
    }

    constructor(private http: HttpClient, private wamp: WampClient){
        this.lastLoginStatus=null;

        this.loginStatusObservable=Observable.create((o : Observer<any[]>)=>{
            this.loginStatusObserver=o;
        }).pipe(shareReplay(1));
        this.errorMessageObservable=Observable.create((o : Observer<string>)=>{
            this.errorMessageObserver=o;
        }).pipe(shareReplay(1));
    }

    private lastLoginStatus : any[];

    private loginStatusObserver : Observer<any[]>;
    private loginStatusObservable : Observable<any[]>;

    private errorMessageObserver : Observer<string>;
    private errorMessageObservable : Observable<string>;
    

    public getLoginStatus() : Observable<any[]>{
        return this.loginStatusObservable;
    }
    public getErrorMessage() : Observable<string>{
        return this.errorMessageObservable;
    }

    private setLoginStatus(ls : any[]){
        this.lastLoginStatus=ls;
        if(null!=this.loginStatusObserver){
            this.loginStatusObserver.next(ls);
        }
    }
    private setErrorMessage(e : string){
        if(null!=this.errorMessageObserver){
            this.errorMessageObserver.next(e);
        }
    }

    public initialCheckLoginStatus() {
        if(this.lastLoginStatus==null){
            this.checkLoginStatus();
        }
    }

    private setLoginStatusFromCookie(){
        var c=this;
        var authCookie=Cookies.get('auth');
        if(null != authCookie){
            let d =  jwtDecode<Object>(authCookie);
            console.debug("JWT content:", d);
            this.setLoginStatus([false, (<any>d).sub]);
        }
        else{
            this.setLoginStatus([false, null]);
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
            this.setLoginStatus(['http', null]); 
            this.setErrorMessage(null);
        }
        else if(error.status==404){
            this.setLoginStatus(['wamp', null]); 
            this.setErrorMessage(null);
        }
        else {
            this.setLoginStatus(null); 
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
        return this.wamp.connect(login, password).pipe(map(res =>{
            if(res){
                console.log("set login status ", res);
                this.setLoginStatus(['wamp', login]);
            }
            return res;
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
        this.checkLoginStatus();
    }

}