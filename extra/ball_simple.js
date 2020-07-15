window.addEventListener("load", onLoad);
window.addEventListener("resize", onResize);

let renderer;
let camera;
let scene;
const radius = 0;
let cameraAngle = 0;

let frame = 0;

let sparkList = [];
/** スパークの数 */
let sparkNum = 50;

function onLoad() {
  init();
  onResize();
}

function onResize() {
  let width = window.innerWidth;
  let height = window.innerHeight;
  renderer.domElement.setAttribute("width", String(width));
  renderer.domElement.setAttribute("height", String(height));
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function init() {
  // レンダラーを作成
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  document.body.appendChild(renderer.domElement);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  // カメラを作成
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(radius, 2, -15);

  // シーンを作成
  scene = new THREE.Scene();

  // 平行光源
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(10, 2, -10);
  // シーンに追加
  scene.add(directionalLight);

  // グリッドヘルパー
  const gridHelper = new THREE.GridHelper(10, 20);
  gridHelper.position.y = 0;
  scene.add(gridHelper);

  addTorus();
  addSparkAll();

  animate();

  // フレーム時に実行されるイベント
  function animate() {
    requestAnimationFrame(animate);

    frame++;

    update();
    updateCamera();

    // FPSを30に
    if (frame % 2) {
      return;
    }

    // レンダリング
    renderer.render(scene, camera);
  }
}

function addTorus() {
  //トーラスの生成
  var torus = new THREE.Mesh(
    // 芯円半径、断面円半径、断面円分割、芯円分割
    new THREE.TorusGeometry(2, 0.5, 16, 32),
    new THREE.MeshPhongMaterial({
      color: 0xffff00,
    })
  );
  //sceneに追加
  scene.add(torus);
  torus.position.set(0, 0, 0);
  const rad = 90 * (Math.PI / 180);
  torus.rotation.set(rad, 0, 0);
}

function update() {}

function updateCamera() {
  //   cameraAngle += 0.3;
  //   let lad = (cameraAngle * Math.PI) / 180;
  //   camera.position.x = radius * Math.sin(lad);
  //   camera.position.z = radius * Math.cos(lad);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
}

function addSparkAll() {
  addSpark(30);

  //   let perAngle = 360 / sparkNum;
  //   for (let i = 0; i < sparkNum; i++) {
  //     // if (i % 4 != 0) {
  //     //   continue;
  //     // }
  //     let rad = (perAngle * i * Math.PI) / 180;
  //     drawSpark(sparks, rad);
  //   }
}

function addSpark(rad) {
  // テクスチャーを読み込みます。
  var loader = new THREE.TextureLoader();
  var map = loader.load("textures/Burst01.png");
  map.wrapS = map.wrapT = THREE.RepeatWrapping;

  var geometory = new THREE.PlaneGeometry(0.15, 2);
  //   geometory.translate(0, 0, 0);
  //   geometory.center();

  var material = new THREE.MeshBasicMaterial({
    map: map,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.5,
  });

  // 板状のMeshを作成します。
  var mesh = new THREE.Mesh(geometory, material);
  //   mesh.position.y = Math.random() * 5;
  //   mesh.rotation.y = Math.random() * 2;
  //   mesh.rotation.x = 360 * Math.sin(rad);
  //   mesh.rotation.z = rad;

  const test = 30;
  //   mesh.rotation.x = 360 * Math.sin(test);
  //   mesh.rotation.y = 2;
  const a = 45 * (Math.PI / 180);
  //   mesh.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), a);
  //   mesh.rotateOnAxis(new THREE.Vector3(0, 0, 1), a);
  mesh.lookAt(0, 0, 0);
  //   mesh.rotateZ = a;
  mesh.rotation.z = a;
  mesh.position.x = 0;
  mesh.position.y = 3;
  mesh.position.z = 0;

  // シーンに追加
  scene.add(mesh);
  sparkList.push(mesh);
}

function updateSparkAll() {
  sparkList.forEach((spark) => {
    updateSpark(spark);
  });
}

const gSpeed = Math.random() * 0.2 + 0.2;

function updateSpark(mesh) {
  //   mesh.position.y -= gSpeed;
  //   console.log(mesh.position.y);
  //   mesh.material.opacity -= 0.05;

  if (mesh.position.y < 0) {
    mesh.position.y = 6;
    mesh.material.opacity = 0.5;
  }
}
