import WebGL from './WebGL';

export default class GL {

    gl;
    program;

    constructor(canvas, options, vert, frag) {
        this.gl = WebGL.getContext(canvas, options);
        this.program = WebGL.createProgram(this.gl, vert, frag);
        console.log(this.gl);
    }
}