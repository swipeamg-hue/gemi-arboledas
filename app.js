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

// ===== 2C. MODO PRESENTACIÓN AUTOMÁTICA CON GEMI (A) — GUION POR FRASES SINCRONIZADO =====
let autoMode = false;
let autoStepTimer = null;
let autoGen = 0;
const btnAutoPlay = document.getElementById('btnAutoPlay');

const waitMs = (ms) => new Promise(r => setTimeout(r, ms));
const sleepAuto = (ms) => new Promise(r => { autoStepTimer = setTimeout(r, ms); });
const clickInSlide = (sel) => { const el = slides[currentSlide].querySelector(sel); if (el) el.click(); };
const setLiters = (v) => { if (litersRange) { litersRange.value = v; updateCalc(); } };
const setThermo = (v) => { if (thermoRange) { thermoRange.value = v; thermoRange.dispatchEvent(new Event('input')); } };
const highlightStep = (i) => {
  stepBoxes.forEach((x, j) => { x.classList.toggle('teaching', j === i); x.classList.toggle('dimmed', j !== i); });
  if (stepBoxes[i]) { stepBoxes[i].classList.add('done'); stepBoxes[i].querySelector('.step-check').textContent = '✓'; }
};
const activateEpp = (zone) => {
  eppCards.forEach(x => x.classList.toggle('active-epp', x.dataset.zone === zone));
  equipGemiEpp(zone, true);
  const card = eppCards.find(x => x.dataset.zone === zone);
  if (card && eppHint) eppHint.textContent = card.dataset.hint;
  playBuddyGesture('wave');
};
const flipCard = (n) => { const fc = slides[currentSlide].querySelector(`.flip-card:nth-child(${n})`); if (fc) fc.classList.add('flipped'); };

