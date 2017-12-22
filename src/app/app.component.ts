import { Component, OnInit } from '@angular/core';

import {LoginService} from './login.service'

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styles: ['.active { font-weight: bold; }']
})
export class AppComponent implements OnInit { 
  isServerOnline : boolean;
  isLoginRequired : boolean;
  loginRefLabel : string;

  constructor(private loginService: LoginService){}

  ngOnInit(): void {
    this.loginService.getLoginStatus().subscribe(
        ls => { 
            if(null!=ls){
                this.isServerOnline=true; 
                this.isLoginRequired=ls[0]; 
                this.loginRefLabel="Login";
                if(null!=ls[1]){
                  this.loginRefLabel="Logout";//"Logged in as "+ls[1]; 
                }
            }
            else{
                this.isServerOnline=false;
            }
        }
    );
    this.loginService.checkLoginStatus();
  }
}
/*
<nav class="navbar navbar-fixed-top navbar-dark bg-inverse">
    <div class="container">
        <a class="navbar-brand">Angular Router</a>
        <ul class="nav navbar-nav" routerLinkActive="active">
            <li class="nav-item"><a class="nav-link" routerLink="home">Home</a></li>
            <li class="nav-item"><a class="nav-link" routerLink="about">About</a></li>
            <li class="nav-item"><a class="nav-link" routerLink="courses">Courses</a></li>
        </ul>
    </div>
</nav>
*/