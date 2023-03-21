import { droneState } from "./communication.js";
import * as THREE from "../libs/three.min.js";
import { GLTFLoader } from "../libs/glfloader.js";
import { OrbitControls } from "../libs/orbitcontrols.js";

/* Initalise GLTF loader */
const loader = new GLTFLoader();

const mapCanvas3D = $("#map");
const fov = 75;
const aspect = 4 / 3;
const near = 0.1;
const far = 1000;
const color = 0xffffff;
const intensity = 1.5;
const scene = new THREE.Scene();
const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
const droneMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const cameraSpeed = 0.3;
const cubes = [];
let droneObject;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
/*function cameraControls(cameraMode, renderer, x, y, z) {
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    const controls = new OrbitControls(camera, renderer.domElement);
    if ((cameraMode = "DroneView")) {
        camera.position.set(x, y, z);
        controls.update();
    } else if ((camera = "free")) {
        const cameraOffset = new THREE.Vector3(0, 100, 70);
        camera.position.x = cameraOffset.x;
        camera.position.y = cameraOffset.y;
        camera.position.z = cameraOffset.z;
        controls.update();
    }
}*/

/* Add drone model to scene */
loader.load("../resources/drone.glb", (gltf) => {
    /** @type {THREE.Object3D} */
    const obj = gltf.scene;
    obj.scale.set(10, 10, 10);
    obj.castShadow = true;
    /** @type {THREE.Mesh} */
    const mesh = obj.children[0];
    mesh.material = droneMaterial;
    obj.translateY(2);
    scene.add(obj);
    droneObject = obj;
});

function render3DCube() {
    let time = 0;
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: mapCanvas3D,
    });
    const controls = new OrbitControls(camera, renderer.domElement);
    const cameraOffset = new THREE.Vector3(0, 100, 70);
    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;
    controls.maxPolarAngle = Math.PI / 2;

    controls.update();

    renderer.setPixelRatio(window.devicePixelRatio * 3);

    const amb = new THREE.AmbientLight();
    amb.intensity = 1;
    scene.add(amb);
    // scene.add(new THREE.GridHelper(100, 100));

    const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);
    plane.lookAt(0, 1, 0);
    plane.translateZ(-5);

    function animateCubes() {
        time += 0.01; // convert time to seconds
        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * 0.1;
            const rotation = speed * time;
            cube.rotation.x = rotation;
            cube.rotation.y = rotation;
        });
        /*camera.position.x =
            cameraOffset.length() * Math.sin(time * cameraSpeed);
        camera.position.z =
            cameraOffset.length() * Math.cos(time * cameraSpeed);
        camera.lookAt(0, 0, 0);
        light.position.set(...camera.position);*/
        renderer.render(scene, camera);
        requestAnimationFrame(animateCubes);
    }
    animateCubes();
}

function make3DCubeInstance(size, pos, color) {
    const geometry = new THREE.BoxGeometry(...Object.values(size));
    const material = new THREE.MeshPhongMaterial({ color });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.set(...Object.values(pos));
    return cube;
}

function clearCubes() {
    for (let cube of cubes) {
        cube.pop();
    }
}

function updateDronePosition(x, y, z) {
    droneObject.position.set(x, y, z);
}

export default {
    render3DCube,
    clearCubes,
    make3DCubeInstance,
    updateDronePosition,
};