// Cada diapositiva = lista de frases. t: elemento al que Gemi se acerca · s: lo que dice · a: acción en pantalla
const autoScripts = [
  [
    { t: 'h1', s: 'Hola, ¿cómo están? Bienvenidos, equipo de enfermería de Hospital Arboledas. Yo soy Gemi, su asistente virtual, y hoy los voy a acompañar durante esta sesión.' },
    { t: '.lead', s: 'En los próximos minutos vamos a conocer Swipe Peracetic, un desinfectante rápido, práctico y biodegradable, pensado para el cuidado diario de nuestros pacientes.' },
    { t: '.hl-item:nth-child(1)', s: 'Lo primero que deben saber: actúa muy rápido. Con solo 5 a 10 minutos de contacto logra eliminar el 99.999 por ciento de los microorganismos.' },
    { t: '.hl-item:nth-child(2)', s: 'Además, no deja residuos tóxicos, porque se descompone en agua, oxígeno y ácido acético, que es básicamente un vinagre suave.' },
    { t: '.hl-item:nth-child(3)', s: 'Y es muy fácil de usar en su turno: no hace espuma, no deja olor y funciona incluso con agua fría.' },
    { t: '.floating-product', s: 'Este es el producto. Viene en un porrón de 20 litros, del cual solo usaremos unos cuantos mililitros cada vez. ¡Comencemos!' }
  ],
  [
    { t: 'h2', s: '¿Qué es Swipe Peracetic? Es un desinfectante líquido a base de ácido peracético, en una concentración del 14 al 16 por ciento.' },
    { t: '.stat-hero-card', s: 'En pruebas de laboratorio logró eliminar el 99.999 por ciento de la bacteria E. coli, en apenas 30 segundos de contacto.' },
    { t: '#microbeGrid .microbe-card:nth-child(1)', a: () => clickInSlide('#microbeGrid .microbe-card:nth-child(1)'), s: 'Elimina bacterias de forma rápida, tanto en superficies como en instrumental.' },
    { t: '#microbeGrid .microbe-card:nth-child(2)', a: () => clickInSlide('#microbeGrid .microbe-card:nth-child(2)'), s: 'También inactiva virus, con un amplio espectro de desinfección hospitalaria.' },
    { t: '#microbeGrid .microbe-card:nth-child(3)', a: () => clickInSlide('#microbeGrid .microbe-card:nth-child(3)'), s: 'Controla hongos y levaduras, sobre todo en zonas húmedas.' },
    { t: '#microbeGrid .microbe-card:nth-child(4)', a: () => clickInSlide('#microbeGrid .microbe-card:nth-child(4)'), s: 'E incluso esporas, cuando lo usamos en su dilución más alta como esterilizante químico.' },
    { t: '.flip-card:nth-child(1)', a: () => flipCard(1), s: 'Ahora rompamos algunos mitos. ¿Deja olor fuerte? No, no deja olor ni color.' },
    { t: '.flip-card:nth-child(2)', a: () => flipCard(2), s: '¿Necesita agua caliente? Tampoco. Funciona incluso con agua fría, de hasta 4 grados.' },
    { t: '.flip-card:nth-child(3)', a: () => flipCard(3), s: '¿Hace mucha espuma? Para nada. No genera espuma, así que es muy fácil de aplicar y de retirar.' }
  ],
  [
    { t: 'h2', s: 'Ahora veamos cómo actúa, con una simulación en tres dimensiones.' },
    { t: '#simViewport', a: () => { if (btnRunSim) btnRunSim.click(); }, s: 'Primero, las moléculas de ácido peracético rodean al microorganismo y rompen su pared celular por oxidación.' },
    { t: '#simViewport', s: 'En 5 a 10 minutos de contacto, el microorganismo queda totalmente neutralizado.' },
    { t: '.biodeg-banner', s: 'Y lo mejor: después de actuar, el producto se transforma en oxígeno, agua y ácido acético. Por eso es cien por ciento biodegradable.' }
  ],
  [
    { t: 'h2', s: 'Esto es muy importante para su día a día: ¿dónde sí y dónde no debemos aplicarlo?' },
    { t: '.mat-chip:nth-child(1)', a: () => clickInSlide('.mat-chip:nth-child(1)'), s: 'Sí es seguro en acero inoxidable. De hecho, ayuda a prevenir el sarro.' },
    { t: '.mat-chip:nth-child(3)', a: () => clickInSlide('.mat-chip:nth-child(3)'), s: 'También es compatible con hule, goma y la mayoría de los plásticos de grado médico.' },
    { t: '.mat-chip:nth-child(5)', a: () => clickInSlide('.mat-chip:nth-child(5)'), s: 'Pero cuidado: no debemos aplicarlo directamente en cobre.' },
    { t: '.mat-chip:nth-child(6)', a: () => clickInSlide('.mat-chip:nth-child(6)'), s: 'Ni en aluminio u otros metales suaves, porque puede corroerlos.' },
    { t: '#goldenRuleBox', mood: 'alert', a: () => { const b = document.getElementById('goldenRuleBox'); if (b) { b.classList.remove('hazard-flash'); void b.offsetWidth; b.classList.add('hazard-flash'); } playTone(220, 0.3, 'sawtooth', 0.05); }, s: 'Y ahora, la regla de oro, la más importante de toda la plática: nunca, nunca mezclen Swipe Peracetic con cloro.' },
    { t: '#goldenRuleBox', mood: 'alert', s: 'Al mezclarse con cloro se libera gas cloro, que es altamente tóxico. Así que siempre en recipientes separados.' }
  ],
  [
    { t: '#taskButtons', s: 'Ahora, la parte más práctica: ¿cuánto producto uso? Para eso tenemos esta calculadora.' },
    { t: '.task-btn:nth-child(1)', a: () => { clickInSlide('.task-btn:nth-child(1)'); setLiters(5); }, s: 'Para desinfectar superficies, como pisos, paredes o mesas, usamos 2 mililitros por cada litro de agua.' },
    { t: '.liters-control', a: () => setLiters(10), s: 'Si preparamos 10 litros de agua, la calculadora nos dice que necesitamos 20 mililitros de producto.' },
    { t: '.task-btn:nth-child(2)', a: () => clickInSlide('.task-btn:nth-child(2)'), s: 'Para áreas críticas, o una dosis de choque, usamos 3.3 mililitros por litro.' },
    { t: '.task-btn:nth-child(3)', a: () => { clickInSlide('.task-btn:nth-child(3)'); setLiters(5); }, s: 'Y para esterilizar equipo médico compatible, usamos 13.3 mililitros por litro. En este caso no se necesita enjuague.' },
    { t: '.calc-result-card', s: 'Un consejo: preparen la mezcla justo antes de usarla, y nunca regresen la mezcla sobrante al porrón original.' }
  ],
  [
    { t: '#stepsChecklist', s: 'Ahora sí, la rutina en el turno. Son solo cuatro pasos muy sencillos.' },
    { t: '#stepsChecklist .step-box:nth-child(1)', a: () => highlightStep(0), s: 'Paso uno, limpieza previa. Antes de desinfectar, retiren siempre la suciedad visible o la materia orgánica.' },
    { t: '#stepsChecklist .step-box:nth-child(2)', a: () => highlightStep(1), s: 'Paso dos, preparar y aplicar. Midan los mililitros exactos en agua limpia, y apliquen sobre la superficie o el instrumental.' },
    { t: '#stepsChecklist .step-box:nth-child(3)', a: () => highlightStep(2), s: 'Paso tres, esperar de 5 a 10 minutos. Este es el paso clave: no sequen la superficie antes de tiempo.' },
    { t: '#stepsChecklist .step-box:nth-child(4)', a: () => highlightStep(3), s: 'Y paso cuatro, enjuagar o dejar secar. En superficies se enjuaga, y en la esterilización de equipo médico no hace falta.' }
  ],
  [
    { t: '.epp-avatar-card', a: () => { setEppSpotlight(true); ['ojos', 'guantes', 'bata', 'mascarilla'].forEach(k => { const l = document.getElementById(`eppGear-${k}`); if (l) l.classList.add('hidden'); }); document.querySelectorAll('.eq-pill').forEach(p => p.classList.remove('equipped')); if (eppStageTag) eppStageTag.textContent = '🛡️ Preparando EPP...'; }, s: 'Para cuidar a quien cuida: cuando manipulemos el producto concentrado, usaremos siempre cuatro elementos de protección. Miren cómo me equipo.' },
    { t: '.epp-avatar-card', a: () => activateEpp('ojos'), s: 'Primero, gafas o careta, para evitar cualquier salpicadura en los ojos.' },
    { t: '.epp-avatar-card', a: () => activateEpp('guantes'), s: 'Segundo, guantes largos de nitrilo o butilo, para proteger nuestras manos.' },
    { t: '.epp-avatar-card', a: () => activateEpp('bata'), s: 'Tercero, bata o delantal impermeable, para cuidar la piel y el uniforme.' },
    { t: '.epp-avatar-card', a: () => activateEpp('mascarilla'), s: 'Y cuarto, mascarilla para vapores, trabajando siempre en un área bien ventilada.' },
    { t: '.epp-avatar-card', mood: 'happy', a: () => { if (eppStageTag) eppStageTag.textContent = '🛡️ ¡Gemi 100% Protegido!'; }, s: '¡Listo, protección completa! Y al terminar, lávense bien las manos y la cara con agua y jabón.' }
  ],
  [
    { t: '.storage-col.do', s: 'Hablemos del almacenamiento. El porrón siempre debe estar parado, bien cerrado, y solo se abre al momento de dosificar.' },
    { t: '.storage-col.do', s: 'Guárdenlo en un lugar fresco, seco y ventilado. Tiene una vida útil de 12 meses en su envase original.' },
    { t: '.storage-col.dont', s: 'Lo que nunca hacemos: dejarlo al sol o cerca del calor, guardarlo junto a alimentos, o pasarlo a envases sin etiqueta.' },
    { t: '.thermo-bar', mood: 'alert', a: () => setThermo(39), s: 'Miren este termómetro: si el almacén pasa de 35 grados, hay que reubicar el porrón a un área más fresca.' },
    { t: '.thermo-bar', a: () => setThermo(22), s: 'En cambio, a una temperatura como 22 grados, el producto se conserva perfectamente.' }
  ],
  [
    { t: 'h2', s: 'Ahora repasemos qué hacer en caso de algún accidente.' },
    { t: '.em-layout', a: () => clickInSlide('.em-tab[data-em="ojos"]'), s: 'Si el producto salpica en los ojos: enjuaguen de inmediato con abundante agua durante al menos 15 minutos, y busquen atención médica.' },
    { t: '.em-layout', a: () => clickInSlide('.em-tab[data-em="piel"]'), s: 'Si cae en la piel: vayan de inmediato a la regadera o a la llave, quiten la ropa contaminada, y laven con agua y jabón.' },
    { t: '.em-layout', a: () => clickInSlide('.em-tab[data-em="inhalacion"]'), s: 'Si alguien inhala los vapores: llévenlo al aire libre y manténganlo en reposo.' },
    { t: '.em-layout', mood: 'alert', a: () => clickInSlide('.em-tab[data-em="ingestion"]'), s: 'En caso de ingestión: enjuagar la boca y beber uno o dos vasos de agua. Y muy importante: nunca provocar el vómito.' },
    { t: '.em-layout', a: () => clickInSlide('.em-tab[data-em="derrame"]'), s: 'Y si hay un derrame: ventilar, ponerse el equipo de protección, y absorber con arcilla o vermiculita. Nunca lo tiren al drenaje.' }
  ],
  [
    { t: '.quiz-box', a: () => { qIndex = 0; qScore = 0; renderQuiz(); }, s: 'Llegó el momento del mini quiz. Les haré cuatro preguntas. Piensen su respuesta, y después yo les muestro la correcta.' },
    { quiz: true }
  ],
  [
    { t: '.closing-left h2', mood: 'happy', a: () => { spawnConfetti(48); const svg = document.getElementById('buddySvg'); if (svg && typeof gsap !== 'undefined') gsap.fromTo(svg, { scaleY: 1 }, { scaleY: 0.78, duration: 0.35, yoyo: true, repeat: 1 }); }, s: 'Y con esto terminamos. Muchas gracias, equipo de enfermería de Hospital Arboledas, por su atención, y por cuidar cada detalle.' },
    { t: '.qr-box', s: 'Pueden escanear este código QR con su celular, para llevarse la calculadora y toda la información.' },
    { t: '.docs-list', mood: 'happy', s: 'Aquí también encontrarán la guía técnica, la hoja de seguridad y el informe de laboratorio. ¿Tienen alguna pregunta?' }
  ]
];

