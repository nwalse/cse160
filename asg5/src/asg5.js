// Used ai here

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let canvas, renderer, scene, camera, loader, objLoader, mtlloader, controls, airplane;
let sun, moon, dayNightCycle = 0;
let directionalLight, ambientLight, pointLight;
let ground, skybox;

function setUpScene() {
    canvas = document.querySelector('#c');
    scene = new THREE.Scene();

    loader = new THREE.TextureLoader();
    objLoader = new OBJLoader();
    mtlloader = new MTLLoader();

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const fov = 75;
    const aspect = 2;
    const near = 0.1;
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 50, 200);

    // Add ground
    createGround();
    
    // Add skybox
    createSkybox();
    
    // Add sun
    createSun();

    // Directional Light (Sun)
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Ambient Light
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Point Light (Moon)
    pointLight = new THREE.PointLight(0x4444ff, 1, 100);
    pointLight.position.set(-50, 50, -50);
    scene.add(pointLight);

    controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 50, 0);
    controls.update();
}

function loadAirplane() {
    mtlloader.load('../textures/Airplane.mtl', (mtl) => {
        objLoader.setMaterials(mtl);
        objLoader.load('../textures/Airplane.obj', (obj) => {
            const texture = loader.load('../textures/Airplane.png');
            const material = new THREE.MeshStandardMaterial({ map: texture }); 
            obj.traverse((child) => {
                if (child.isMesh) {
                    child.material = material;
                }
            });
            obj.scale.set(0.05, 0.05, 0.05);
            obj.position.set(0, 50, 0);
            scene.add(obj);
            airplane = obj;
        });
    });
}

function createCloud(position) {
    mtlloader.load('../textures/materials.mtl', (mtl) => {
        mtl.preload();
        objLoader.setMaterials(mtl);
        objLoader.load('./../textures/model.obj', (cloud) => {
            cloud.scale.set(5,5,5);
            cloud.position.set(position.x, position.y, position.z);
            scene.add(cloud);
        });
    });
}

function generateClouds() {
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 400 - 200;
        const y = Math.random() * 100 + 50;
        const z = Math.random() * 400 - 200;
        createCloud(new THREE.Vector3(x, y, z));
    }
}

function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a472a,  // Dark green color
        roughness: 0.8,
        metalness: 0.2
    });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;  // Rotate to be horizontal
    ground.position.y = -50;  // Position below the airplane
    scene.add(ground);
}

function createSkybox() {
    const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyTexture = loader.load('../textures/sky.jpg');
    const skyboxMaterials = [
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }), // right
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }), // left
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }), // top
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }), // bottom
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }), // front
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide })  // back
    ];
    skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
    scene.add(skybox);
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 1
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(100, 100, -100);
    scene.add(sun);

    // Create moon
    const moonGeometry = new THREE.SphereGeometry(15, 32, 32);
    const moonMaterial = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        emissive: 0x4444ff,
        emissiveIntensity: 0.5
    });
    moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(-100, 100, -100);
    scene.add(moon);
}

function updateDayNightCycle(time) {
    // Update cycle (0 to 2π)
    dayNightCycle = (time * 0.1) % (Math.PI * 2);
    
    // Calculate sun and moon positions
    const radius = 150;
    sun.position.x = Math.cos(dayNightCycle) * radius;
    sun.position.y = Math.sin(dayNightCycle) * radius;
    moon.position.x = Math.cos(dayNightCycle + Math.PI) * radius;
    moon.position.y = Math.sin(dayNightCycle + Math.PI) * radius;

    // Update directional light (sun)
    directionalLight.position.copy(sun.position);
    
    // Calculate sun height for lighting calculations
    const sunHeight = (sun.position.y + radius) / (2 * radius);
    
    // Update light intensities
    directionalLight.intensity = Math.max(0, sunHeight);
    ambientLight.intensity = 0.2 + sunHeight * 0.3;
    pointLight.intensity = Math.max(0, -sunHeight) * 0.5;

    // Update sky color
    const skyColor = new THREE.Color();
    if (sunHeight > 0) {
        // Day
        skyColor.setHSL(0.6, 0.8, 0.5 + sunHeight * 0.5);
    } else {
        // Night
        skyColor.setHSL(0.6, 0.8, 0.1);
    }
    scene.background = skyColor;

    // Update skybox materials
    const skyboxIntensity = sunHeight > 0 ? 1 : 0.2;
    skybox.material.forEach(material => {
        material.opacity = skyboxIntensity;
        material.transparent = true;
    });

    // Update ground color based on time of day
    const groundColor = new THREE.Color();
    if (sunHeight > 0) {
        // Day
        groundColor.setHSL(0.3, 0.8, 0.3);
    } else {
        // Night
        groundColor.setHSL(0.3, 0.8, 0.1);
    }
    ground.material.color = groundColor;
}

function main() {
    setUpScene();
    loadAirplane();
    generateClouds();

    function render(time) {
        time *= 0.001;
        
        if (airplane) {
            airplane.position.y = 50 + Math.sin(time * 2) * 10;
        }

        updateDayNightCycle(time);
        
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();