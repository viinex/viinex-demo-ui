export class Format{
    static gb(sz: number): string{
        return ((sz/1000000000).toFixed(2))+" GB";
    }
    private static pad02(x: number){
        return ('00' + x.toString()).substr(-2);
    }
    static formatDate(d:Date) : string{
        return d.getFullYear()+"."+Format.pad02(d.getMonth()+1)+"."+Format.pad02(d.getDate());
    }
    static formatTime(d:Date) : string{
        return Format.pad02(d.getHours())+":"+Format.pad02(d.getMinutes());
    }
    static interval([b,e]:[Date,Date]): string{
        let res:string;
        if(e.valueOf()-b.valueOf()>84000000){
            res=Format.formatDate(b)+" - "+Format.formatDate(e);
        }
        else {
            res=Format.formatDate(b)+" "+Format.formatTime(b)+"-"+Format.formatTime(e);
        }
        return res;
    }
    static temporalLength(seconds: number) : string {
        let m=Math.floor(seconds/60);
        let res=m + " minute(s)";
        let h=Math.floor(m/60);
        let d=Math.floor(h/24);
        let mo=Math.floor(d/30);
        if(mo>0){
            res=mo+" month(s)";
            let rd=d-mo*30;
            if(rd > 0){
                res+=" and "+rd+" day(s)";
            }
        } 
        else if(d > 0){
            res = d+" day(s)";
            let rh=h-d*24;
            if(rh>0){
                res+=" and "+rh+" hour(s)";
            }
        }
        else if(h>0){
            res = h+" hour(s)";
            let rm=m-h*60;
            if(rm>0){
                res+=" and "+rm+" minute(s)";
            }
        }
        else if(m>0){
            res = m+" minute(s)";
            let rs=seconds-m*60;
            if(rs>0){
                res+=" and "+rs+" second(s)";
            }
        }
        return res;
    }
}