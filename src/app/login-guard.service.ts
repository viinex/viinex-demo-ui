import { Injectable, OnInit } from '@angular/core';
import { Observable, of } from "rxjs";
import {map} from 'rxjs/operators';

import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { LoginService } from './login.service'


@Injectable()
export class LoginGuardService  implements OnInit {  
    constructor(private loginService: LoginService, private router: Router){
    }
    
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.loginService.loginStatus.pipe(map(ls => {
            if(ls.isServerAccessible && !ls.isLoginRequired){
                return true;
            }
            else{
                this._routeToReturnTo = state.url;
                this.router.navigate(['/login']);
                return false;
            }
        }));
    }
    public returnToRequestedRoute(defaultUrl: string): Promise<boolean>{
        if(this._routeToReturnTo){
            let r = this._routeToReturnTo;
            this._routeToReturnTo=null;
            return this.router.navigateByUrl(r);
        }
        else {
            if(defaultUrl){
                return this.router.navigateByUrl(defaultUrl);
            }
            else{
                return of(false).toPromise();
            }
        }
    }
    private _routeToReturnTo: string = null;

    ngOnInit(): void {
    }

}