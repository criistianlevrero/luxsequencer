import type { PipelineSource } from './types';

type PendingFrameMap = Partial<Record<PipelineSource, ImageBitmap>>;

type TextureMap = Record<PipelineSource, WebGLTexture>;

type UniformLocations = {
  texA: WebGLUniformLocation | null;
  texB: WebGLUniformLocation | null;
  mixFactor: WebGLUniformLocation | null;
};

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D texA;
uniform sampler2D texB;
uniform float mixFactor;

void main() {
  vec4 colorA = texture(texA, v_uv);
  vec4 colorB = texture(texB, v_uv);
  outColor = mix(colorA, colorB, mixFactor);
}
`;

export class WebGLCompositor {
  private readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private textures: TextureMap | null = null;
  private uniforms: UniformLocations | null = null;
  private pendingFrames: PendingFrameMap = {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  init(): boolean {
    const gl = this.canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) {
      return false;
    }

    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      return false;
    }

    const program = this.createProgram(gl, vertexShader, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!program) {
      return false;
    }

    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      gl.deleteProgram(program);
      return false;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]), gl.STATIC_DRAW);

    const texA = this.createTexture(gl);
    const texB = this.createTexture(gl);

    if (!texA || !texB) {
      gl.deleteBuffer(vertexBuffer);
      gl.deleteProgram(program);
      return false;
    }

    const uniforms: UniformLocations = {
      texA: gl.getUniformLocation(program, 'texA'),
      texB: gl.getUniformLocation(program, 'texB'),
      mixFactor: gl.getUniformLocation(program, 'mixFactor'),
    };

    this.gl = gl;
    this.program = program;
    this.vertexBuffer = vertexBuffer;
    this.textures = { A: texA, B: texB };
    this.uniforms = uniforms;

    this.resize(this.canvas.clientWidth || this.canvas.width, this.canvas.clientHeight || this.canvas.height);

    return true;
  }

  setSourceFrame(source: PipelineSource, bitmap: ImageBitmap): void {
    const previous = this.pendingFrames[source];
    if (previous) {
      previous.close();
    }
    this.pendingFrames[source] = bitmap;
  }

  resize(width: number, height: number): void {
    if (!this.gl) {
      return;
    }

    const safeWidth = Math.max(1, Math.floor(width));
    const safeHeight = Math.max(1, Math.floor(height));

    if (this.canvas.width !== safeWidth || this.canvas.height !== safeHeight) {
      this.canvas.width = safeWidth;
      this.canvas.height = safeHeight;
    }

    this.gl.viewport(0, 0, safeWidth, safeHeight);
  }

  render(mixFactor: number): void {
    const gl = this.gl;
    const program = this.program;
    const textures = this.textures;
    const uniforms = this.uniforms;
    const vertexBuffer = this.vertexBuffer;

    if (!gl || !program || !textures || !uniforms || !vertexBuffer) {
      return;
    }

    this.uploadPendingFrame('A', textures.A);
    this.uploadPendingFrame('B', textures.B);

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures.A);
    gl.uniform1i(uniforms.texA, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures.B);
    gl.uniform1i(uniforms.texB, 1);

    gl.uniform1f(uniforms.mixFactor, Math.min(1, Math.max(0, mixFactor)));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose(): void {
    this.pendingFrames.A?.close();
    this.pendingFrames.B?.close();
    this.pendingFrames = {};

    if (!this.gl) {
      return;
    }

    if (this.textures) {
      this.gl.deleteTexture(this.textures.A);
      this.gl.deleteTexture(this.textures.B);
    }

    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
    }

    if (this.program) {
      this.gl.deleteProgram(this.program);
    }

    this.textures = null;
    this.vertexBuffer = null;
    this.program = null;
    this.uniforms = null;
    this.gl = null;
  }

  private uploadPendingFrame(source: PipelineSource, texture: WebGLTexture): void {
    const gl = this.gl;
    const pendingFrame = this.pendingFrames[source];
    if (!gl || !pendingFrame) {
      return;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pendingFrame);

    pendingFrame.close();
    delete this.pendingFrames[source];
  }

  private createTexture(gl: WebGL2RenderingContext): WebGLTexture | null {
    const texture = gl.createTexture();
    if (!texture) {
      return null;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]),
    );

    return texture;
  }

  private compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) {
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
    const program = gl.createProgram();
    if (!program) {
      return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }
}
