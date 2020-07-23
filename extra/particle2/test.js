window.addEventListener("load", init);

function init() {
  console.log("test start.");

  //描画領域を変数に格納
  const width = window.innerWidth;
  const height = window.innerHeight;

  let rot = 0;

  //sceneを作成
  const scene = new THREE.Scene();

  //cameraを作成
  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
  camera.position.set(0, 0, 1000);

  starField();

  function starField() {
    const startPositionGeometry = new THREE.TorusKnotGeometry(
      100,
      50,
      128,
      32,
      1,
      2
    );
    const endPositionGeometry = new THREE.TorusKnotGeometry(
      100,
      50,
      128,
      32,
      1,
      8
    );

    const prefabWidth = 5;
    const prefabHeight = 10;
    const prefabCount = 2000;

    const prefab = new THREE.CylinderBufferGeometry(8, 8, 30, 50);
    // const prefab = new THREE.PlaneBufferGeometry(prefabWidth, prefabHeight);
    // const prefab = new THREE.TorusKnotBufferGeometry(4, 0.5);
    // const prefabCount = startPositionGeometry.vertices.length;
    const geometry = new BAS.InstancedPrefabBufferGeometry(prefab, prefabCount);

    // PlaneGeometry を prefab とする (他のジオメトリも可)
    // const prefab = new THREE.PlaneGeometry(prefabWidth, prefabHeight);

    // prefab を prefabCount 数の分だけ増やしたジオメトリを生成
    // const geometry = new THREE.BAS.InstancedPrefabBufferGeometry(
    //   prefab,
    //   prefabCount
    // );

    // attribute 変数初期化
    // .createAttribute([変数名], [ベクトル成分数])
    // 位置
    // const aPosition = geometry.createAttribute("aPosition", 3);
    // 位置 (終点)
    // const aEndPosition = geometry.createAttribute("aEndPosition", 3);
    // 回転
    const aAxisAngle = geometry.createAttribute("aAxisAngle", 4);

    const aStartPosition = geometry.createAttribute("aStartPosition", 3);
    const aEndPosition = geometry.createAttribute("aEndPosition", 3);
    const prefabData = [];

    const SIZE = 3000;
    // 各 prefab ごとに attribute 変数値を設定

    for (let i = 0; i < prefabCount; i++) {
      // 位置 (XYZ座標)
      // 値は任意
      //   geometry.setPrefabData(aPosition, i, [val, val, val]);
      //   geometry.setPrefabData(aEndPosition, i, [val, val, val]);
      // 回転 (軸、角度)
      // 値は任意
      //   geometry.setPrefabData(aAxisAngle, i, [1, 1, 1, 2.0]);
    }

    for (let i = 0; i < prefabCount; i++) {
      let start = new THREE.Vector3(
        SIZE * (Math.random() - 0.5),
        // SIZE * (Math.random() - 0.5),
        -1000,
        SIZE * (Math.random() - 0.5)
      );
      geometry.setPrefabData(
        aStartPosition,
        i,
        // startPositionGeometry.vertices[i].toArray(prefabData)
        start.toArray(prefabData)
      );

      let end = new THREE.Vector3(
        // SIZE * (Math.random() - 0.5),
        start.x + 50 * Math.random(),
        Math.abs(SIZE * (Math.random() - 0.5)),
        // SIZE * (Math.random() - 0.5)
        start.z
      );
      geometry.setPrefabData(
        aEndPosition,
        i,
        // endPositionGeometry.vertices[i].toArray(prefabData)
        end.toArray(prefabData)
      );

      //   geometry.setPrefabData(aAxisAngle, i, [1, 1, 1, 2.0]);
    }

    // THREE.THREE.BAS.用マテリアル生成
    const material = new BAS.BasicAnimationMaterial({
      // シェーダで使う uniform 変数を指定
      uniforms: {
        uTime: { value: 0.0 },
      },
      // 頂点シェーダで使う THREE.BAS.のビルトイン関数を指定
      vertexFunctions: [
        // easeCubicInOut
        // BAS.ShaderChunk["ease_cubic_in_out"],
        BAS.ShaderChunk["ease_sine_in"],
        // quatFromAxisAngle, rotateVector
        // BAS.ShaderChunk["quaternion_rotation"],
      ],
      // 頂点シェーダで使う変数を指定 (GLSL)
      vertexParameters: [
        "uniform float uTime;",
        "attribute vec3 aStartPosition;",
        "attribute vec3 aEndPosition;",
        // "attribute vec4 aAxisAngle;",
      ],
      // 頂点シェーダで使う値の初期化 (GLSL)
      vertexInit: [
        // quatFromAxisAngle: 軸と角度から回転を表すクォータニオン算出 (BAS.提供関数)
        // "vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w);",
        // 一般的な Easing 関数は BAS.で提供されている
        // "float tProgress = easeCubicInOut(uTime);",
        // "float tProgress = easeQuadInOut(uTime);",
        "float tProgress = easeSineIn(uTime);",
      ],
      // prefab の位置を計算する (GLSL)
      vertexPosition: [
        // transformed: prefab の位置 (three.js の ShaderChunk で定義されているもの)
        // 最初は原点の状態で、その値を変更することで移動させることができる
        // 回転
        // rotateVector: クォータニオンを基に回転後の transformed を算出
        // "transformed = rotateVector(tQuat, transformed);",
        // 位置
        "transformed += mix(aStartPosition, aEndPosition, tProgress);",
      ],
    });

    // 上記 geometry と material を基に three.js のメッシュを生成してシーンに追加
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // uniform 変数の値は JS で変化させる
    //   material.uniforms["uTime"].value = time;

    //レンダラーを作成
    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector("#three_canvas"),
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    //初回実行
    tick();

    //実行するための関数
    function tick() {
      // uniform 変数の値は JS で変化させる
      const sec = performance.now() / 1000;
      material.uniforms["uTime"].value = sec;

      // レンダリング;
      renderer.render(scene, camera);

      //自分自身を呼び続ける
      requestAnimationFrame(tick);
    }

    onResize();
    window.addEventListener("resize", onResize);

    function onResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }
}