function splitSentences(text) {
  return String(text).split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
}

// Gestos con Anime.js para darle vida a Gemi (tanto el flotante como el protagonista de EPP)
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

// 5 visemas fonéticos reales en pixel-art: 0 cerrada, 1 consonante, 2 E/I, 3 A abierta, 4 O/U redonda
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

let activeAudio = null;
let lipRafId = null;
let speakDelayTimer = null;
let slideTourRunning = false;
let slideTourGen = 0;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Renderiza el texto de la burbuja por palabras (.kw) para seguimiento tipo karaoke en vivo
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
  const activeBubble = currentSlide === 6
    ? document.getElementById('eppSpeechBubble')
    : document.getElementById('buddyBubble');
  if (!activeBubble || !activeBubble._kwRanges || !activeBubble._kwRanges.length) return -1;
  const ranges = activeBubble._kwRanges;
  for (let i = 0; i < ranges.length; i++) {
    if (charIdx <= ranges[i][1]) return i;
  }
  return ranges.length - 1;
}

// Seguimiento ocular GSAP sobre lo que Gemi está leyendo o señalando (ya no sigue al cursor)
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
  const onEppStage = (currentSlide === 6);
  const svg = document.getElementById(onEppStage ? 'eppGemiSvg' : 'buddySvg');
  if (!svg || !svg.getScreenCTM) return;

  let targetEl = forceTarget;
  if (!targetEl) {
    if (onEppStage) {
      const eppBubble = document.getElementById('eppSpeechBubble');
      const kwReading = eppBubble ? eppBubble.querySelector('.kw.reading') : null;
      const eqActive = scanProgress < 0.16 ? document.querySelector('#eppEquippedBadges .eq-pill.equipped') : null;
      targetEl = eqActive || kwReading || eppBubble || document.getElementById('eppStageTag');
    } else {
      targetEl = el || currentReadingEl;
      if (!targetEl) {
        const bBubble = document.getElementById('buddyBubble');
        targetEl = (bBubble && bBubble.querySelector('.kw.reading')) || bBubble;
      }
    }
  }
  if (!targetEl) {
    tweenGazeTo(0, 0, 0, 0, 0.25);
    return;
  }

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
  if (!buddyEl || !el || buddyParked || currentSlide === 6) return;
  const r = el.getBoundingClientRect();
  const elCx = r.left + r.width / 2;
  const buddyCx = buddyX + (buddyEl.offsetWidth || 90) / 2;
  if (Math.abs(elCx - buddyCx) > 26) {
    buddyEl.classList.toggle('facing-left', elCx < buddyCx);
  }
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

// Habla usando MP3 neuronal de Jorge + línea exacta de visemas WordBoundary (0ms de desfase)
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
        if (p && p.catch) p.catch(() => {
          cancelAnimationFrame(lipRafId);
          startSilentSync();
        });
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
function startLipSync() {
  if (buddyEl) buddyEl.classList.add('speaking');
  setMouthFrame(1);
}
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

function clearGemiFocus() {
  document.querySelectorAll('.gemi-focus').forEach(n => n.classList.remove('gemi-focus'));
  document.querySelectorAll('.slide.stage-dimming').forEach(s => s.classList.remove('stage-dimming'));
}

// Lleva a Gemi junto al elemento del que está hablando y apunta su mirada ahí
async function focusBuddyOn(el, mode = 'glide', scaleMul = 1) {
  clearGemiFocus();
  currentReadingEl = el || null;
  if (!el) return;
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
  if (el) {
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

    const el = ch.t ? slides[idx].querySelector(ch.t) : null;
    const mode = c % 2 === 0 ? 'teleport' : 'glide';
    const scaleMul = c % 3 === 0 ? 1.25 : 1;
    setBuddyMood(ch.mood || 'normal', ch.s, false);
    await focusBuddyOn(el, mode, scaleMul);
    if (!alive()) return;
    if (ch.a) { try { ch.a(); } catch (e) {} }
    if (ch.mood === 'alert') playBuddyGesture('alertShake');
    await speakChunk(ch.s, alive);
    if (!alive()) return;
    await sleepAuto(ch.pause || 400);
  }
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
  if (buddyEl) buddyEl.classList.toggle('hidden-for-stage', idx === 6);
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
    if (btn) {
      await focusBuddyOn(btn, 'glide');
      btn.click();
    }
    await sleepAuto(500);
    if (!alive()) return;
    setBuddyMood('happy', item.feedback, false);
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
    if (buddyEl) buddyEl.classList.toggle('hidden-for-stage', idx === 6);
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
  dot.addEventListener('click', () => openSlide(i));
  dotsNav.appendChild(dot);

  const item = document.createElement('button');
  item.className = 'menu-item';
  item.innerHTML = `<span>${i + 1}. ${s.dataset.title}</span><span>${s.dataset.time}</span>`;
  item.addEventListener('click', () => {
    openSlide(i);
    menuModal.classList.add('hidden');
  });
  menuList.appendChild(item);
});

