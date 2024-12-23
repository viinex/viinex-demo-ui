import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';

import {LoginService, LoginStatus } from './login.service'
import { Transport } from './viinex-rpc';
import { Observable, timer } from 'rxjs';

import * as nacl from 'tweetnacl';
import * as bb from 'bytebuffer';
import * as sha256 from 'fast-sha256';

@Component({
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

    errorMessage: string;

    constructor(private loginService: LoginService, private router: Router){}
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

                    if(this.isWamp){
                        this.wampUri = "wss://cloud.viinex.com/ws";
                        this.wampRealm = "lwo";
                        this.loginName = "guest";
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
            if(loggedOn){
                timer(1000).subscribe(() => { 
                    this.router.navigate(['/']); 
                });
            }
        });
    }
    public onLogout(){
        this.loginService.logout();
    }

    private privateKeySeedHex(password: string) : string {
        if(password.length==64){
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