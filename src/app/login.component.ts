import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';

import {LoginService} from './login.service'
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/timer';

@Component({
    selector: 'login',
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
    isServerOnline: boolean;
    isLoginRequired: boolean;

    loginName: string;
    loginPassword: string;

    errorMessage: string;

    constructor(private loginService: LoginService, private router: Router){}
    ngOnInit(): void {
        this.loginService.getLoginStatus().subscribe(
            ls => { 
                if(null!=ls){
                    this.isServerOnline=true; 
                    this.isLoginRequired=ls[0]; 
                    this.loginName=ls[1]; 
                }
                else{
                    this.isServerOnline=false;
                }
            }
        );
        this.loginService.getErrorMessage().subscribe(v => { this.errorMessage=v; })
        this.loginService.initialCheckLoginStatus();
    }

    public onLogin(){
        this.loginService.login(this.loginName, this.loginPassword);
        Observable.timer(1000).subscribe(() => { 
            this.router.navigate(['/']); 
        });
    }
    public onLogout(){
        this.loginService.logout();
    }
}