function animateCounterStat() {
  const el = document.getElementById('counterStat');
  if (!el) return;
  let val = 92.0;
  const step = () => {
    val += (99.999 - val) * 0.16;
    if (99.999 - val < 0.005) {
      el.textContent = '99.999%';
    } else {
      el.textContent = val.toFixed(3) + '%';
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}

const pixelPortal = document.getElementById('pixelPortal');

function runFuturisticTransition(prevSlide, nextSlideEl) {
  if (typeof gsap === 'undefined') {
    prevSlide.classList.remove('active');
    nextSlideEl.classList.add('active');
    return;
  }

  gsap.killTweensOf([prevSlide, nextSlideEl, pixelPortal]);

  // Coordenada de una partícula 3D real del fondo para materializar desde ese cuadro
  const origin = window.__getPixelOrigin2D ? window.__getPixelOrigin2D() : { x: 50, y: 50 };
  const exitPt = window.__getPixelOrigin2D ? window.__getPixelOrigin2D() : { x: 25, y: 35 };
  const oxPx = (origin.x / 100) * window.innerWidth;
  const oyPx = (origin.y / 100) * window.innerHeight;

  if (prevSlide !== nextSlideEl) {
    gsap.to(prevSlide, {
      opacity: 0,
      scale: 0.05,
      transformOrigin: `${exitPt.x}% ${exitPt.y}%`,
      borderRadius: '18px',
      duration: 0.38,
      ease: 'power3.in',
      onComplete: () => {
        prevSlide.classList.remove('active');
        gsap.set(prevSlide, { clearProps: 'all' });
      }
    });
  }

  if (pixelPortal) {
    pixelPortal.classList.remove('hidden');
    gsap.fromTo(pixelPortal,
      { left: oxPx - 9, top: oyPx - 9, width: 18, height: 18, opacity: 1, borderRadius: '3px' },
      {
        left: 0, top: 58, width: window.innerWidth, height: Math.max(200, window.innerHeight - 118),
        opacity: 0, borderRadius: '18px', duration: 0.68, ease: 'power3.out',
        onComplete: () => pixelPortal.classList.add('hidden')
      }
    );
  }

  nextSlideEl.classList.add('active');
  gsap.set(nextSlideEl, { clearProps: 'all', opacity: 1, zIndex: 3 });

  gsap.fromTo(nextSlideEl,
    {
      opacity: 0.25,
      scale: 0.035,
      transformOrigin: `${origin.x}% ${origin.y}%`,
      clipPath: 'inset(35% 35% 35% 35% round 16px)'
    },
    {
      opacity: 1,
      scale: 1,
      clipPath: 'inset(0% 0% 0% 0% round 0px)',
      duration: 0.68,
      delay: 0.06,
      ease: 'power3.out',
      clearProps: 'transform,clipPath,transformOrigin'
    }
  );

  const targets = nextSlideEl.querySelectorAll('.stagger, .glass-card');
  gsap.fromTo(targets,
    { y: 16, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.42, stagger: 0.045, delay: 0.22, ease: 'power3.out', overwrite: 'auto' }
  );
}

function openSlide(index) {
  if (index < 0 || index >= slides.length) return;
  const prev = slides[currentSlide];
  currentSlide = index;
  window.__activeSlideIndex = currentSlide;
  const next = slides[currentSlide];

  if (prev === next) {
    next.classList.add('active');
  } else {
    runFuturisticTransition(prev, next, currentSlide);
  }

  progressBar.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;
  slideCounter.textContent = `${currentSlide + 1} / ${slides.length}`;
  btnPrev.disabled = currentSlide === 0;
  btnNext.disabled = currentSlide === slides.length - 1;

  Array.from(dotsNav.children).forEach((d, idx) => d.classList.toggle('active', idx === currentSlide));
  Array.from(menuList.children).forEach((m, idx) => m.classList.toggle('current', idx === currentSlide));

  notesBody.textContent = slides[currentSlide].dataset.notes || '';
  notesTime.textContent = `Tiempo sugerido: ${slides[currentSlide].dataset.time || ''}`;

  if (currentSlide === 1) animateCounterStat();
  if (currentSlide !== 5 && typeof stopClassroom === 'function') stopClassroom();
  if (currentSlide !== 6 && typeof stopEppClass === 'function') stopEppClass();
  if (typeof stopSlideTour === 'function') stopSlideTour();
  clearGemiFocus();
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

// Soporte táctil (Swipe izquierda/derecha en tablet o celular)
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
  if (e.key.toLowerCase() === 'l') toggleLaser();
  if (e.key.toLowerCase() === 'd') toggleDraw();
  if (e.key.toLowerCase() === 'c') clearDraw();
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
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    btnTimer.classList.remove('running');
  } else {
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

// ===== 5. SLIDE 1 & 2: PROTAGONISMO INTERACTIVO DE GEMI =====
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

document.querySelectorAll('.microbe-card').forEach((card, idx) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.microbe-card').forEach(c => c.classList.remove('active-microbe'));
    card.classList.add('active-microbe');
    const line = (autoScripts[1] && autoScripts[1][2 + idx]) ? autoScripts[1][2 + idx].s : card.dataset.detail;
    gemiSpotlightReact(card, line, { gesture: 'point', speak: soundEnabled, scaleMul: 1.08 });
  });
});

document.querySelectorAll('.flip-card').forEach((fc, idx) => {
  fc.addEventListener('click', () => {
    fc.classList.toggle('flipped');
    playTone(580, 0.05);
    const isFlipped = fc.classList.contains('flipped');
    if (isFlipped && autoScripts[1] && autoScripts[1][6 + idx]) {
      gemiSpotlightReact(fc, autoScripts[1][6 + idx].s, { mood: 'happyOpen', gesture: 'nod', speak: soundEnabled });
    }
  });
});

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
    gemiSpotlightReact(document.querySelector('.biodeg-banner'), '¡Cero residuos tóxicos! Solo O₂, Agua y Ácido Acético.', { mood: 'happy', gesture: 'cheer', speak: false });
  }, 3200);
});

// ===== 7. SLIDE 4: ESCÁNER DE MATERIALES + ALERTA CLORO =====
const matFeedback = document.getElementById('materialFeedback');
document.querySelectorAll('.mat-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.mat-chip').forEach(c => c.classList.remove('selected-ok', 'selected-no'));
    const isOk = chip.dataset.ok === 'true';
    chip.classList.add(isOk ? 'selected-ok' : 'selected-no');
    matFeedback.innerHTML = `<span class="scan-dot"></span> ${chip.dataset.msg}`;
    gemiSpotlightReact(chip, chip.dataset.msg, { mood: isOk ? 'happy' : 'alert', gesture: isOk ? 'nod' : 'alertShake', speak: false });
    lookBuddyAtElement(matFeedback, 0.35);
  });
});

const hazardOverlay = document.getElementById('hazardOverlay');
document.getElementById('btnChlorineAlert').addEventListener('click', () => {
  const box = document.getElementById('goldenRuleBox');
  box.classList.remove('hazard-flash');
  void box.offsetWidth;
  box.classList.add('hazard-flash');
  if (hazardOverlay) hazardOverlay.classList.remove('hidden');
  playTone(220, 0.35, 'sawtooth', 0.07);
  gemiSpotlightReact(box, 'Regla de oro: nunca mezclar con cloro, porque libera gas tóxico.', { mood: 'alert', gesture: 'alertShake', speak: soundEnabled, scaleMul: 1.16 });
});
document.getElementById('btnCloseHazard').addEventListener('click', () => {
  hazardOverlay.classList.add('hidden');
});

// ===== 8. SLIDE 5: CALCULADORA + VASO MEDIDOR =====
const litersRange = document.getElementById('litersRange');
const litersValue = document.getElementById('litersValue');
const resRatio = document.getElementById('resRatio');
const resRinse = document.getElementById('resRinse');
const resAmount = document.getElementById('resAmount');
const resSub = document.getElementById('resSub');
const resDesc = document.getElementById('resDesc');

let activeTask = document.querySelector('.task-btn.active');
let currentDisplayedMl = 10.0;

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
    gemiSpotlightReact(resCard, rinseNote, { mood: btn.dataset.rinseOk === 'ok' ? 'happy' : 'normal', gesture: 'nod', speak: false });
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

