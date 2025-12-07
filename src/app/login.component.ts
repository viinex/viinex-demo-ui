import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';

import {LoginService, LoginStatus } from './login.service'
import { Transport } from './viinex-rpc';
import { Observable, timer } from 'rxjs';

import * as nacl from 'tweetnacl';
import {default as bb} from 'bytebuffer';
import * as sha256 from 'fast-sha256';
import { LoginGuardService } from './login-guard.service';

@Component({
    standalone: false,
    selector: 'login',
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
    isServerOnline: boolean;
    isLoginRequired: boolean;
    isWamp : boolean = false;

    wampUri: string = "";
    wampRealm: string = "";
    loginName: string = "";
    loginPassword: string = "";
    rememberLoginDetails: boolean = true;

    errorMessage: string;

    constructor(private loginService: LoginService, private router: Router, private loginGuardService: LoginGuardService){}
    ngOnInit(): void {
        this.isWamp = false;
        this.loginService.loginStatus.subscribe(
            ls => { 
                console.debug("LoginComponent::login status change subscription", ls);
                if(null!=ls){
                    this.isServerOnline=true; 
                    this.isLoginRequired = ls.isLoginRequired; 
                    this.loginName = ls.loginName; 
                    this.isWamp = ls.rpc?.transport==Transport.Wamp;

                    if (this.isWamp && !this.loginName) {
                        this.wampUri = localStorage.getItem('wampUri') || this.wampUri;
                        console.log("wampUri: ", this.wampUri);
                        this.wampRealm = localStorage.getItem('wampRealm') || this.wampRealm;
                        console.log("wampRealm: ", this.wampRealm);
                        this.loginName = localStorage.getItem('loginName') || this.loginName;
                        const privateKeySeed = localStorage.getItem('privateKeySeedHex');
                        if (privateKeySeed) {
                            this.loginPassword = privateKeySeed;
                        }
                    }

                    if(this.isWamp && !this.wampUri){
                        if(location.protocol == "https:"){
                            this.wampUri = "wss://"+location.host+"/ws";
                        }
                        else{
                            this.wampUri = "ws://"+location.host+"/ws";
                        }
                    }

                }
                else{
                    this.isServerOnline=false;
                }
            }
        );
        this.loginService.getErrorMessage().subscribe(v => { this.errorMessage=v; })
    }

    public onLogin(){
        let password=this.loginPassword;
        if(this.isWamp){
            password=this.privateKeySeedHex(password);
        }
        this.loginService.login({login: this.loginName, password: password, isWamp: this.isWamp, uri: this.wampUri, realm: this.wampRealm}).subscribe((loggedOn: boolean) => {
            console.log("this.loginService.login ", this.wampUri, this.wampRealm, this.loginName, this.loginPassword, loggedOn);
            if(loggedOn) {
                if (this.rememberLoginDetails && this.isWamp) {
                    localStorage.setItem('wampUri', this.wampUri);
                    localStorage.setItem('wampRealm', this.wampRealm);
                    localStorage.setItem('loginName', this.loginName);
                    localStorage.setItem('privateKeySeedHex', this.privateKeySeedHex(this.loginPassword));
                } else {
                    localStorage.removeItem('wampUri');
                    localStorage.removeItem('wampRealm');
                    localStorage.removeItem('loginName');
                    localStorage.removeItem('privateKeySeedHex');
                }
                this.loginGuardService.returnToRequestedRoute('/');
            }
        });
    }
    public onLogout(){
        this.loginService.logout();
    }

    private privateKeySeedHex(password: string) : string {
        if(password.length==64 && /^[0-9a-fA-F]+$/.test(password)){
            return password;
        }
        else{
            let msg = new Uint8Array(bb.fromUTF8(this.loginName+":"+this.wampRealm+":"+this.loginPassword).toArrayBuffer());
            return bb.wrap(sha256.hash(msg)).toHex();
        }

    }
    public publicKey(password: string){
        let seedHex=this.privateKeySeedHex(password);
        console.log(seedHex);
        let seed = new Uint8Array(bb.fromHex(seedHex).toArrayBuffer());
        let key = nacl.sign.keyPair.fromSeed(seed);
        return bb.wrap(key.publicKey).toHex();

    }
}