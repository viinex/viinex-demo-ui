import { zip, pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';

import { LoginService } from './login.service'
import { VideoObjectsService } from './video-objects.service';
import { Stateful } from './video-objects';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: false,
  selector: 'my-app',
  templateUrl: './app.component.html',
  styles: ['.active { font-weight: bold; }']
})
export class AppComponent implements OnInit {
  isServerOnline: boolean = false;
  isLoginApplicable: boolean = true;
  isLoginRequired: boolean = true;
  loginRefLabel: string = "Login";
  isHttpRpc: boolean = false;
  isAccessGranted: boolean = false;

  enableApps: boolean = false;

  constructor(private loginService: LoginService, private videoObjectsService: VideoObjectsService) { }

  ngOnInit(): void {
      this.loginService.loginStatus.subscribe(ls => {
        console.log("APP component -- login status and video objects change subscription", ls);
        console.trace();
        this.isServerOnline = ls.isServerAccessible;
        this.isLoginApplicable = ls.isLoginPageRelevant;
        this.isLoginRequired = ls.isLoginRequired;
        this.isHttpRpc = ls.isHttp;
        this.isAccessGranted = ls.isAccessGranted;
        if (!this.isAccessGranted) {
          this.loginRefLabel = "Login";
        }
        else {
          this.loginRefLabel = "Logout "+ls.loginName; 
        }
      });
      this.videoObjectsService.objects.subscribe(vo =>{
        this.enableApps = vo.applications.length > 0;
      });
  }
}