// ===== 9. SLIDE 6: FLUJO DE TURNO — CLASE GUIADA POR GEMI =====
const stepBoxes = Array.from(document.querySelectorAll('#stepsChecklist .step-box'));
const btnTeachSteps = document.getElementById('btnTeachSteps');
const classroomStatus = document.getElementById('classroomStatus');
const stepSpeeches = [
  'Paso 1, limpieza previa: antes de desinfectar, retiren siempre la suciedad visible o materia orgánica.',
  'Paso 2, prepara y aplica: midan los mililitros exactos en agua limpia y apliquen sobre la superficie o instrumental.',
  'Paso 3, espera de 5 a 10 minutos: este es el tiempo clave para eliminar microorganismos, no lo sequen antes.',
  'Paso 4, enjuaga o deja secar: en superficies se enjuaga, y en esterilización de equipo médico 1 a 75 no requiere enjuague.'
];

let classRunning = false;
let classTimer = null;

function stopClassroom() {
  classRunning = false;
  clearTimeout(classTimer);
  clearGemiFocus();
  stopActiveVoice();
  stepBoxes.forEach(b => b.classList.remove('teaching', 'dimmed'));
  if (btnTeachSteps) btnTeachSteps.textContent = '🎓 Que Gemi explique los 4 pasos';
  if (classroomStatus) classroomStatus.textContent = 'Toca un paso o inicia la explicación guiada.';
}

function teachSingleStep(idx, autoAdvance = false) {
  if (idx >= stepBoxes.length) {
    stopClassroom();
    if (classroomStatus) classroomStatus.textContent = '✅ ¡Excelente! Gemi terminó de explicar los 4 pasos del turno.';
    setBuddyMood('happy', '¡Listo equipo! Ya dominan los 4 pasos del turno. 🎉', false);
    playBuddyGesture('cheer');
    return;
  }

  const box = stepBoxes[idx];
  clearGemiFocus();
  stepBoxes.forEach((b, i) => {
    b.classList.toggle('teaching', i === idx);
    b.classList.toggle('dimmed', i !== idx);
  });
  box.classList.add('done', 'gemi-focus');
  box.querySelector('.step-check').textContent = '✓';
  if (slides[5]) slides[5].classList.add('stage-dimming');
  currentReadingEl = box;

  // Mover a Gemi justo al lado/encima de la tarjeta activa y mirar el texto del paso
  moveBuddyToElement(box, 'glide', 1.18);
  faceBuddyToward(box);
  lookBuddyAtElement(box, 0.1);
  playBuddyGesture('point');

  if (classroomStatus) classroomStatus.textContent = `Gemi explicando el Paso ${idx + 1} de 4...`;
  const text = stepSpeeches[idx];
  setBuddyMood('normal', text, false);

  const goNext = () => {
    if (!autoAdvance || !classRunning) return;
    teachSingleStep(idx + 1, true);
  };

  speakWithLipSync(text, () => {
    if (autoAdvance && classRunning) classTimer = setTimeout(goNext, 550);
  });
}

stepBoxes.forEach((box, idx) => {
  box.addEventListener('click', () => {
    stopClassroom();
    teachSingleStep(idx, false);
  });
});

if (btnTeachSteps) {
  btnTeachSteps.addEventListener('click', () => {
    if (classRunning) {
      stopClassroom();
    } else {
      classRunning = true;
      btnTeachSteps.textContent = '⏹️ Detener explicación';
      teachSingleStep(0, true);
    }
  });
}

// ===== 10. SLIDE 7: GEMI CON EQUIPO DE PROTECCIÓN PERSONAL (EPP) =====
const eppLayout = document.getElementById('eppLayout');
const eppStageTag = document.getElementById('eppStageTag');
const btnToggleEppCards = document.getElementById('btnToggleEppCards');
const eppHint = document.getElementById('eppAvatarHint');
const eppCards = Array.from(document.querySelectorAll('.epp-card'));
const btnTeachEpp = document.getElementById('btnTeachEpp');
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
let eppClassRunning = false;
let eppClassTimer = null;

function setEppSpotlight(on) {
  if (eppLayout) eppLayout.classList.toggle('epp-spotlight-mode', on);
  if (btnToggleEppCards) btnToggleEppCards.textContent = on ? '📋 Ver tarjetas' : '👁️ Solo Gemi';
}

if (btnToggleEppCards) {
  btnToggleEppCards.addEventListener('click', () => {
    const isSpot = eppLayout && eppLayout.classList.contains('epp-spotlight-mode');
    setEppSpotlight(!isSpot);
  });
}

const eppSpeechBubble = document.getElementById('eppSpeechBubble');
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
}

document.querySelectorAll('.eq-pill').forEach((pill, idx) => {
  pill.addEventListener('click', () => {
    stopEppClass();
    const cardIdx = eppCards.findIndex(c => c.dataset.zone === pill.dataset.eq);
    if (cardIdx >= 0) teachEppStep(cardIdx, false);
  });
});

function stopEppClass() {
  eppClassRunning = false;
  clearTimeout(eppClassTimer);
  stopActiveVoice();
  if (btnTeachEpp) btnTeachEpp.textContent = '🎓 Que Gemi explique el EPP';
}

function teachEppStep(idx, autoAdvance = false) {
  if (idx >= eppCards.length) {
    stopEppClass();
    if (eppStageTag) eppStageTag.textContent = '🛡️ ¡Gemi 100% Protegido!';
    if (eppHint) eppHint.textContent = '🛡️ ¡Gemi 100% protegido con todo su EPP!';
    if (eppSpeechBubble) setBubbleContent(eppSpeechBubble, '¡Listo, protección completa!');
    playBuddyGesture('cheer');
    lookBuddyAtElement(null, 0.5, eppStageTag);
    return;
  }
  const card = eppCards[idx];
  const zone = card.dataset.zone;
  setEppSpotlight(true);
  eppCards.forEach(c => c.classList.remove('active-epp'));
  card.classList.add('active-epp');
  equipGemiEpp(zone, autoAdvance);
  if (eppHint) eppHint.textContent = card.dataset.hint;
  playTone(660, 0.06);
  playBuddyGesture('wave');

  const text = eppSpeeches[zone] || card.dataset.hint;
  if (eppSpeechBubble) {
    setBubbleContent(eppSpeechBubble, text);
    currentReadingEl = eppSpeechBubble;
    const pill = document.querySelector(`.eq-pill[data-eq="${zone}"]`);
    lookBuddyAtElement(eppSpeechBubble, 0.06, pill || eppStageTag);
  }
  const goNext = () => {
    if (!autoAdvance || !eppClassRunning) return;
    teachEppStep(idx + 1, true);
  };

  speakWithLipSync(text, () => {
    if (autoAdvance && eppClassRunning) eppClassTimer = setTimeout(goNext, 500);
  });
}

eppCards.forEach((card, idx) => {
  card.addEventListener('click', () => {
    stopEppClass();
    teachEppStep(idx, false);
  });
});

