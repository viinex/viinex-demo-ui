import {Component, OnInit} from '@angular/core';

import {OnvifService} from './onvif.service'
import {OnvifDevice} from './onvif-device'

@Component({
    selector: 'onvif-discovery',
    templateUrl: './onvif-discovery.component.html'
})
export class OnvifDiscoveryComponent implements OnInit {
    errorMessage: string;
    devices: OnvifDevice[];

    constructor(private onvifService: OnvifService){}
    ngOnInit(): void {
        this.onvifService.getDevices().subscribe(
            devices => this.devices=devices,
            error => this.errorMessage=<any>error
        );
    }
}