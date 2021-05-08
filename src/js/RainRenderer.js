import GL from './GL';
import { vertShader, fragShader } from './Shaders';

const glsl  = require("glslify");

export default class RainRenderer {

    canvas;
    ctx;
    gl;

    constructor() {
        console.log("Rain renderer init");
        this.createCanvas();

        this.gl = new GL(this.canvas, { alpha:false }, vertShader, fragShader);
    }

    createCanvas() {
        this.canvas = document.createElement("canvas");
        this.canvas.width = 800;
        this.canvas.height = 600;
        document.body.appendChild(this.canvas);
    }
}