const eppGemiSvg = document.getElementById('eppGemiSvg');
if (eppGemiSvg) {
  eppGemiSvg.addEventListener('click', () => {
    if (eppClassRunning) {
      stopEppClass();
    } else {
      eppClassRunning = true;
      if (btnTeachEpp) btnTeachEpp.textContent = '⏹️ Detener explicación';
      teachEppStep(0, true);
    }
  });
}

if (btnTeachEpp) {
  btnTeachEpp.addEventListener('click', () => {
    if (eppClassRunning) {
      stopEppClass();
    } else {
      eppClassRunning = true;
      btnTeachEpp.textContent = '⏹️ Detener explicación';
      teachEppStep(0, true);
    }
  });
}

// ===== 10C. PUNTERO LÁSER (L) Y MODO DIBUJO EN PANTALLA (D) =====
const btnLaser = document.getElementById('btnLaser');
const laserDot = document.getElementById('laserDot');
let laserOn = false;

function toggleLaser() {
  laserOn = !laserOn;
  btnLaser.classList.toggle('active', laserOn);
  laserDot.classList.toggle('hidden', !laserOn);
  document.body.style.cursor = laserOn ? 'none' : '';
}
btnLaser.addEventListener('click', toggleLaser);
window.addEventListener('mousemove', (e) => {
  if (!laserOn) return;
  laserDot.style.left = `${e.clientX}px`;
  laserDot.style.top = `${e.clientY}px`;
  const trail = document.createElement('div');
  trail.className = 'laser-trail';
  trail.style.left = `${e.clientX}px`;
  trail.style.top = `${e.clientY}px`;
  document.body.appendChild(trail);
  if (typeof gsap !== 'undefined') {
    gsap.to(trail, { scale: 0.1, opacity: 0, duration: 0.35, ease: 'power2.out', onComplete: () => trail.remove() });
  } else {
    setTimeout(() => trail.remove(), 250);
  }
});

function spawnReaction(emoji) {
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('div');
    el.className = 'reaction-bubble';
    el.textContent = emoji;
    el.style.left = `${15 + Math.random() * 70}%`;
    document.body.appendChild(el);
    if (typeof gsap !== 'undefined') {
      gsap.to(el, {
        y: -(260 + Math.random() * 220),
        x: (Math.random() - 0.5) * 90,
        opacity: 0,
        scale: 1.3,
        duration: 1.6 + Math.random() * 0.6,
        ease: 'power1.out',
        onComplete: () => el.remove()
      });
    } else {
      el.remove();
    }
  }
  playTone(720, 0.06);
}

const drawCanvas = document.getElementById('drawCanvas');
const drawToolbar = document.getElementById('drawToolbar');
const btnDraw = document.getElementById('btnDraw');
const drawCtx = drawCanvas.getContext('2d');
let drawOn = false, isDrawing = false;

function resizeDraw() {
  drawCanvas.width = window.innerWidth;
  drawCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeDraw);
resizeDraw();

function toggleDraw() {
  drawOn = !drawOn;
  btnDraw.classList.toggle('active', drawOn);
  drawCanvas.classList.toggle('hidden', !drawOn);
  drawToolbar.classList.toggle('hidden', !drawOn);
}
function clearDraw() { drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height); }

btnDraw.addEventListener('click', toggleDraw);
document.getElementById('btnClearDraw').addEventListener('click', clearDraw);
document.getElementById('btnExitDraw').addEventListener('click', toggleDraw);

drawCanvas.addEventListener('pointerdown', (e) => {
  isDrawing = true;
  drawCtx.beginPath();
  drawCtx.moveTo(e.clientX, e.clientY);
});
drawCanvas.addEventListener('pointermove', (e) => {
  if (!isDrawing) return;
  drawCtx.lineTo(e.clientX, e.clientY);
  drawCtx.strokeStyle = '#2DD4BF';
  drawCtx.lineWidth = 3.5;
  drawCtx.lineCap = 'round';
  drawCtx.shadowColor = '#2DD4BF';
  drawCtx.shadowBlur = 8;
  drawCtx.stroke();
});
window.addEventListener('pointerup', () => { isDrawing = false; });

// ===== 10B. SLIDE 8: TERMÓMETRO DE ALMACÉN + COLUMNAS =====
const thermoRange = document.getElementById('thermoRange');
const thermoBadge = document.getElementById('thermoBadge');
const thermoMsg = document.getElementById('thermoMsg');
let lastThermoDanger = false;
if (thermoRange) {
  thermoRange.addEventListener('input', () => {
    const t = parseInt(thermoRange.value, 10);
    const bar = document.querySelector('.thermo-bar');
    if (t <= 35) {
      thermoBadge.textContent = `${t} °C · Zona Segura`;
      thermoBadge.className = 'thermo-badge ok';
      thermoMsg.textContent = '✅ Temperatura óptima: estabilidad garantizada hasta 12 meses.';
      if (!autoMode) {
        if (lastThermoDanger) setBuddyMood('happy', '✅ Zona segura: debajo de 35 °C se conserva perfecto.', false);
        lastThermoDanger = false;
        currentReadingEl = thermoBadge;
        moveBuddyToElement(bar, 'glide', 1.05);
        faceBuddyToward(bar);
        lookBuddyAtElement(thermoBadge, 0.5);
      }
    } else {
      thermoBadge.textContent = `${t} °C · ¡Alerta Calor!`;
      thermoBadge.className = 'thermo-badge danger';
      thermoMsg.textContent = '⚠️ Supera 35 °C: reubicar el porrón a un área fresca y ventilada.';
      if (!autoMode) {
        if (!lastThermoDanger) {
          setBuddyMood('alert', '⚠️ ¡Cuidado! Supera 35 °C, hay que moverlo a un área fresca.', false);
          playBuddyGesture('alertShake');
        }
        lastThermoDanger = true;
        currentReadingEl = thermoBadge;
        moveBuddyToElement(bar, 'glide', 1.12);
        faceBuddyToward(bar);
        lookBuddyAtElement(thermoBadge, 0.5);
      }
    }
  });
}
document.querySelectorAll('.storage-col').forEach(col => {
  col.addEventListener('click', () => {
    const isDo = col.classList.contains('do');
    gemiSpotlightReact(col, isDo
      ? 'Porrón de 20 L siempre vertical, cerrado y máximo a 35 °C.'
      : 'Nunca dejar al sol ni junto a alimentos, y ¡jamás mezclar con cloro!',
      { mood: isDo ? 'happy' : 'alert', gesture: isDo ? 'nod' : 'alertShake', speak: false });
  });
});

