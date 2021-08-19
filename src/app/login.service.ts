import { Injectable } from '@angular/core';
import { Observable, Observer, forkJoin } from "rxjs";
import { map,shareReplay } from 'rxjs/operators';

import * as Crypto from 'crypto-js';
import * as Cookies from 'js-cookie';

import jwtDecode, { JwtPayload } from 'jwt-decode'
import { HttpClient } from '@angular/common/http';


@Injectable()
export class LoginService {
    public static isServerAccessible(loginStatus : any[]){
        return loginStatus!=null;
    }
    public static isLoginApplicable(loginStatus : any[]){
        return loginStatus==null || loginStatus[0] || (loginStatus[1]!=null);
    }
    public static isLoginRequired(loginStatus : any[]){
        return loginStatus!=null && loginStatus[0];
    }

    constructor(private http: HttpClient){
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

    public checkLoginStatus() {
        var c=this;
        this.http.get("v1/svc").subscribe(
            (res:Response) => { 
                var authCookie=Cookies.get('auth');
                if(null != authCookie){
                    let d =  jwtDecode<Object>(authCookie);
                    console.log(d);
                    c.setLoginStatus([false, d]);
                }
                else{
                    c.setLoginStatus([false, null]);
                }
                c.setErrorMessage(null);
            },
            (error: Response) => { c.handleErrorObservable(error); }
        );
    }

    private handleErrorObservable (error: Response) {
        if(error.status==403) {
            this.setLoginStatus([true, null]); 
            this.setErrorMessage(null);
        }
        else {
            this.setLoginStatus(null); 
            this.setErrorMessage(error.toString());
        }
    }

    public login(login : string, password : string){
        this.http.post("v1/authGetChallenge?login="+login, '')
        .subscribe((res:Object) => {
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
            this.http.post("v1/authCheckResponse", response).subscribe((res:Response)=>{
                this.checkLoginStatus();
            }, (error:Response)=>{
                if(error.status==403){
                    this.setErrorMessage("Invalid credentials"); // that is password
                }
                else{
                    this.setLoginStatus(null);
                    this.setErrorMessage(error.toString());
                }
            })
        }, (error: Response) => {
            if(error.status==403){
                this.setErrorMessage("Invalid credentials"); // that is username, but we won't tell you
            }
            else{
                this.setLoginStatus(null);
                this.setErrorMessage(error.toString());
            }
            return false;
        });
    }
    public logout(){
        Cookies.remove("auth");
        this.checkLoginStatus();
    }

}