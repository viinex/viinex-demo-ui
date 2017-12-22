import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/share';

import { Observer } from 'rxjs/Observer';

import * as Crypto from 'crypto-js';
import * as Cookies from 'js-cookie';


@Injectable()
export class LoginService {
    private IsLoggedIn(){
        return false;
    }
    constructor(private http: Http){
        this.loginStatusObservable=Observable.create((o : Observer<any[]>)=>{
            this.loginStatusObserver=o;
        }).share();
        this.errorMessageObservable=Observable.create((o : Observer<string>)=>{
            this.errorMessageObserver=o;
        }).share();
    }

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
        this.loginStatusObserver.next(ls);
    }
    private setErrorMessage(e : string){
        this.errorMessageObserver.next(e);
    }

    public checkLoginStatus() {
        var c=this;
        this.http.get("v1/svc").subscribe(
            (res:Response) => { 
                c.setLoginStatus([false, JSON.parse(atob(Cookies.get('auth'))).user]);
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
        .subscribe((res:Response) => {
            let challenge=<any>res.json();
            console.log(challenge);
            let secret = challenge.realm ? Crypto.MD5(login + ':' + challenge.realm + ':' + password).toString(Crypto.enc.Hex) : password;
            let responseStr = Crypto.HmacMD5(challenge.challenge, secret).toString(Crypto.enc.Hex);
            let response = {
                login: login,
                when: challenge.when, 
                challenge: challenge.challenge,
                signature: challenge.signature,
                response: responseStr
            };
            console.log(response);
            this.http.post("v1/authCheckResponse", response).subscribe((res:Response)=>{
                console.log(res.json());
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