import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import TWEEN from '@tweenjs/tween.js';

let container, controls;
let camera, scene, renderer;
let raycaster, mouse;
const people = [];

const stats = new Stats();
stats.domElement.style.right = 0;
stats.domElement.style.left = 'initial';
document.body.appendChild(stats.dom);

init();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 200);
  // camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 200);
  camera.position.set(50, 40, 50);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 10, 180);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.outputEncoding = THREE.sRGBEncoding;
  // renderer.shadowMap.enabled = true;

  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;
  controls.autoRotate = true;
  controls.update();

  addLights();
  addItems();

  window.addEventListener('click', onMouseClick, false);
  window.addEventListener('resize', onWindowResize, false);
  animate();
}


function addItems() {

  const n = 8;
  for (let x = -n / 2; x < n / 2; x++) {
    for (let y = -n / 2; y < n / 2; y++) {
      for (let z = -n / 2; z < n / 2; z++) {
        const margin = 2.5;
        const size = 1;
        const color = new THREE.Color(`hsla(120, 80%, 50%, 1)`);
        // const geometry = new THREE.SphereBufferGeometry(size, 32, 32);
        const geometry = new THREE.BoxBufferGeometry(size, size, size);
        const material = new THREE.MeshLambertMaterial({ color: color });
        const person = new THREE.Mesh(geometry, material);
        const randomX = Math.random() * size - size / 2;
        const randomY = Math.random() * size - size / 2;
        const randomZ = Math.random() * size - size / 2;
        person.position.set((x + size / 2) * margin + randomX, (y + size / 2) * margin + randomY, (z + size / 2) * margin + randomZ);

        person.castShadow = true;
        person.receiveShadow = true;

        const colorChange = new THREE.Color(`hsla(0, 80%, 50%, 1)`);
        const colorTweenIn = new TWEEN.Tween(person.material.color)
          .to(colorChange, 1000)
          .easing(TWEEN.Easing.Cubic.In)
          .onStart(() => {
            person.tweenDone = true;
          })
          .onComplete(() => {
            if (person.closeProx.length > 0) {
              // const randomIndex = Math.floor(Math.random() * person.closeProx.length);
              // person.closeProx[randomIndex].colorTween.start();
              // person.closeProx.splice(randomIndex, 1);
              for (let i = 0; i < person.closeProx.length; i++) {
                if (!person.closeProx[i].tweenDone) {
                  person.closeProx[i].colorTween.start();
                  // person.closeProx.splice(randomIndex, 1);

                }
              }
            }
          });

        person.colorTween = colorTweenIn;
        person.closeProx = [];

        people.push(person);
        scene.add(person);
      }
    }
  }

  checkProximity();
}

function checkProximity() {
  for (let i = 0; i < people.length; i++) {
    const allButMe = people.slice();
    allButMe.splice(i, 1);
    for (let j = 0; j < allButMe.length; j++) {
      const distanceTo = people[i].position.distanceTo(allButMe[j].position);
      if (distanceTo < 3) {
        people[i].closeProx.push(allButMe[j]);
      }
    }
  }
}

function addLights() {

  const shadowSize = 16;

  const ambient = new THREE.AmbientLight(0xffffff, 0.05);
  scene.add(ambient);

  const topRight = new THREE.DirectionalLight(0xffffff, 0.5);
  topRight.position.set(4, 4, 4);
  topRight.castShadow = true;
  topRight.shadow.camera.top = shadowSize;
  topRight.shadow.camera.bottom = -shadowSize;
  topRight.shadow.camera.left = -shadowSize;
  topRight.shadow.camera.right = shadowSize;

  // const topRightHelper = new THREE.DirectionalLightHelper(topRight, 1);
  scene.add(topRight);
  // scene.add(topRightHelper);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
  backLight.position.set(0, 2, -6);
  // const backLightHelper = new THREE.DirectionalLightHelper(backLight, 1);
  scene.add(backLight);
  // scene.add(backLightHelper);
}

function onMouseClick(event) {
  const x = (event.touches) ? event.touches[0].clientX : event.clientX;
  const y = (event.touches) ? event.touches[0].clientY : event.clientY;

  mouse.x = (x / window.innerWidth) * 2 - 1;
  mouse.y = - (y / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length) {
    const obj = intersects[0].object;
    console.log(obj.closeProx);
    if (obj.colorTween && !obj.tweenDone) {
      obj.colorTween.start();
    }
  }

  renderer.render(scene, camera);

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  stats.begin();

  TWEEN.update();
  controls.update();
  renderer.render(scene, camera);

  stats.end();
  requestAnimationFrame(animate);
}