// ===== 1. CONTROL DE ÍNDICE GLOBAL Y AUDIO SUTIL (WEB AUDIO API) =====
window.__activeSlideIndex = 0;
let soundEnabled = true;
let audioCtx = null;

function playTone(freq, dur = 0.08, type = 'sine', vol = 0.05) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

const btnSound = document.getElementById('btnSound');
if (btnSound) {
  btnSound.classList.add('active');
  btnSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    btnSound.classList.toggle('active', soundEnabled);
    if (soundEnabled) playTone(620, 0.07);
    else if (typeof stopActiveVoice === 'function') stopActiveVoice();
  });
}

// ===== 2. EFECTO 3D TILT + SPOTLIGHT DINÁMICO EN TARJETAS =====
document.querySelectorAll('.glass-card').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    if (el.hasAttribute('data-tilt')) {
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(700px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-2px)`;
    }
  });
  el.addEventListener('mouseleave', () => {
    if (el.hasAttribute('data-tilt')) el.style.transform = '';
  });
});

// ===== 2B. TELÓN DE BIENVENIDA =====
const welcomeCurtain = document.getElementById('welcomeCurtain');
const btnStartPres = document.getElementById('btnStartPresentation');
if (btnStartPres && welcomeCurtain) {
  btnStartPres.addEventListener('click', () => {
    playTone(660, 0.09);
    if (window.__triggerWarp3D) window.__triggerWarp3D();
    if (typeof gsap !== 'undefined') {
      gsap.to(welcomeCurtain, {
        opacity: 0,
        scale: 1.06,
        duration: 0.55,
        ease: 'power2.inOut',
        onComplete: () => {
          welcomeCurtain.classList.add('hidden');
          updateBuddyForSlide(currentSlide);
        }
      });
    } else {
      welcomeCurtain.classList.add('hidden');
      updateBuddyForSlide(currentSlide);
    }
  });
}

const btnStartAuto = document.getElementById('btnStartAuto');
if (btnStartAuto && welcomeCurtain) {
  btnStartAuto.addEventListener('click', () => {
    soundEnabled = true;
    if (btnSound) btnSound.classList.add('active');
    playTone(660, 0.09);
    if (window.__triggerWarp3D) window.__triggerWarp3D();
    if (typeof gsap !== 'undefined') {
      gsap.to(welcomeCurtain, {
        opacity: 0,
        scale: 1.06,
        duration: 0.55,
        ease: 'power2.inOut',
        onComplete: () => {
          welcomeCurtain.classList.add('hidden');
          startAutoPresentation();
        }
      });
    } else {
      welcomeCurtain.classList.add('hidden');
      startAutoPresentation();
    }
  });
}

// ===== 2C. GUIONES SINCRONIZADOS + ANIMACIONES EN ESCENA (SOLO 1:300 Y 1:75 EN DOSIFICACIÓN) =====
let autoMode = false;
let autoStepTimer = null;
let autoGen = 0;
const btnAutoPlay = document.getElementById('btnAutoPlay');

const waitMs = (ms) => new Promise(r => setTimeout(r, ms));
const sleepAuto = (ms) => new Promise(r => { autoStepTimer = setTimeout(r, ms); });
const clickInSlide = (sel) => { const el = slides[currentSlide].querySelector(sel); if (el) el.click(); };
const setLiters = (v) => { if (litersRange) { litersRange.value = v; updateCalc(); } };

const autoScripts = [
  // Slide 1: Portada
  [
    { t: 'h1', s: 'Hola, ¿cómo están? Bienvenidos, equipo de enfermería de Hospital Arboledas. Yo soy Gemi, su asistente virtual, y hoy los voy a acompañar durante esta sesión.' },
    { t: '.lead', s: 'En los próximos minutos vamos a conocer Swipe Peracetic, un desinfectante rápido, práctico y biodegradable, pensado para el cuidado diario de nuestros pacientes.' },
    { t: '.hl-item:nth-child(1)', s: 'Lo primero que deben saber: actúa muy rápido. Con solo 5 a 10 minutos de contacto logra eliminar el 99.999 por ciento de los microorganismos.' },
    { t: '.hl-item:nth-child(2)', s: 'Además, no deja residuos tóxicos, porque se descompone en agua, oxígeno y ácido acético, que es básicamente un vinagre suave.' },
    { t: '.hl-item:nth-child(3)', s: 'Y es muy fácil de usar en su turno: no hace espuma, no deja olor y funciona incluso con agua fría.' },
    { t: '.floating-product', s: 'Este es el producto. Viene en un porrón de 20 litros, del cual solo usaremos unos cuantos mililitros cada vez. ¡Comencemos!' }
  ],
  // Slide 2: Perfil del Producto (Protagonismo 100% Gemi + pop-in animado)
  [
    { vis: 'perfil_conc', s: '¿Qué es Swipe Peracetic? Es un desinfectante líquido a base de ácido peracético, en una concentración del 14 al 16 por ciento.' },
    { vis: 'perfil_stat', s: 'En pruebas de laboratorio logró eliminar el 99.999 por ciento de la bacteria E. coli, en apenas 30 segundos de contacto.' },
    { vis: 'micro_bacterias', s: 'Elimina bacterias de forma rápida, tanto en superficies como en instrumental.' },
    { vis: 'micro_virus', s: 'También inactiva virus, con un amplio espectro de desinfección hospitalaria.' },
    { vis: 'micro_hongos', s: 'Controla hongos y levaduras, sobre todo en zonas húmedas.' },
    { vis: 'micro_esporas', s: 'E incluso esporas, cuando lo usamos en su dilución más alta como esterilizante químico.' },
    { vis: 'mito_olor', mood: 'happyOpen', s: 'Ahora rompamos algunos mitos. ¿Deja olor fuerte? No, no deja olor ni color.' },
    { vis: 'mito_fria', mood: 'happyOpen', s: '¿Necesita agua caliente? Tampoco. Funciona incluso con agua fría, de hasta 4 grados.' },
    { vis: 'mito_espuma', mood: 'happyOpen', s: '¿Hace mucha espuma? Para nada. No genera espuma, así que es muy fácil de aplicar y de retirar.' }
  ],
  // Slide 3: Simulador 3D
  [
    { t: 'h2', s: 'Ahora veamos cómo actúa, con una simulación en tres dimensiones.' },
    { t: '#simViewport', a: () => { if (btnRunSim) btnRunSim.click(); }, s: 'Primero, las moléculas de ácido peracético rodean al microorganismo y rompen su pared celular por oxidación.' },
    { t: '#simViewport', s: 'En 5 a 10 minutos de contacto, el microorganismo queda totalmente neutralizado.' },
    { t: '.biodeg-banner', s: 'Y lo mejor: después de actuar, el producto se transforma en oxígeno, agua y ácido acético. Por eso es cien por ciento biodegradable.' }
  ],
  // Slide 4: Compatibilidad Clínica (Protagonismo 100% Gemi + animaciones)
  [
    { vis: null, s: 'Esto es muy importante para su día a día: ¿dónde sí y dónde no debemos aplicarlo?' },
    { vis: 'compat_acero', mood: 'happyOpen', s: 'Sí es seguro en acero inoxidable. De hecho, ayuda a prevenir el sarro.' },
    { vis: 'compat_hule', mood: 'happyOpen', s: 'También es compatible con hule, goma y la mayoría de los plásticos de grado médico.' },
    { vis: 'compat_cobre', mood: 'alert', s: 'Pero cuidado: no debemos aplicarlo directamente en cobre.' },
    { vis: 'compat_aluminio', mood: 'alert', s: 'Ni en aluminio u otros metales suaves, porque puede corroerlos.' },
    { vis: 'compat_cloro', mood: 'alert', s: 'Y ahora, la regla de oro, la más importante de toda la plática: nunca, nunca mezclen Swipe Peracetic con cloro.' },
    { vis: 'compat_gas', mood: 'alert', s: 'Al mezclarse con cloro se libera gas cloro, que es altamente tóxico. Así que siempre en recipientes separados.' }
  ],
  // Slide 5: Calculadora (SOLO 1:300 y 1:75)
  [
    { t: '#taskButtons', s: 'Ahora veamos las dos diluciones oficiales en esta calculadora interactiva.' },
    { t: '.task-btn:nth-child(1)', a: () => { clickInSlide('.task-btn:nth-child(1)'); setLiters(5); }, s: 'Para dosis de choque y áreas críticas usamos 1 a 300, que son 3.3 mililitros por cada litro de agua.' },
    { t: '.liters-control', a: () => setLiters(10), s: 'Por ejemplo, en 10 litros de agua agregamos 33 mililitros de producto, y sí requiere enjuague después.' },
    { t: '.task-btn:nth-child(2)', a: () => { clickInSlide('.task-btn:nth-child(2)'); setLiters(5); }, s: 'Y para esterilizar equipo médico compatible, usamos la dilución 1 a 75, que son 13.3 mililitros por litro. En este caso no se necesita enjuague.' },
    { t: '.calc-result-card', s: 'Un consejo: preparen la mezcla justo antes de usarla, y nunca regresen la mezcla sobrante al porrón original.' }
  ],
  // Slide 6: Flujo de Turno (Protagonismo 100% Gemi + pasos aparecen y desaparecen)
  [
    { vis: null, s: 'Ahora sí, la rutina en el turno. Son solo cuatro pasos muy sencillos.' },
    { vis: 'paso_1', s: 'Paso uno, limpieza previa. Antes de desinfectar, retiren siempre la suciedad visible o la materia orgánica.' },
    { vis: 'paso_2', s: 'Paso dos, preparar y aplicar. Midan los mililitros exactos en agua limpia, y apliquen sobre la superficie o el instrumental.' },
    { vis: 'paso_3', s: 'Paso tres, esperar de 5 a 10 minutos. Este es el paso clave: no sequen la superficie antes de tiempo.' },
    { vis: 'paso_4', mood: 'happyOpen', s: 'Y paso cuatro, enjuagar o dejar secar. En áreas críticas 1 a 300 se enjuaga, y en 1 a 75 para equipo médico no hace falta.' }
  ],
  // Slide 7: EPP Obligatorio (Solo Gemi equipándose)
  [
    { a: () => resetEppGear(), s: 'Para cuidar a quien cuida: cuando manipulemos el producto concentrado, usaremos siempre cuatro elementos de protección. Miren cómo me equipo.' },
    { a: () => equipGemiEpp('ojos', true), s: 'Primero, gafas o careta, para evitar cualquier salpicadura en los ojos.' },
    { a: () => equipGemiEpp('guantes', true), s: 'Segundo, guantes largos de nitrilo o butilo, para proteger nuestras manos.' },
    { a: () => equipGemiEpp('bata', true), s: 'Tercero, bata o delantal impermeable, para cuidar la piel y el uniforme.' },
    { a: () => equipGemiEpp('mascarilla', true), s: 'Y cuarto, mascarilla para vapores, trabajando siempre en un área bien ventilada.' },
    { mood: 'happyOpen', a: () => { if (eppStageTag) eppStageTag.textContent = '🛡️ ¡Gemi 100% Protegido!'; playBuddyGesture('cheer'); }, s: '¡Listo, protección completa! Y al terminar, lávense bien las manos y la cara con agua y jabón.' }
  ],
  // Slide 8: Almacenamiento Seguro (Protagonismo 100% Gemi)
  [
    { vis: 'store_vertical', s: 'Hablemos del almacenamiento. El porrón siempre debe estar parado, bien cerrado, y solo se abre al momento de dosificar.' },
    { vis: 'store_fresco', s: 'Guárdenlo en un lugar fresco, seco y ventilado. Tiene una vida útil de 12 meses en su envase original.' },
    { vis: 'store_nunca', mood: 'alert', s: 'Lo que nunca hacemos: dejarlo al sol o cerca del calor, guardarlo junto a alimentos, o pasarlo a envases sin etiqueta.' },
    { vis: 'store_calor', mood: 'alert', s: 'Miren este termómetro: si el almacén pasa de 35 grados, hay que reubicar el porrón a un área más fresca.' },
    { vis: 'store_ok', mood: 'happyOpen', s: 'En cambio, a una temperatura como 22 grados, el producto se conserva perfectamente.' }
  ],
  // Slide 9: Respuesta Inmediata (Protagonismo 100% Gemi + Animaciones 3D + tsParticles)
  [
    { vis: null, s: 'Ahora repasemos qué hacer en caso de algún accidente.' },
    { vis: 'em_ojos', s: 'Si el producto salpica en los ojos: enjuaguen de inmediato con abundante agua durante al menos 15 minutos, y busquen atención médica.' },
    { vis: 'em_piel', s: 'Si cae en la piel: vayan de inmediato a la regadera o a la llave, quiten la ropa contaminada, y laven con agua y jabón.' },
    { vis: 'em_inhalacion', s: 'Si alguien inhala los vapores: llévenlo al aire libre y manténganlo en reposo.' },
    { vis: 'em_ingestion', mood: 'alert', s: 'En caso de ingestión: enjuagar la boca y beber uno o dos vasos de agua. Y muy importante: nunca provocar el vómito.' },
    { vis: 'em_derrame', mood: 'alert', s: 'Y si hay un derrame: ventilar, ponerse el equipo de protección, y absorber con arcilla o vermiculita. Nunca lo tiren al drenaje.' }
  ],
  // Slide 10: Quiz
  [
    { t: '.quiz-box', a: () => { qIndex = 0; qScore = 0; renderQuiz(); }, s: 'Llegó el momento del mini quiz. Les haré cuatro preguntas. Piensen su respuesta, y después yo les muestro la correcta.' },
    { quiz: true }
  ],
  // Slide 11: Cierre
  [
    { t: '.closing-left h2', mood: 'happy', a: () => { spawnConfetti(48); const svg = document.getElementById('buddySvg'); if (svg && typeof gsap !== 'undefined') gsap.fromTo(svg, { scaleY: 1 }, { scaleY: 0.78, duration: 0.35, yoyo: true, repeat: 1 }); }, s: 'Y con esto terminamos. Muchas gracias, equipo de enfermería de Hospital Arboledas, por su atención, y por cuidar cada detalle.' },
    { t: '.qr-box', s: 'Pueden escanear este código QR con su celular, para llevarse la calculadora y toda la información.' },
    { t: '.docs-list', mood: 'happy', s: 'Aquí también encontrarán la guía técnica, la hoja de seguridad y el informe de laboratorio. ¿Tienen alguna pregunta?' }
  ]
];

function splitSentences(text) {
  return String(text).split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
}

// ===== 2D. GESTOS ANIME.JS + VISEMAS WORDBOUNDRY + KARAOKE + MIRADA DE LECTURA GSAP =====
function playBuddyGesture(kind) {
  if (typeof anime === 'undefined') return;
  if (kind === 'wave') {
    anime({ targets: '#buddyArmR, #eppArmR', rotate: [0, -55, 15, -50, 0], duration: 950, easing: 'easeInOutSine' });
    anime({ targets: '#buddyStar, #eppStar', scale: [1, 1.35, 1], duration: 700, easing: 'easeOutElastic(1, .6)' });
  } else if (kind === 'speak') {
    anime({ targets: '#buddyStar, #eppStar', scale: [1, 1.22, 1], duration: 480, easing: 'easeInOutQuad' });
    anime({ targets: '#buddyArmL, #eppArmL', rotate: [0, 18, 0], duration: 520, easing: 'easeInOutSine' });
  } else if (kind === 'point') {
    anime({ targets: '#buddyArmR, #eppArmR', rotate: [0, -48, -32, 0], duration: 680, easing: 'easeOutBack' });
    anime({ targets: '#buddyStar, #eppStar', rotate: [0, 15, 0], duration: 520, easing: 'easeOutSine' });
  } else if (kind === 'nod') {
    anime({ targets: '#buddySvg, #eppGemiSvg', translateY: [0, 4, 0, 3, 0], duration: 520, easing: 'easeInOutSine' });
  } else if (kind === 'alertShake') {
    anime({ targets: '#buddySvg, #eppGemiSvg', translateX: [0, -5, 5, -4, 4, 0], duration: 480, easing: 'easeInOutSine' });
    anime({ targets: '#buddyStar, #eppStar', scale: [1, 1.4, 1], duration: 480, easing: 'easeOutBack' });
  } else if (kind === 'cheer') {
    anime({ targets: '#buddyArmL, #eppArmL', rotate: [0, 46, 20, 46, 0], duration: 850, easing: 'easeOutBack' });
    anime({ targets: '#buddyArmR, #eppArmR', rotate: [0, -46, -20, -46, 0], duration: 850, easing: 'easeOutBack' });
    anime({ targets: '#buddySvg, #eppGemiSvg', translateY: [0, -10, 0], duration: 600, easing: 'easeOutBounce' });
  } else if (kind === 'land') {
    anime({ targets: '#buddySvg', scaleX: [1.14, 1], scaleY: [0.86, 1], duration: 420, easing: 'easeOutElastic(1, .5)' });
  }
}

const mouthFrames = [
  '<rect x="7" y="8" width="2" height="1" fill="#1E293B"/>',
  '<rect x="6" y="8" width="4" height="1" fill="#99F6E4"/>',
  '<rect x="6" y="8" width="4" height="1" fill="#F8FAFC"/><rect x="7" y="9" width="2" height="1" fill="#F43F5E"/>',
  '<rect x="6" y="7" width="4" height="3" fill="#020617"/><rect x="6" y="7" width="4" height="1" fill="#F8FAFC"/><rect x="7" y="8" width="2" height="2" fill="#F43F5E"/>',
  '<rect x="7" y="7" width="2" height="2" fill="#F43F5E"/><rect x="7" y="7" width="2" height="1" fill="#F8FAFC"/>'
];
let lastMouthState = -1;
function setMouthFrame(state) {
  if (state === lastMouthState) return;
  lastMouthState = state;
  const html = mouthFrames[state] || mouthFrames[0];
  [document.getElementById('buddyMouth'), document.getElementById('eppGemiMouth')].forEach(el => {
    if (!el) return;
    el.innerHTML = html;
    el.classList.remove('hidden');
  });
}
setMouthFrame(0);

function visemeAtTime(timeline, ms) {
  if (!timeline || !timeline.length) return 0;
  let lo = 0, hi = timeline.length - 1, ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timeline[mid][0] <= ms) { ans = timeline[mid][1]; lo = mid + 1; }
    else hi = mid - 1;
  }
  return ans;
}

const PROTAGONIST_SLIDES = new Set([1, 3, 5, 6, 7, 8]);
const isStageSlide = (idx = currentSlide) => PROTAGONIST_SLIDES.has(idx);

let activeAudio = null;
let lipRafId = null;
let speakDelayTimer = null;
let slideTourRunning = false;
let slideTourGen = 0;

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setBubbleContent(el, text) {
  if (!el) return;
  const raw = String(text || '');
  el.dataset.rawText = raw;
  const parts = raw.split(/(\s+)/);
  let cursor = 0;
  const ranges = [];
  el.innerHTML = parts.map(part => {
    const start = cursor;
    cursor += part.length;
    if (/^\s+$/.test(part) || !part) return part;
    ranges.push([start, cursor]);
    return `<span class="kw">${escapeHtml(part)}</span>`;
  }).join('');
  el._kwNodes = Array.from(el.querySelectorAll('.kw'));
  el._kwRanges = ranges;
}

function highlightBubbleWord(wordIdx, progress = null) {
  [document.getElementById('buddyBubble'), document.getElementById('eppSpeechBubble')].forEach(el => {
    if (!el || !el._kwNodes || !el._kwNodes.length) return;
    const targetIdx = progress !== null
      ? Math.min(el._kwNodes.length - 1, Math.floor(Math.max(0, Math.min(0.999, progress)) * el._kwNodes.length))
      : Math.min(el._kwNodes.length - 1, wordIdx);
    el._kwNodes.forEach((node, i) => {
      node.classList.toggle('spoken', i < targetIdx);
      node.classList.toggle('reading', i === targetIdx);
    });
  });
}

function clearBubbleHighlight() {
  [document.getElementById('buddyBubble'), document.getElementById('eppSpeechBubble')].forEach(el => {
    if (!el || !el._kwNodes) return;
    el._kwNodes.forEach(node => node.classList.remove('spoken', 'reading'));
  });
}

function wordIndexFromChar(charIdx) {
  const activeBubble = isStageSlide()
    ? document.getElementById('eppSpeechBubble')
    : document.getElementById('buddyBubble');
  if (!activeBubble || !activeBubble._kwRanges || !activeBubble._kwRanges.length) return -1;
  const ranges = activeBubble._kwRanges;
  for (let i = 0; i < ranges.length; i++) {
    if (charIdx <= ranges[i][1]) return i;
  }
  return ranges.length - 1;
}

// Seguimiento ocular GSAP sobre lo que Gemi lee o señala
let currentReadingEl = null;
let gazeLastTick = 0;
let gazeResetTimer = null;
const gazeState = { ex: 0, ey: 0, px: 0, py: 0 };

function applyGazeAttrs() {
  const eyeT = `translate(${gazeState.ex.toFixed(3)}, ${gazeState.ey.toFixed(3)})`;
  const pupT = `translate(${gazeState.px.toFixed(3)}, ${gazeState.py.toFixed(3)})`;
  ['buddyEyes', 'eppEyes'].forEach(id => {
    const g = document.getElementById(id);
    if (g) g.setAttribute('transform', eyeT);
  });
  ['buddyPupils', 'eppPupils'].forEach(id => {
    const p = document.getElementById(id);
    if (p) p.setAttribute('transform', pupT);
  });
}

function tweenGazeTo(ex, ey, px, py, dur = 0.14) {
  if (typeof gsap !== 'undefined') {
    gsap.to(gazeState, { ex, ey, px, py, duration: dur, ease: 'power2.out', overwrite: 'auto', onUpdate: applyGazeAttrs });
  } else {
    gazeState.ex = ex; gazeState.ey = ey; gazeState.px = px; gazeState.py = py;
    applyGazeAttrs();
  }
}

function lookBuddyAtElement(el, scanProgress = 0.5, forceTarget = null) {
  if (buddySleeping) return;
  const onStage = isStageSlide();
  const svg = document.getElementById(onStage ? 'eppGemiSvg' : 'buddySvg');
  if (!svg || !svg.getScreenCTM) return;

  let targetEl = forceTarget;
  if (!targetEl) {
    if (onStage) {
      const visPane = document.getElementById('stageVisualPane');
      const eppBubble = document.getElementById('eppSpeechBubble');
      const kwReading = eppBubble ? eppBubble.querySelector('.kw.reading') : null;
      const eqActive = currentSlide === 6 && scanProgress < 0.2 ? document.querySelector('#eppEquippedBadges .eq-pill.equipped') : null;
      if (visPane && !visPane.classList.contains('hidden')) targetEl = visPane;
      else targetEl = eqActive || kwReading || eppBubble || document.getElementById('eppStageTag');
    } else {
      targetEl = el || currentReadingEl;
      if (!targetEl) {
        const bBubble = document.getElementById('buddyBubble');
        targetEl = (bBubble && bBubble.querySelector('.kw.reading')) || bBubble;
      }
    }
  }
  if (!targetEl) { tweenGazeTo(0, 0, 0, 0, 0.25); return; }

  const r = targetEl.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return;

  const isSingleWord = targetEl.classList && targetEl.classList.contains('kw');
  const clampedP = Math.max(0, Math.min(0.999, scanProgress));
  const lines = isSingleWord ? 1 : (r.height >= 72 ? 2 : 1);
  const rowFloat = clampedP * lines;
  const rowIdx = Math.min(lines - 1, Math.floor(rowFloat));
  const colT = lines === 1 ? clampedP : (rowFloat - rowIdx);

  const tx = isSingleWord ? (r.left + r.width / 2) : (r.left + r.width * (0.12 + colT * 0.76));
  const ty = isSingleWord ? (r.top + r.height / 2) : (r.top + r.height * (lines === 1 ? 0.48 : (0.28 + rowIdx * 0.44)));

  const ctm = svg.getScreenCTM();
  if (!ctm) return;
  const inv = ctm.inverse();
  const pt = new DOMPoint(tx, ty).matrixTransform(inv);
  const rawDx = pt.x - 8;
  const rawDy = pt.y - 6;
  const mag = Math.hypot(rawDx, rawDy) || 1;

  let nx;
  if (Math.abs(rawDx) < 22) {
    nx = Math.max(-1, Math.min(1, rawDx / 14));
  } else {
    const signX = Math.sign(inv.a || 1);
    nx = (rawDx / mag) * 0.65 + (colT - 0.5) * 0.55 * signX;
    nx = Math.max(-1, Math.min(1, nx));
  }
  const ny = Math.max(-1, Math.min(1, (rawDy / mag) * 0.9));

  tweenGazeTo(nx * 0.45, ny * 0.35, nx * 0.46, ny * 0.32, 0.13);
}

function faceBuddyToward(el) {
  if (!buddyEl || !el || buddyParked || isStageSlide()) return;
  const r = el.getBoundingClientRect();
  const elCx = r.left + r.width / 2;
  const buddyCx = buddyX + (buddyEl.offsetWidth || 90) / 2;
  if (Math.abs(elCx - buddyCx) > 26) buddyEl.classList.toggle('facing-left', elCx < buddyCx);
}

function stopActiveVoice() {
  clearTimeout(speakDelayTimer);
  clearTimeout(gazeResetTimer);
  if (activeAudio) {
    try { activeAudio.pause(); activeAudio.currentTime = 0; } catch (e) {}
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio.onplay = null;
  }
  cancelAnimationFrame(lipRafId);
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  stopLipSync();
  clearBubbleHighlight();
}

function speakOne(text) {
  return new Promise(resolve => {
    let done = false;
    let lipTimer = null;
    let watchdog = null;
    const wordsArr = text.trim().split(/\s+/).filter(Boolean);
    const words = wordsArr.length || 1;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(watchdog);
      clearInterval(lipTimer);
      cancelAnimationFrame(lipRafId);
      stopLipSync();
      clearBubbleHighlight();
      gazeResetTimer = setTimeout(() => tweenGazeTo(0, 0, 0, 0, 0.35), 450);
      resolve();
    };

    clearTimeout(gazeResetTimer);
    wakeBuddy();
    lookBuddyAtElement(currentReadingEl, 0.05);

    const startSilentSync = () => {
      startLipSync();
      const seq = [1, 3, 4, 0, 2, 1, 0];
      let si = 0;
      const estMs = Math.max(2200, words * 380);
      const startedAt = Date.now();
      clearInterval(lipTimer);
      clearTimeout(watchdog);
      lipTimer = setInterval(() => {
        setMouthFrame(seq[si++ % seq.length]);
        const progress = Math.min(0.999, (Date.now() - startedAt) / estMs);
        highlightBubbleWord(-1, progress);
        lookBuddyAtElement(currentReadingEl, progress);
      }, 120);
      watchdog = setTimeout(finish, estMs);
    };

    const mp3File = window.__audioMap && window.__audioMap[text];
    if (soundEnabled && mp3File) {
      try {
        if (!activeAudio) activeAudio = new Audio();
        activeAudio.pause();
        activeAudio.src = `assets/audio/${mp3File}`;
        const timeline = window.__audioTimings && window.__audioTimings[mp3File];
        startLipSync();
        playBuddyGesture('speak');

        const tickViseme = () => {
          if (done || activeAudio.paused) return;
          const ms = activeAudio.currentTime * 1000;
          if (timeline && timeline.length) setMouthFrame(visemeAtTime(timeline, ms));
          const durMs = (activeAudio.duration && isFinite(activeAudio.duration))
            ? activeAudio.duration * 1000
            : Math.max(1800, words * 420);
          const effectiveMs = Math.max(400, durMs - 140);
          const progress = Math.min(0.999, Math.max(0, ms / effectiveMs));
          highlightBubbleWord(-1, progress);
          const now = performance.now();
          if (now - gazeLastTick > 75) {
            gazeLastTick = now;
            lookBuddyAtElement(currentReadingEl, progress);
          }
          lipRafId = requestAnimationFrame(tickViseme);
        };
        activeAudio.onplay = () => { lipRafId = requestAnimationFrame(tickViseme); };
        if (!timeline || !timeline.length) {
          const seq = [1, 3, 2, 0, 4, 2, 1, 0];
          let si = 0;
          lipTimer = setInterval(() => { setMouthFrame(seq[si++ % seq.length]); }, 110);
        }

        activeAudio.onended = finish;
        activeAudio.onerror = finish;
        watchdog = setTimeout(finish, Math.max(8000, words * 750 + 4000));
        const p = activeAudio.play();
        if (p && p.catch) p.catch(() => { cancelAnimationFrame(lipRafId); startSilentSync(); });
        return;
      } catch (e) {}
    }

    if (!soundEnabled || !('speechSynthesis' in window)) {
      startSilentSync();
      return;
    }

    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    const v = pickNaturalSpanishVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'es-MX'; }
    u.rate = 1.07;
    u.pitch = 1.02;
    let started = false, gotBoundary = false;
    u.onstart = () => { started = true; startLipSync(); playBuddyGesture('speak'); };
    u.onboundary = (e) => {
      if (!e.name || e.name === 'word') {
        gotBoundary = true;
        pulseLipOnce();
        if (typeof e.charIndex === 'number') {
          const wIdx = wordIndexFromChar(e.charIndex);
          if (wIdx >= 0) {
            highlightBubbleWord(wIdx);
            lookBuddyAtElement(currentReadingEl, (wIdx + 0.5) / words);
          }
        }
      }
    };
    u.onend = finish;
    u.onerror = finish;
    lipTimer = setInterval(() => { if (started && !gotBoundary) pulseLipOnce(); }, 135);
    watchdog = setTimeout(finish, words * 650 + 5000);
    window.__gemiUtter = u;
    if (synth.paused) synth.resume();
    synth.speak(u);
  });
}

async function speakChunk(text, alive = () => true) {
  if (window.__audioMap && window.__audioMap[text]) {
    await speakOne(text);
    return;
  }
  for (const sentence of splitSentences(text)) {
    if (!alive()) return;
    await speakOne(sentence);
  }
}

function speakWithLipSync(text, onFinish) {
  if (!text) { if (onFinish) onFinish(); return false; }
  stopActiveVoice();
  speakDelayTimer = setTimeout(() => { speakChunk(text).then(() => { if (onFinish) onFinish(); }); }, 50);
  return true;
}

function pickNaturalSpanishVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang.startsWith('es') && /natural|online|google|dalia|jorge|paloma|salome/i.test(v.name)) ||
    voices.find(v => v.lang === 'es-MX') ||
    voices.find(v => v.lang.startsWith('es')) ||
    null
  );
}
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

let mouthPulseTimer = null;
function startLipSync() { if (buddyEl) buddyEl.classList.add('speaking'); setMouthFrame(1); }
function pulseLipOnce() {
  setMouthFrame(lastMouthState === 3 ? 1 : 3);
  clearTimeout(mouthPulseTimer);
  mouthPulseTimer = setTimeout(() => setMouthFrame(0), 120);
}
function stopLipSync() {
  clearTimeout(mouthPulseTimer);
  if (buddyEl) buddyEl.classList.remove('speaking');
  setMouthFrame(0);
}

// ===== 2E. ESCENARIO ÚNICO PROTAGONISTA DE GEMI (SLIDES 2, 4, 6, 7, 8 Y 9) =====
const stagePool = document.getElementById('stagePool');
const stageActorCard = document.getElementById('stageActorCard');
const stageSplit = document.getElementById('stageSplit');
const stageVisualPane = document.getElementById('stageVisualPane');
const stageAnimContent = document.getElementById('stageAnimContent');
const stageStepDots = document.getElementById('stageStepDots');
const eppSpeechBubble = document.getElementById('eppSpeechBubble');
const eppStageTag = document.getElementById('eppStageTag');
const eppEquippedBadges = document.getElementById('eppEquippedBadges');
const eppGradCap = document.getElementById('eppGradCap');
const eppGemiSvg = document.getElementById('eppGemiSvg');
const em3DEl = document.getElementById('em3D');

const stageVisualCatalog = {
  // Slide 2: Perfil
  perfil_conc: { tag: '🧪 Fórmula Clínica', icon: '🧪', title: 'Ácido Peracético 14–16%', pills: ['FDA / USDA (GRAS)', 'Desinfectante Líquido'], sub: 'Alta eficacia clínica sin residuos.', particles: 'sporesClear' },
  perfil_stat: { tag: '🏆 Certificado Analis', icon: '✅', counter: true, title: 'Reducción microbiana', pills: ['E. coli ATCC 11229', '30 segundos · 1:75'], sub: 'Eficacia comprobada en laboratorio.', particles: 'sporesClear' },
  micro_bacterias: { tag: '🦠 Espectro Biocida', icon: '🦠', title: 'Bacterias Gram+ y Gram-', pills: [{ text: 'NEUTRALIZADO · 99.999%', cls: 'ok' }], sub: 'Acción inmediata en superficies e instrumental.', theme: 'theme-ok', particles: 'sporesClear' },
  micro_virus: { tag: '🧬 Espectro Biocida', icon: '🧬', title: 'Virus Envueltos y No Envueltos', pills: [{ text: 'AMPLIO ESPECTRO', cls: 'ok' }], sub: 'Inactivación rápida en áreas clínicas.', theme: 'theme-ok', particles: 'sporesClear' },
  micro_hongos: { tag: '🍄 Espectro Biocida', icon: '🍄', title: 'Hongos y Levaduras', pills: [{ text: 'ZONAS HÚMEDAS', cls: 'ok' }], sub: 'Control preventivo en regaderas y áreas críticas.', theme: 'theme-ok', particles: 'sporesClear' },
  micro_esporas: { tag: '🛡️ Espectro Biocida', icon: '🛡️', title: 'Esporas Bacterianas', pills: [{ text: 'ESTERILIZANTE QUÍMICO · 1:75', cls: 'ok' }], sub: 'Nivel alto con 2000 ppm.', theme: 'theme-ok', particles: 'sporesClear' },
  mito_olor: { tag: '👃 Sin Olor Residual', icon: '✨', title: 'No imparte olor ni color', pills: [{ text: 'Ideal con pacientes', cls: 'ok' }], sub: 'Cómodo para el personal en turno.', theme: 'theme-ok' },
  mito_fria: { tag: '❄️ Agua Fría', icon: '❄️', title: 'Eficaz hasta 4 °C y agua dura', pills: [{ text: 'No requiere calentar', cls: 'ok' }], sub: 'Rango pH 2 a 8.', theme: 'theme-ok', particles: 'frost' },
  mito_espuma: { tag: '🫧 Cero Espuma', icon: '🫧', title: 'Sin generación de espuma', pills: [{ text: 'Fácil de aplicar y enjuagar', cls: 'ok' }], sub: 'Cero residuos en superficie.', theme: 'theme-ok', particles: 'freshAir' },
  // Slide 4: Compatibilidad y Cloro
  compat_acero: { tag: '✅ Material Seguro', icon: '🔩', title: 'Acero Inoxidable', pills: [{ text: 'SEGURO · PREVIENE SARRO', cls: 'ok' }], sub: 'Ideal para mesas, tarjas e instrumental compatible.', theme: 'theme-ok', particles: 'sporesClear' },
  compat_hule: { tag: '✅ Material Seguro', icon: '🩺', title: 'Hule, Goma y Plásticos Médicos', pills: [{ text: 'COMPATIBLE', cls: 'ok' }], sub: 'Uso seguro en superficies y equipo clínico.', theme: 'theme-ok', particles: 'sporesClear' },
  compat_cobre: { tag: '⛔ Precaución', icon: '🪙', title: 'Cobre — NO Aplicar Directo', pills: [{ text: 'RIESGO DE DAÑO', cls: 'danger' }], sub: 'Evitar contacto en piezas de cobre.', theme: 'theme-danger' },
  compat_aluminio: { tag: '⛔ Precaución', icon: '⚙️', title: 'Aluminio y Metales Suaves', pills: [{ text: 'CORROSIVO EN METALES SUAVES', cls: 'danger' }], sub: 'No utilizar en aluminio o aleaciones suaves.', theme: 'theme-danger' },
  compat_cloro: { tag: '☠️ REGLA DE ORO', icon: '☠️', title: '¡NUNCA MEZCLAR CON CLORO!', pills: [{ text: 'GAS CLORO ALTAMENTE TÓXICO', cls: 'danger' }], sub: 'Jamás combinar con hipoclorito o productos clorados.', theme: 'theme-danger', particles: 'toxicGas', tone: true },
  compat_gas: { tag: '🚫 Separación Total', icon: '🧪', title: 'Siempre en Recipientes Separados', pills: [{ text: 'CERO CLORO', cls: 'danger' }], sub: 'Protege a todo tu servicio evitando vapores tóxicos.', theme: 'theme-danger', particles: 'toxicGas' },
  // Slide 6: 4 Pasos
  paso_1: { tag: 'Paso 1 de 4', icon: '🧽', title: 'Limpieza Previa', pills: ['Retirar suciedad y materia orgánica'], sub: 'Paso indispensable antes de aplicar el desinfectante.' },
  paso_2: { tag: 'Paso 2 de 4', icon: '🧪', title: 'Preparar y Aplicar', pills: ['Medir ml exactos en agua limpia'], sub: 'Cubrir uniformemente la superficie o equipo.' },
  paso_3: { tag: 'Paso 3 de 4', radial: '5–10 min', title: 'Tiempo de Contacto Clave', pills: ['No secar antes de tiempo'], sub: 'Garantiza el 99.999% de eliminación microbiana.', particles: 'sporesClear' },
  paso_4: { tag: 'Paso 4 de 4', icon: '💧', title: 'Enjuagar o Dejar Secar', pills: ['1:300 → Sí enjuagar', { text: '1:75 → NO requiere', cls: 'ok' }], sub: 'Superficie lista y segura.', theme: 'theme-ok', particles: 'freshAir' },
  // Slide 8: Almacenamiento
  store_vertical: { tag: '📦 Envase Original', icon: '🛢️', title: 'Porrón 20 L Vertical y Cerrado', pills: [{ text: 'Abrir solo al dosificar', cls: 'ok' }], sub: 'Evita derrames y pérdida de concentración.', theme: 'theme-ok' },
  store_fresco: { tag: '⏳ Estabilidad 12 Meses', icon: '🌬️', title: 'Lugar Fresco, Seco y Ventilado', pills: [{ text: 'Vigencia: 12 meses', cls: 'ok' }], sub: 'Conservar siempre en su envase etiquetado.', theme: 'theme-ok', particles: 'freshAir' },
  store_nunca: { tag: '❌ Prohibiciones', icon: '☀️', title: 'Cero Sol, Calor ni Alimentos', pills: [{ text: 'NO REENVASAR', cls: 'danger' }, { text: 'NO DEVOLVER MEZCLA', cls: 'danger' }], sub: 'Alejar de chispas, flamas y comida.', theme: 'theme-danger' },
  store_calor: { tag: '🌡️ Límite 35 °C', thermo: { temp: 39, danger: true }, title: '39 °C · ¡Alerta Calor!', pills: [{ text: 'REUBICAR PORRÓN (> 35 °C)', cls: 'danger' }], sub: 'El exceso de calor acelera la degradación.', theme: 'theme-danger', particles: 'toxicGas' },
  store_ok: { tag: '🌡️ Rango Óptimo', thermo: { temp: 22, danger: false }, title: '22 °C · Zona Segura', pills: [{ text: 'MÁXIMO 35 °C · ÓPTIMO', cls: 'ok' }], sub: 'Conserva potencia hasta 12 meses.', theme: 'theme-ok', particles: 'frost' },
  // Slide 9: Emergencias 3D + tsParticles
  em_ojos: { tag: '👁️ Ojos · Acción Inmediata', em: 'ojos', pills: ['Abundante agua mín. 15 min', 'Retirar lentes si aplica', 'Atención médica urgente'], particles: 'waterJet' },
  em_piel: { tag: '🚿 Piel · Ducha de Seguridad', em: 'piel', pills: ['Lavado inmediato con agua y jabón', 'Quitar ropa y calzado'], particles: 'shower' },
  em_inhalacion: { tag: '🌬️ Inhalación · Ventilación', em: 'inhalacion', pills: ['Trasladar al aire libre', 'Reposo en posición cómoda'], particles: 'freshAir' },
  em_ingestion: { tag: '🚫 Ingestión · Prohibido Vomitar', em: 'ingestion', pills: ['Enjuagar boca · 1–2 vasos de agua', { text: 'NUNCA PROVOCAR VÓMITO', cls: 'danger' }], theme: 'theme-danger' },
  em_derrame: { tag: '⚠️ Derrame · Contención Segura', em: 'derrame', pills: ['EPP completo + ventilar', { text: 'Absorber con arcilla o vermiculita', cls: 'ok' }, { text: 'NO TIRAR AL DRENAJE', cls: 'danger' }], theme: 'theme-danger', particles: 'vermiculite' }
};

const stagePipsBySlide = {
  1: [
    { vis: 'perfil_conc', label: '14–16%' },
    { vis: 'perfil_stat', label: '99.999%' },
    { vis: 'micro_bacterias', label: '🦠' },
    { vis: 'micro_virus', label: '🧬' },
    { vis: 'micro_hongos', label: '🍄' },
    { vis: 'micro_esporas', label: '🛡️' },
    { vis: 'mito_olor', label: '👃' },
    { vis: 'mito_fria', label: '❄️ 4°C' },
    { vis: 'mito_espuma', label: '🫧' }
  ],
  3: [
    { vis: 'compat_acero', label: '✅ Acero' },
    { vis: 'compat_hule', label: '✅ Hule/Plástico' },
    { vis: 'compat_cobre', label: '⛔ Cobre' },
    { vis: 'compat_aluminio', label: '⛔ Aluminio' },
    { vis: 'compat_cloro', label: '☠️ ¡Cloro!' }
  ],
  5: [
    { vis: 'paso_1', label: '1. Limpiar' },
    { vis: 'paso_2', label: '2. Aplicar' },
    { vis: 'paso_3', label: '3. 5–10 min' },
    { vis: 'paso_4', label: '4. Enjuague' }
  ],
  7: [
    { vis: 'store_vertical', label: '🛢️ 20L' },
    { vis: 'store_fresco', label: '🌬️ 12m' },
    { vis: 'store_nunca', label: '🚫 Sol' },
    { vis: 'store_calor', label: '🌡️ 39°C' },
    { vis: 'store_ok', label: '🌡️ 22°C' }
  ],
  8: [
    { vis: 'em_ojos', label: '👁️ Ojos' },
    { vis: 'em_piel', label: '🚿 Piel' },
    { vis: 'em_inhalacion', label: '🌬️ Inhalación' },
    { vis: 'em_ingestion', label: '🚫 Ingestión' },
    { vis: 'em_derrame', label: '⚠️ Derrame' }
  ]
};

const stageDefaultTags = {
  1: '✨ Perfil del Producto · Toca a Gemi',
  3: '🔬 Compatibilidad y Regla de Oro',
  5: '📋 Rutina Práctica en 4 Pasos',
  6: '🛡️ Equipo de Protección Personal (EPP)',
  7: '📦 Almacenamiento Seguro',
  8: '🚑 Protocolos de Emergencia (3D)'
};

function clearStageVisual() {
  if (stageVisualPane) {
    stageVisualPane.classList.add('hidden');
    stageVisualPane.classList.remove('theme-danger', 'theme-ok');
  }
  if (stageSplit) stageSplit.classList.remove('has-visual');
  if (stageAnimContent) stageAnimContent.innerHTML = '';
  if (em3DEl) em3DEl.classList.add('hidden');
  if (window.__playStageParticles) window.__playStageParticles(null);
  document.querySelectorAll('.stage-pip').forEach(p => p.classList.remove('active'));
  currentReadingEl = eppSpeechBubble;
}

function animatePopCounter(el) {
  let val = 92.0;
  const step = () => {
    val += (99.999 - val) * 0.16;
    if (99.999 - val < 0.005) el.textContent = '99.999%';
    else { el.textContent = val.toFixed(3) + '%'; requestAnimationFrame(step); }
  };
  requestAnimationFrame(step);
}

function showStageVisual(visKey) {
  if (!visKey || !stageVisualCatalog[visKey]) {
    clearStageVisual();
    return;
  }
  const cfg = stageVisualCatalog[visKey];
  if (eppStageTag && cfg.tag) eppStageTag.textContent = cfg.tag;

  stageVisualPane.classList.remove('hidden', 'theme-danger', 'theme-ok');
  if (cfg.theme) stageVisualPane.classList.add(cfg.theme);
  stageSplit.classList.add('has-visual');

  document.querySelectorAll('.stage-pip').forEach(p => {
    p.classList.toggle('active', p.dataset.vis === visKey);
  });

  if (cfg.em && em3DEl) {
    em3DEl.classList.remove('hidden');
    if (window.__setEmergency3D) window.__setEmergency3D(cfg.em);
  } else if (em3DEl) {
    em3DEl.classList.add('hidden');
  }

  let bodyHtml = '';
  if (cfg.counter) {
    bodyHtml += `<div class="pop-big-stat" id="stageCounterVal">92.000%</div>`;
  } else if (cfg.radial) {
    bodyHtml += `<div class="anim-radial-ring">${cfg.radial}</div>`;
  } else if (cfg.thermo) {
    const pct = Math.min(100, Math.round((cfg.thermo.temp / 45) * 100));
    const bg = cfg.thermo.danger ? '#EF4444' : '#2DD4BF';
    bodyHtml += `<div class="anim-thermo-track"><div class="anim-thermo-fill" style="width:${pct}%;background:${bg};"></div></div>`;
  } else if (cfg.icon) {
    bodyHtml += `<div class="pop-icon">${cfg.icon}</div>`;
  }

  if (cfg.title) bodyHtml += `<div class="pop-title">${cfg.title}</div>`;
  if (cfg.pills && cfg.pills.length) {
    bodyHtml += `<div class="pop-chip-row">` + cfg.pills.map(p => {
      const text = typeof p === 'string' ? p : p.text;
      const cls = typeof p === 'object' && p.cls ? p.cls : '';
      return `<span class="pop-pill ${cls}">${text}</span>`;
    }).join('') + `</div>`;
  }
  if (cfg.sub) bodyHtml += `<p class="pop-sub">${cfg.sub}</p>`;

  stageAnimContent.innerHTML = bodyHtml;
  const counterEl = document.getElementById('stageCounterVal');
  if (counterEl) animatePopCounter(counterEl);

  if (cfg.tone) playTone(220, 0.3, 'sawtooth', 0.05);
  if (window.__playStageParticles) window.__playStageParticles(cfg.particles || null);

  if (typeof gsap !== 'undefined') {
    gsap.fromTo(stageVisualPane, { opacity: 0, scale: 0.9, x: 18 }, { opacity: 1, scale: 1, x: 0, duration: 0.42, ease: 'back.out(1.6)' });
  }
  currentReadingEl = stageVisualPane;
  lookBuddyAtElement(stageVisualPane, 0.35);
}

const eppStageLabels = {
  ojos: '🥽 Gafas / Careta de Protección',
  guantes: '🧤 Guantes Largos de Nitrilo',
  bata: '🥼 Bata / Delantal Impermeable',
  mascarilla: '😷 Mascarilla para Vapores Ácidos'
};
const eppSpeeches = {
  ojos: 'Primero, gafas o careta de protección total para evitar cualquier salpicadura en los ojos.',
  guantes: 'Segundo, guantes largos de nitrilo o butilo para proteger nuestras manos.',
  bata: 'Tercero, bata o delantal impermeable para cuidar la piel y el uniforme.',
  mascarilla: 'Y cuarto, mascarilla para vapores ácidos trabajando siempre en un área bien ventilada.'
};

function resetEppGear() {
  ['ojos', 'guantes', 'bata', 'mascarilla'].forEach(k => {
    const l = document.getElementById(`eppGear-${k}`);
    if (l) l.classList.add('hidden');
  });
  document.querySelectorAll('.eq-pill').forEach(p => p.classList.remove('equipped'));
  if (eppStageTag) eppStageTag.textContent = '🛡️ Preparando EPP...';
}

function equipGemiEpp(zoneKey, keepPrevious = false) {
  ['ojos', 'guantes', 'bata', 'mascarilla'].forEach(k => {
    const layer = document.getElementById(`eppGear-${k}`);
    if (!layer) return;
    if (k === zoneKey) layer.classList.remove('hidden');
    else if (!keepPrevious) layer.classList.add('hidden');
  });
  document.querySelectorAll('.eq-pill').forEach(p => {
    if (p.dataset.eq === zoneKey) p.classList.add('equipped');
    else if (!keepPrevious) p.classList.remove('equipped');
  });
  if (eppStageTag && eppStageLabels[zoneKey]) eppStageTag.textContent = eppStageLabels[zoneKey];
  playBuddyGesture('wave');
}

function mountStageForSlide(idx) {
  if (!stageActorCard) return;
  clearStageVisual();
  if (!isStageSlide(idx)) {
    if (stagePool) stagePool.appendChild(stageActorCard);
    if (buddyEl) buddyEl.classList.remove('hidden-for-stage');
    return;
  }
  const slot = slides[idx] && slides[idx].querySelector('.stage-slot');
  if (slot) slot.appendChild(stageActorCard);
  if (buddyEl) buddyEl.classList.add('hidden-for-stage');

  if (eppGradCap) eppGradCap.classList.toggle('hidden', idx !== 5);
  if (eppEquippedBadges) eppEquippedBadges.classList.toggle('hidden', idx !== 6);
  if (idx !== 6) resetEppGear();
  if (eppStageTag) eppStageTag.textContent = stageDefaultTags[idx] || '✨ Gemi en Escena';

  if (stageStepDots) {
    const pips = stagePipsBySlide[idx] || [];
    stageStepDots.innerHTML = pips.map(p =>
      `<button type="button" class="stage-pip" data-vis="${p.vis}">${p.label}</button>`
    ).join('');
    stageStepDots.querySelectorAll('.stage-pip').forEach(btn => {
      btn.addEventListener('click', () => {
        stopSlideTour();
        const visKey = btn.dataset.vis;
        const match = (autoScripts[idx] || []).find(c => c.vis === visKey);
        const speech = match ? match.s : '';
        const mood = match && match.mood ? match.mood : 'normal';
        setBuddyMood(mood, speech, false);
        showStageVisual(visKey);
        playBuddyGesture(mood === 'alert' ? 'alertShake' : 'point');
        if (speech) speakWithLipSync(speech);
      });
    });
  }
}

document.querySelectorAll('.eq-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    stopSlideTour();
    const zone = pill.dataset.eq;
    equipGemiEpp(zone, false);
    const speech = eppSpeeches[zone] || '';
    setBuddyMood('normal', speech, false);
    currentReadingEl = eppSpeechBubble;
    lookBuddyAtElement(eppSpeechBubble, 0.08, pill);
    playTone(660, 0.06);
    if (speech) speakWithLipSync(speech);
  });
});

if (eppGemiSvg) {
  eppGemiSvg.addEventListener('click', () => {
    if (autoMode) return;
    if (slideTourRunning) {
      stopSlideTour();
      clearStageVisual();
      setBuddyMood('normal', buddyLines[currentSlide] || 'Toca a Gemi para continuar.', false);
    } else {
      startSlideTour(currentSlide);
    }
  });
}

// ===== 2F. ORQUESTADOR DE PRESENTACIÓN Y SPOTLIGHT =====
function clearGemiFocus() {
  document.querySelectorAll('.gemi-focus').forEach(n => n.classList.remove('gemi-focus'));
  document.querySelectorAll('.slide.stage-dimming').forEach(s => s.classList.remove('stage-dimming'));
}

async function focusBuddyOn(el, mode = 'glide', scaleMul = 1) {
  clearGemiFocus();
  currentReadingEl = el || null;
  if (!el || isStageSlide()) return;
  const r0 = el.getBoundingClientRect();
  if (r0.top < 70 || r0.bottom > window.innerHeight - 70) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await waitMs(480);
  }
  el.classList.add('gemi-focus');
  if (slides[currentSlide]) slides[currentSlide].classList.add('stage-dimming');
  moveBuddyToElement(el, mode, scaleMul);
  await waitMs(mode === 'teleport' ? 420 : 320);
  faceBuddyToward(el);
  lookBuddyAtElement(el, 0.08);
  playBuddyGesture(scaleMul > 1.1 ? 'point' : 'land');
}

function gemiSpotlightReact(el, speechText, opts = {}) {
  const { mood = 'normal', gesture = 'point', speak = false, scaleMul = 1.08 } = opts;
  if (autoMode || slideTourRunning) return;
  clearGemiFocus();
  currentReadingEl = el || null;
  if (el && !isStageSlide()) {
    el.classList.add('gemi-focus');
    if (slides[currentSlide]) slides[currentSlide].classList.add('stage-dimming');
    moveBuddyToElement(el, 'glide', scaleMul);
    faceBuddyToward(el);
  }
  setBuddyMood(mood, speechText, speak);
  lookBuddyAtElement(el, 0.1);
  playBuddyGesture(gesture);
}

async function runSlideScript(idx, alive) {
  const chunks = autoScripts[idx] || [{ t: 'h2', s: buddyLines[idx] }];
  for (let c = 0; c < chunks.length; c++) {
    if (!alive()) return;
    const ch = chunks[c];
    if (ch.quiz) { await runAutoQuiz(alive); continue; }

    setBuddyMood(ch.mood || 'normal', ch.s, false);

    if (isStageSlide(idx)) {
      if ('vis' in ch) showStageVisual(ch.vis);
      if (ch.a) { try { ch.a(); } catch (e) {} }
      playBuddyGesture(ch.mood === 'alert' ? 'alertShake' : 'point');
    } else {
      const el = ch.t ? slides[idx].querySelector(ch.t) : null;
      const mode = c % 2 === 0 ? 'teleport' : 'glide';
      const scaleMul = c % 3 === 0 ? 1.25 : 1;
      await focusBuddyOn(el, mode, scaleMul);
      if (!alive()) return;
      if (ch.a) { try { ch.a(); } catch (e) {} }
      if (ch.mood === 'alert') playBuddyGesture('alertShake');
    }

    await speakChunk(ch.s, alive);
    if (!alive()) return;
    await sleepAuto(ch.pause || 380);
  }
  if (isStageSlide(idx) && idx !== 6) clearStageVisual();
  clearGemiFocus();
}

function stopSlideTour() {
  slideTourRunning = false;
  slideTourGen++;
  clearTimeout(autoStepTimer);
  clearGemiFocus();
  stopActiveVoice();
}

async function startSlideTour(idx) {
  stopAutoPresentation();
  stopSlideTour();
  slideTourRunning = true;
  const myGen = ++slideTourGen;
  const alive = () => slideTourRunning && myGen === slideTourGen && currentSlide === idx;
  await runSlideScript(idx, alive);
  if (alive()) stopSlideTour();
}

async function runAutoQuiz(alive) {
  const letters = ['A', 'B', 'C', 'D'];
  for (let q = 0; q < quizData.length; q++) {
    if (!alive()) return;
    const item = quizData[q];
    setBuddyMood('normal', `❓ ${item.q}`, false);
    await focusBuddyOn(document.getElementById('quizQuestion'), q % 2 ? 'glide' : 'teleport', q % 2 ? 1 : 1.2);
    const spoken = `Pregunta ${q + 1}. ${item.q} ` + item.options.map((o, i) => `Opción ${letters[i]}: ${o}.`).join(' ');
    await speakChunk(spoken, alive);
    for (let s = 5; s > 0; s--) {
      if (!alive()) return;
      setBuddyMood('normal', `🤔 Piénsenlo... ${s}`, false);
      await sleepAuto(1000);
    }
    if (!alive()) return;
    const btn = quizOptions.children[item.correct];
    if (btn) { await focusBuddyOn(btn, 'glide'); btn.click(); }
    await sleepAuto(500);
    if (!alive()) return;
    setBuddyMood('happyOpen', item.feedback, false);
    await speakChunk(`La respuesta correcta es la opción ${letters[item.correct]}. ${item.feedback}`, alive);
    await sleepAuto(600);
    if (q < quizData.length - 1 && alive()) btnQuizNext.click();
  }
}

async function runAutoFrom(startIdx) {
  stopSlideTour();
  const gen = ++autoGen;
  const alive = () => autoMode && gen === autoGen;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  await sleepAuto(150);

  for (let idx = startIdx; idx < slides.length; idx++) {
    if (!alive()) return;
    if (currentSlide !== idx) openSlide(idx);
    else updateBuddyForSlide(idx);
    await sleepAuto(750);
    if (!alive()) return;
    await runSlideScript(idx, alive);
    if (!alive()) return;
    await sleepAuto(500);
  }
  if (alive()) stopAutoPresentation();
}

function stopAutoPresentation() {
  autoMode = false;
  autoGen++;
  clearTimeout(autoStepTimer);
  clearGemiFocus();
  if (btnAutoPlay) {
    btnAutoPlay.classList.remove('active');
    btnAutoPlay.innerHTML = '<span>🤖 Auto</span>';
  }
  stopActiveVoice();
}

function startAutoPresentation() {
  autoMode = true;
  if (btnAutoPlay) {
    btnAutoPlay.classList.add('active');
    btnAutoPlay.innerHTML = '<span>⏸️ Pausar Auto</span>';
  }
  runAutoFrom(currentSlide);
}

if (btnAutoPlay) {
  btnAutoPlay.addEventListener('click', () => {
    if (autoMode) stopAutoPresentation();
    else startAutoPresentation();
  });
}

// ===== 3. NAVEGACIÓN DE DIAPOSITIVAS =====
const slides = Array.from(document.querySelectorAll('.slide'));
let currentSlide = 0;

const progressBar = document.getElementById('progressBar');
const slideCounter = document.getElementById('slideCounter');
const dotsNav = document.getElementById('dotsNav');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const notesDrawer = document.getElementById('notesDrawer');
const notesBody = document.getElementById('notesBody');
const notesTime = document.getElementById('notesTime');
const btnNotes = document.getElementById('btnNotes');
const menuModal = document.getElementById('menuModal');
const menuList = document.getElementById('menuList');

slides.forEach((s, i) => {
  const dot = document.createElement('button');
  dot.className = 'dot' + (i === 0 ? ' active' : '');
  dot.title = `${i + 1}. ${s.dataset.title}`;
  dot.addEventListener('click', () => { stopAutoPresentation(); openSlide(i); });
  dotsNav.appendChild(dot);

  const item = document.createElement('button');
  item.className = 'menu-item';
  item.innerHTML = `<span>${i + 1}. ${s.dataset.title}</span><span>${s.dataset.time}</span>`;
  item.addEventListener('click', () => {
    stopAutoPresentation();
    openSlide(i);
    menuModal.classList.add('hidden');
  });
  menuList.appendChild(item);
});

const pixelPortal = document.getElementById('pixelPortal');

function runFuturisticTransition(prevSlide, nextSlideEl) {
  if (typeof gsap === 'undefined') {
    prevSlide.classList.remove('active');
    nextSlideEl.classList.add('active');
    return;
  }
  gsap.killTweensOf([prevSlide, nextSlideEl, pixelPortal]);
  const origin = window.__getPixelOrigin2D ? window.__getPixelOrigin2D() : { x: 50, y: 50 };
  const exitPt = window.__getPixelOrigin2D ? window.__getPixelOrigin2D() : { x: 25, y: 35 };
  const oxPx = (origin.x / 100) * window.innerWidth;
  const oyPx = (origin.y / 100) * window.innerHeight;

  if (prevSlide !== nextSlideEl) {
    gsap.to(prevSlide, {
      opacity: 0, scale: 0.05, transformOrigin: `${exitPt.x}% ${exitPt.y}%`,
      borderRadius: '18px', duration: 0.38, ease: 'power3.in',
      onComplete: () => { prevSlide.classList.remove('active'); gsap.set(prevSlide, { clearProps: 'all' }); }
    });
  }
  if (pixelPortal) {
    pixelPortal.classList.remove('hidden');
    gsap.fromTo(pixelPortal,
      { left: oxPx - 9, top: oyPx - 9, width: 18, height: 18, opacity: 1, borderRadius: '3px' },
      { left: 0, top: 58, width: window.innerWidth, height: Math.max(200, window.innerHeight - 118), opacity: 0, borderRadius: '18px', duration: 0.68, ease: 'power3.out', onComplete: () => pixelPortal.classList.add('hidden') }
    );
  }
  nextSlideEl.classList.add('active');
  gsap.set(nextSlideEl, { clearProps: 'all', opacity: 1, zIndex: 3 });
  gsap.fromTo(nextSlideEl,
    { opacity: 0.25, scale: 0.035, transformOrigin: `${origin.x}% ${origin.y}%`, clipPath: 'inset(35% 35% 35% 35% round 16px)' },
    { opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.68, delay: 0.06, ease: 'power3.out', clearProps: 'transform,clipPath,transformOrigin' }
  );
  const targets = nextSlideEl.querySelectorAll('.stagger, .glass-card');
  gsap.fromTo(targets, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, stagger: 0.045, delay: 0.22, ease: 'power3.out', overwrite: 'auto' });
}

function openSlide(index) {
  if (index < 0 || index >= slides.length) return;
  const prev = slides[currentSlide];
  currentSlide = index;
  window.__activeSlideIndex = currentSlide;
  const next = slides[currentSlide];

  if (prev === next) next.classList.add('active');
  else runFuturisticTransition(prev, next);

  progressBar.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;
  slideCounter.textContent = `${currentSlide + 1} / ${slides.length}`;
  btnPrev.disabled = currentSlide === 0;
  btnNext.disabled = currentSlide === slides.length - 1;

  Array.from(dotsNav.children).forEach((d, idx) => d.classList.toggle('active', idx === currentSlide));
  Array.from(menuList.children).forEach((m, idx) => m.classList.toggle('current', idx === currentSlide));

  notesBody.textContent = slides[currentSlide].dataset.notes || '';
  notesTime.textContent = `Tiempo sugerido: ${slides[currentSlide].dataset.time || ''}`;

  stopSlideTour();
  clearGemiFocus();
  mountStageForSlide(currentSlide);
  if (window.__triggerWarp3D) window.__triggerWarp3D();
  updateBuddyForSlide(currentSlide);

  const topbarEl = document.querySelector('.topbar');
  if (topbarEl) {
    topbarEl.classList.remove('hud-flash');
    void topbarEl.offsetWidth;
    topbarEl.classList.add('hud-flash');
  }
  playTone(520, 0.05, 'sine', 0.03);
}

let touchStartX = 0;
document.getElementById('deck').addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
document.getElementById('deck').addEventListener('touchend', (e) => {
  const diff = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(diff) > 55) { diff < 0 ? nextSlide() : prevSlide(); }
}, { passive: true });

function nextSlide() { openSlide(currentSlide + 1); }
function prevSlide() { openSlide(currentSlide - 1); }

btnPrev.addEventListener('click', () => { stopAutoPresentation(); prevSlide(); });
btnNext.addEventListener('click', () => { stopAutoPresentation(); nextSlide(); });

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); stopAutoPresentation(); nextSlide(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); stopAutoPresentation(); prevSlide(); }
  if (e.key.toLowerCase() === 'a') { autoMode ? stopAutoPresentation() : startAutoPresentation(); }
  if (e.key.toLowerCase() === 'n') toggleNotes();
  if (e.key.toLowerCase() === 'm') menuModal.classList.toggle('hidden');
  if (e.key.toLowerCase() === 'f') toggleFullscreen();
  if (e.key.toLowerCase() === 't') toggleTheme();
  if (e.key === '1') spawnReaction('👏');
  if (e.key === '2') spawnReaction('💚');
  if (e.key === '3') spawnReaction('🛡️');
  if (e.key === 'Escape') {
    menuModal.classList.add('hidden');
    document.getElementById('pocketModal').classList.add('hidden');
    document.getElementById('hazardOverlay').classList.add('hidden');
  }
});

function toggleNotes() {
  notesDrawer.classList.toggle('hidden');
  btnNotes.classList.toggle('active');
}
btnNotes.addEventListener('click', toggleNotes);
document.getElementById('btnCloseNotes').addEventListener('click', toggleNotes);
document.getElementById('btnMenu').addEventListener('click', () => menuModal.classList.toggle('hidden'));
document.getElementById('btnCloseMenu').addEventListener('click', () => menuModal.classList.add('hidden'));

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
}
document.getElementById('btnFullscreen').addEventListener('click', toggleFullscreen);

// ===== 4. TEMPORIZADOR 25:00 =====
let totalSeconds = 25 * 60;
let timerInterval = null;
const timerDisplay = document.getElementById('timerDisplay');
const btnTimer = document.getElementById('btnTimer');

function renderTimer() {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;
  btnTimer.classList.toggle('warning', totalSeconds <= 180);
}
btnTimer.addEventListener('click', () => {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; btnTimer.classList.remove('running'); }
  else {
    btnTimer.classList.add('running');
    timerInterval = setInterval(() => {
      if (totalSeconds > 0) { totalSeconds--; renderTimer(); }
      else { clearInterval(timerInterval); timerInterval = null; }
    }, 1000);
  }
});
document.getElementById('btnTimerReset').addEventListener('click', () => {
  clearInterval(timerInterval); timerInterval = null;
  totalSeconds = 25 * 60;
  btnTimer.classList.remove('running', 'warning');
  renderTimer();
});

// ===== 5. SLIDE 1: INTERACCIÓN EN PORTADA =====
document.querySelectorAll('.hero-highlights .hl-item').forEach((card, idx) => {
  card.addEventListener('click', () => {
    const line = (autoScripts[0] && autoScripts[0][2 + idx]) ? autoScripts[0][2 + idx].s : buddyLines[0];
    gemiSpotlightReact(card, line, { mood: 'happyOpen', gesture: 'point', speak: soundEnabled, scaleMul: 1.1 });
  });
});
const heroProductImg = document.querySelector('.floating-product');
if (heroProductImg) {
  heroProductImg.addEventListener('click', () => {
    const line = (autoScripts[0] && autoScripts[0][5]) ? autoScripts[0][5].s : buddyLines[0];
    gemiSpotlightReact(heroProductImg, line, { mood: 'happyOpen', gesture: 'cheer', speak: soundEnabled, scaleMul: 1.12 });
  });
}

// ===== 5B. TEMA CLARO / OSCURO (T) =====
const btnTheme = document.getElementById('btnTheme');
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  if (btnTheme) btnTheme.classList.toggle('active', document.body.classList.contains('light-mode'));
  playTone(640, 0.05);
}
if (btnTheme) btnTheme.addEventListener('click', toggleTheme);

// ===== 6. SLIDE 3: SIMULADOR 3D BIOCIDA =====
const btnRunSim = document.getElementById('btnRunSim');
const simEco = document.getElementById('simEcoOutputs');
const simCap = document.getElementById('simCaption');
const simPills = [document.getElementById('simP1'), document.getElementById('simP2'), document.getElementById('simP3')];
let simRunning = false;

btnRunSim.addEventListener('click', () => {
  if (simRunning) return;
  simRunning = true;
  btnRunSim.textContent = 'Simulando en 3D...';
  simEco.classList.remove('show');
  if (window.__setBiocideSimPhase) window.__setBiocideSimPhase(1);
  const simView = document.getElementById('simViewport');
  gemiSpotlightReact(simView, 'Fase 1: Ataque por oxidación rápida al patógeno 3D.', { gesture: 'point', speak: false });

  simPills.forEach((p, idx) => p.classList.toggle('active', idx === 0));
  simCap.textContent = 'Fase 1: Las moléculas rodean y oxidan al patógeno 3D.';

  setTimeout(() => {
    simPills.forEach((p, idx) => p.classList.toggle('active', idx === 1));
    if (window.__setBiocideSimPhase) window.__setBiocideSimPhase(2);
    simCap.textContent = 'Fase 2: En 5–10 minutos logra 99.999% de neutralización.';
    if (!autoMode) {
      setBuddyMood('normal', 'Fase 2: En 5–10 min logra 99.999% de reducción.', false);
      lookBuddyAtElement(simView, 0.55);
    }
  }, 1600);

  setTimeout(() => {
    simPills.forEach((p, idx) => p.classList.toggle('active', idx === 2));
    if (window.__setBiocideSimPhase) window.__setBiocideSimPhase(3);
    simEco.classList.add('show');
    simCap.textContent = 'Fase 3: ¡Cero residuos tóxicos! Oxígeno, Agua y Ácido Acético.';
    btnRunSim.textContent = '↻ Volver a simular';
    simRunning = false;
    gemiSpotlightReact(document.querySelector('.biodeg-banner'), '¡Cero residuos tóxicos! Solo O₂, Agua y Ácido Acético.', { mood: 'happyOpen', gesture: 'cheer', speak: false });
  }, 3200);
});

const hazardOverlay = document.getElementById('hazardOverlay');
document.getElementById('btnCloseHazard').addEventListener('click', () => {
  hazardOverlay.classList.add('hidden');
});

// ===== 8. SLIDE 5: CALCULADORA (SOLO 1:300 Y 1:75) + VASO 3D =====
const litersRange = document.getElementById('litersRange');
const litersValue = document.getElementById('litersValue');
const resRatio = document.getElementById('resRatio');
const resRinse = document.getElementById('resRinse');
const resAmount = document.getElementById('resAmount');
const resSub = document.getElementById('resSub');
const resDesc = document.getElementById('resDesc');

let activeTask = document.querySelector('.task-btn.active');
let currentDisplayedMl = 16.5;

function updateCalc() {
  const liters = parseInt(litersRange.value, 10);
  const mlPerLiter = parseFloat(activeTask.dataset.ml);
  const targetMl = liters * mlPerLiter;

  litersValue.textContent = `${liters} ${liters === 1 ? 'Litro' : 'Litros'}`;
  resRatio.textContent = `Dilución ${activeTask.dataset.ratio} · ${activeTask.dataset.ppm}`;
  resRinse.textContent = activeTask.dataset.rinse;
  resRinse.className = `res-rinse ${activeTask.dataset.rinseOk}`;
  resSub.textContent = `de SWIPE® Peracetic en ${liters} ${liters === 1 ? 'litro' : 'litros'} de agua`;
  resDesc.textContent = `📋 ${activeTask.dataset.desc}`;

  if (window.__setBeakerLevel3D) window.__setBeakerLevel3D(liters / 20);
  if (typeof gsap !== 'undefined') {
    const obj = { val: currentDisplayedMl };
    gsap.to(obj, {
      val: targetMl,
      duration: 0.35,
      onUpdate: () => { resAmount.textContent = `${obj.val.toFixed(1)} ml`; },
      onComplete: () => { currentDisplayedMl = targetMl; }
    });
  } else {
    resAmount.textContent = `${targetMl.toFixed(1)} ml`;
  }
}

document.querySelectorAll('.task-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.task-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTask = btn;
    updateCalc();
    const rinseNote = btn.dataset.rinseOk === 'ok'
      ? '✅ ¡Ojo! Esta dilución NO requiere enjuague posterior.'
      : '💧 Recuerda enjuagar después de los 5 a 10 minutos.';
    const resCard = document.querySelector('.calc-result-card');
    gemiSpotlightReact(resCard, rinseNote, { mood: btn.dataset.rinseOk === 'ok' ? 'happyOpen' : 'normal', gesture: 'nod', speak: false });
    lookBuddyAtElement(document.getElementById('resAmount'), 0.45);
  });
});
litersRange.addEventListener('input', () => {
  updateCalc();
  if (!autoMode) lookBuddyAtElement(document.getElementById('resAmount'), parseInt(litersRange.value, 10) / 20);
});
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    litersRange.value = btn.dataset.liters;
    updateCalc();
    if (!autoMode) lookBuddyAtElement(document.getElementById('resAmount'), 0.5);
  });
});

// ===== 9. REACCIONES RÁPIDAS Y CONFETI =====
function spawnReaction(emoji) {
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('div');
    el.className = 'reaction-bubble';
    el.textContent = emoji;
    el.style.left = `${15 + Math.random() * 70}%`;
    document.body.appendChild(el);
    if (typeof gsap !== 'undefined') {
      gsap.to(el, {
        y: -(260 + Math.random() * 220), x: (Math.random() - 0.5) * 90,
        opacity: 0, scale: 1.3, duration: 1.6 + Math.random() * 0.6,
        ease: 'power1.out', onComplete: () => el.remove()
      });
    } else el.remove();
  }
  playTone(720, 0.06);
}

// ===== 10. SLIDE 10: QUIZ (SOLO DILUCIONES 1:300 Y 1:75) =====
const quizData = [
  { q: '¿Con qué producto está PROHIBIDO mezclar SWIPE® Peracetic?', options: ['Agua fría', 'Cloro (lavandina) o productos clorados', 'Agua de la llave'], correct: 1, feedback: '¡Exacto! Mezclarlo con cloro libera inmediatamente gas cloro altamente tóxico.' },
  { q: '¿Cuál es el tiempo de contacto recomendado sobre la superficie?', options: ['5 a 10 segundos', '5 a 10 minutos', '2 horas'], correct: 1, feedback: '¡Correcto! Dejar actuar de 5 a 10 minutos asegura la desinfección efectiva.' },
  { q: 'Para dosis de choque y áreas críticas (500 ppm / 1:300), ¿cuánto se agrega por cada litro de agua?', options: ['3.3 ml por litro', '13.3 ml por litro', '50 ml por litro'], correct: 0, feedback: '¡Muy bien! 3.3 ml por litro (1:300) es la dilución indicada para dosis de choque y áreas críticas.' },
  { q: 'Si el producto concentrado salpica a los ojos, ¿qué hacemos primero?', options: ['Poner gotas oftálmicas', 'Enjuagar con abundante agua mínimo 15 minutos y buscar atención médica', 'Tallar con un paño seco'], correct: 1, feedback: '¡Así es! Enjuague inmediato con abundante agua al menos 15 minutos y atención médica urgente.' }
];

let qIndex = 0, qScore = 0;
const quizProgress = document.getElementById('quizProgress');
const quizScore = document.getElementById('quizScore');
const quizQuestion = document.getElementById('quizQuestion');
const quizOptions = document.getElementById('quizOptions');
const quizFeedback = document.getElementById('quizFeedback');
const btnQuizNext = document.getElementById('btnQuizNext');
const btnQuizRestart = document.getElementById('btnQuizRestart');

function spawnConfetti(count = 28) {
  const colors = ['#2DD4BF', '#38BDF8', '#FACC15', '#4ADE80'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.background = colors[i % colors.length];
    el.style.left = count > 40 ? `${15 + Math.random() * 70}%` : '50%';
    el.style.top = count > 40 ? '25%' : '55%';
    document.body.appendChild(el);
    if (typeof gsap !== 'undefined') {
      gsap.to(el, {
        x: (Math.random() - 0.5) * (count > 40 ? 600 : 420),
        y: (count > 40 ? 250 + Math.random() * 350 : (Math.random() - 0.7) * 320),
        rotation: Math.random() * 680, opacity: 0,
        duration: count > 40 ? 1.8 : 1.1, ease: 'power2.out',
        onComplete: () => el.remove()
      });
    } else el.remove();
  }
}

function renderQuiz() {
  const item = quizData[qIndex];
  quizProgress.textContent = `Pregunta ${qIndex + 1} de ${quizData.length}`;
  quizScore.textContent = `Aciertos: ${qScore}`;
  quizQuestion.textContent = item.q;
  quizFeedback.classList.add('hidden');
  const quizBadge = document.getElementById('quizBadge');
  if (quizBadge) quizBadge.classList.add('hidden');
  btnQuizNext.classList.add('hidden');
  btnQuizRestart.classList.add('hidden');
  quizOptions.innerHTML = '';

  item.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      const allBtns = Array.from(quizOptions.children);
      allBtns.forEach(b => b.disabled = true);
      if (idx === item.correct) { btn.classList.add('correct'); qScore++; quizScore.textContent = `Aciertos: ${qScore}`; playTone(780, 0.14); spawnConfetti(28); setBuddyMood('happyOpen', '¡Esooo! ¡Excelente respuesta! 🎉'); flipBuddyCelebration(); }
      else { btn.classList.add('wrong'); allBtns[item.correct].classList.add('correct'); playTone(260, 0.16, 'triangle'); setBuddyMood('normal', '¡Casi! Revisa la explicación arriba 💡'); }
      quizFeedback.textContent = item.feedback;
      quizFeedback.classList.remove('hidden');
      if (qIndex < quizData.length - 1) btnQuizNext.classList.remove('hidden');
      else {
        quizFeedback.textContent += ` — Resultado final: ${qScore} de ${quizData.length} aciertos.`;
        if (quizBadge) quizBadge.classList.remove('hidden');
        spawnConfetti(70);
        btnQuizRestart.classList.remove('hidden');
      }
    });
    quizOptions.appendChild(btn);
  });
}
btnQuizNext.addEventListener('click', () => {
  qIndex++;
  renderQuiz();
  if (!autoMode) { currentReadingEl = quizQuestion; moveBuddyToElement(quizQuestion, 'glide', 1.1); lookBuddyAtElement(quizQuestion, 0.25); }
});
btnQuizRestart.addEventListener('click', () => {
  qIndex = 0; qScore = 0;
  renderQuiz();
  if (!autoMode) { currentReadingEl = quizQuestion; moveBuddyToElement(quizQuestion, 'glide', 1.1); lookBuddyAtElement(quizQuestion, 0.25); }
});
const btnQuizSpeak = document.getElementById('btnQuizSpeak');
if (btnQuizSpeak) {
  btnQuizSpeak.addEventListener('click', () => {
    const letters = ['A', 'B', 'C', 'D'];
    const item = quizData[qIndex];
    if (!item) return;
    const spoken = `Pregunta ${qIndex + 1}. ${item.q} ` + item.options.map((o, i) => `Opción ${letters[i]}: ${o}.`).join(' ');
    gemiSpotlightReact(quizQuestion, spoken, { gesture: 'point', speak: soundEnabled, scaleMul: 1.15 });
  });
}

// Pocket Card Modal & QR
const pocketModal = document.getElementById('pocketModal');
document.getElementById('btnOpenPocket').addEventListener('click', () => pocketModal.classList.remove('hidden'));
document.getElementById('btnClosePocket').addEventListener('click', () => pocketModal.classList.add('hidden'));

const qrContainer = document.getElementById('qrContainer');
if (qrContainer && typeof QRCode !== 'undefined') {
  const qrUrl = window.location.protocol.startsWith('http') ? window.location.href : 'https://github.com';
  new QRCode(qrContainer, { text: qrUrl, width: 84, height: 84, colorDark: '#0B2D48', colorLight: '#ffffff' });
}

// ===== 11. MASCOTA PIXELADA GEMI ("GEMI") CON CAMINATA Y VOZ =====
const buddyEl = document.getElementById('geminiBuddy');
const buddyBubble = document.getElementById('buddyBubble');
const buddyEyes = document.getElementById('buddyEyes');
const buddyLines = [
  'Bienvenidos equipo de enfermería de Hospital Arboledas. Conozcamos SWIPE Peracetic.',
  'Conozcamos SWIPE Peracetic: 99.999 por ciento efectivo, sin olor ni espuma.',
  'Actúa por oxidación rápida y se biodegrada en agua, oxígeno y ácido acético.',
  'Regla de oro: nunca mezclar con cloro, porque libera gas tóxico.',
  'Usa la calculadora con las diluciones 1 a 300 y 1 a 75 según tu actividad.',
  'Recuerda los 4 pasos: limpiar, aplicar, esperar de 5 a 10 minutos y enjuagar si aplica.',
  'Al dosificar el concentrado, usa siempre gafas, guantes, bata y buena ventilación.',
  'Guarda el porrón siempre parado, bien cerrado y a menos de 35 grados.',
  'En caso de accidente, observa cada protocolo animado en escena.',
  'Llegó el Mini-Quiz. Vamos a comprobar lo aprendido.',
  'Muchas gracias. Escanea el código QR para llevar la guía en tu celular.'
];

let buddyX = 40;
let buddyY = Math.max(120, window.innerHeight - 190);
let buddyScale = 1.0;
let targetX = buddyX;
let targetY = buddyY;
const buddyPop = { v: 1 };
let buddyPaused = false;
let buddyParked = false;
let buddyResumeTimer = null;
const buddyQuickMenu = document.getElementById('buddyQuickMenu');
const btnParkBuddy = document.getElementById('btnParkBuddy');

function spawnBuddySparkles(cx, cy) {
  const cols = ['#2DD4BF', '#38BDF8', '#FACC15', '#F472B6'];
  for (let i = 0; i < 12; i++) {
    const sp = document.createElement('div');
    sp.className = 'buddy-sparkle';
    sp.style.background = cols[i % cols.length];
    sp.style.left = `${cx}px`;
    sp.style.top = `${cy}px`;
    document.body.appendChild(sp);
    if (typeof gsap !== 'undefined') {
      gsap.to(sp, {
        x: (Math.random() - 0.5) * 140, y: (Math.random() - 0.5) * 140,
        rotation: Math.random() * 360, scale: 0, opacity: 0, duration: 0.65,
        ease: 'power2.out', onComplete: () => sp.remove()
      });
    } else sp.remove();
  }
}

function teleportBuddyTo(x, y) {
  if (!buddyEl) return;
  if (typeof gsap === 'undefined') { buddyX = targetX = x; buddyY = targetY = y; return; }
  spawnBuddySparkles(buddyX + 40, buddyY + 40);
  gsap.killTweensOf(buddyEl);
  gsap.to(buddyEl, {
    opacity: 0, duration: 0.18,
    onComplete: () => {
      buddyX = targetX = x;
      buddyY = targetY = y;
      spawnBuddySparkles(x + 40, y + 40);
      gsap.fromTo(buddyPop, { v: 0.35 }, { v: 1, duration: 0.5, ease: 'back.out(2.4)' });
      gsap.to(buddyEl, { opacity: 1, duration: 0.25 });
    }
  });
}

function placeBuddyNear(rect, scaleMul = 1) {
  const mobile = window.innerWidth < 700;
  const s = mobile ? 0.76 : 1.08 * scaleMul;
  buddyScale = s;
  const w = buddyEl.offsetWidth || 90;
  const h = buddyEl.offsetHeight || 130;
  const bw = w * s;
  const bh = h * s;
  const topLimit = 58;
  const bottomLimit = Math.max(topLimit, window.innerHeight - 56 - bh);
  if (mobile) return { x: 8 - (w - bw) / 2, y: bottomLimit - (h - bh) / 2 };

  let vx = rect.right + 12;
  let vy = rect.top + Math.min(rect.height / 2, 90) - bh / 2;
  if (vx + bw > window.innerWidth - 8) vx = rect.left - bw - 12;
  if (vx < 8) {
    vx = Math.min(window.innerWidth - bw - 8, Math.max(8, rect.left + rect.width / 2 - bw / 2));
    vy = rect.bottom + bh + 8 < window.innerHeight - 54 ? rect.bottom + 8 : rect.top - bh - 8;
  }
  vy = Math.max(topLimit, Math.min(bottomLimit, vy));
  return { x: vx - (w - bw) / 2, y: vy - (h - bh) / 2 };
}

function moveBuddyToElement(el, mode = 'glide', scaleMul = 1) {
  if (!buddyEl || buddyParked || !el || isStageSlide()) return;
  const { x, y } = placeBuddyNear(el.getBoundingClientRect(), scaleMul);
  if (mode === 'teleport') teleportBuddyTo(x, y);
  else { targetX = x; targetY = y; }
}

const buddyZzz = document.getElementById('buddyZzz');
let lastActivityTime = Date.now();
let buddySleeping = false;

function wakeBuddy() {
  lastActivityTime = Date.now();
  if (buddySleeping) {
    buddySleeping = false;
    if (buddyZzz) buddyZzz.classList.add('hidden');
    setBuddyMood('normal');
  }
}
['mousemove', 'keydown', 'click', 'touchstart'].forEach(ev => window.addEventListener(ev, wakeBuddy, { passive: true }));

function flipBuddyCelebration() {
  if (!buddyEl) return;
  spawnBuddySparkles(buddyX + 32, buddyY + 32);
  const svg = document.getElementById('buddySvg');
  if (svg && typeof gsap !== 'undefined') {
    gsap.fromTo(svg, { rotation: 0, y: 0 }, { rotation: 360, y: -26, duration: 0.7, ease: 'back.out(1.6)', onComplete: () => gsap.set(svg, { clearProps: 'rotation,y' }) });
  }
}

function speakBuddy(text) {
  speakWithLipSync(text, () => {
    buddyPaused = false;
    if (buddyEl && !buddyParked) buddyEl.classList.add('walking');
  });
}

const normalEyesHtml = '<rect x="5" y="5" width="2" height="2" fill="#2DD4BF"/><rect x="9" y="5" width="2" height="2" fill="#2DD4BF"/><g id="buddyPupils"><rect x="5.55" y="5.55" width="0.9" height="0.9" fill="#020617"/><rect x="9.55" y="5.55" width="0.9" height="0.9" fill="#020617"/><rect x="5.15" y="5.15" width="0.38" height="0.38" fill="#F8FAFC"/><rect x="9.15" y="5.15" width="0.38" height="0.38" fill="#F8FAFC"/></g>';
const happyOpenEyesHtml = '<rect x="5" y="5" width="2" height="2" fill="#4ADE80"/><rect x="9" y="5" width="2" height="2" fill="#4ADE80"/><g id="buddyPupils"><rect x="5.55" y="5.55" width="0.9" height="0.9" fill="#020617"/><rect x="9.55" y="5.55" width="0.9" height="0.9" fill="#020617"/><rect x="5.15" y="5.15" width="0.38" height="0.38" fill="#F8FAFC"/><rect x="9.15" y="5.15" width="0.38" height="0.38" fill="#F8FAFC"/></g>';
const alertEyesHtml = '<rect x="5" y="4" width="2" height="3" fill="#EF4444"/><rect x="9" y="4" width="2" height="3" fill="#EF4444"/><g id="buddyPupils"><rect x="5.55" y="5.0" width="0.9" height="1.15" fill="#020617"/><rect x="9.55" y="5.0" width="0.9" height="1.15" fill="#020617"/></g>';
const happyEyesHtml = '<rect x="5" y="5" width="2" height="1" fill="#4ADE80"/><rect x="9" y="5" width="2" height="1" fill="#4ADE80"/><rect x="4" y="6" width="1" height="1" fill="#4ADE80"/><rect x="7" y="6" width="1" height="1" fill="#4ADE80"/><rect x="8" y="6" width="1" height="1" fill="#4ADE80"/><rect x="11" y="6" width="1" height="1" fill="#4ADE80"/>';

function setBuddyMood(mood, text, shouldSpeak = false) {
  if (!buddyEyes || !buddyBubble) return;
  if (text) {
    setBubbleContent(buddyBubble, text);
    buddyBubble.classList.remove('collapsed');
    if (eppSpeechBubble && isStageSlide()) setBubbleContent(eppSpeechBubble, text);
    buddyPaused = true;
    clearTimeout(buddyResumeTimer);
    buddyResumeTimer = setTimeout(() => { buddyPaused = false; }, 5200);
    if (shouldSpeak) speakBuddy(text);
  }
  const eppEyesEl = document.getElementById('eppEyes');
  if (mood === 'happy') {
    buddyEyes.innerHTML = happyEyesHtml;
    if (eppEyesEl) eppEyesEl.innerHTML = happyEyesHtml;
  } else if (mood === 'happyOpen') {
    buddyEyes.innerHTML = happyOpenEyesHtml;
    if (eppEyesEl) eppEyesEl.innerHTML = happyOpenEyesHtml.replace('buddyPupils', 'eppPupils');
  } else if (mood === 'alert') {
    buddyEyes.innerHTML = alertEyesHtml;
    if (eppEyesEl) eppEyesEl.innerHTML = alertEyesHtml.replace('buddyPupils', 'eppPupils');
  } else {
    buddyEyes.innerHTML = normalEyesHtml;
    if (eppEyesEl) eppEyesEl.innerHTML = normalEyesHtml.replace('buddyPupils', 'eppPupils');
  }
  applyGazeAttrs();
}

function updateBuddyForSlide(idx) {
  if (autoMode || slideTourRunning) return;
  const line = buddyLines[idx] || '¡Seguimos!';
  const curtainHidden = welcomeCurtain ? welcomeCurtain.classList.contains('hidden') : true;

  if (isStageSlide(idx)) {
    currentReadingEl = eppSpeechBubble;
    setBuddyMood(idx === 3 ? 'alert' : 'normal', line, curtainHidden);
    return;
  }

  const header = slides[idx] ? slides[idx].querySelector('.slide-header, .closing-left h2, h1') : null;
  currentReadingEl = header || null;
  if (curtainHidden && header) {
    setTimeout(() => {
      if (!autoMode && !slideTourRunning && currentSlide === idx) {
        moveBuddyToElement(header, 'teleport', 1.15);
        faceBuddyToward(header);
        lookBuddyAtElement(header, 0.25);
      }
    }, 750);
  }
  if (idx === 10 && curtainHidden) {
    setBuddyMood('happy', line, true);
    spawnConfetti(48);
    playBuddyGesture('cheer');
    const svg = document.getElementById('buddySvg');
    if (svg && typeof gsap !== 'undefined') gsap.fromTo(svg, { scaleY: 1 }, { scaleY: 0.78, duration: 0.35, yoyo: true, repeat: 1 });
    return;
  }
  setBuddyMood(idx === 3 ? 'alert' : 'normal', line, curtainHidden);
}

if (buddyEl) {
  let tPhase = 0;
  function walkLoop() {
    tPhase += 0.04;
    if (!buddyParked) {
      const dx = targetX - buddyX;
      const dy = targetY - buddyY;
      const dist = Math.hypot(dx, dy);
      if (dist > 2) {
        buddyX += dx * 0.1;
        buddyY += dy * 0.1;
        if (Math.abs(dx) > 4) buddyEl.classList.toggle('facing-left', dx < 0);
        buddyEl.classList.add('walking');
      } else {
        buddyEl.classList.remove('walking');
      }
    }
    const baseS = buddyParked ? 1.0 : buddyScale;
    const breath = buddyEl.classList.contains('speaking') ? Math.sin(tPhase * 2) * 0.04 : Math.sin(tPhase) * 0.03;
    const s = (baseS + breath) * buddyPop.v;
    const tilt = buddyEl.classList.contains('walking') ? Math.max(-6, Math.min(6, (targetX - buddyX) * 0.08)) : 0;
    buddyEl.style.transform = `translate3d(${buddyX.toFixed(1)}px, ${buddyY.toFixed(1)}px, 0) scale(${s.toFixed(3)}) rotate(${tilt.toFixed(1)}deg)`;
    requestAnimationFrame(walkLoop);
  }
  requestAnimationFrame(walkLoop);

  buddyEl.addEventListener('click', () => {
    spawnBuddySparkles(buddyX + 32, buddyY + 32);
    if (autoMode) return;
    if (slideTourRunning) {
      stopSlideTour();
      setBuddyMood('normal', buddyLines[currentSlide], false);
    } else {
      startSlideTour(currentSlide);
    }
  });

  const openBqm = (e) => { e.preventDefault(); if (buddyQuickMenu) buddyQuickMenu.classList.toggle('hidden'); };
  buddyEl.addEventListener('dblclick', openBqm);
  buddyEl.addEventListener('contextmenu', openBqm);

  if (buddyQuickMenu) {
    document.getElementById('btnCloseBqm').addEventListener('click', () => buddyQuickMenu.classList.add('hidden'));
    buddyQuickMenu.querySelectorAll('.bqm-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'explain') startSlideTour(currentSlide);
        else if (act === 'greet') {
          setBuddyMood('happy', '¡Bienvenidos personal de enfermería de Hospital Arboledas! Es un gusto saludarlos.', true);
          spawnBuddySparkles(buddyX + 32, buddyY + 32);
          playBuddyGesture('wave');
        } else if (act === 'celebrate') {
          setBuddyMood('happy', '¡Excelente participación equipo! 🎉', true);
          spawnConfetti(45);
          playBuddyGesture('cheer');
        } else if (act === 'park') {
          buddyParked = !buddyParked;
          if (buddyParked) {
            buddyX = targetX = 22; buddyY = targetY = window.innerHeight - 160;
            buddyEl.classList.remove('walking', 'facing-left');
            btnParkBuddy.textContent = '🚶‍♂️ Volver a caminar';
          } else {
            buddyEl.classList.add('walking');
            btnParkBuddy.textContent = '📌 Estacionar en esquina';
          }
        } else if (btn.dataset.faq) {
          setBuddyMood('normal', btn.dataset.faq, true);
        }
        buddyQuickMenu.classList.add('hidden');
      });
    });
  }

  setInterval(() => {
    const curtainHidden = welcomeCurtain ? welcomeCurtain.classList.contains('hidden') : true;
    if (curtainHidden && !buddyPaused && !buddySleeping && !autoMode && !slideTourRunning && Date.now() - lastActivityTime > 14000) {
      buddySleeping = true;
      if (buddyZzz) buddyZzz.classList.remove('hidden');
      if (buddyEyes) buddyEyes.innerHTML = '<rect x="5" y="6" width="2" height="1" fill="#64748B"/><rect x="9" y="6" width="2" height="1" fill="#64748B"/>';
      return;
    }
    if (buddySleeping || !buddyEyes || !buddyEyes.querySelector('#buddyPupils')) return;
    if (typeof anime !== 'undefined') {
      anime({ targets: '#buddyBlink, #eppBlink', scaleY: [1, 0.08, 1], duration: 190, easing: 'easeInOutQuad' });
    }
  }, 3800);
}

// Init
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('nocurtain') === '1' && welcomeCurtain) welcomeCurtain.classList.add('hidden');
const startIdx = parseInt(urlParams.get('slide'), 10);
openSlide(!isNaN(startIdx) && startIdx >= 0 && startIdx < slides.length ? startIdx : 0);
updateCalc();
renderQuiz();
