import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

import {VideoObjectsService} from '../video-objects.service'
import {WebRTCServer,VideoObjects} from '../video-objects'

@Component({
    templateUrl: "./webrtc-video-list.component.html"
})
export class WebrtcVideoListComponent implements OnInit {
    errorMessage: string;
    webrtcServers: WebRTCServer[];
    selectedServer: WebRTCServer;

    constructor(private router: Router, 
                private route: ActivatedRoute,
                private videoObjectsService: VideoObjectsService){
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            let srvId = params["webrtcServerId"];
            if(null==this.webrtcServers){
                this.videoObjectsService.objects.subscribe(
                    objs => {
                        this.webrtcServers=objs.webrtcServers;
                        if(this.webrtcServers.length==1){
                            this.selectedServer=this.webrtcServers[0];
                        }
                        else {
                            let srv = this.webrtcServers.find(wr => wr.name==srvId);
                            if(null!=srv){
                                this.selectedServer=srv;
                            }
                            else {
                                this.selectedServer=null;
                            }
                        }
                    },
                    error => this.errorMessage=<any>error
                );
            }
            else {
                if(this.webrtcServers.length==1){
                    this.selectedServer=this.webrtcServers[0];
                }
                else {
                    this.selectedServer = this.webrtcServers.find(wr => wr.name==srvId);
                }
            }
        });
    }
    // onSelectServer(va:VideoArchive){
    //     this.selectedArchive=va; 
    //     //this.selectedArchiveSummary.tracks.
    //     //this.router.navigate([vs.name], { relativeTo: this.route })
    // }
}