// ===== 11. SLIDE 9: EMERGENCIAS =====
const emergencyData = {
  ojos: {
    title: '👁️ Contacto con los Ojos',
    items: [
      '1. Enjuagar inmediatamente con <strong>abundante agua</strong> durante por lo menos <strong>15 minutos</strong>.',
      '2. Retirar lentes de contacto si están presentes y es fácil hacerlo.',
      '3. Solicitar <strong>atención médica de urgencia</strong> de inmediato.'
    ],
    alert: 'Tiempo es visión: no esperar a que aparezcan molestias para iniciar el lavado.'
  },
  piel: {
    title: '🚿 Contacto con la Piel',
    items: [
      '1. Ponerse inmediatamente bajo la <strong>ducha de seguridad</strong> o llave de agua abundante.',
      '2. Quitar toda la ropa y calzado contaminado.',
      '3. Lavar la piel con agua y jabón y acudir a valoración médica.'
    ],
    alert: 'Desechar zapatos o artículos de cuero contaminados y lavar la ropa antes de reutilizarla.'
  },
  inhalacion: {
    title: '🌬️ Inhalación de Vapores',
    items: [
      '1. Trasladar a la persona de inmediato al <strong>aire libre</strong>.',
      '2. Mantenerla en reposo y en una posición que facilite la respiración.',
      '3. Si los síntomas persisten, consultar al médico.'
    ],
    alert: 'Prevención: preparar siempre las diluciones en áreas con buena ventilación.'
  },
  ingestion: {
    title: '🚫 Ingestión Accidental',
    items: [
      '1. Enjuagar la boca y beber <strong>1 o 2 vasos de agua</strong> lentamente (solo si está consciente).',
      '2. Llamar de inmediato al médico o centro de toxicología.',
      '3. Tener a la mano la etiqueta o Hoja de Seguridad del producto.'
    ],
    alert: 'PROHIBICIÓN ESTRICTA: ¡NUNCA provocar el vómito! El material es corrosivo.'
  },
  derrame: {
    title: '⚠️ Derrame Accidental',
    items: [
      '1. Evacuar el área inmediata, no inhalar vapores y asegurar ventilación máxima.',
      '2. Colocarse EPP completo (gafas, guantes largos, bata/traje y mascarilla para gases ácidos).',
      '3. Absorber el líquido con <strong>arcilla o vermiculita</strong> y depositar en contenedor de residuos peligrosos (D002).'
    ],
    alert: '¡PROHIBIDO verter derrames de producto concentrado al drenaje o alcantarillado!'
  }
};

const emPanel = document.getElementById('emPanel');
function renderEmergency(key) {
  const data = emergencyData[key];
  emPanel.innerHTML = `
    <h3>${data.title}</h3>
    <ul>${data.items.map(i => `<li>${i}</li>`).join('')}</ul>
    <div class="em-alert-box">⚠️ ${data.alert}</div>
  `;
  if (window.__setEmergency3D) window.__setEmergency3D(key);
}
document.querySelectorAll('.em-tab').forEach((tab, idx) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.em-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderEmergency(tab.dataset.em);
    const danger = tab.dataset.em === 'ingestion' || tab.dataset.em === 'derrame';
    const line = (autoScripts[8] && autoScripts[8][1 + idx]) ? autoScripts[8][1 + idx].s : buddyLines[8];
    gemiSpotlightReact(document.querySelector('.em-layout'), line, {
      mood: danger ? 'alert' : 'normal',
      gesture: danger ? 'alertShake' : 'point',
      speak: soundEnabled,
      scaleMul: 1.08
    });
    lookBuddyAtElement(emPanel, 0.2);
  });
});

// ===== 12. SLIDE 10: QUIZ =====
const quizData = [
  { q: '¿Con qué producto está PROHIBIDO mezclar SWIPE® Peracetic?', options: ['Agua fría', 'Cloro (lavandina) o productos clorados', 'Agua de la llave'], correct: 1, feedback: '¡Exacto! Mezclarlo con cloro libera inmediatamente gas cloro altamente tóxico.' },
  { q: '¿Cuál es el tiempo de contacto recomendado sobre la superficie?', options: ['5 a 10 segundos', '5 a 10 minutos', '2 horas'], correct: 1, feedback: '¡Correcto! Dejar actuar de 5 a 10 minutos asegura la desinfección efectiva.' },
  { q: 'Para desinfección regular de superficies (300 ppm / 1:500), ¿cuánto se agrega por cada litro de agua?', options: ['2.0 ml por litro', '13.3 ml por litro', '50 ml por litro'], correct: 0, feedback: '¡Muy bien! 2.0 ml por litro (1:500) es la dilución para superficies regulares.' },
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
        rotation: Math.random() * 680,
        opacity: 0,
        duration: count > 40 ? 1.8 : 1.1,
        ease: 'power2.out',
        onComplete: () => el.remove()
      });
    } else {
      el.remove();
    }
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
      if (idx === item.correct) { btn.classList.add('correct'); qScore++; quizScore.textContent = `Aciertos: ${qScore}`; playTone(780, 0.14); spawnConfetti(28); setBuddyMood('happy', '¡Esooo! ¡Excelente respuesta! 🎉'); flipBuddyCelebration(); }
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
  if (!autoMode) {
    currentReadingEl = quizQuestion;
    moveBuddyToElement(quizQuestion, 'glide', 1.1);
    lookBuddyAtElement(quizQuestion, 0.25);
  }
});
btnQuizRestart.addEventListener('click', () => {
  qIndex = 0; qScore = 0;
  renderQuiz();
  if (!autoMode) {
    currentReadingEl = quizQuestion;
    moveBuddyToElement(quizQuestion, 'glide', 1.1);
    lookBuddyAtElement(quizQuestion, 0.25);
  }
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

// Pocket Card Modal
const pocketModal = document.getElementById('pocketModal');
document.getElementById('btnOpenPocket').addEventListener('click', () => pocketModal.classList.remove('hidden'));
document.getElementById('btnClosePocket').addEventListener('click', () => pocketModal.classList.add('hidden'));

// QR Code automático en Slide 11
const qrContainer = document.getElementById('qrContainer');
if (qrContainer && typeof QRCode !== 'undefined') {
  const qrUrl = window.location.protocol.startsWith('http')
    ? window.location.href
    : 'https://github.com';
  new QRCode(qrContainer, {
    text: qrUrl,
    width: 84,
    height: 84,
    colorDark: '#0B2D48',
    colorLight: '#ffffff'
  });
}

// ===== 13. MASCOTA PIXELADA GEMINI ("GEMI") CON CAMINATA Y VOZ =====
const buddyEl = document.getElementById('geminiBuddy');
const buddyBubble = document.getElementById('buddyBubble');
const buddyEyes = document.getElementById('buddyEyes');
const buddyLines = [
  'Bienvenidos equipo de enfermería de Hospital Arboledas. Conozcamos SWIPE Peracetic.',
  'Elimina el 99.999 por ciento de microorganismos, sin olor ni espuma.',
  'Actúa por oxidación rápida y se biodegrada en agua, oxígeno y ácido acético.',
  'Regla de oro: nunca mezclar con cloro, porque libera gas tóxico.',
  'Usa la calculadora para medir los mililitros exactos según los litros de agua.',
  'Recuerda los 4 pasos: limpiar, aplicar, esperar de 5 a 10 minutos y enjuagar si aplica.',
  'Al dosificar el concentrado, usa siempre gafas, guantes, bata y buena ventilación.',
  'Guarda el porrón siempre parado, bien cerrado y a menos de 35 grados.',
  'En caso de accidente, selecciona cada pestaña para ver el protocolo inmediato.',
  'Llegó el Mini-Quiz. Vamos a comprobar lo aprendido.',
  'Muchas gracias. Escanea el código QR para llevar la guía en tu celular.'
];

let buddyX = 40;
let buddyY = Math.max(120, window.innerHeight - 190);
let buddyVx = 1.4;
let buddyVy = 0.85;
let buddyScale = 1.0;
let targetX = buddyX;
let targetY = buddyY;
const buddyPop = { v: 1 };
let buddyPaused = false;
let buddyParked = false;
let buddyResumeTimer = null;
let lastMouseX = window.innerWidth / 2;
let lastMouseY = window.innerHeight / 2;
const buddyGradCap = document.getElementById('buddyGradCap');
const buddyEppGear = document.getElementById('buddyEppGear');
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
        x: (Math.random() - 0.5) * 140,
        y: (Math.random() - 0.5) * 140,
        rotation: Math.random() * 360,
        scale: 0,
        opacity: 0,
        duration: 0.65,
        ease: 'power2.out',
        onComplete: () => sp.remove()
      });
    } else {
      sp.remove();
    }
  }
}

