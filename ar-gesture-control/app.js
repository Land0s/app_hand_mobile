// Инициализация сцены, камеры, рендерера
let camera, scene, renderer, object;
let net;

init();

async function init() {
  // 1. Настройка Three.js
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
  
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // 2. Добавляем 3D-объект (куб)
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshNormalMaterial();
  object = new THREE.Mesh(geometry, material);
  scene.add(object);

  // 3. Включаем WebXR (AR)
  renderer.xr.enabled = true;
  
  // Кнопка для входа в AR
  const arButton = document.createElement('button');
  arButton.id = 'ar-button';
  arButton.textContent = 'Start AR';
  arButton.addEventListener('click', async () => {
    await renderer.xr.setSession(navigator.xr.requestSession('immersive-ar'));
    setupHandTracking();
  });
  document.body.appendChild(arButton);

  // 4. Запускаем анимацию
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

// 5. Распознавание жестов (TensorFlow Handpose)
async function setupHandTracking() {
  net = await handpose.load();
  const video = document.createElement('video');
  
  // Запрашиваем доступ к камере
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();
    detectHand(video);
  } catch (err) {
    console.error('Camera access denied:', err);
  }
}

async function detectHand(video) {
  const predictions = await net.estimateHands(video);
  if (predictions.length > 0) {
    const hand = predictions[0];
    updateObjectByGesture(hand);
  }
  requestAnimationFrame(() => detectHand(video));
}

// 6. Управление объектом по жестам
function updateObjectByGesture(hand) {
  const fingersUp = countFingersUp(hand);
  
  // Пример: если поднято 2 пальца – увеличиваем, если 0 – уменьшаем
  if (fingersUp >= 2) {
    object.scale.set(1.5, 1.5, 1.5);
  } else {
    object.scale.set(0.7, 0.7, 0.7);
  }
}

// Вспомогательная функция: считаем поднятые пальцы
function countFingersUp(hand) {
  // Упрощённая логика (можно доработать)
  const fingertips = hand.annotations.indexFinger[3];
  const fingerBase = hand.annotations.indexFinger[0];
  return fingertips[1] < fingerBase[1] ? 1 : 0;
}