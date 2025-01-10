export class OnvifDevice{
    url : string;
    name: string;
    hardware: string;
    location: string;
}

export class OnvifDeviceInfo {
    vendor: string;
    serial: string;
    model: string;
    firmware: string;
}

export class OnvifVideoSourceInfo {
    token: string;
    framerate: number;
    resolution: [number, number];
}
export class OnvifVideoCodecInfo {
    codec: string;
    resolution: [number, number];
    source: string;
    quality: number;
    bounds: [number, number, number, number];
}
export class OnvifProfileInfo {
    token: string;
    name: string;
    fixed: boolean;
    video: OnvifVideoCodecInfo;
}

export class OnvifDeviceDetails {
    info: OnvifDeviceInfo;
    videoSources: Array<OnvifVideoSourceInfo>;
    profiles: Array<OnvifProfileInfo>;
}

// response from viinex api
export class OnvifDiscoveryResult {
    scopes : {
        hardware: string;
        location: string;
        name: string;
    };
    xaddrs: Array<string>;
}
