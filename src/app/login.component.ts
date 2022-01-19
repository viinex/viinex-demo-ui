import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';

import {LoginService, LoginStatus, Transport } from './login.service'
import { Observable, timer } from 'rxjs';

@Component({
    selector: 'login',
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
    isServerOnline: boolean;
    isLoginRequired: boolean;
    isWamp : boolean;

    loginName: string;
    loginPassword: string;

    errorMessage: string;

    constructor(private loginService: LoginService, private router: Router){}
    ngOnInit(): void {
        this.isWamp = false;
        this.loginService.loginStatus.subscribe(
            ls => { 
                console.debug("LoginComponent.ngOnInit");
                if(null!=ls){
                    this.isServerOnline=true; 
                    this.isLoginRequired = ls.isLoginRequired(); 
                    this.loginName = ls.loginName; 
                    this.isWamp = ls.transport==Transport.Wamp;

                    if(this.isWamp){
                        this.loginName = 'user42';
                        this.loginPassword = 'fb434a5d1f40693ed4a3407c64c0e6d3f5df2ceee9f3c5cf6de67f7a818f8a08';
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
        this.loginService.login(this.isWamp, this.loginName, this.loginPassword).subscribe((loggedOn: boolean) => {
            if(loggedOn){
                timer(1000).subscribe(() => { 
                    this.router.navigate(['/']); 
                });
            }
        });
    }
    public onLogout(){
        this.loginService.logout().subscribe(() => {
            
        });
    }
}