import { Injectable, OnInit } from '@angular/core';
import { Observable } from "rxjs";
import {map} from 'rxjs/operators';

import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { LoginService } from './login.service'


@Injectable()
export class LoginGuardService implements CanActivate, OnInit {  
    constructor(private loginService: LoginService, private router: Router){}
    
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.loginService.getLoginStatus().pipe(map(ls => {
            if(LoginService.isServerAccessible(ls) && !LoginService.isLoginRequired(ls)){
                return true;
            }
            else{
                this.router.navigate(['/login']);
                return false;
            }
        }));
    }

  ngOnInit(): void {
      this.loginService.initialCheckLoginStatus();
  }
  
} 