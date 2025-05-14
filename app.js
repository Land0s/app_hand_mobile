import * as THREE from 'three';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { ARjs } from 'ar.js';

// Инициализация Three.js + AR.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// AR.js маркерная сцена
const arToolkitSource = new ARjs.Source({
    sourceType: 'webcam',
});
const arToolkitContext = new ARjs.Context({
    cameraParametersUrl: 'data/camera_para.dat',
    detectionMode: 'mono',
});
arToolkitContext.init(() => {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
});
scene.visible = false;
arToolkitSource.init(() => {
    setTimeout(() => {
        arToolkitSource.onResizeElement();
        arToolkitSource.copyElementSizeTo(renderer.domElement);
    }, 2000);
});

// 3D-объект (куб)
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 5;

// Загрузка модели Handpose
let model;
async function loadHandpose() {
    await tf.ready();
    model = await handpose.load();
    console.log("Handpose model loaded!");
    detectHand();
}

// Детекция жестов
async function detectHand() {
    const video = arToolkitSource.domElement;
    const predictions = await model.estimateHands(video);
    if (predictions.length > 0) {
        const hand = predictions[0];
        updateCubePosition(hand.landmarks);
    }
    requestAnimationFrame(detectHand);
}

// Обновление позиции куба на основе жестов
function updateCubePosition(landmarks) {
    // Пример: перемещение куба по оси X в зависимости от положения ладони
    const wrist = landmarks[0]; // Запястье
    cube.position.x = (wrist[0] / window.innerWidth) * 4 - 2;
    cube.position.y = -(wrist[1] / window.innerHeight) * 4 + 2;
}

// Рендер
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

loadHandpose();
animate();