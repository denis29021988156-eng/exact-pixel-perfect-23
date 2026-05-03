import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

const vertex = /* glsl */ `
  attribute vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;

  // simplex-ish smooth noise
  vec3 hash(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dot(hash(i + vec3(0,0,0)), f - vec3(0,0,0)),
              dot(hash(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
          mix(dot(hash(i + vec3(0,1,0)), f - vec3(0,1,0)),
              dot(hash(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
      mix(mix(dot(hash(i + vec3(0,0,1)), f - vec3(0,0,1)),
              dot(hash(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
          mix(dot(hash(i + vec3(0,1,1)), f - vec3(0,1,1)),
              dot(hash(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
      u.z);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p = uv - 0.5;
    p.x *= uResolution.x / uResolution.y;

    float t = uTime * 0.04;

    float n1 = noise(vec3(p * 1.4, t));
    float n2 = noise(vec3(p * 2.1 + 4.0, t * 0.7));
    float n3 = noise(vec3(p * 0.8 - 2.0, t * 0.5));

    vec3 deepNavy   = vec3(0.039, 0.054, 0.102);   // #0A0E1A
    vec3 indigo     = vec3(0.090, 0.110, 0.220);
    vec3 violet     = vec3(0.180, 0.110, 0.380);
    vec3 electric   = vec3(0.231, 0.510, 0.965);   // #3B82F6
    vec3 cyan       = vec3(0.024, 0.713, 0.831);   // #06B6D4

    vec3 col = deepNavy;
    col = mix(col, indigo, smoothstep(-0.4, 0.6, n1));
    col = mix(col, violet, smoothstep(0.0, 0.8, n2) * 0.55);
    col = mix(col, electric, smoothstep(0.3, 0.9, n3) * 0.35);
    col = mix(col, cyan, smoothstep(0.5, 1.0, n1 * n2) * 0.25);

    // soft vignette
    float v = smoothstep(1.1, 0.2, length(p));
    col *= 0.55 + 0.55 * v;

    // film grain
    float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    col += (g - 0.5) * 0.025;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function GradientMeshBg({ className = '', static: isStatic = false }: { className?: string; static?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new Renderer({ alpha: false, antialias: false, dpr: Math.min(window.devicePixelRatio, 1.5) });
    const gl = renderer.gl;
    gl.clearColor(0.039, 0.054, 0.102, 1);
    el.appendChild(gl.canvas);
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.display = 'block';

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [el.clientWidth, el.clientHeight] },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      program.uniforms.uResolution.value = [el.clientWidth, el.clientHeight];
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    const start = performance.now();
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      program.uniforms.uTime.value = reduced || isStatic ? 0 : t;
      renderer.render({ scene: mesh });
      if (!reduced && !isStatic) raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      el.removeChild(gl.canvas);
    };
  }, [isStatic]);

  return <div ref={ref} className={`absolute inset-0 ${className}`} aria-hidden />;
}