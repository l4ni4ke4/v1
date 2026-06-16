/* ============================================================
   Three.js hero scene — flowing particle wave ("data sea")
   with golden sparks, floating dust and mouse parallax.
   ============================================================ */
(function () {
  var canvas = document.getElementById('webgl');
  if (!canvas || !window.THREE) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 860;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070a12, 0.02);

  // soft round sprite so points render as glowing dots, not squares
  function makeDotTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.75, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  var dotTexture = makeDotTexture();

  var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120);
  camera.position.set(0, 5.2, 16);
  camera.lookAt(0, 0, 0);

  /* ----- wave grid ----- */
  var COLS = isMobile ? 90 : 150;
  var ROWS = isMobile ? 50 : 80;
  var SEP = 0.55;
  var COUNT = COLS * ROWS;

  var positions = new Float32Array(COUNT * 3);
  var colors = new Float32Array(COUNT * 3);
  var phase = new Float32Array(COUNT); // per-point flicker offset

  var cBase = new THREE.Color(0x3c4d78);   // cool slate blue
  var cMid = new THREE.Color(0x5a6fa3);    // lighter blue
  var cGold = new THREE.Color(0xd9b676);   // champagne spark
  var cGoldHi = new THREE.Color(0xf0dcab);

  var i, x, z, idx = 0;
  for (i = 0; i < COUNT; i++) {
    x = (i % COLS) - COLS / 2;
    z = Math.floor(i / COLS) - ROWS / 2;
    positions[idx] = x * SEP;
    positions[idx + 1] = 0;
    positions[idx + 2] = z * SEP;

    var r = Math.random();
    var c;
    if (r > 0.955) c = cGoldHi;
    else if (r > 0.88) c = cGold;
    else if (r > 0.5) c = cMid;
    else c = cBase;
    colors[idx] = c.r; colors[idx + 1] = c.g; colors[idx + 2] = c.b;
    phase[i] = Math.random() * Math.PI * 2;
    idx += 3;
  }

  var waveGeo = new THREE.BufferGeometry();
  waveGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  waveGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  var waveMat = new THREE.PointsMaterial({
    size: 0.13,
    map: dotTexture,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  var wave = new THREE.Points(waveGeo, waveMat);
  wave.position.y = -2.6;
  scene.add(wave);

  /* ----- floating gold dust ----- */
  var DUST = isMobile ? 60 : 130;
  var dustPos = new Float32Array(DUST * 3);
  var dustSpeed = new Float32Array(DUST);
  for (i = 0; i < DUST; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 44;
    dustPos[i * 3 + 1] = Math.random() * 14 - 4;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    dustSpeed[i] = 0.15 + Math.random() * 0.5;
  }
  var dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  var dustMat = new THREE.PointsMaterial({
    size: 0.18,
    map: dotTexture,
    color: 0xd9b676,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* ----- mouse parallax ----- */
  var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  if (!reduceMotion) {
    window.addEventListener('mousemove', function (e) {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  /* ----- resize ----- */
  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  /* ----- animation loop ----- */
  var clock = new THREE.Clock();
  var posAttr = waveGeo.getAttribute('position');
  var dustAttr = dustGeo.getAttribute('position');

  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden) return;

    var t = clock.getElapsedTime() * (reduceMotion ? 0 : 0.55);

    // displace wave grid
    var arr = posAttr.array;
    var n = 0;
    for (var p = 0; p < COUNT; p++) {
      var px = arr[n];
      var pz = arr[n + 2];
      arr[n + 1] =
        Math.sin(px * 0.32 + t) * 0.42 +
        Math.cos(pz * 0.28 + t * 0.8) * 0.42 +
        Math.sin((px + pz) * 0.14 + t * 0.6) * 0.3 +
        Math.sin(t * 1.4 + phase[p]) * 0.05;
      n += 3;
    }
    posAttr.needsUpdate = true;

    // drift dust upward, wrap around
    var d = dustAttr.array;
    for (var k = 0; k < DUST; k++) {
      d[k * 3 + 1] += dustSpeed[k] * 0.008;
      if (d[k * 3 + 1] > 11) d[k * 3 + 1] = -4;
    }
    dustAttr.needsUpdate = true;

    // camera parallax + slow drift
    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;
    camera.position.x = mouseX * 1.6 + Math.sin(t * 0.18) * 0.4;
    camera.position.y = 5.2 - mouseY * 0.9;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  tick();
})();
