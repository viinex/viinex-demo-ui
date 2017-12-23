import { Component, OnInit } from '@angular/core';

import { LoginService } from './login.service'

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styles: ['.active { font-weight: bold; }']
})
export class AppComponent implements OnInit {
  isServerOnline: boolean;
  isLoginApplicable: boolean;
  isLoginRequired: boolean;
  loginRefLabel: string;

  constructor(private loginService: LoginService) { }

  ngOnInit(): void {
    this.loginService.getLoginStatus().subscribe(
      ls => {
        this.isServerOnline = LoginService.isServerAccessible(ls);
        this.isLoginApplicable = LoginService.isLoginApplicable(ls);
        this.isLoginRequired = LoginService.isLoginRequired(ls);
        if (this.isLoginRequired) {
          this.loginRefLabel = "Login";
        }
        else {
          this.loginRefLabel = "Logout";//"Logged in as "+ls[1]; 
        }
      }
    );
    this.loginService.initialCheckLoginStatus();
  }
}
