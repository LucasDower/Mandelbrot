import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({
  antialias: false
});

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

window.addEventListener('resize', function (e) {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const scene = new THREE.Scene();

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  u_ratio: { value: window.innerWidth / window.innerHeight },
  u_width: { value: 3.0 },
  u_offset: { value: [0.0, 0.0] }
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    varying vec2 v_uv;

    void main() {
        v_uv = uv;
        gl_Position = vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    #define MAX_ITER 1000.0

    uniform float u_ratio;
    uniform float u_width;
    uniform vec2 u_offset;
    varying vec2 v_uv;

    vec4 get_color(int i)
    {
        if (i > int(MAX_ITER))
        {
            return vec4(0.0, 0.0, 0.0, 1.0);
        }

        vec4 colors[16] = vec4[](
            vec4(0.258, 0.118, 0.059, 1.0), // brown 3
            vec4(0.098, 0.027, 0.102, 1.0), // dark violet
            vec4(0.035, 0.004, 0.184, 1.0), // darkest blue
            vec4(0.016, 0.016, 0.286, 1.0), // blue 5
            vec4(0.000, 0.027, 0.392, 1.0), // blue 4
            vec4(0.047, 0.173, 0.541, 1.0), // blue 3
            vec4(0.094, 0.322, 0.694, 1.0), // blue 2
            vec4(0.224, 0.490, 0.820, 1.0), // blue 1
            vec4(0.525, 0.710, 0.898, 1.0), // blue 0
            vec4(0.827, 0.925, 0.969, 1.0), // lightest blue
            vec4(0.945, 0.914, 0.749, 1.0), // lightest yellow
            vec4(0.973, 0.788, 0.373, 1.0), // light yellow
            vec4(1.000, 0.667, 0.000, 1.0), // dirty yellow
            vec4(0.800, 0.502, 0.000, 1.0), // brown 0
            vec4(0.600, 0.341, 0.000, 1.0), // brown 1
            vec4(0.416, 0.204, 0.012, 1.0)  // brown 2
        );
        int k = int(mod(float(i), 16.0));
        return colors[k];
    }

    vec4 mandelbrot(float x0, float y0)
    {
        float x = 0.0;
        float y = 0.0;
        float iteration = 0.0;

        while (x*x + y*y <= float(1 << 16) && iteration <= MAX_ITER)
        {
            float xtemp = x*x - y*y + x0;
            y = 2.0*x*y + y0;
            x = xtemp;
            iteration += 1.0;
        }

        if (iteration < MAX_ITER)
        {
            float log_zn = log(x*x + y*y) / 2.0;
            float nu = log(log_zn / log(2.0)) / log(2.0);
            iteration = iteration + 1.0 - nu;
        }

        int i0 = int(floor(iteration));
        int i1 = int(floor(iteration + 1.0));
        vec4 c0 = get_color(i0);
        vec4 c1 = get_color(i1);
        vec4 color = mix(c0, c1, mod(iteration, 1.0));

        return color;
    }

    void main() {
        vec2 scaled_uv = (v_uv - 0.5) * vec2(u_ratio, 1.0);
        vec2 c = scaled_uv * u_width;
        c += u_offset;

        gl_FragColor = mandelbrot(c.x, c.y);
    }
  `
});

const quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2, 1, 1), material);
scene.add(quad);

const mouse = { x: 0.0, y: 0.0 };
let mouseDown = false;

document.addEventListener('mousemove', (e) => {
  if (mouseDown) {
    const deltaX = e.clientX - mouse.x;
    const deltaY = e.clientY - mouse.y;
    const percentageX = deltaX / window.innerWidth;
    const percentageY = deltaY / window.innerHeight;
    uniforms.u_offset.value[0] -= (window.innerWidth / window.innerHeight) * percentageX * uniforms.u_width.value;
    uniforms.u_offset.value[1] += percentageY * uniforms.u_width.value;
    requestAnimationFrame(animate);
  }
  mouse.y = e.clientY;
  mouse.x = e.clientX;
});

document.addEventListener('mousedown', () => {
  mouseDown = true;
});

document.addEventListener('mouseup', () => {
  mouseDown = false;
});

document.addEventListener('wheel', (e) => {
  uniforms.u_width.value *= (e.deltaY > 0 ? 1.1 : 0.9);
  requestAnimationFrame(animate);
});

function animate (): void {
  uniforms.u_ratio.value = window.innerWidth / window.innerHeight;
  renderer.render(scene, camera);
}

animate();
