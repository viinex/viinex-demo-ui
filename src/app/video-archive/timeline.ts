export class Timeline {
    constructor(canvasId: string){
        this.canvas=<HTMLCanvasElement>document.getElementById(canvasId);
        this.context=this.canvas.getContext("2d");
    }
    draw(){
        this.context.fillText("qweqwe", this.canvas.width/2, this.canvas.height/2);
    }
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
}