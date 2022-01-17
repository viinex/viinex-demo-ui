import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {OnvifService} from './onvif.service'
import {OnvifDevice, OnvifDeviceDetails} from './onvif-device'

@Component({
    selector: 'onvif-discovery',
    templateUrl: './onvif-discovery.component.html'
})
export class OnvifDiscoveryComponent implements OnInit {
    errorMessage: string;
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
            res => { this.probeResult=res; this.errorMessage=null;},
            error => this.errorMessage=<any>error);
    }
    probeForCustom(): void {
        this.probeTarget="http://"+this.probeCustomAddress+
        (this.probeCustomPort!=null?":"+this.probeCustomPort:"")
        +"/onvif/device_service";
        this.probe();
    }
}