function teleportBuddyTo(x, y) {
  if (!buddyEl) return;
  if (typeof gsap === 'undefined') {
    buddyX = targetX = x;
    buddyY = targetY = y;
    return;
  }
  spawnBuddySparkles(buddyX + 40, buddyY + 40);
  gsap.killTweensOf(buddyEl);
  gsap.to(buddyEl, {
    opacity: 0,
    duration: 0.18,
    onComplete: () => {
      buddyX = targetX = x;
      buddyY = targetY = y;
      spawnBuddySparkles(x + 40, y + 40);
      gsap.fromTo(buddyPop, { v: 0.35 }, { v: 1, duration: 0.5, ease: 'back.out(2.4)' });
      gsap.to(buddyEl, { opacity: 1, duration: 0.25 });
    }
  });
}

// Calcula un lugar junto al elemento (derecha, izquierda o arriba/abajo) sin salirse de la pantalla
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
  if (mobile) {
    // En celular estacionar abajo a la izquierda para no tapar tarjetas ni botones
    return { x: 8 - (w - bw) / 2, y: bottomLimit - (h - bh) / 2 };
  }
  let vx = rect.right + 12;
  let vy = rect.top + Math.min(rect.height / 2, 90) - bh / 2;
  if (vx + bw > window.innerWidth - 8) vx = rect.left - bw - 12;
  if (vx < 8) {
    vx = Math.min(window.innerWidth - bw - 8, Math.max(8, rect.left + rect.width / 2 - bw / 2));
    vy = rect.bottom + bh + 8 < window.innerHeight - 54 ? rect.bottom + 8 : rect.top - bh - 8;
  }
  vy = Math.max(topLimit, Math.min(bottomLimit, vy));
  // compensar que el escalado es desde el centro
  return { x: vx - (w - bw) / 2, y: vy - (h - bh) / 2 };
}

function moveBuddyToElement(el, mode = 'glide', scaleMul = 1) {
  if (!buddyEl || buddyParked || !el) return;
  const { x, y } = placeBuddyNear(el.getBoundingClientRect(), scaleMul);
  if (mode === 'teleport') teleportBuddyTo(x, y);
  else { targetX = x; targetY = y; }
}

const buddyZzz = document.getElementById('buddyZzz');
const buddyMouth = document.getElementById('buddyMouth');
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
    gsap.fromTo(svg, { rotation: 0, y: 0 }, { rotation: 360, y: -26, duration: 0.7, ease: 'back.out(1.6)', yoyo: false, onComplete: () => gsap.set(svg, { clearProps: 'rotation,y' }) });
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
    if (eppSpeechBubble && currentSlide === 6) setBubbleContent(eppSpeechBubble, text);
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
  if (buddyGradCap) buddyGradCap.classList.toggle('hidden', idx !== 5);
  if (buddyEppGear) buddyEppGear.classList.toggle('hidden', idx !== 6);
  // En la lámina de EPP (Slide 7), Gemi ya está en el centro del escenario -> ocultamos el flotante para no duplicarlo
  if (buddyEl) buddyEl.classList.toggle('hidden-for-stage', idx === 6);
  if (autoMode || slideTourRunning) return; // el guion controla todo
  const line = buddyLines[idx] || '¡Seguimos!';
  const curtainHidden = welcomeCurtain ? welcomeCurtain.classList.contains('hidden') : true;
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
    // Reverencia y lluvia de estrellas en el Cierre (Slide 11)
    setBuddyMood('happy', line, true);
    spawnConfetti(48);
    playBuddyGesture('cheer');
    const svg = document.getElementById('buddySvg');
    if (svg && typeof gsap !== 'undefined') {
      gsap.fromTo(svg, { scaleY: 1 }, { scaleY: 0.78, duration: 0.35, yoyo: true, repeat: 1 });
    }
    return;
  }
  setBuddyMood(idx === 3 ? 'alert' : 'normal', line, curtainHidden);
}

// Registro de cursor SOLO para puntero láser (los ojos de Gemi leen el contenido, no siguen al cursor)
window.addEventListener('mousemove', (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

if (buddyEl) {
  let tPhase = 0;
  function walkLoop() {
    tPhase += 0.04;
    if (!buddyParked) {
      if (laserOn && !autoMode) {
        targetX = lastMouseX - 32;
        targetY = lastMouseY - 32;
      }
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

  // Doble clic o clic derecho abre Menú Rápido de Gemi
  const openBqm = (e) => {
    e.preventDefault();
    if (buddyQuickMenu) buddyQuickMenu.classList.toggle('hidden');
  };
  buddyEl.addEventListener('dblclick', openBqm);
  buddyEl.addEventListener('contextmenu', openBqm);

  if (buddyQuickMenu) {
    document.getElementById('btnCloseBqm').addEventListener('click', () => buddyQuickMenu.classList.add('hidden'));
    buddyQuickMenu.querySelectorAll('.bqm-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'explain') {
          startSlideTour(currentSlide);
        } else if (act === 'greet') {
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
            buddyX = targetX = 22;
            buddyY = targetY = window.innerHeight - 160;
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
    if (curtainHidden && !buddyPaused && !buddySleeping && !autoMode && !slideTourRunning && !classRunning && !eppClassRunning && Date.now() - lastActivityTime > 14000) {
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

// Init (soporta ?slide=N&nocurtain=1 para abrir directo en una diapositiva)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('nocurtain') === '1' && welcomeCurtain) {
  welcomeCurtain.classList.add('hidden');
}
const startIdx = parseInt(urlParams.get('slide'), 10);
openSlide(!isNaN(startIdx) && startIdx >= 0 && startIdx < slides.length ? startIdx : 0);
updateCalc();
renderEmergency('ojos');
renderQuiz();
