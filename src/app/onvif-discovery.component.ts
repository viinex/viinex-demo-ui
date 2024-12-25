import {Component, OnInit} from '@angular/core';
import {FormsModule, NgModel} from '@angular/forms';

import {OnvifService} from './onvif.service'
import {OnvifDevice, OnvifDeviceDetails} from './onvif-device'


@Component({
    standalone: false,
    selector: 'onvif-discovery',
    templateUrl: './onvif-discovery.component.html'
})
export class OnvifDiscoveryComponent implements OnInit {
    errorMessage: string;
    errorDetails: string;
    devices: OnvifDevice[];

    probeResult: OnvifDeviceDetails;
    probeTarget: string;

    probeAnon: boolean;
    probeLogin: string;
    probePassword: string;

    probeCustomAddress: string;
    probeCustomPort: number;

    constructor(private onvifService: OnvifService){
        this.probeAnon=false;
    }
    ngOnInit(): void {
        let x = this;
        this.onvifService.getDevices().subscribe(
            devices => x.devices=devices,
            error => this.errorMessage=<any>error
        );
    }

    probeFor(url: string): void {
        this.probeTarget=url;
        this.probe();
    }
    private probe(): void {
        let auth:[string,string]=this.probeAnon ? null : [this.probeLogin, this.probePassword];

        this.probeResult=null;
        this.onvifService.probeFor(this.probeTarget, auth).subscribe(
            res => { 
                this.probeResult=res; 
                this.errorMessage=null;
                this.errorDetails="";
            },
            error => {
                if(error.error != null && error.error.code != null){
                    this.errorMessage = error.error.code;
                    this.errorDetails = error.error.reason;
                }
                else{
                    this.errorMessage=JSON.stringify(error);
                    this.errorDetails="";
                }
            });
    }
    probeForCustom(): void {
        this.probeTarget="http://"+this.probeCustomAddress+
        (this.probeCustomPort!=null?":"+this.probeCustomPort:"")
        +"/onvif/device_service";
        this.probe();
    }
}