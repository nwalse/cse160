import {
    SphereGeometry,
    Mesh,
    ShaderMaterial,
    UniformsUtils,
    BackSide
} from "three";
import * as THREE from 'three';

class Sky extends Mesh {
    constructor() {
        let shader = Sky.SkyShader;

        let material = new ShaderMaterial({
            name: shader.name,
            uniforms: UniformsUtils.clone(shader.uniforms),
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
            side: BackSide,
            depthWrite: false,
        });

        super(new SphereGeometry(1, 30, 25), material);

        this.isSky = true;
        this.iTime = 0;
    }
}

Sky.SkyShader = {
    name: 'NormalSkyShader',

    uniforms: {
        "iTime": { value: 0.0 },
        "cameraPosition": { value: new THREE.Vector3() },
    },

    vertexShader: `
        varying vec3 v_WorldDirection;

        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            v_WorldDirection = normalize(worldPosition.xyz - cameraPosition);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: `
        precision mediump float;

        uniform float iTime;
        varying vec3 v_WorldDirection;

        void main(void) {
            vec3 rd = normalize(v_WorldDirection); // Ray direction
            vec3 col = vec3(0.53, 0.81, 0.92); // Daytime sky color (light blue)

            // Fade effect for horizon
            float fade = smoothstep(0.0, 0.01, abs(rd.y)) * 0.8 + 0.2;
            col *= fade;

            gl_FragColor = vec4(col, 1.0);
        }
    `
};

export { Sky };