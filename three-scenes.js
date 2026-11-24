// ===== ESCENAS 3D ESTILIZADAS Y DETALLADAS CON THREE.JS (100% OFFLINE) =====
(function () {
  if (typeof THREE === 'undefined') return;

  function makeTeardrop(mat) {
    const g = new THREE.Group();
    const bot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), mat);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.18, 10), mat);
    top.position.y = 0.11;
    g.add(bot, top);
    return g;
  }

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
    // Doble enlace C=O
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

    function renderMol() {
      requestAnimationFrame(renderMol);
      if (window.__activeSlideIndex !== 0) return;
      if (!isDragging) {
        molGroup.rotation.y += 0.008;
        molGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.18;
      }
      ring2.rotation.z += 0.006;
      const nw = molEl.clientWidth, nh = molEl.clientHeight;
      if (nw && nh && renMol.domElement.width !== nw) {
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

    // Patógeno 3D estilizado con picos y ojitos
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

    // Ojitos caricatura del patógeno
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

    // Enjambre de Peracetic
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

    // Moléculas ecológicas finales: O2, H2O, Ácido Acético
    const ecoGroup = new THREE.Group();
    // O2
    const o2 = new THREE.Group();
    const oMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, shininess: 100 });
    const oA = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 20), oMat); oA.position.x = -0.35;
    const oB = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 20), oMat); oB.position.x = 0.35;
    o2.add(oA, oB); o2.position.x = -3.0;
    // H2O
    const h2o = new THREE.Group();
    const hMat = new THREE.MeshPhongMaterial({ color: 0xf8fafc, shininess: 100 });
    const hO = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 20), new THREE.MeshPhongMaterial({ color: 0x2dd4bf, shininess: 100 }));
    const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), hMat); h1.position.set(-0.55, 0.4, 0);
    const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), hMat); h2.position.set(0.55, 0.4, 0);
    h2o.add(hO, h1, h2);
    // Ácido acético
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
      if (nw && nh && renBio.domElement.width !== nw) {
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

    // Anillos de graduación
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
      if (nw && nh && renBk.domElement.width !== nw) {
        camBk.aspect = nw / nh;
        camBk.updateProjectionMatrix();
        renBk.setSize(nw, nh);
      }
      renBk.render(sceneBk, camBk);
    }
    renderBk();
  }

  // 5. VISUALIZADOR 3D DETALLADO DE EMERGENCIAS (SLIDE 9)
  const emEl = document.getElementById('em3D');
  if (emEl) {
    const w = emEl.clientWidth || 300;
    const h = emEl.clientHeight || 230;
    const sceneEm = new THREE.Scene();
    const camEm = new THREE.PerspectiveCamera(45, w / h, 0.1, 50);
    camEm.position.set(0, 0.5, 7.2);

    const renEm = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renEm.setSize(w, h);
    renEm.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    emEl.appendChild(renEm.domElement);

    sceneEm.add(new THREE.AmbientLight(0xffffff, 0.85));
    const emLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    emLight.position.set(3, 5, 5);
    sceneEm.add(emLight);

    const emGroups = {};
    const waterMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, emissive: 0x0284c7, transparent: true, opacity: 0.9, shininess: 110 });

    // 1) OJOS: Ojo 3D estilizado + gotas lágrima
    const gOjos = new THREE.Group();
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.95, 24, 24), new THREE.MeshPhongMaterial({ color: 0xf8fafc, shininess: 90 }));
    const eyeIris = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 20), new THREE.MeshPhongMaterial({ color: 0x0ea5e9, shininess: 100 }));
    eyeIris.position.z = 0.68;
    const eyePupil = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    eyePupil.position.z = 0.96;
    gOjos.add(eyeWhite, eyeIris, eyePupil);
    const eyeDrops = [];
    for (let i = 0; i < 14; i++) {
      const d = makeTeardrop(waterMat);
      d.rotation.z = -Math.PI / 2;
      d.position.set(-2.5 + Math.random() * 5, (Math.random() - 0.5) * 1.4, 1.25);
      d.userData = { speed: 0.06 + Math.random() * 0.04 };
      gOjos.add(d);
      eyeDrops.push(d);
    }
    emGroups.ojos = gOjos;

    // 2) PIEL: Regadera de seguridad 3D con tubo + gotas lágrima
    const gPiel = new THREE.Group();
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 14), new THREE.MeshPhongMaterial({ color: 0x64748b, shininess: 80 }));
    pipe.position.y = 2.2;
    const showerHead = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.55, 22), new THREE.MeshPhongMaterial({ color: 0x94a3b8, shininess: 90 }));
    showerHead.position.y = 1.6;
    const shieldBase = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.16, 24), new THREE.MeshPhongMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.55 }));
    shieldBase.position.y = -1.4;
    gPiel.add(pipe, showerHead, shieldBase);
    const showerDrops = [];
    for (let i = 0; i < 20; i++) {
      const d = makeTeardrop(waterMat);
      d.position.set((Math.random() - 0.5) * 1.6, -1.2 + Math.random() * 2.5, (Math.random() - 0.5) * 1.2);
      d.userData = { speed: 0.06 + Math.random() * 0.04 };
      gPiel.add(d);
      showerDrops.push(d);
    }
    emGroups.piel = gPiel;

    // 3) INHALACIÓN: Pulmones 3D estilizados respirando + anillos de aire fresco
    const gInh = new THREE.Group();
    const lungMat = new THREE.MeshPhongMaterial({ color: 0xfb7185, shininess: 70, transparent: true, opacity: 0.88 });
    const trachea = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.3, 12), lungMat); trachea.position.y = 0.8;
    const lungL = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 20), lungMat); lungL.scale.set(0.75, 1.35, 0.65); lungL.position.set(-0.75, -0.1, 0);
    const lungR = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 20), lungMat); lungR.scale.set(0.75, 1.35, 0.65); lungR.position.set(0.75, -0.1, 0);
    gInh.add(trachea, lungL, lungR);
    const airRings = [];
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.5 + i * 0.3, 0.045, 10, 32), new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.75 }));
      r.position.set(-2.2 + i * 1.4, 0, 0.7);
      r.rotation.y = Math.PI / 2;
      gInh.add(r);
      airRings.push(r);
    }
    emGroups.inhalacion = gInh;

    // 4) INGESTIÓN: Vaso de agua 3D + símbolo prohibición
    const gIng = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.55, 1.7, 22, 1, true), new THREE.MeshPhongMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.35, shininess: 120, side: THREE.DoubleSide }));
    glass.position.x = -1.1;
    const waterIn = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.5, 1.1, 20), waterMat);
    waterIn.position.set(-1.1, -0.25, 0);
    const noMat = new THREE.MeshPhongMaterial({ color: 0xef4444, emissive: 0x7f1d1d, shininess: 90 });
    const noRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.13, 12, 32), noMat); noRing.position.x = 1.1;
    const noBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.17, 0.17), noMat); noBar.position.x = 1.1; noBar.rotation.z = Math.PI / 4;
    gIng.add(glass, waterIn, noRing, noBar);
    emGroups.ingestion = gIng;

    // 5) DERRAME: Charco + bidón volcado + gránulos absorbentes
    const gDer = new THREE.Group();
    const puddle = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.08, 28), new THREE.MeshPhongMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.78, shininess: 100 }));
    puddle.position.y = -1.2;
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.1, 18), new THREE.MeshPhongMaterial({ color: 0x1d4ed8, shininess: 70 }));
    drum.rotation.z = 1.25; drum.position.set(-1.4, -0.8, -0.3);
    const warnRing = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.055, 10, 40), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    warnRing.rotation.x = Math.PI / 2; warnRing.position.y = -1.15;
    gDer.add(puddle, drum, warnRing);
    const granules = [];
    const granMat = new THREE.MeshPhongMaterial({ color: 0xe2e8f0, shininess: 40 });
    for (let i = 0; i < 20; i++) {
      const g = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), granMat);
      g.position.set((Math.random() - 0.5) * 2.1, -1.0 + Math.random() * 2.6, (Math.random() - 0.5) * 1.6);
      g.userData = { speed: 0.035 + Math.random() * 0.03 };
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

      if (currentEm === 'ojos') {
        gOjos.rotation.y = Math.sin(Date.now() * 0.002) * 0.25;
        eyeDrops.forEach(d => { d.position.x += d.userData.speed; if (d.position.x > 2.5) d.position.x = -2.5; });
      } else if (currentEm === 'piel') {
        gPiel.rotation.y += 0.006;
        showerDrops.forEach(d => { d.position.y -= d.userData.speed; if (d.position.y < -1.3) d.position.y = 1.4; });
      } else if (currentEm === 'inhalacion') {
        const breath = 1 + Math.sin(Date.now() * 0.003) * 0.08;
        lungL.scale.set(0.75 * breath, 1.35 * breath, 0.65 * breath);
        lungR.scale.set(0.75 * breath, 1.35 * breath, 0.65 * breath);
        airRings.forEach((r, i) => {
          r.position.x += 0.035;
          if (r.position.x > 2.6) r.position.x = -2.6;
          r.scale.setScalar(1 + Math.sin(Date.now() * 0.004 + i) * 0.12);
        });
      } else if (currentEm === 'ingestion') {
        gIng.rotation.y = Math.sin(Date.now() * 0.002) * 0.3;
        noRing.rotation.z += 0.015;
      } else if (currentEm === 'derrame') {
        gDer.rotation.y += 0.007;
        granules.forEach(g => { g.position.y -= g.userData.speed; if (g.position.y < -1.1) g.position.y = 1.6; });
      }

      const nw = emEl.clientWidth, nh = emEl.clientHeight;
      if (nw && nh && renEm.domElement.width !== nw) {
        camEm.aspect = nw / nh;
        camEm.updateProjectionMatrix();
        renEm.setSize(nw, nh);
      }
      renEm.render(sceneEm, camEm);
    }
    renderEm();
  }
})();
