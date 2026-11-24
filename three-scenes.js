// ===== ESCENAS 3D PBR + SHADERS GLSL + TSPARTICLES (100% OFFLINE) =====
(function () {
  if (typeof THREE === 'undefined') return;

  // 1. CAMPO DE PARTÍCULAS 3D GLOBAL
  const bgContainer = document.getElementById('bg3d');
  if (bgContainer) {
    const sceneBg = new THREE.Scene();
    const cameraBg = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraBg.position.z = 50;

    const rendererBg = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    rendererBg.setSize(window.innerWidth, window.innerHeight);
    rendererBg.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    bgContainer.appendChild(rendererBg.domElement);

    const count = 240;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c1 = new THREE.Color('#2DD4BF');
    const c2 = new THREE.Color('#38BDF8');

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 70;
      const col = Math.random() > 0.5 ? c1 : c2;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geoBg = new THREE.BufferGeometry();
    geoBg.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geoBg.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointsBg = new THREE.Points(geoBg, new THREE.PointsMaterial({
      size: 0.78,
      vertexColors: true,
      transparent: true,
      opacity: 0.65
    }));
    sceneBg.add(pointsBg);

    let mouseX = 0, mouseY = 0, warpSpeed = 0;
    window.__triggerWarp3D = () => { warpSpeed = 0.65; };
    window.__getPixelOrigin2D = () => {
      const idx = Math.floor(Math.random() * count);
      const v = new THREE.Vector3(positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]);
      v.applyEuler(pointsBg.rotation);
      v.project(cameraBg);
      const x = Math.max(15, Math.min(85, (v.x * 0.5 + 0.5) * 100));
      const y = Math.max(18, Math.min(82, (-v.y * 0.5 + 0.5) * 100));
      return { x, y };
    };
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 6;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 4;
    });
    window.addEventListener('resize', () => {
      cameraBg.aspect = window.innerWidth / window.innerHeight;
      cameraBg.updateProjectionMatrix();
      rendererBg.setSize(window.innerWidth, window.innerHeight);
    });

    function animateBg3D() {
      requestAnimationFrame(animateBg3D);
      pointsBg.rotation.y += 0.0008 + warpSpeed * 0.015;
      pointsBg.rotation.x += 0.0003;
      if (warpSpeed > 0.001) {
        cameraBg.position.z = 50 - warpSpeed * 14;
        warpSpeed *= 0.92;
      } else {
        cameraBg.position.z += (50 - cameraBg.position.z) * 0.08;
      }
      cameraBg.position.x += (mouseX - cameraBg.position.x) * 0.03;
      cameraBg.position.y += (-mouseY - cameraBg.position.y) * 0.03;
      cameraBg.lookAt(0, 0, 0);
      rendererBg.render(sceneBg, cameraBg);
    }
    animateBg3D();
  }

  // 2. MOLÉCULA 3D DETALLADA EN PORTADA (SLIDE 1)
  const molEl = document.getElementById('molecule3D');
  if (molEl) {
    const w = molEl.clientWidth || 320;
    const h = molEl.clientHeight || 220;
    const sceneMol = new THREE.Scene();
    const camMol = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camMol.position.z = 9.8;

    const renMol = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renMol.setSize(w, h);
    renMol.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    molEl.appendChild(renMol.domElement);

    sceneMol.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dirLight = new THREE.DirectionalLight(0x2dd4bf, 1.5);
    dirLight.position.set(5, 7, 7);
    const rimLight = new THREE.PointLight(0x38bdf8, 1.4, 25);
    rimLight.position.set(-5, -4, 5);
    sceneMol.add(dirLight, rimLight);

    const molGroup = new THREE.Group();
    sceneMol.add(molGroup);

    const atomMatC = new THREE.MeshPhongMaterial({ color: 0x38bdf8, shininess: 95, specular: 0xffffff });
    const atomMatO = new THREE.MeshPhongMaterial({ color: 0xf43f5e, shininess: 100, specular: 0xffcdd2, emissive: 0x3b0712 });
    const atomMatH = new THREE.MeshPhongMaterial({ color: 0xf8fafc, shininess: 110, specular: 0xffffff });
    const bondMat = new THREE.MeshPhongMaterial({ color: 0xcbd5e1, shininess: 60 });

    const atoms = [
      { pos: [-2.0, 0.0, 0.0], r: 0.56, mat: atomMatC },
      { pos: [-0.4, 0.5, 0.2], r: 0.56, mat: atomMatC },
      { pos: [-0.3, 1.95, 0.3], r: 0.5, mat: atomMatO },
      { pos: [1.1, -0.2, 0.0], r: 0.5, mat: atomMatO },
      { pos: [2.3, 0.7, -0.2], r: 0.5, mat: atomMatO },
      { pos: [3.2, 0.1, -0.4], r: 0.33, mat: atomMatH },
      { pos: [-2.7, 0.8, 0.6], r: 0.33, mat: atomMatH },
      { pos: [-2.7, -0.7, 0.5], r: 0.33, mat: atomMatH },
      { pos: [-2.3, -0.1, -1.0], r: 0.33, mat: atomMatH }
    ];

    function addBond(p1, p2, offset = 0) {
      const dist = p1.distanceTo(p2);
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, dist, 14), bondMat);
      cyl.position.copy(p1).add(p2).multiplyScalar(0.5);
      cyl.position.x += offset;
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
      molGroup.add(cyl);
    }

    atoms.forEach(a => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(a.r, 28, 28), a.mat);
      m.position.set(...a.pos);
      molGroup.add(m);
    });

    [[0, 1], [1, 3], [3, 4], [4, 5], [0, 6], [0, 7], [0, 8]].forEach(([i, j]) => {
      addBond(new THREE.Vector3(...atoms[i].pos), new THREE.Vector3(...atoms[j].pos));
    });
    addBond(new THREE.Vector3(...atoms[1].pos), new THREE.Vector3(...atoms[2].pos), -0.12);
    addBond(new THREE.Vector3(...atoms[1].pos), new THREE.Vector3(...atoms[2].pos), 0.12);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.85, 0.035, 12, 80), new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.4 }));
    ring1.rotation.x = 1.1;
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.025, 12, 80), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 }));
    ring2.rotation.y = 0.8;
    molGroup.add(ring1, ring2);

    let isDragging = false, prevX = 0, prevY = 0;
    molEl.addEventListener('pointerdown', (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
    window.addEventListener('pointerup', () => { isDragging = false; });
    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      molGroup.rotation.y += (e.clientX - prevX) * 0.01;
      molGroup.rotation.x += (e.clientY - prevY) * 0.01;
      prevX = e.clientX; prevY = e.clientY;
    });

    let lastMolW = 0, lastMolH = 0;
    function renderMol() {
      requestAnimationFrame(renderMol);
      if (window.__activeSlideIndex !== 0) return;
      if (!isDragging) {
        molGroup.rotation.y += 0.008;
        molGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.18;
      }
      ring2.rotation.z += 0.006;
      const nw = molEl.clientWidth, nh = molEl.clientHeight;
      if (nw > 4 && nh > 4 && (nw !== lastMolW || nh !== lastMolH)) {
        lastMolW = nw; lastMolH = nh;
        camMol.aspect = nw / nh;
        camMol.updateProjectionMatrix();
        renMol.setSize(nw, nh);
      }
      renMol.render(sceneMol, camMol);
    }
    renderMol();
  }

  // 3. SIMULADOR 3D DE PATÓGENO CARICATURA VS PERACETIC (SLIDE 3)
  const bioEl = document.getElementById('biocide3D');
  if (bioEl) {
    const w = bioEl.clientWidth || 720;
    const h = bioEl.clientHeight || 220;
    const sceneBio = new THREE.Scene();
    const camBio = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camBio.position.z = 11;

    const renBio = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renBio.setSize(w, h);
    renBio.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    bioEl.appendChild(renBio.domElement);

    sceneBio.add(new THREE.AmbientLight(0xffffff, 0.8));
    const pLight = new THREE.PointLight(0x2dd4bf, 2, 30);
    pLight.position.set(4, 5, 6);
    sceneBio.add(pLight);

    const pathogenGroup = new THREE.Group();
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xef4444, shininess: 70, specular: 0xffaaaa });
    const spikeMat = new THREE.MeshPhongMaterial({ color: 0xfca5a5, shininess: 90 });
    const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 24), bodyMat);
    pathogenGroup.add(coreMesh);

    const spikeDirs = [
      [1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,-1],
      [0.7,0.7,0], [-0.7,0.7,0], [0.7,-0.7,0], [-0.7,-0.7,0],
      [0.6,0.6,0.5], [-0.6,0.6,0.5], [0.6,-0.6,0.5], [-0.6,-0.6,0.5]
    ];
    spikeDirs.forEach(([dx, dy, dz]) => {
      const dir = new THREE.Vector3(dx, dy, dz).normalize();
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 12), spikeMat);
      cone.position.copy(dir).multiplyScalar(1.55);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), bodyMat);
      tip.position.copy(dir).multiplyScalar(1.9);
      pathogenGroup.add(cone, tip);
    });

    const eyeW = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeB = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    [-0.38, 0.38].forEach(ex => {
      const ew = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), eyeW);
      ew.position.set(ex, 0.25, 1.22);
      const eb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), eyeB);
      eb.position.set(ex, 0.25, 1.42);
      pathogenGroup.add(ew, eb);
    });
    sceneBio.add(pathogenGroup);

    const swarm = [];
    const swarmGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const swarmMat = new THREE.MeshPhongMaterial({ color: 0x2dd4bf, emissive: 0x0d9488, shininess: 100 });
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(swarmGeo, swarmMat);
      const angle = (i / 24) * Math.PI * 2;
      m.userData = { angle, radius: 4.8 + Math.random() * 1.4, speed: 0.02 + Math.random() * 0.02 };
      m.position.set(Math.cos(angle) * 5, 0, Math.sin(angle) * 5);
      sceneBio.add(m);
      swarm.push(m);
    }

    const ecoGroup = new THREE.Group();
    const o2 = new THREE.Group();
    const oMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, shininess: 100 });
    const oA = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 20), oMat); oA.position.x = -0.35;
    const oB = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 20), oMat); oB.position.x = 0.35;
    o2.add(oA, oB); o2.position.x = -3.0;
    const h2o = new THREE.Group();
    const hMat = new THREE.MeshPhongMaterial({ color: 0xf8fafc, shininess: 100 });
    const hO = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 20), new THREE.MeshPhongMaterial({ color: 0x2dd4bf, shininess: 100 }));
    const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), hMat); h1.position.set(-0.55, 0.4, 0);
    const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), hMat); h2.position.set(0.55, 0.4, 0);
    h2o.add(hO, h1, h2);
    const ac = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 24), new THREE.MeshPhongMaterial({ color: 0x4ade80, shininess: 90 }));
    ac.position.x = 3.0;
    ecoGroup.add(o2, h2o, ac);
    ecoGroup.visible = false;
    sceneBio.add(ecoGroup);

    let simPhase = 0;
    window.__setBiocideSimPhase = (phase) => {
      simPhase = phase;
      if (phase === 0) {
        pathogenGroup.visible = true;
        pathogenGroup.scale.set(1, 1, 1);
        ecoGroup.visible = false;
      } else if (phase === 2 && typeof gsap !== 'undefined') {
        gsap.to(pathogenGroup.scale, { x: 0.04, y: 0.04, z: 0.04, duration: 0.75, ease: 'back.in(2)' });
      } else if (phase === 3) {
        pathogenGroup.visible = false;
        ecoGroup.visible = true;
        ecoGroup.scale.set(0.1, 0.1, 0.1);
        if (typeof gsap !== 'undefined') gsap.to(ecoGroup.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'elastic.out(1, 0.6)' });
      }
    };

    let lastBioW = 0, lastBioH = 0;
    function renderBio() {
      requestAnimationFrame(renderBio);
      if (window.__activeSlideIndex !== 2) return;
      pathogenGroup.rotation.y = Math.sin(Date.now() * 0.0015) * 0.45;
      pathogenGroup.rotation.z = Math.sin(Date.now() * 0.001) * 0.12;
      swarm.forEach((m, idx) => {
        m.userData.angle += m.userData.speed * (simPhase === 1 ? 3.2 : 1);
        const targetR = simPhase === 1 ? 1.55 : simPhase >= 2 ? 6.5 : m.userData.radius;
        const currR = Math.hypot(m.position.x, m.position.z);
        const nextR = currR + (targetR - currR) * 0.06;
        m.position.x = Math.cos(m.userData.angle) * nextR;
        m.position.z = Math.sin(m.userData.angle) * nextR;
        m.position.y = Math.sin(Date.now() * 0.002 + idx) * 1.2;
      });
      if (ecoGroup.visible) {
        ecoGroup.children.forEach((sp, i) => {
          sp.position.y = Math.sin(Date.now() * 0.003 + i * 1.5) * 0.4;
          sp.rotation.y += 0.015;
        });
      }
      const nw = bioEl.clientWidth, nh = bioEl.clientHeight;
      if (nw > 4 && nh > 4 && (nw !== lastBioW || nh !== lastBioH)) {
        lastBioW = nw; lastBioH = nh;
        camBio.aspect = nw / nh;
        camBio.updateProjectionMatrix();
        renBio.setSize(nw, nh);
      }
      renBio.render(sceneBio, camBio);
    }
    renderBio();
  }

  // 4. TANQUE MEDIDOR GRADUADO 3D EN CALCULADORA (SLIDE 5)
  const beakerEl = document.getElementById('beaker3D');
  if (beakerEl) {
    const w = beakerEl.clientWidth || 110;
    const h = beakerEl.clientHeight || 128;
    const sceneBk = new THREE.Scene();
    const camBk = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
    camBk.position.set(0, 1.15, 6.4);
    camBk.lookAt(0, 0, 0);

    const renBk = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renBk.setSize(w, h);
    renBk.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    beakerEl.appendChild(renBk.domElement);

    sceneBk.add(new THREE.AmbientLight(0xffffff, 0.85));
    const bkLight = new THREE.DirectionalLight(0x2dd4bf, 1.5);
    bkLight.position.set(3, 5, 4);
    sceneBk.add(bkLight);

    const bkGroup = new THREE.Group();
    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.32, 0.2, 28), new THREE.MeshPhongMaterial({ color: 0x334155, shininess: 80 }));
    baseMesh.position.y = -1.45;
    const glassMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.8, 28, 1, true), new THREE.MeshPhongMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22, shininess: 120, side: THREE.DoubleSide }));
    const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.045, 12, 32), new THREE.MeshPhongMaterial({ color: 0x7dd3fc, shininess: 100 }));
    rimMesh.rotation.x = Math.PI / 2; rimMesh.position.y = 1.4;

    [-0.7, 0.0, 0.7].forEach(ry => {
      const tick = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.018, 8, 32), new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.6 }));
      tick.rotation.x = Math.PI / 2; tick.position.y = ry;
      bkGroup.add(tick);
    });

    const liqGeo = new THREE.CylinderGeometry(1.06, 1.06, 2.6, 28);
    liqGeo.translate(0, 1.3, 0);
    const liqMesh = new THREE.Mesh(liqGeo, new THREE.MeshPhongMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.84, shininess: 95, emissive: 0x0d9488 }));
    liqMesh.position.y = -1.35;
    liqMesh.scale.y = 0.25;

    const meniscus = new THREE.Mesh(new THREE.TorusGeometry(1.03, 0.03, 10, 28), new THREE.MeshBasicMaterial({ color: 0x99f6e4 }));
    meniscus.rotation.x = Math.PI / 2;
    meniscus.position.y = -1.35 + 0.25 * 2.6;

    bkGroup.add(baseMesh, glassMesh, rimMesh, liqMesh, meniscus);

    const bubbles3D = [];
    const bubGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const bubMat = new THREE.MeshBasicMaterial({ color: 0xccf8f1, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 14; i++) {
      const b = new THREE.Mesh(bubGeo, bubMat);
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * 0.75;
      b.position.set(Math.cos(ang) * rad, -1.3 + Math.random() * 0.8, Math.sin(ang) * rad);
      b.userData = { speed: 0.012 + Math.random() * 0.015 };
      bkGroup.add(b);
      bubbles3D.push(b);
    }
    sceneBk.add(bkGroup);

    window.__setBeakerLevel3D = (ratio) => {
      const clamped = Math.max(0.08, Math.min(1, ratio));
      if (typeof gsap !== 'undefined') {
        gsap.to(liqMesh.scale, { y: clamped, duration: 0.45, ease: 'power2.out' });
        gsap.to(meniscus.position, { y: -1.35 + clamped * 2.6, duration: 0.45, ease: 'power2.out' });
      } else {
        liqMesh.scale.y = clamped;
        meniscus.position.y = -1.35 + clamped * 2.6;
      }
    };

    let lastBkW = 0, lastBkH = 0;
    function renderBk() {
      requestAnimationFrame(renderBk);
      if (window.__activeSlideIndex !== 4) return;
      bkGroup.rotation.y += 0.01;
      const topY = -1.35 + liqMesh.scale.y * 2.5;
      bubbles3D.forEach(b => {
        b.position.y += b.userData.speed;
        if (b.position.y > topY) b.position.y = -1.32;
      });
      const nw = beakerEl.clientWidth, nh = beakerEl.clientHeight;
      if (nw > 4 && nh > 4 && (nw !== lastBkW || nh !== lastBkH)) {
        lastBkW = nw; lastBkH = nh;
        camBk.aspect = nw / nh;
        camBk.updateProjectionMatrix();
        renBk.setSize(nw, nh);
      }
      renBk.render(sceneBk, camBk);
    }
    renderBk();
  }

  // 5. MOTOR DE PARTÍCULAS REALISTAS TSPARTICLES (GITHUB tsparticles/tsparticles)
  let tspReady = false;
  let tspContainer = null;

  async function ensureTsParticles() {
    if (tspReady) return true;
    if (typeof tsParticles === 'undefined') return false;
    try {
      if (typeof loadAll === 'function') await loadAll(tsParticles);
      tspReady = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  const particlePresets = {
    waterJet: {
      fullScreen: { enable: false },
      fpsLimit: 60,
      particles: {
        number: { value: 0 },
        color: { value: ['#38BDF8', '#99F6E4', '#E0F2FE'] },
        shape: { type: 'circle' },
        opacity: { value: { min: 0.45, max: 0.95 }, animation: { enable: true, speed: 1.4, destroy: 'min' } },
        size: { value: { min: 2, max: 5.5 } },
        move: { enable: true, speed: { min: 8, max: 14 }, direction: 'right', outModes: { default: 'destroy' }, gravity: { enable: true, acceleration: 6 } }
      },
      emitters: [
        { position: { x: 8, y: 42 }, rate: { delay: 0.035, quantity: 3 }, life: { duration: 0, count: 0 } },
        { position: { x: 8, y: 58 }, rate: { delay: 0.035, quantity: 3 }, life: { duration: 0, count: 0 } }
      ]
    },
    shower: {
      fullScreen: { enable: false },
      fpsLimit: 60,
      particles: {
        number: { value: 0 },
        color: { value: ['#38BDF8', '#7DD3FC', '#CCFBF1'] },
        shape: { type: 'circle' },
        opacity: { value: { min: 0.4, max: 0.9 }, animation: { enable: true, speed: 1, destroy: 'min' } },
        size: { value: { min: 2, max: 5 } },
        move: { enable: true, speed: { min: 9, max: 16 }, direction: 'bottom', outModes: { default: 'destroy' }, gravity: { enable: true, acceleration: 9 } }
      },
      emitters: { position: { x: 50, y: 12 }, size: { width: 38, height: 4 }, rate: { delay: 0.025, quantity: 4 } }
    },
    freshAir: {
      fullScreen: { enable: false },
      fpsLimit: 60,
      particles: {
        number: { value: 26 },
        color: { value: ['#2DD4BF', '#38BDF8', '#A7F3D0'] },
        shape: { type: 'circle' },
        opacity: { value: { min: 0.25, max: 0.78 } },
        size: { value: { min: 3, max: 8 } },
        move: { enable: true, speed: { min: 3.5, max: 6.5 }, direction: 'right', outModes: { default: 'out' }, straight: false }
      }
    },
    toxicGas: {
      fullScreen: { enable: false },
      fpsLimit: 60,
      particles: {
        number: { value: 28 },
        color: { value: ['#EF4444', '#84CC16', '#FACC15'] },
        shape: { type: 'circle' },
        opacity: { value: { min: 0.35, max: 0.82 } },
        size: { value: { min: 5, max: 14 } },
        move: { enable: true, speed: { min: 2.2, max: 4.8 }, direction: 'top', outModes: { default: 'out' } }
      }
    },
    vermiculite: {
      fullScreen: { enable: false },
      fpsLimit: 60,
      particles: {
        number: { value: 0 },
        color: { value: ['#E2E8F0', '#FDE68A', '#94A3B8'] },
        shape: { type: 'square' },
        opacity: { value: { min: 0.55, max: 0.95 } },
        size: { value: { min: 3, max: 6.5 } },
        move: { enable: true, speed: { min: 5, max: 10 }, direction: 'bottom', outModes: { default: 'destroy' }, gravity: { enable: true, acceleration: 8 } }
      },
      emitters: { position: { x: 52, y: 10 }, size: { width: 42, height: 4 }, rate: { delay: 0.04, quantity: 3 } }
    },
    frost: {
      fullScreen: { enable: false },
      fpsLimit: 60,
      particles: {
        number: { value: 22 },
        color: { value: ['#BAE6FD', '#E0F2FE', '#2DD4BF'] },
        shape: { type: 'circle' },
        opacity: { value: { min: 0.3, max: 0.8 } },
        size: { value: { min: 2.5, max: 6 } },
        move: { enable: true, speed: 1.8, direction: 'bottom', outModes: { default: 'out' } }
      }
    },
    sporesClear: {
      fullScreen: { enable: false },
      fpsLimit: 60,
      particles: {
        number: { value: 20 },
        color: { value: ['#2DD4BF', '#4ADE80', '#38BDF8'] },
        shape: { type: 'circle' },
        opacity: { value: { min: 0.35, max: 0.85 } },
        size: { value: { min: 2.5, max: 5.5 } },
        move: { enable: true, speed: 2.5, outModes: { default: 'out' } }
      }
    }
  };

  window.__playStageParticles = async (presetName) => {
    const el = document.getElementById('stageParticles');
    if (!el) return;
    if (tspContainer) {
      try { tspContainer.destroy(); } catch (e) {}
      tspContainer = null;
    }
    el.innerHTML = '';
    if (!presetName || !particlePresets[presetName]) return;
    const ok = await ensureTsParticles();
    if (!ok) return;
    try {
      tspContainer = await tsParticles.load({ id: 'stageParticles', options: particlePresets[presetName] });
    } catch (e) {}
  };

  // 6. ESCENAS 3D PBR REALISTAS DE EMERGENCIA (SLIDE 9) + GLSL AGUA / VERMICULITA
  const emEl = document.getElementById('em3D');
  if (emEl) {
    const w = emEl.clientWidth || 340;
    const h = emEl.clientHeight || 220;
    const sceneEm = new THREE.Scene();
    const camEm = new THREE.PerspectiveCamera(42, w / h, 0.1, 60);
    camEm.position.set(0, 0.35, 7.6);

    const renEm = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renEm.setSize(w, h);
    renEm.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    emEl.appendChild(renEm.domElement);

    sceneEm.add(new THREE.AmbientLight(0xffffff, 0.75));
    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    keyLight.position.set(4, 6, 7);
    const fillLight = new THREE.PointLight(0x2dd4bf, 1.4, 24);
    fillLight.position.set(-4, -2, 5);
    sceneEm.add(keyLight, fillLight);

    // Shader personalizado para superficie líquida realista con ondas
    const waveUniforms = {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color('#0284C7') },
      uColorB: { value: new THREE.Color('#38BDF8') }
    };
    const liquidShaderMat = new THREE.ShaderMaterial({
      uniforms: waveUniforms,
      transparent: true,
      side: THREE.DoubleSide,
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z += sin(p.x * 5.0 + uTime * 3.5) * 0.045 + cos(p.y * 5.0 + uTime * 2.8) * 0.045;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying vec2 vUv;
        void main() {
          float ripple = sin(length(vUv - 0.5) * 26.0 - uTime * 4.5) * 0.5 + 0.5;
          vec3 col = mix(uColorA, uColorB, ripple);
          gl_FragColor = vec4(col, 0.85);
        }
      `
    });

    const emGroups = {};
    const waterPbr = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8, emissive: 0x0369a1, emissiveIntensity: 0.35,
      transparent: true, opacity: 0.88, roughness: 0.08, clearcoat: 1.0, clearcoatRoughness: 0.06
    });

    // Textura radial procedural para el iris anatómico del ojo
    function makeIrisTexture() {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(64, 64, 14, 64, 64, 62);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.28, '#020617');
      grad.addColorStop(0.32, '#0284C7');
      grad.addColorStop(0.75, '#38BDF8');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = 'rgba(224,242,254,0.35)';
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(64 + Math.cos(a) * 20, 64 + Math.sin(a) * 20);
        ctx.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58);
        ctx.stroke();
      }
      return new THREE.CanvasTexture(c);
    }

    // 1) OJOS: Ojo anatómico con iris azul/cian visible + córnea brillante + chorro salino
    const gOjos = new THREE.Group();
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(1.12, 32, 32), new THREE.MeshPhongMaterial({ color: 0xf8fafc, shininess: 100 }));
    sclera.scale.z = 0.88;
    const irisDisk = new THREE.Mesh(new THREE.CircleGeometry(0.56, 32), new THREE.MeshBasicMaterial({ map: makeIrisTexture() }));
    irisDisk.position.z = 1.02;
    const corneaDome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 24, 24), new THREE.MeshPhongMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.25, shininess: 140, specular: 0xffffff }));
    corneaDome.position.z = 0.74;
    const washRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.04, 12, 48), waterPbr);
    const washRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.03, 12, 48), waterPbr);
    gOjos.add(sclera, irisDisk, corneaDome, washRing1, washRing2);
    const eyeJets = [];
    for (let i = 0; i < 18; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), waterPbr);
      s.position.set(-2.8 + Math.random() * 5.6, (Math.random() - 0.5) * 1.1, 1.35 + Math.random() * 0.25);
      s.userData = { speed: 0.08 + Math.random() * 0.05 };
      gOjos.add(s);
      eyeJets.push(s);
    }
    emGroups.ojos = gOjos;

    // 2) PIEL: Regadera industrial de seguridad + palanca + cascada de agua
    const gPiel = new THREE.Group();
    const steelMat = new THREE.MeshPhongMaterial({ color: 0xcbd5e1, shininess: 120, specular: 0xffffff });
    const greenSafetyMat = new THREE.MeshPhongMaterial({ color: 0x10b981, shininess: 80 });
    const topPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.1, 16), steelMat);
    topPipe.position.set(0, 2.1, 0);
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.65, 28), greenSafetyMat);
    nozzle.position.set(0, 1.5, 0);
    const pullRod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.25, 10), steelMat);
    pullRod.position.set(1.2, 1.0, 0);
    const pullHandle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 10, 3), new THREE.MeshPhongMaterial({ color: 0xfacc15 }));
    pullHandle.position.set(1.2, 0.25, 0);
    const waterPool = new THREE.Mesh(new THREE.CircleGeometry(1.65, 32), liquidShaderMat);
    waterPool.rotation.x = -Math.PI / 2;
    waterPool.position.y = -1.45;
    gPiel.add(topPipe, nozzle, pullRod, pullHandle, waterPool);
    const showerDrops = [];
    for (let i = 0; i < 28; i++) {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.055, 0.28, 8), waterPbr);
      d.position.set((Math.random() - 0.5) * 1.65, -1.3 + Math.random() * 2.7, (Math.random() - 0.5) * 1.15);
      d.userData = { speed: 0.08 + Math.random() * 0.05 };
      gPiel.add(d);
      showerDrops.push(d);
    }
    emGroups.piel = gPiel;

    // 3) INHALACIÓN: Árbol bronquial anatómico (TubeGeometry) + pulmones respirando
    const gInh = new THREE.Group();
    const tracheaMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, shininess: 90, transparent: true, opacity: 0.85 });
    const curveL = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.45, 0), new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(-0.75, -0.05, 0)]);
    const curveR = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.45, 0), new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0.75, -0.05, 0)]);
    const branchL = new THREE.Mesh(new THREE.TubeGeometry(curveL, 16, 0.12, 12, false), tracheaMat);
    const branchR = new THREE.Mesh(new THREE.TubeGeometry(curveR, 16, 0.12, 12, false), tracheaMat);
    const lungMat = new THREE.MeshPhongMaterial({ color: 0xf472b6, emissive: 0x831843, emissiveIntensity: 0.35, transparent: true, opacity: 0.86, shininess: 85 });
    const lungL = new THREE.Mesh(new THREE.SphereGeometry(0.82, 24, 24), lungMat);
    lungL.scale.set(0.72, 1.32, 0.65); lungL.position.set(-0.92, -0.25, 0);
    const lungR = new THREE.Mesh(new THREE.SphereGeometry(0.82, 24, 24), lungMat);
    lungR.scale.set(0.72, 1.32, 0.65); lungR.position.set(0.92, -0.25, 0);
    gInh.add(branchL, branchR, lungL, lungR);
    emGroups.inhalacion = gInh;

    // 4) INGESTIÓN: Vaso moldeado LatheGeometry con agua ondulada + Símbolo NO Vomitar 3D
    const gIng = new THREE.Group();
    const pts = [new THREE.Vector2(0, -0.9), new THREE.Vector2(0.58, -0.9), new THREE.Vector2(0.82, 0.9), new THREE.Vector2(0.76, 0.92), new THREE.Vector2(0.53, -0.82), new THREE.Vector2(0, -0.82)];
    const cupMesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), new THREE.MeshPhongMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.38, shininess: 140, side: THREE.DoubleSide }));
    cupMesh.position.x = -1.15;
    const cupLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.52, 1.15, 24), waterPbr);
    cupLiquid.position.set(-1.15, -0.22, 0);
    const noMat = new THREE.MeshPhongMaterial({ color: 0xef4444, emissive: 0x991b1b, shininess: 100 });
    const noRing = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.14, 14, 36), noMat);
    noRing.position.x = 1.15;
    const noBar = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.18, 0.18), noMat);
    noBar.position.x = 1.15; noBar.rotation.z = Math.PI / 4;
    gIng.add(cupMesh, cupLiquid, noRing, noBar);
    emGroups.ingestion = gIng;

    // 5) DERRAME: Charco Shader + Bidón 20L volcado + Rejilla de drenaje bloqueada + Granulados cayendo
    const gDer = new THREE.Group();
    const spillPool = new THREE.Mesh(new THREE.CircleGeometry(1.85, 36), liquidShaderMat);
    spillPool.rotation.x = -Math.PI / 2; spillPool.position.y = -1.25;
    const drumBody = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 1.15, 22), new THREE.MeshPhongMaterial({ color: 0x1d4ed8, shininess: 90 }));
    drumBody.rotation.z = 1.28; drumBody.position.set(-1.55, -0.82, -0.25);
    const drainNo = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.06, 12, 48), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    drainNo.rotation.x = Math.PI / 2; drainNo.position.y = -1.22;
    gDer.add(spillPool, drumBody, drainNo);
    const granules = [];
    const granMat = new THREE.MeshPhongMaterial({ color: 0xfef3c7, shininess: 50 });
    for (let i = 0; i < 24; i++) {
      const g = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), granMat);
      g.position.set((Math.random() - 0.5) * 2.2, -1.0 + Math.random() * 2.5, (Math.random() - 0.5) * 1.5);
      g.userData = { speed: 0.045 + Math.random() * 0.03 };
      gDer.add(g);
      granules.push(g);
    }
    emGroups.derrame = gDer;

    Object.values(emGroups).forEach(g => { g.visible = false; sceneEm.add(g); });
    let currentEm = 'ojos';
    emGroups.ojos.visible = true;

    window.__setEmergency3D = (key) => {
      currentEm = key;
      Object.entries(emGroups).forEach(([k, g]) => { g.visible = (k === key); });
    };

    function renderEm() {
      requestAnimationFrame(renderEm);
      if (window.__activeSlideIndex !== 8) return;
      waveUniforms.uTime.value = Date.now() * 0.001;

      if (currentEm === 'ojos') {
        gOjos.rotation.y = Math.sin(Date.now() * 0.002) * 0.22;
        washRing1.rotation.z += 0.025;
        washRing2.rotation.z -= 0.018;
        eyeJets.forEach(s => { s.position.x += s.userData.speed; if (s.position.x > 2.8) s.position.x = -2.8; });
      } else if (currentEm === 'piel') {
        gPiel.rotation.y += 0.006;
        showerDrops.forEach(d => { d.position.y -= d.userData.speed; if (d.position.y < -1.35) d.position.y = 1.45; });
      } else if (currentEm === 'inhalacion') {
        const breath = 1 + Math.sin(Date.now() * 0.0032) * 0.11;
        lungL.scale.set(0.72 * breath, 1.32 * breath, 0.65 * breath);
        lungR.scale.set(0.72 * breath, 1.32 * breath, 0.65 * breath);
        gInh.rotation.y = Math.sin(Date.now() * 0.0014) * 0.28;
      } else if (currentEm === 'ingestion') {
        gIng.rotation.y = Math.sin(Date.now() * 0.002) * 0.25;
        noRing.rotation.z += 0.02;
      } else if (currentEm === 'derrame') {
        gDer.rotation.y += 0.006;
        granules.forEach(g => { g.position.y -= g.userData.speed; g.rotation.x += 0.05; if (g.position.y < -1.15) g.position.y = 1.5; });
      }

      const nw = emEl.clientWidth, nh = emEl.clientHeight;
      if (nw > 4 && nh > 4 && (nw !== renEm._lastW || nh !== renEm._lastH)) {
        renEm._lastW = nw; renEm._lastH = nh;
        camEm.aspect = nw / nh;
        camEm.updateProjectionMatrix();
        renEm.setSize(nw, nh);
      }
      renEm.render(sceneEm, camEm);
    }
    renderEm();
  }
})();
