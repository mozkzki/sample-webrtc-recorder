window.addEventListener("load", _init);
window.addEventListener("resize", _resize);

let renderer;
let camera;
let scene;
const radius = 20;
let cameraAngle = 0;

let frame = 0;

let sparkList = [];
/** スパークの数 */
let sparkNum = 50;

let magma = null;
let aura = null;

let wall = null;
let newPosition = new THREE.Vector3(0, 0, 0);

let gauge = 1;
var gaugeSlider = document.getElementById("gauge");

// 現在の値を埋め込む関数
const setCurrentValue = (val) => {
  gauge = Number(val);
};

// inputイベント時に値をセットする関数
const rangeOnChange = (e) => {
  setCurrentValue(e.target.value);
};

window.onload = () => {
  // 変更に合わせてイベントを発火する
  gaugeSlider.addEventListener("input", rangeOnChange);
};

// マウスを追随
window.addEventListener("mousemove", (e) => {
  console.log("mouse:(" + e.clientX + "," + e.clientY + ")");
  newPosition = getStartPosition(e.clientX, e.clientY);
});

function getStartPosition(target_x, target_y) {
  let width = window.innerWidth;
  let height = window.innerHeight;

  // 取得したスクリーン座標を-1〜1に正規化する（WebGLは-1〜1で座標が表現される）
  var mouseX = (target_x / width) * 2 - 1;
  var mouseY = -(target_y / height) * 2 + 1;

  // マウスの位置ベクトル
  var pos = new THREE.Vector3(mouseX, mouseY, 1);

  // pos はスクリーン座標系なので、オブジェクトの座標系に変換
  // オブジェクト座標系は今表示しているカメラからの視点なので、第二引数にカメラオブジェクトを渡す
  pos.unproject(camera);

  //   console.log("origin(" + target_x + "," + target_y + ")");
  //   console.log("screen(" + mouseX + "," + mouseY + "," + 1 + ")");
  //   console.log("world (" + pos.x + "," + pos.y + "," + pos.z + ")");

  // 始点、向きベクトルを渡してレイを作成
  var ray = new THREE.Raycaster(
    camera.position,
    pos.sub(camera.position).normalize()
  );

  // 交差判定
  // 引数は取得対象となるMeshを渡す
  var objs = ray.intersectObject(wall);

  var pos_new = new THREE.Vector3(0, 0, 0);
  if (objs.length > 0) {
    // 交差していたらobjsが1以上になる
    pos_new.x = objs[0].point.x;
    pos_new.y = objs[0].point.y;
    pos_new.z = pos.z;
  }

  //   console.log(
  //     "start (" + pos_new.x + "," + pos_new.y + "," + pos_new.z + ")"
  //   );

  return pos_new;
}

function createWall() {
  const geometry = new THREE.BoxBufferGeometry(65535, 65535, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x000000,
    // transparent: true,
    opacity: 0.0,
  });

  wall = new THREE.Mesh(geometry, material);
  scene.add(wall);
  wall.position.set(0, 0, 0);

  // レンダリング
  renderer.render(scene, camera);
}

function _init() {
  init3DField();
  _resize();
}

