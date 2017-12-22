import {Component, OnInit} from '@angular/core';

import {LoginService} from './login.service'

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

    constructor(private loginService: LoginService){}
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
        this.loginService.checkLoginStatus();
    }

    public onLogin(){
        this.loginService.login(this.loginName, this.loginPassword);
    }
    public onLogout(){
        this.loginService.logout();
    }
}