function _resize() {
  let width = window.innerWidth;
  let height = window.innerHeight;
  renderer.domElement.setAttribute("width", String(width));
  renderer.domElement.setAttribute("height", String(height));
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function init3DField() {
  // レンダラーを作成
  renderer = new THREE.WebGLRenderer({
    // canvas: document.querySelector("#my3dcanvas"),
    // alpha: true,
    antialias: true,
  });
  document.body.appendChild(renderer.domElement);

  renderer.setPixelRatio(window.devicePixelRatio);
  // 背景に透明を指定
  renderer.setClearColor(0x000000, 0);
  // レンダラーの auto clear をfalseにする
  // renderer.autoClear = false;

  // カメラを作成
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  //   camera.position.set(radius, 4, 0);
  camera.position.set(0, 4, radius);
  //   camera.position.set(0, 0, 10);

  // シーンを作成
  scene = new THREE.Scene();
  const ball = new THREE.Group();
  scene.add(ball);

  // // 平行光源
  // const directionalLight = new THREE.DirectionalLight(0xffffff);
  // directionalLight.position.set(0, 0, 0);
  // // シーンに追加
  // scene.add(directionalLight);

  // 透明な壁を作成（スクリーン座標変換用）
  createWall();

  var magmaMap = drawMagmaBall(ball);
  var ouraMap = drawOuraBall(ball);
  var glow = drawGlow(ball);
  drawSparkAll(ball);
  drawFlares(ball);
  var inGrow = addInGrow(ball);

  // グリッドヘルパー
  const gridHelper = new THREE.GridHelper(10, 20);
  gridHelper.position.y = -3;
  scene.add(gridHelper);

  animate();

  // フレーム時に実行されるイベント
  function animate() {
    requestAnimationFrame(animate);

    frame++;

    // renderer.clear();

    updateMagmaBall(magmaMap);
    updateOuraBall(ouraMap);
    updateSparkAll();
    updateFlares();
    updateGlow(glow);
    updateInGrow(inGrow);

    updateCamera();

    // FPSを30に
    if (frame % 2) {
      return;
    }

    // レンダリング
    renderer.render(scene, camera);
  }
}

function updateCamera() {
  //   cameraAngle += 0.3;
  //   let lad = (cameraAngle * Math.PI) / 180;
  //   camera.position.x = radius * Math.sin(lad);
  //   camera.position.z = radius * Math.cos(lad);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
}

function drawMagmaBall(ball) {
  // テクスチャー読み込み
  var loader = new THREE.TextureLoader();
  var map = loader.load("textures/magma.png");

  const geometry = new THREE.SphereGeometry(2, 20, 20);
  const material = new THREE.MeshBasicMaterial({
    map: map,
  });

  // テクスチャーをあてた球のMeshを作成します。
  magma = new THREE.Mesh(geometry, material);
  // 縦横でリピートするように設定します。
  map.wrapS = map.wrapT = THREE.RepeatWrapping;

  magma.position.x = 0;
  magma.position.y = 0;
  magma.position.z = 0;

  // シーンに追加
  scene.add(magma);
  ball.add(magma);

  return map;
}

function updateMagmaBall(map) {
  // 毎フレーム位置を0.005ずつ動かす。
  //   map.offset.x += 0.007;
  //   map.offset.y += 0.008;
  map.offset.x += 0.001;
  map.offset.y += 0.002;

  magma.position.x = newPosition.x;
  magma.position.y = newPosition.y;
  magma.position.z = 0;
}

function drawOuraBall(ball) {
  // テクスチャー読み込み
  var loader = new THREE.TextureLoader();
  var map = loader.load("textures/aura3_type2.png");

  const geometry = new THREE.SphereGeometry(2.05, 20, 20);
  const material = new THREE.MeshBasicMaterial({
    map: map,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });

  // テクスチャーをあてた球のMeshを作成します。
  aura = new THREE.Mesh(geometry, material);
  // 縦横でリピートするように設定します。
  map.wrapS = map.wrapT = THREE.RepeatWrapping;

  aura.position.x = 0;
  aura.position.y = 0;
  aura.position.z = 0;

  // シーンに追加
  scene.add(aura);
  ball.add(aura);

  return map;
}

function updateOuraBall(map) {
  // 毎フレーム位置を0.005ずつ動かす。
  map.offset.x += 0.005;
  map.offset.y += 0.005;

  aura.position.x = newPosition.x;
  aura.position.y = newPosition.y;
  aura.position.z = 0;
}

function drawGlow(ball) {
  // テクスチャーを読み込みます。
  var loader = new THREE.TextureLoader();
  var map = loader.load("textures/Particle01.png");

  // マテリアル
  var material = new THREE.SpriteMaterial({
    map: map,
    color: 0xffffff,
    blending: THREE.AdditiveBlending,
    opacity: 0.8,
    transparent: true,
  });

  // スプライト
  var sprite = new THREE.Sprite(material);
  sprite.scale.multiplyScalar(11);
  //   scene.add(sprite);
  ball.add(sprite);

  return sprite;
}

function updateGlow(glow) {
  glow.position.x = newPosition.x;
  glow.position.y = newPosition.y;
  glow.position.z = newPosition.z;
}

let sparks = null;

function drawSparkAll(ball) {
  sparks = new THREE.Group();
  ball.add(sparks);

  let perAngle = 360 / sparkNum;
  for (let i = 0; i < sparkNum; i++) {
    let rad = (perAngle * i * Math.PI) / 180;
    var spark = getSpark();
    spark.rotation.x = 360 * Math.sin(rad);
    spark.rotation.z = rad;
    sparks.add(spark);
    sparkList.push(spark);
  }
}

function updateSparkAll() {
  sparks.position.x = newPosition.x;
  sparks.position.y = newPosition.y;
  sparks.position.z = newPosition.z;

  sparkList.forEach((spark) => {
    updateSpark(spark);
  });
}

function getSpark() {
  // テクスチャーを読み込みます。
  var loader = new THREE.TextureLoader();
  var map = loader.load("textures/Burst01.png");
  map.wrapS = map.wrapT = THREE.RepeatWrapping;

  var geometory = new THREE.PlaneGeometry(0.15, 2);
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
  mesh.position.y = Math.random() * 5;
  mesh.rotation.y = Math.random() * 2;

  // meshをそのまま返しても何故かうまく行かない
  var spark = new THREE.Object3D();
  spark.add(mesh);

  return spark;
}

const gSpeed = Math.random() * 0.2 + 0.2;

function updateSpark(spark) {
  var mesh = spark.children[0];

  mesh.position.y -= gSpeed;
  mesh.material.opacity -= 0.05;

  if (mesh.position.y < 0) {
    mesh.position.y = 6;
    mesh.material.opacity = 0.5;
  }
}

let flareMap = null;
let flareBottomRadius = 2;
let flareDiameter = null;

function getFlare(offset) {
  const speed = Math.random() * 0.05 + 0.01;
  const topRadius = 6;
  flareDiameter = topRadius - flareBottomRadius;

  // ジオメトリ
  const geometry = new THREE.CylinderGeometry(
    topRadius,
    flareBottomRadius,
    0,
    30,
    3,
    true
  );

  // カラーマップ
  let loader = new THREE.TextureLoader();
  flareMap = loader.load("./textures/aura3_type2.png");
  flareMap.wrapS = flareMap.wrapT = THREE.RepeatWrapping;
  flareMap.repeat.set(10, 10);

  // マテリアル
  const material = _createMaterial(offset);

  // メッシュ
  const mesh = new THREE.Mesh(geometry, material);

  const flare = new THREE.Object3D();
  flare.add(mesh);

  return flare;
}

/**
 * マテリアルを生成します。
 * @return THREE.ShaderMaterial
 */
function _createMaterial(offset) {
  let material = new THREE.ShaderMaterial({
    uniforms: {
      map: {
        //   type : 't',
        value: flareMap,
      },
      offset: {
        //   type : 'v2',
        value: offset,
      },
      opacity: {
        //   type : 'f',
        value: 0.15,
      },
      innerRadius: {
        //   type : 'f',
        value: flareBottomRadius,
      },
      diameter: {
        //   type : 'f',
        value: flareDiameter,
      },
    },
    vertexShader: `
        varying vec2 vUv;       // フラグメントシェーダーに渡すUV座標
        varying float radius;   // フラグメントシェーダーに渡す半径
        uniform vec2 offset;    // カラーマップのズレ位置

        void main()
        {
          // 本来の一からuvをずらす
          vUv = uv + offset;
          // 中心から頂点座標までの距離
          radius = length(position);
          // 3次元上頂点座標を画面上の二次元座標に変換(お決まり)
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
    fragmentShader: `
        uniform sampler2D map;      // テクスチャ
        uniform float opacity;      // 透明度
        uniform float diameter;     // ドーナツの太さ
        uniform float innerRadius;  // 内円の半径
        varying vec2 vUv;           // UV座標
        varying float radius;       // 中心ドットまでの距離
        const float PI = 3.1415926; // 円周率

        void main() {
          // UVの位置からテクスチャの色を取得
          vec4 tColor = texture2D(map, vUv);
          // 描画位置がドーナツの幅の何割の位置になるか
          float ratio = (radius - innerRadius) / diameter;
          float opacity = opacity * sin(PI * ratio);
          // ベースカラー
          vec4 baseColor = (tColor + vec4(0.0, 0.0, 0.3, 1.0));
          // 透明度を反映させる
          gl_FragColor = baseColor * vec4(1.0, 1.0, 1.0, opacity);
        }
      `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
  });
  return material;
}

/** ランダム係数 */
const randomRatio = Math.random() + 1;

/**
 * フレーム毎の更新
 */
function updateFlare(flare, index) {
  var offset = flareOffsetList[index];
  //   console.log(offset);
  offset.x += 0.004 * randomRatio;
  offset.y -= 0.015 * randomRatio;
}

/** フレアの数 */
const flareNum = 10;
/** フレアリスト */
const flareList = [];
const flareOffsetList = [];

/**
 * コンストラクター
 */
let flares = null;
function drawFlares(ball) {
  flares = new THREE.Group();
  ball.add(flares);

  let perAngle = 360 / flareNum;
  for (let i = 0; i < flareNum; i++) {
    let rad = (perAngle * i * Math.PI) / 180;
    let flareOffset = new THREE.Vector2();
    let flare = getFlare(flareOffset);
    flareOffsetList.push(flareOffset);
    flare.rotation.x = rad;
    flare.rotation.y = rad;
    flare.rotation.z = rad / 2;
    flares.add(flare);
    flareList.push(flare);
  }
}

/**
 * フレーム毎の更新です。
 */
function updateFlares() {
  flares.position.x = newPosition.x;
  flares.position.y = newPosition.y;
  flares.position.z = newPosition.z;

  flareList.forEach((flare, i) => {
    updateFlare(flare, i);
  });
}

function addInGrow(ball) {
  // ジオメトリ
  const geometry = new THREE.SphereGeometry(2.07, 20, 20);

  // マテリアル
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0x96ecff) },
      viewVector: { value: camera.position },
      // glowColor: { type: "c", value: new THREE.Color(0x96ecff) },
      // viewVector: { type: "v3", value: camera.position },
    },
    vertexShader: `
        uniform vec3 viewVector;    // カメラ位置
        varying float opacity;      // 透明度
        void main()
        {
          // 頂点法線ベクトル x
          vec3 nNomal = normalize(normal);
          vec3 nViewVec = normalize(viewVector);

          // 透明度
          opacity = dot(nNomal, nViewVec);
          // 反転
          opacity = 1.0 - opacity;

          // お決まり
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
    fragmentShader: `
        uniform vec3 glowColor;
        varying float opacity;
        void main()
        {
          gl_FragColor = vec4(glowColor, opacity);
        }
      `,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });

  // メッシュ
  const mesh = new THREE.Mesh(geometry, material);
  ball.add(mesh);

  return mesh;
}

function updateInGrow(inGrow) {
  inGrow.position.x = newPosition.x;
  inGrow.position.y = newPosition.y;
  inGrow.position.z = newPosition.z;
}
