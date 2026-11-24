// ===== 1. AUDIO SUTIL (WEB AUDIO API) =====
window.__activeSlideIndex = 0;
let soundEnabled = true;
let audioCtx = null;

function haptic(pattern = 16) {
  try { if (navigator && navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
}

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

// ===== 2. TELÓN DE BIENVENIDA =====
const welcomeCurtain = document.getElementById('welcomeCurtain');
const btnStartPres = document.getElementById('btnStartPresentation');
if (btnStartPres && welcomeCurtain) {
  btnStartPres.addEventListener('click', () => {
    haptic(20);
    playTone(660, 0.09);
    if (window.__triggerWarp3D) window.__triggerWarp3D();
    const done = () => { welcomeCurtain.classList.add('hidden'); startSlideTour(currentSlide); };
    if (typeof gsap !== 'undefined') gsap.to(welcomeCurtain, { opacity: 0, scale: 1.06, duration: 0.45, ease: 'power2.inOut', onComplete: done });
    else done();
  });
}

const btnStartAuto = document.getElementById('btnStartAuto');
if (btnStartAuto && welcomeCurtain) {
  btnStartAuto.addEventListener('click', () => {
    soundEnabled = true;
    if (btnSound) btnSound.classList.add('active');
    playTone(660, 0.09);
    if (window.__triggerWarp3D) window.__triggerWarp3D();
    const done = () => { welcomeCurtain.classList.add('hidden'); startAutoPresentation(); };
    if (typeof gsap !== 'undefined') gsap.to(welcomeCurtain, { opacity: 0, scale: 1.06, duration: 0.45, ease: 'power2.inOut', onComplete: done });
    else done();
  });
}

// ===== 2B. GUIONES DE GEMI EN LAS 11 LÁMINAS (SOLO DILUCIONES 1:300 Y 1:75) =====
let autoMode = false;
let autoStepTimer = null;
let autoGen = 0;
const btnAutoPlay = document.getElementById('btnAutoPlay');

const sleepAuto = (ms) => new Promise(r => { autoStepTimer = setTimeout(r, ms); });
const setLiters = (v) => { if (litersRange) { litersRange.value = v; updateCalc(); } };
const selectTask = (ratio) => {
  const b = Array.from(document.querySelectorAll('.task-btn')).find(x => x.dataset.ratio === ratio);
  if (b) b.click();
};

const autoScripts = [
  // Slide 1: Portada (Hospital, Molécula 3D, rapidez, biodegradación, uso, porrón)
  [
    { vis: 'portada_hosp', mood: 'happyOpen', s: 'Hola, ¿cómo están? Bienvenidos, equipo de enfermería de Hospital Arboledas. Yo soy Gemi, su asistente virtual, y hoy los voy a acompañar durante esta sesión.' },
    { vis: 'portada_mol', s: 'En los próximos minutos vamos a conocer Swipe Peracetic, un desinfectante rápido, práctico y biodegradable, pensado para el cuidado diario de nuestros pacientes.' },
    { vis: 'portada_rapida', s: 'Lo primero que deben saber: actúa muy rápido. Con solo 5 a 10 minutos de contacto logra eliminar el 99.999 por ciento de los microorganismos.' },
    { vis: 'portada_biodeg', s: 'Además, no deja residuos tóxicos, porque se descompone en agua, oxígeno y ácido acético, que es básicamente un vinagre suave.' },
    { vis: 'portada_uso', s: 'Y es muy fácil de usar en su turno: no hace espuma, no deja olor y funciona incluso con agua fría.' },
    { vis: 'portada_porron', mood: 'happyOpen', s: 'Este es el producto. Viene en un porrón de 20 litros, del cual solo usaremos unos cuantos mililitros cada vez. ¡Comencemos!' }
  ],
  // Slide 2: Perfil del Producto
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
    { vis: 'sim_intro', s: 'Ahora veamos cómo actúa, con una simulación en tres dimensiones.' },
    { vis: 'sim_phase1', s: 'Primero, las moléculas de ácido peracético rodean al microorganismo y rompen su pared celular por oxidación.' },
    { vis: 'sim_phase2', s: 'En 5 a 10 minutos de contacto, el microorganismo queda totalmente neutralizado.' },
    { vis: 'sim_phase3', mood: 'happyOpen', s: 'Y lo mejor: después de actuar, el producto se transforma en oxígeno, agua y ácido acético. Por eso es cien por ciento biodegradable.' }
  ],
  // Slide 4: Compatibilidad Clínica
  [
    { vis: null, s: 'Esto es muy importante para su día a día: ¿dónde sí y dónde no debemos aplicarlo?' },
    { vis: 'compat_acero', mood: 'happyOpen', s: 'Sí es seguro en acero inoxidable. De hecho, ayuda a prevenir el sarro.' },
    { vis: 'compat_hule', mood: 'happyOpen', s: 'También es compatible con hule, goma y la mayoría de los plásticos de grado médico.' },
    { vis: 'compat_cobre', mood: 'alert', s: 'Pero cuidado: no debemos aplicarlo directamente en cobre.' },
    { vis: 'compat_aluminio', mood: 'alert', s: 'Ni en aluminio u otros metales suaves, porque puede corroerlos.' },
    { vis: 'compat_cloro', mood: 'alert', s: 'Y ahora, la regla de oro, la más importante de toda la plática: nunca, nunca mezclen Swipe Peracetic con cloro.' },
    { vis: 'compat_gas', mood: 'alert', s: 'Al mezclarse con cloro se libera gas cloro, que es altamente tóxico. Así que siempre en recipientes separados.' }
  ],
  // Slide 5: Calculadora (Solo 1:300 y 1:75)
  [
    { vis: 'calc_panel', a: () => { selectTask('1:300'); setLiters(5); }, s: 'Ahora veamos las dos diluciones oficiales en esta calculadora interactiva.' },
    { vis: 'calc_panel', a: () => { selectTask('1:300'); setLiters(5); }, s: 'Para dosis de choque y áreas críticas usamos 1 a 300, que son 3.3 mililitros por cada litro de agua.' },
    { vis: 'calc_panel', a: () => setLiters(10), s: 'Por ejemplo, en 10 litros de agua agregamos 33 mililitros de producto, y sí requiere enjuague después.' },
    { vis: 'calc_panel', a: () => { selectTask('1:75'); setLiters(5); }, s: 'Y para esterilizar equipo médico compatible, usamos la dilución 1 a 75, que son 13.3 mililitros por litro. En este caso no se necesita enjuague.' },
    { vis: 'calc_panel', s: 'Un consejo: preparen la mezcla justo antes de usarla, y nunca regresen la mezcla sobrante al porrón original.' }
  ],
  // Slide 6: Rutina en 4 Pasos
  [
    { vis: null, s: 'Ahora sí, la rutina en el turno. Son solo cuatro pasos muy sencillos.' },
    { vis: 'paso_1', s: 'Paso uno, limpieza previa. Antes de desinfectar, retiren siempre la suciedad visible o la materia orgánica.' },
    { vis: 'paso_2', s: 'Paso dos, preparar y aplicar. Midan los mililitros exactos en agua limpia, y apliquen sobre la superficie o el instrumental.' },
    { vis: 'paso_3', s: 'Paso tres, esperar de 5 a 10 minutos. Este es el paso clave: no sequen la superficie antes de tiempo.' },
    { vis: 'paso_4', mood: 'happyOpen', s: 'Y paso cuatro, enjuagar o dejar secar. En áreas críticas 1 a 300 se enjuaga, y en 1 a 75 para equipo médico no hace falta.' }
  ],
  // Slide 7: EPP Obligatorio
  [
    { a: () => resetEppGear(), s: 'Para cuidar a quien cuida: cuando manipulemos el producto concentrado, usaremos siempre cuatro elementos de protección. Miren cómo me equipo.' },
    { a: () => equipGemiEpp('ojos', true), s: 'Primero, gafas o careta, para evitar cualquier salpicadura en los ojos.' },
    { a: () => equipGemiEpp('guantes', true), s: 'Segundo, guantes largos de nitrilo o butilo, para proteger nuestras manos.' },
    { a: () => equipGemiEpp('bata', true), s: 'Tercero, bata o delantal impermeable, para cuidar la piel y el uniforme.' },
    { a: () => equipGemiEpp('mascarilla', true), s: 'Y cuarto, mascarilla para vapores, trabajando siempre en un área bien ventilada.' },
    { mood: 'happyOpen', a: () => { if (eppStageTag) eppStageTag.textContent = '🛡️ ¡Gemi 100% Protegido!'; playBuddyGesture('cheer'); }, s: '¡Listo, protección completa! Y al terminar, lávense bien las manos y la cara con agua y jabón.' }
  ],
  // Slide 8: Almacenamiento
  [
    { vis: 'store_vertical', s: 'Hablemos del almacenamiento. El porrón siempre debe estar parado, bien cerrado, y solo se abre al momento de dosificar.' },
    { vis: 'store_fresco', s: 'Guárdenlo en un lugar fresco, seco y ventilado. Tiene una vida útil de 12 meses en su envase original.' },
    { vis: 'store_nunca', mood: 'alert', s: 'Lo que nunca hacemos: dejarlo al sol o cerca del calor, guardarlo junto a alimentos, o pasarlo a envases sin etiqueta.' },
    { vis: 'store_calor', mood: 'alert', s: 'Miren este termómetro: si el almacén pasa de 35 grados, hay que reubicar el porrón a un área más fresca.' },
    { vis: 'store_ok', mood: 'happyOpen', s: 'En cambio, a una temperatura como 22 grados, el producto se conserva perfectamente.' }
  ],
  // Slide 9: Emergencias 3D + tsParticles
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
    { vis: 'quiz_panel', a: () => { qIndex = 0; qScore = 0; renderQuiz(); }, s: 'Llegó el momento del mini quiz. Les haré cuatro preguntas. Piensen su respuesta, y después yo les muestro la correcta.' },
    { quiz: true }
  ],
  // Slide 11: Cierre
  [
    { vis: 'close_thanks', mood: 'happyOpen', a: () => spawnConfetti(45), s: 'Y con esto terminamos. Muchas gracias, equipo de enfermería de Hospital Arboledas, por su atención, y por cuidar cada detalle.' },
    { vis: 'close_qr', s: 'Pueden escanear este código QR con su celular, para llevarse la calculadora y toda la información.' },
    { vis: 'close_docs', mood: 'happyOpen', s: 'Aquí también encontrarán la guía técnica, la hoja de seguridad y el informe de laboratorio. ¿Tienen alguna pregunta?' }
  ]
];

function splitSentences(text) {
  return String(text).split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
}

// ===== 2C. GESTOS ANIME.JS + VISEMAS WORDBOUNDRY + MIRADA GSAP =====
function playBuddyGesture(kind) {
  if (typeof anime === 'undefined') return;
  if (kind === 'wave') {
    anime({ targets: '#eppArmR', rotate: [0, -55, 15, -50, 0], duration: 950, easing: 'easeInOutSine' });
    anime({ targets: '#eppStar', scale: [1, 1.35, 1], duration: 700, easing: 'easeOutElastic(1, .6)' });
  } else if (kind === 'speak') {
    anime({ targets: '#eppStar', scale: [1, 1.22, 1], duration: 480, easing: 'easeInOutQuad' });
    anime({ targets: '#eppArmL', rotate: [0, 18, 0], duration: 520, easing: 'easeInOutSine' });
  } else if (kind === 'point') {
    anime({ targets: '#eppArmR', rotate: [0, -48, -32, 0], duration: 680, easing: 'easeOutBack' });
    anime({ targets: '#eppStar', rotate: [0, 15, 0], duration: 520, easing: 'easeOutSine' });
  } else if (kind === 'nod') {
    anime({ targets: '#eppGemiSvg', translateY: [0, 4, 0, 3, 0], duration: 520, easing: 'easeInOutSine' });
  } else if (kind === 'alertShake') {
    anime({ targets: '#eppGemiSvg', translateX: [0, -5, 5, -4, 4, 0], duration: 480, easing: 'easeInOutSine' });
    anime({ targets: '#eppStar', scale: [1, 1.4, 1], duration: 480, easing: 'easeOutBack' });
  } else if (kind === 'cheer') {
    anime({ targets: '#eppArmL', rotate: [0, 46, 20, 46, 0], duration: 850, easing: 'easeOutBack' });
    anime({ targets: '#eppArmR', rotate: [0, -46, -20, -46, 0], duration: 850, easing: 'easeOutBack' });
    anime({ targets: '#eppGemiSvg', translateY: [0, -10, 0], duration: 600, easing: 'easeOutBounce' });
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
  const el = document.getElementById('eppGemiMouth');
  if (el) { el.innerHTML = html; el.classList.remove('hidden'); }
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
let activeVoiceGen = 0;
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
  el.scrollTop = 0;
}

function highlightBubbleWord(wordIdx, progress = null) {
  const el = document.getElementById('eppSpeechBubble');
  if (!el || !el._kwNodes || !el._kwNodes.length) return;
  const targetIdx = progress !== null
    ? Math.min(el._kwNodes.length - 1, Math.floor(Math.max(0, Math.min(0.999, progress)) * el._kwNodes.length))
    : Math.min(el._kwNodes.length - 1, wordIdx);
  let activeNode = null;
  el._kwNodes.forEach((node, i) => {
    node.classList.toggle('spoken', i < targetIdx);
    const isReading = i === targetIdx;
    node.classList.toggle('reading', isReading);
    if (isReading) activeNode = node;
  });
  if (activeNode && el.scrollHeight > el.clientHeight + 2) {
    const desired = Math.max(0, activeNode.offsetTop - (el.clientHeight / 2) + (activeNode.offsetHeight / 2));
    if (Math.abs(el.scrollTop - desired) > 6) el.scrollTop = desired;
  }
}

function clearBubbleHighlight() {
  const el = document.getElementById('eppSpeechBubble');
  if (!el || !el._kwNodes) return;
  el._kwNodes.forEach(node => node.classList.remove('spoken', 'reading'));
}

function wordIndexFromChar(charIdx) {
  const activeBubble = document.getElementById('eppSpeechBubble');
  if (!activeBubble || !activeBubble._kwRanges || !activeBubble._kwRanges.length) return -1;
  const ranges = activeBubble._kwRanges;
  for (let i = 0; i < ranges.length; i++) {
    if (charIdx <= ranges[i][1]) return i;
  }
  return ranges.length - 1;
}

let currentReadingEl = null;
let gazeLastTick = 0;
let gazeResetTimer = null;
const gazeState = { ex: 0, ey: 0, px: 0, py: 0 };

function applyGazeAttrs() {
  const eyeT = `translate(${gazeState.ex.toFixed(3)}, ${gazeState.ey.toFixed(3)})`;
  const pupT = `translate(${gazeState.px.toFixed(3)}, ${gazeState.py.toFixed(3)})`;
  const g = document.getElementById('eppEyes');
  const p = document.getElementById('eppPupils');
  if (g) g.setAttribute('transform', eyeT);
  if (p) p.setAttribute('transform', pupT);
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
  const svg = document.getElementById('eppGemiSvg');
  if (!svg || !svg.getScreenCTM) return;

  let targetEl = forceTarget;
  if (!targetEl) {
    const visPane = document.getElementById('stageVisualPane');
    const eppBubble = document.getElementById('eppSpeechBubble');
    const kwReading = eppBubble ? eppBubble.querySelector('.kw.reading') : null;
    const eqActive = currentSlide === 6 && scanProgress < 0.2 ? document.querySelector('#eppEquippedBadges .eq-pill.equipped') : null;
    if (visPane && !visPane.classList.contains('hidden')) targetEl = el || visPane;
    else targetEl = eqActive || kwReading || eppBubble || document.getElementById('eppStageTag');
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
  if (Math.abs(rawDx) < 22) nx = Math.max(-1, Math.min(1, rawDx / 14));
  else nx = Math.max(-1, Math.min(1, (rawDx / mag) * 0.65 + (colT - 0.5) * 0.55));
  const ny = Math.max(-1, Math.min(1, (rawDy / mag) * 0.9));

  tweenGazeTo(nx * 0.45, ny * 0.35, nx * 0.46, ny * 0.32, 0.13);
}

function stopActiveVoice() {
  activeVoiceGen++;
  clearTimeout(speakDelayTimer);
  clearTimeout(gazeResetTimer);
  if (activeAudio) {
    try { activeAudio.pause(); activeAudio.currentTime = 0; } catch (e) {}
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio.onplay = null;
  }
  cancelAnimationFrame(lipRafId);
  if (window.__gemiUtter) {
    window.__gemiUtter.onend = null;
    window.__gemiUtter.onerror = null;
    window.__gemiUtter.onboundary = null;
    window.__gemiUtter.onstart = null;
  }
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
          const durMs = (activeAudio.duration && isFinite(activeAudio.duration)) ? activeAudio.duration * 1000 : Math.max(1800, words * 420);
          const progress = Math.min(0.999, Math.max(0, ms / Math.max(400, durMs - 140)));
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

    if (!soundEnabled || !('speechSynthesis' in window)) { startSilentSync(); return; }

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
          if (wIdx >= 0) { highlightBubbleWord(wIdx); lookBuddyAtElement(currentReadingEl, (wIdx + 0.5) / words); }
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
  if (window.__audioMap && window.__audioMap[text]) { await speakOne(text); return; }
  for (const sentence of splitSentences(text)) { if (!alive()) return; await speakOne(sentence); }
}

function speakWithLipSync(text, onFinish) {
  if (!text) { if (onFinish) onFinish(); return false; }
  stopActiveVoice();
  const myGen = activeVoiceGen;
  speakDelayTimer = setTimeout(() => {
    if (myGen !== activeVoiceGen) return;
    speakChunk(text, () => myGen === activeVoiceGen).then(() => {
      if (myGen === activeVoiceGen && onFinish) onFinish();
    });
  }, 50);
  return true;
}

function pickNaturalSpanishVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => v.lang.startsWith('es') && /natural|online|google|dalia|jorge|paloma|salome/i.test(v.name))
    || voices.find(v => v.lang === 'es-MX') || voices.find(v => v.lang.startsWith('es')) || null;
}
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

let mouthPulseTimer = null;
function startLipSync() { setMouthFrame(1); }
function pulseLipOnce() {
  setMouthFrame(lastMouthState === 3 ? 1 : 3);
  clearTimeout(mouthPulseTimer);
  mouthPulseTimer = setTimeout(() => setMouthFrame(0), 120);
}
function stopLipSync() { clearTimeout(mouthPulseTimer); setMouthFrame(0); }

// ===== 2D. ESCENARIO ÚNICO PROTAGONISTA DE GEMI (LAS 11 LÁMINAS) =====
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

const stageMolWrap = document.getElementById('stageMolWrap');
const stageBioWrap = document.getElementById('stageBioWrap');
const calcStageWrap = document.getElementById('calcStageWrap');
const stageEmWrap = document.getElementById('em3DWrap');
const em3DEl = document.getElementById('em3D');
const quizStageWrap = document.getElementById('quizStageWrap');
const closingQrWrap = document.getElementById('closingQrWrap');
const closingDocsWrap = document.getElementById('closingDocsWrap');
const simEco = document.getElementById('simEcoOutputs');
const btnPlaySlide = document.getElementById('btnPlaySlide');
const btnAskGemi = document.getElementById('btnAskGemi');
const btnReactClap = document.getElementById('btnReactClap');
let currentVisKey = null;

const stageVisualCatalog = {
  // Slide 1: Portada
  portada_hosp: { tag: '🏥 Hospital Arboledas', img: 'assets/img/hospital-arboledas.jpg', title: 'Enfermería · Sesión 25 min', pills: ['Inducción Clínica'], particles: 'sporesClear' },
  portada_mol: { tag: '🧬 Molécula 3D Interactiva', widget: 'mol', particles: 'sporesClear' },
  portada_rapida: { tag: '⚡ Acción Ultrarrápida', icon: '⚡', title: '99.999% en 5–10 min', pills: [{ text: 'Acción inmediata', cls: 'ok' }], theme: 'theme-ok', particles: 'sporesClear' },
  portada_biodeg: { tag: '🌿 100% Biodegradable', icon: '🌿', title: 'O₂ + Agua + Ácido Acético', pills: [{ text: 'Cero residuos tóxicos', cls: 'ok' }], theme: 'theme-ok', particles: 'freshAir' },
  portada_uso: { tag: '🧬 Fácil en Turno', icon: '❄️', title: 'Sin espuma · Agua fría 4 °C', pills: [{ text: 'Cero olor residual', cls: 'ok' }], theme: 'theme-ok', particles: 'frost' },
  portada_porron: { tag: '🛢️ Presentación 20 L', productImg: 'assets/img/peracetic-20l.png', title: 'Porrón Clínico 20 L', pills: ['Dosificación en mililitros'], particles: 'sporesClear' },

  // Slide 2: Perfil
  perfil_conc: { tag: '🧪 Fórmula Clínica', icon: '🧪', title: 'Ácido Peracético 14–16%', pills: ['FDA / USDA (GRAS)'], particles: 'sporesClear' },
  perfil_stat: { tag: '🏆 Ensayo Certificado', counter: true, title: 'Reducción en 30 s', pills: ['E. coli ATCC 11229 · 1:75'], particles: 'sporesClear' },
  micro_bacterias: { tag: '🦠 Bacterias', icon: '🦠', title: 'Gram+ y Gram-', pills: [{ text: 'NEUTRALIZADO 99.999%', cls: 'ok' }], zap: true, theme: 'theme-ok', particles: 'sporesClear' },
  micro_virus: { tag: '🧬 Virus', icon: '🧬', title: 'Envueltos y No Envueltos', pills: [{ text: 'AMPLIO ESPECTRO', cls: 'ok' }], zap: true, theme: 'theme-ok', particles: 'sporesClear' },
  micro_hongos: { tag: '🍄 Hongos', icon: '🍄', title: 'Hongos y Levaduras', pills: [{ text: 'ZONAS HÚMEDAS', cls: 'ok' }], zap: true, theme: 'theme-ok', particles: 'sporesClear' },
  micro_esporas: { tag: '🛡️ Esporas', icon: '🛡️', title: 'Nivel Alto', pills: [{ text: 'ESTERILIZANTE 1:75', cls: 'ok' }], zap: true, theme: 'theme-ok', particles: 'sporesClear' },
  mito_olor: { tag: '👃 Sin Olor', icon: '✨', title: 'Cero Olor y Color', pills: [{ text: 'Confort del paciente', cls: 'ok' }], theme: 'theme-ok' },
  mito_fria: { tag: '❄️ Agua Fría', icon: '❄️', title: 'Eficaz hasta 4 °C', pills: [{ text: 'No requiere calentar', cls: 'ok' }], theme: 'theme-ok', particles: 'frost' },
  mito_espuma: { tag: '🫧 Cero Espuma', icon: '🫧', title: 'Fácil Aplicación', pills: [{ text: 'Cero residuos', cls: 'ok' }], theme: 'theme-ok', particles: 'freshAir' },

  // Slide 3: Simulador 3D Biocida
  sim_intro: { tag: '⚔️ Mecanismo Biocida', widget: 'bio', bioPhase: 0, particles: 'sporesClear' },
  sim_phase1: { tag: '1️⃣ Ataque Oxidativo', widget: 'bio', bioPhase: 1 },
  sim_phase2: { tag: '2️⃣ 99.999% Neutralizado', widget: 'bio', bioPhase: 2 },
  sim_phase3: { tag: '3️⃣ 100% Biodegradable', widget: 'bio', bioPhase: 3, theme: 'theme-ok', particles: 'sporesClear' },

  // Slide 4: Compatibilidad y Cloro
  compat_acero: { tag: '✅ Acero Inoxidable', icon: '🔩', title: 'Acero Inoxidable', pills: [{ text: 'SEGURO · PREVIENE SARRO', cls: 'ok' }], theme: 'theme-ok', particles: 'sporesClear' },
  compat_hule: { tag: '✅ Hule y Plásticos', icon: '🩺', title: 'Hule, Goma y Plásticos', pills: [{ text: 'COMPATIBLE', cls: 'ok' }], theme: 'theme-ok', particles: 'sporesClear' },
  compat_cobre: { tag: '⛔ Precaución', icon: '🪙', title: 'Cobre — NO Aplicar', pills: [{ text: 'RIESGO DE DAÑO', cls: 'danger' }], theme: 'theme-danger' },
  compat_aluminio: { tag: '⛔ Precaución', icon: '⚙️', title: 'Aluminio y Metales Suaves', pills: [{ text: 'CORROSIVO', cls: 'danger' }], theme: 'theme-danger' },
  compat_cloro: { tag: '☠️ REGLA DE ORO', icon: '☠️', title: '¡NUNCA CON CLORO!', pills: [{ text: 'LIBERA GAS TÓXICO', cls: 'danger' }], hazardBtn: true, theme: 'theme-danger', particles: 'toxicGas', tone: true },
  compat_gas: { tag: '🚫 Separación Total', icon: '🧪', title: 'Recipientes Separados', pills: [{ text: 'CERO CLORO', cls: 'danger' }], hazardBtn: true, theme: 'theme-danger', particles: 'toxicGas' },

  // Slide 5: Calculadora Compacta (Solo 1:300 y 1:75)
  calc_panel: { tag: '🧮 Calculadora 1:300 · 1:75', widget: 'calc' },

  // Slide 6: 4 Pasos
  paso_1: { tag: 'Paso 1 de 4', icon: '🧽', title: 'Limpieza Previa', pills: ['Retirar materia orgánica'] },
  paso_2: { tag: 'Paso 2 de 4', icon: '🧪', title: 'Preparar y Aplicar', pills: ['Medir ml en agua limpia'] },
  paso_3: { tag: 'Paso 3 de 4', radial: '5–10 min', title: 'Tiempo de Contacto', pills: ['No secar antes de tiempo'], particles: 'sporesClear' },
  paso_4: { tag: 'Paso 4 de 4', icon: '💧', title: 'Enjuagar o Secar', pills: ['1:300 → Sí enjuagar', { text: '1:75 → NO', cls: 'ok' }], theme: 'theme-ok', particles: 'freshAir' },

  // Slide 8: Almacenamiento
  store_vertical: { tag: '📦 Envase Original', icon: '🛢️', title: 'Porrón 20 L Vertical', pills: [{ text: 'Cerrado al guardar', cls: 'ok' }], theme: 'theme-ok' },
  store_fresco: { tag: '⏳ Vigencia 12 Meses', icon: '🌬️', title: 'Fresco, Seco y Ventilado', pills: [{ text: '12 meses', cls: 'ok' }], theme: 'theme-ok', particles: 'freshAir' },
  store_nunca: { tag: '❌ Prohibiciones', icon: '☀️', title: 'Sin Sol, Calor ni Comida', pills: [{ text: 'NO REENVASAR', cls: 'danger' }], theme: 'theme-danger' },
  store_calor: { tag: '🌡️ Límite 35 °C', thermo: { temp: 39, danger: true }, title: '39 °C · ¡Alerta Calor!', pills: [{ text: 'REUBICAR (> 35 °C)', cls: 'danger' }], theme: 'theme-danger', particles: 'toxicGas' },
  store_ok: { tag: '🌡️ Rango Óptimo', thermo: { temp: 22, danger: false }, title: '22 °C · Zona Segura', pills: [{ text: 'MÁXIMO 35 °C', cls: 'ok' }], theme: 'theme-ok', particles: 'frost' },

  // Slide 9: Emergencias 3D + tsParticles
  em_ojos: { tag: '👁️ Ojos · Acción Inmediata', widget: 'em', em: 'ojos', pills: ['15 min agua abundante', 'Urgencias'], particles: 'waterJet' },
  em_piel: { tag: '🚿 Piel · Ducha Seguridad', widget: 'em', em: 'piel', pills: ['Agua y jabón', 'Quitar ropa'], particles: 'shower' },
  em_inhalacion: { tag: '🌬️ Inhalación', widget: 'em', em: 'inhalacion', pills: ['Aire libre', 'Reposo'], particles: 'freshAir' },
  em_ingestion: { tag: '🚫 Ingestión', widget: 'em', em: 'ingestion', pills: ['1–2 vasos agua', { text: 'NUNCA VOMITAR', cls: 'danger' }], theme: 'theme-danger' },
  em_derrame: { tag: '⚠️ Derrame', widget: 'em', em: 'derrame', pills: ['EPP + arcilla/vermiculita', { text: 'NO DRENAJE', cls: 'danger' }], theme: 'theme-danger', particles: 'vermiculite' },

  // Slide 10 & 11
  quiz_panel: { tag: '📝 Mini-Quiz Clínico', widget: 'quiz' },
  close_thanks: { tag: '🏆 Hospital Arboledas', icon: '💚', title: '¡Muchas Gracias!', pills: [{ text: 'Seguridad Clínica', cls: 'ok' }], theme: 'theme-ok', particles: 'sporesClear' },
  close_qr: { tag: '📱 Tu Guía en el Teléfono', widget: 'qr' },
  close_docs: { tag: '📁 Documentos PDF', widget: 'docs' }
};

const stagePipsBySlide = {
  0: [
    { vis: 'portada_hosp', label: '🏥' },
    { vis: 'portada_mol', label: '🧬 3D' },
    { vis: 'portada_rapida', label: '⚡ 5–10m' },
    { vis: 'portada_biodeg', label: '🌿 Eco' },
    { vis: 'portada_uso', label: '❄️ 4°C' },
    { vis: 'portada_porron', label: '🛢️ 20L' }
  ],
  1: [
    { vis: 'perfil_conc', label: '14–16%' },
    { vis: 'perfil_stat', label: '99.999%' },
    { vis: 'micro_bacterias', label: '🦠' },
    { vis: 'micro_virus', label: '🧬' },
    { vis: 'micro_hongos', label: '🍄' },
    { vis: 'micro_esporas', label: '🛡️' },
    { vis: 'mito_olor', label: '👃' },
    { vis: 'mito_fria', label: '❄️' },
    { vis: 'mito_espuma', label: '🫧' }
  ],
  2: [
    { vis: 'sim_phase1', label: '1. Oxidación' },
    { vis: 'sim_phase2', label: '2. 5–10 min' },
    { vis: 'sim_phase3', label: '3. O₂/H₂O' }
  ],
  3: [
    { vis: 'compat_acero', label: '✅ Acero' },
    { vis: 'compat_hule', label: '✅ Hule' },
    { vis: 'compat_cobre', label: '⛔ Cobre' },
    { vis: 'compat_aluminio', label: '⛔ Aluminio' },
    { vis: 'compat_cloro', label: '☠️ Cloro' }
  ],
  4: [{ vis: 'calc_panel', label: '🧮 Abrir Calculadora 1:300 · 1:75', persist: true }],
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
    { vis: 'em_inhalacion', label: '🌬️ Aire' },
    { vis: 'em_ingestion', label: '🚫 Vómito' },
    { vis: 'em_derrame', label: '⚠️ Derrame' }
  ],
  9: [{ vis: 'quiz_panel', label: '📝 Responder Quiz', persist: true }],
  10: [
    { vis: 'close_thanks', label: '💚 Gracias' },
    { vis: 'close_qr', label: '📱 QR / Tarjeta', persist: true },
    { vis: 'close_docs', label: '📁 PDFs', persist: true }
  ]
};

const stageDefaultTags = {
  0: '✨ Toca a Gemi o un ícono',
  1: '✨ Perfil · Toca a Gemi',
  2: '🔬 Simulador 3D Biocida',
  3: '🔬 Compatibilidad · Regla de Oro',
  4: '🧮 Calculadora 1:300 · 1:75',
  5: '📋 Rutina en 4 Pasos',
  6: '🛡️ EPP Obligatorio',
  7: '📦 Almacenamiento Seguro',
  8: '🚑 Emergencias 3D',
  9: '📝 Mini-Quiz con Gemi',
  10: '📱 QR, Tarjeta y PDFs'
};

function hideAllVisualWidgets() {
  [stageMolWrap, stageBioWrap, calcStageWrap, stageEmWrap, quizStageWrap, closingQrWrap, closingDocsWrap].forEach(w => {
    if (w) w.classList.add('hidden');
  });
  if (simEco) simEco.classList.remove('show');
}

function clearStageVisual() {
  currentVisKey = null;
  if (stageVisualPane) {
    stageVisualPane.classList.add('hidden');
    stageVisualPane.classList.remove('theme-danger', 'theme-ok');
  }
  if (stageSplit) stageSplit.classList.remove('has-visual');
  if (stageAnimContent) { stageAnimContent.innerHTML = ''; stageAnimContent.classList.add('hidden'); }
  hideAllVisualWidgets();
  if (window.__playStageParticles) window.__playStageParticles(null);
  document.querySelectorAll('.stage-pip').forEach(p => p.classList.remove('active'));
  currentReadingEl = eppSpeechBubble;
}

function animatePopCounter(el) {
  let val = 92.0;
  const step = () => {
    if (!document.body.contains(el)) return;
    val += (99.999 - val) * 0.16;
    if (99.999 - val < 0.005) el.textContent = '99.999%';
    else { el.textContent = val.toFixed(3) + '%'; requestAnimationFrame(step); }
  };
  requestAnimationFrame(step);
}

function triggerChlorineHazardAlert() {
  haptic([40, 30, 65]);
  playTone(190, 0.35, 'sawtooth', 0.07);
  setTimeout(() => playTone(145, 0.35, 'sawtooth', 0.07), 180);
  playBuddyGesture('alertShake');
  const hz = document.getElementById('hazardOverlay');
  if (hz) hz.classList.remove('hidden');
}

function showStageVisual(visKey) {
  if (!visKey || !stageVisualCatalog[visKey]) {
    clearStageVisual();
    return;
  }
  currentVisKey = visKey;
  const cfg = stageVisualCatalog[visKey];
  if (eppStageTag && cfg.tag) eppStageTag.textContent = cfg.tag;

  stageVisualPane.classList.remove('hidden', 'theme-danger', 'theme-ok');
  if (cfg.theme) stageVisualPane.classList.add(cfg.theme);
  stageSplit.classList.add('has-visual');

  document.querySelectorAll('.stage-pip').forEach(p => p.classList.toggle('active', p.dataset.vis === visKey));

  hideAllVisualWidgets();
  if (cfg.widget === 'mol' && stageMolWrap) stageMolWrap.classList.remove('hidden');
  else if (cfg.widget === 'bio' && stageBioWrap) {
    stageBioWrap.classList.remove('hidden');
    if (typeof cfg.bioPhase === 'number' && window.__setBiocideSimPhase) {
      window.__setBiocideSimPhase(cfg.bioPhase);
      if (cfg.bioPhase === 3 && simEco) simEco.classList.add('show');
    }
  } else if (cfg.widget === 'calc' && calcStageWrap) calcStageWrap.classList.remove('hidden');
  else if (cfg.widget === 'em' && stageEmWrap) {
    stageEmWrap.classList.remove('hidden');
    if (em3DEl) em3DEl.classList.remove('hidden');
    if (window.__setEmergency3D) window.__setEmergency3D(cfg.em);
  } else if (cfg.widget === 'quiz' && quizStageWrap) quizStageWrap.classList.remove('hidden');
  else if (cfg.widget === 'qr' && closingQrWrap) closingQrWrap.classList.remove('hidden');
  else if (cfg.widget === 'docs' && closingDocsWrap) closingDocsWrap.classList.remove('hidden');

  let bodyHtml = '';
  if (cfg.counter) bodyHtml += `<div class="pop-big-stat" id="stageCounterVal">92.000%</div>`;
  else if (cfg.radial) bodyHtml += `<div class="anim-radial-ring" id="demoRadialRing" title="Toca para simular">${cfg.radial}</div>`;
  else if (cfg.thermo) {
    const pct = Math.min(100, Math.round((cfg.thermo.temp / 45) * 100));
    const bg = cfg.thermo.danger ? '#EF4444' : '#2DD4BF';
    bodyHtml += `<div class="anim-thermo-track"><div class="anim-thermo-fill" id="liveThermoFill" style="width:${pct}%;background:${bg};"></div></div>`;
  } else if (cfg.img) bodyHtml += `<img src="${cfg.img}" alt="Hospital Arboledas" class="pop-media-img" />`;
  else if (cfg.productImg) bodyHtml += `<img src="${cfg.productImg}" alt="SWIPE Peracetic 20L" class="pop-media-product" />`;
  else if (cfg.icon) bodyHtml += `<div class="pop-icon" id="stagePopIcon">${cfg.icon}</div>`;

  if (cfg.title) bodyHtml += `<div class="pop-title" id="stagePopTitle">${cfg.title}</div>`;
  if (cfg.pills && cfg.pills.length) {
    bodyHtml += `<div class="pop-chip-row" id="stagePopPills">` + cfg.pills.map(p => {
      const text = typeof p === 'string' ? p : p.text;
      const cls = typeof p === 'object' && p.cls ? p.cls : '';
      return `<span class="pop-pill ${cls}">${text}</span>`;
    }).join('') + `</div>`;
  }
  if (cfg.zap) bodyHtml += `<button type="button" class="pop-action-btn" id="btnZapMicrobe">⚡ Neutralizar patógeno</button>`;
  if (cfg.hazardBtn) bodyHtml += `<button type="button" class="pop-action-btn danger" id="btnTrigHazard">🚨 Simular Alerta Química</button>`;
  if (cfg.radial) bodyHtml += `<button type="button" class="pop-action-btn" id="btnDemoTimer">⏱️ Simular 5 min</button>`;
  if (cfg.thermo) {
    bodyHtml += `<div class="thermo-slider-wrap"><span>15°C</span><input type="range" id="liveThermoRange" min="15" max="42" value="${cfg.thermo.temp}" aria-label="Temperatura de almacén" /><span>42°C</span></div>`;
  }
  if (cfg.sub) bodyHtml += `<p class="pop-sub">${cfg.sub}</p>`;

  if (bodyHtml) {
    stageAnimContent.innerHTML = bodyHtml;
    stageAnimContent.classList.remove('hidden');
    const counterEl = document.getElementById('stageCounterVal');
    if (counterEl) animatePopCounter(counterEl);

    const btnZap = document.getElementById('btnZapMicrobe');
    if (btnZap) {
      btnZap.addEventListener('click', () => {
        haptic(24);
        playTone(840, 0.12);
        const ic = document.getElementById('stagePopIcon');
        if (ic) ic.classList.add('zapped');
        btnZap.textContent = '✅ ¡99.999% Neutralizado!';
        btnZap.classList.add('done');
        if (window.__playStageParticles) window.__playStageParticles('sporesClear');
        playBuddyGesture('cheer');
      });
    }

    const btnHz = document.getElementById('btnTrigHazard');
    if (btnHz) btnHz.addEventListener('click', triggerChlorineHazardAlert);

    const btnTimerDemo = document.getElementById('btnDemoTimer');
    const ringEl = document.getElementById('demoRadialRing');
    const runRingDemo = () => {
      if (!ringEl || ringEl.dataset.running === '1') return;
      ringEl.dataset.running = '1';
      haptic(18);
      let m = 1;
      ringEl.textContent = '1:00m';
      if (btnTimerDemo) btnTimerDemo.textContent = '⏳ Actuando...';
      const iv = setInterval(() => {
        if (!document.body.contains(ringEl)) { clearInterval(iv); return; }
        m++;
        if (m <= 5) {
          ringEl.textContent = `${m}:00m`;
          playTone(540 + m * 55, 0.05);
        } else {
          clearInterval(iv);
          ringEl.textContent = '✅ Listo';
          ringEl.dataset.running = '0';
          if (btnTimerDemo) { btnTimerDemo.textContent = '✅ ¡Desinfección Lista!'; btnTimerDemo.classList.add('done'); }
          spawnConfetti(22);
          playBuddyGesture('cheer');
        }
      }, 360);
    };
    if (btnTimerDemo) btnTimerDemo.addEventListener('click', runRingDemo);
    if (ringEl) ringEl.addEventListener('click', runRingDemo);

    const thermoInput = document.getElementById('liveThermoRange');
    if (thermoInput) {
      thermoInput.addEventListener('input', () => {
        const t = parseInt(thermoInput.value, 10);
        const danger = t > 35;
        const fill = document.getElementById('liveThermoFill');
        const titleEl = document.getElementById('stagePopTitle');
        const pillsEl = document.getElementById('stagePopPills');
        if (fill) {
          fill.style.width = `${Math.min(100, Math.round((t / 45) * 100))}%`;
          fill.style.background = danger ? '#EF4444' : '#2DD4BF';
        }
        stageVisualPane.classList.toggle('theme-danger', danger);
        stageVisualPane.classList.toggle('theme-ok', !danger);
        if (titleEl) titleEl.textContent = danger ? `${t} °C · ¡Alerta Calor!` : `${t} °C · Zona Segura`;
        if (pillsEl) {
          pillsEl.innerHTML = danger
            ? `<span class="pop-pill danger">REUBICAR (&gt; 35 °C)</span>`
            : `<span class="pop-pill ok">ÓPTIMO (≤ 35 °C)</span>`;
        }
        if (!autoMode && !slideTourRunning) setBuddyMood(danger ? 'alert' : 'happyOpen', null, false);
      });
    }
  } else {
    stageAnimContent.innerHTML = '';
    stageAnimContent.classList.add('hidden');
  }

  if (cfg.tone) playTone(220, 0.3, 'sawtooth', 0.05);
  if (window.__playStageParticles) window.__playStageParticles(cfg.particles || null);

  if (typeof gsap !== 'undefined') {
    gsap.fromTo(stageVisualPane, { opacity: 0, scale: 0.92, y: 8 }, { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'back.out(1.5)' });
  }
  currentReadingEl = stageVisualPane;
  lookBuddyAtElement(stageVisualPane, 0.35);
}

const eppStageLabels = {
  ojos: '🥽 Gafas / Careta',
  guantes: '🧤 Guantes Nitrilo',
  bata: '🥼 Bata Impermeable',
  mascarilla: '😷 Mascarilla Vapores'
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

function equipGemiEpp(zoneKey, keepPrevious = false, toggleMode = false) {
  ['ojos', 'guantes', 'bata', 'mascarilla'].forEach(k => {
    const layer = document.getElementById(`eppGear-${k}`);
    if (!layer) return;
    if (k === zoneKey) {
      if (toggleMode) layer.classList.toggle('hidden');
      else layer.classList.remove('hidden');
    } else if (!keepPrevious) layer.classList.add('hidden');
  });
  document.querySelectorAll('.eq-pill').forEach(p => {
    const layer = document.getElementById(`eppGear-${p.dataset.eq}`);
    p.classList.toggle('equipped', !!(layer && !layer.classList.contains('hidden')));
  });
  const count = document.querySelectorAll('#eppEquippedBadges .eq-pill.equipped').length;
  if (eppStageTag) {
    if (count === 4 && toggleMode) {
      eppStageTag.textContent = '🛡️ ¡Gemi 100% Protegido! (4/4)';
      spawnConfetti(32);
      playBuddyGesture('cheer');
      return;
    }
    eppStageTag.textContent = toggleMode ? `${eppStageLabels[zoneKey] || ''} · (${count}/4)` : (eppStageLabels[zoneKey] || '');
  }
  playBuddyGesture('wave');
}

function syncPlayBtnState() {
  if (!btnPlaySlide) return;
  const running = slideTourRunning || autoMode;
  btnPlaySlide.textContent = running ? '⏹️ Detener' : '▶️ Animar';
  btnPlaySlide.classList.toggle('active', running);
  btnPlaySlide.classList.toggle('play-pulse', !running);
}

function mountStageForSlide(idx) {
  if (!stageActorCard) return;
  clearStageVisual();
  const slot = slides[idx] && slides[idx].querySelector('.stage-slot');
  if (slot) slot.appendChild(stageActorCard);
  else if (stagePool) stagePool.appendChild(stageActorCard);

  if (eppGradCap) eppGradCap.classList.toggle('hidden', idx !== 5);
  if (eppEquippedBadges) eppEquippedBadges.classList.toggle('hidden', idx !== 6);
  if (idx !== 6) resetEppGear();
  else if (eppStageTag) eppStageTag.textContent = '🛡️ Equipa a Gemi (0/4)';
  if (idx !== 6 && eppStageTag) eppStageTag.textContent = stageDefaultTags[idx] || '✨ Toca a Gemi';

  if (stageStepDots) {
    const pips = stagePipsBySlide[idx] || [];
    stageStepDots.innerHTML = pips.map(p =>
      `<button type="button" class="stage-pip" data-vis="${p.vis}" data-persist="${p.persist ? '1' : '0'}">${p.label}</button>`
    ).join('');
    stageStepDots.querySelectorAll('.stage-pip').forEach(btn => {
      btn.addEventListener('click', () => {
        haptic(14);
        stopSlideTour();
        const visKey = btn.dataset.vis;
        const persist = btn.dataset.persist === '1';
        if (currentVisKey === visKey && !persist) {
          stopActiveVoice();
          clearStageVisual();
          if (eppStageTag) eppStageTag.textContent = stageDefaultTags[idx] || '✨ Toca a Gemi';
          return;
        }
        const match = (autoScripts[idx] || []).find(c => c.vis === visKey);
        const speech = match ? match.s : '';
        const mood = match && match.mood ? match.mood : 'normal';
        if (match && match.a) { try { match.a(); } catch (e) {} }
        setBuddyMood(mood, speech || stageDefaultTags[idx], false);
        showStageVisual(visKey);
        playBuddyGesture(mood === 'alert' ? 'alertShake' : 'point');
        if (speech) speakWithLipSync(speech);
      });
    });
  }
}

document.querySelectorAll('.eq-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    haptic(18);
    stopSlideTour();
    const zone = pill.dataset.eq;
    equipGemiEpp(zone, true, true);
    const speech = eppSpeeches[zone] || '';
    setBuddyMood('normal', speech, false);
    currentReadingEl = eppSpeechBubble;
    lookBuddyAtElement(eppSpeechBubble, 0.08, pill);
    playTone(660, 0.06);
    if (speech) speakWithLipSync(speech);
  });
});

window.__onBioTap = () => {
  haptic(16);
  playTone(740, 0.07);
  if (window.__playStageParticles) window.__playStageParticles('sporesClear');
};

const buddyQuickMenu = document.getElementById('buddyQuickMenu');
const toggleSlideTourAction = () => {
  haptic(18);
  if (autoMode) { stopAutoPresentation(); syncPlayBtnState(); return; }
  if (slideTourRunning) {
    stopSlideTour();
    setBuddyMood('normal', buddyLines[currentSlide] || 'Toca un ícono o a Gemi para continuar.', false);
  } else {
    startSlideTour(currentSlide);
  }
};
if (eppGemiSvg) {
  eppGemiSvg.addEventListener('click', toggleSlideTourAction);
  const openBqm = (e) => { e.preventDefault(); if (buddyQuickMenu) buddyQuickMenu.classList.toggle('hidden'); };
  eppGemiSvg.addEventListener('dblclick', openBqm);
  eppGemiSvg.addEventListener('contextmenu', openBqm);
}
if (btnPlaySlide) btnPlaySlide.addEventListener('click', toggleSlideTourAction);
if (btnAskGemi && buddyQuickMenu) {
  btnAskGemi.addEventListener('click', (e) => {
    e.stopPropagation();
    haptic(14);
    buddyQuickMenu.classList.toggle('hidden');
  });
}
let reactCycle = 0;
if (btnReactClap) {
  const emojis = ['👏', '💚', '🛡️', '🎉'];
  btnReactClap.addEventListener('click', () => {
    haptic(20);
    const em = emojis[reactCycle++ % emojis.length];
    spawnReaction(em);
    btnReactClap.textContent = em;
    playBuddyGesture('cheer');
  });
}

// ===== 2E. EJECUCIÓN DE GUIONES Y QUIZ =====
const tourEndVisual = { 0: 'portada_mol', 2: 'sim_phase3', 4: 'calc_panel', 7: 'store_ok', 8: 'em_derrame', 9: 'quiz_panel', 10: 'close_qr' };
async function runSlideScript(idx, alive) {
  const chunks = autoScripts[idx] || [{ s: buddyLines[idx] }];
  for (let c = 0; c < chunks.length; c++) {
    if (!alive()) return;
    const ch = chunks[c];
    if (ch.quiz) { await runAutoQuiz(alive); continue; }

    setBuddyMood(ch.mood || 'normal', ch.s, false);
    if ('vis' in ch) showStageVisual(ch.vis);
    if (ch.a) { try { ch.a(); } catch (e) {} }
    playBuddyGesture(ch.mood === 'alert' ? 'alertShake' : 'point');

    await speakChunk(ch.s, alive);
    if (!alive()) return;
    await sleepAuto(ch.pause || 350);
  }
  if (tourEndVisual[idx]) showStageVisual(tourEndVisual[idx]);
  else if (idx !== 6) clearStageVisual();
}

function stopSlideTour() {
  slideTourRunning = false;
  slideTourGen++;
  clearTimeout(autoStepTimer);
  stopActiveVoice();
  syncPlayBtnState();
}

async function startSlideTour(idx) {
  stopAutoPresentation();
  stopSlideTour();
  slideTourRunning = true;
  syncPlayBtnState();
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
    lookBuddyAtElement(document.getElementById('quizQuestion'), 0.25);
    const spoken = `Pregunta ${q + 1}. ${item.q} ` + item.options.map((o, i) => `Opción ${letters[i]}: ${o}.`).join(' ');
    await speakChunk(spoken, alive);
    for (let s = 5; s > 0; s--) {
      if (!alive()) return;
      setBuddyMood('normal', `🤔 Piénsenlo... ${s}`, false);
      await sleepAuto(1000);
    }
    if (!alive()) return;
    const btn = quizOptions.children[item.correct];
    if (btn) btn.click();
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
    await sleepAuto(700);
    if (!alive()) return;
    await runSlideScript(idx, alive);
    if (!alive()) return;
    await sleepAuto(450);
  }
  if (alive()) stopAutoPresentation();
}

function stopAutoPresentation() {
  autoMode = false;
  autoGen++;
  clearTimeout(autoStepTimer);
  if (btnAutoPlay) { btnAutoPlay.classList.remove('active'); btnAutoPlay.innerHTML = '<span>🤖 Auto</span>'; }
  stopActiveVoice();
  syncPlayBtnState();
}

function startAutoPresentation() {
  autoMode = true;
  if (btnAutoPlay) { btnAutoPlay.classList.add('active'); btnAutoPlay.innerHTML = '<span>⏸️ Pausa</span>'; }
  syncPlayBtnState();
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
const mobileProgressBar = document.getElementById('mobileProgressBar');
const slideCounter = document.getElementById('slideCounter');
const btnMobileIndex = document.getElementById('btnMobileIndex');
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
  item.addEventListener('click', () => { stopAutoPresentation(); openSlide(i); menuModal.classList.add('hidden'); });
  menuList.appendChild(item);
});

const pixelPortal = document.getElementById('pixelPortal');

function runFuturisticTransition(prevSlide, nextSlideEl) {
  if (typeof gsap === 'undefined') {
    slides.forEach(s => { if (s !== nextSlideEl) s.classList.remove('active'); });
    nextSlideEl.classList.add('active');
    return;
  }
  slides.forEach(s => {
    gsap.killTweensOf(s.querySelectorAll('.stagger'));
    if (s !== prevSlide && s !== nextSlideEl) {
      gsap.killTweensOf(s);
      s.classList.remove('active');
      gsap.set(s, { clearProps: 'all' });
    }
  });
  gsap.killTweensOf([prevSlide, nextSlideEl, pixelPortal]);
  const origin = window.__getPixelOrigin2D ? window.__getPixelOrigin2D() : { x: 50, y: 50 };
  const exitPt = window.__getPixelOrigin2D ? window.__getPixelOrigin2D() : { x: 25, y: 35 };
  const oxPx = (origin.x / 100) * window.innerWidth;
  const oyPx = (origin.y / 100) * window.innerHeight;

  if (prevSlide !== nextSlideEl) {
    gsap.to(prevSlide, {
      opacity: 0, scale: 0.05, transformOrigin: `${exitPt.x}% ${exitPt.y}%`,
      borderRadius: '18px', duration: 0.35, ease: 'power3.in',
      onComplete: () => { prevSlide.classList.remove('active'); gsap.set(prevSlide, { clearProps: 'all' }); }
    });
  }
  if (pixelPortal) {
    pixelPortal.classList.remove('hidden');
    gsap.fromTo(pixelPortal,
      { left: oxPx - 9, top: oyPx - 9, width: 18, height: 18, opacity: 1, borderRadius: '3px' },
      { left: 0, top: 54, width: window.innerWidth, height: Math.max(200, window.innerHeight - 108), opacity: 0, borderRadius: '18px', duration: 0.62, ease: 'power3.out', onComplete: () => pixelPortal.classList.add('hidden') }
    );
  }
  nextSlideEl.classList.add('active');
  gsap.set(nextSlideEl, { clearProps: 'all', opacity: 1, zIndex: 3 });
  gsap.fromTo(nextSlideEl,
    { opacity: 0.25, scale: 0.04, transformOrigin: `${origin.x}% ${origin.y}%`, clipPath: 'inset(35% 35% 35% 35% round 16px)' },
    { opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.62, delay: 0.05, ease: 'power3.out', clearProps: 'transform,clipPath,transformOrigin' }
  );
  const targets = nextSlideEl.querySelectorAll('.stagger');
  gsap.fromTo(targets, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, stagger: 0.04, delay: 0.18, ease: 'power3.out', overwrite: 'auto' });
}

function openSlide(index) {
  if (index < 0 || index >= slides.length) return;
  const prev = slides[currentSlide];
  currentSlide = index;
  window.__activeSlideIndex = currentSlide;
  const next = slides[currentSlide];

  if (prev === next) next.classList.add('active');
  else runFuturisticTransition(prev, next);

  const pctStr = `${((currentSlide + 1) / slides.length) * 100}%`;
  progressBar.style.width = pctStr;
  if (mobileProgressBar) mobileProgressBar.style.width = pctStr;
  slideCounter.textContent = `${currentSlide + 1} / ${slides.length}`;
  if (btnMobileIndex) btnMobileIndex.textContent = `${currentSlide + 1} / ${slides.length} ▾`;
  btnPrev.disabled = currentSlide === 0;
  btnNext.disabled = currentSlide === slides.length - 1;

  Array.from(dotsNav.children).forEach((d, idx) => d.classList.toggle('active', idx === currentSlide));
  Array.from(menuList.children).forEach((m, idx) => m.classList.toggle('current', idx === currentSlide));

  notesBody.textContent = slides[currentSlide].dataset.notes || '';
  notesTime.textContent = `Tiempo sugerido: ${slides[currentSlide].dataset.time || ''}`;
  if (buddyQuickMenu) buddyQuickMenu.classList.add('hidden');

  stopSlideTour();
  mountStageForSlide(currentSlide);
  if (!autoMode) {
    if (currentSlide === 4) showStageVisual('calc_panel');
    else if (currentSlide === 9) showStageVisual('quiz_panel');
    else if (currentSlide === 10) showStageVisual('close_qr');
  }
  if (window.__triggerWarp3D) window.__triggerWarp3D();
  updateBuddyForSlide(currentSlide);

  const topbarEl = document.querySelector('.topbar');
  if (topbarEl) { topbarEl.classList.remove('hud-flash'); void topbarEl.offsetWidth; topbarEl.classList.add('hud-flash'); }
  playTone(520, 0.05, 'sine', 0.03);
}

// Swipe táctil izquierda/derecha en celular (aislado de escenas 3D y controles deslizantes)
let touchStartX = 0, touchStartY = 0, touchIgnoreSwipe = false;
document.getElementById('deck').addEventListener('touchstart', (e) => {
  const t = e.target;
  touchIgnoreSwipe = !!(t && t.closest && t.closest('#molecule3D, #biocide3D, #beaker3D, #em3D, input, .calc-slider-mini, .thermo-slider-wrap'));
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });
document.getElementById('deck').addEventListener('touchend', (e) => {
  if (touchIgnoreSwipe) return;
  const dx = e.changedTouches[0].screenX - touchStartX;
  const dy = e.changedTouches[0].screenY - touchStartY;
  if (Math.abs(dx) > 58 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    haptic(14);
    stopAutoPresentation();
    dx < 0 ? nextSlide() : prevSlide();
  }
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

function toggleNotes() { notesDrawer.classList.toggle('hidden'); btnNotes.classList.toggle('active'); }
btnNotes.addEventListener('click', toggleNotes);
document.getElementById('btnCloseNotes').addEventListener('click', toggleNotes);
document.getElementById('btnMenu').addEventListener('click', () => menuModal.classList.toggle('hidden'));
if (btnMobileIndex) btnMobileIndex.addEventListener('click', () => { haptic(14); menuModal.classList.toggle('hidden'); });
document.getElementById('btnCloseMenu').addEventListener('click', () => menuModal.classList.add('hidden'));
menuModal.addEventListener('click', (e) => { if (e.target === menuModal) menuModal.classList.add('hidden'); });

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
}
document.getElementById('btnFullscreen').addEventListener('click', toggleFullscreen);

// ===== 4. TEMPORIZADOR 25:00 Y TEMA =====
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
    timerInterval = setInterval(() => { if (totalSeconds > 0) { totalSeconds--; renderTimer(); } else { clearInterval(timerInterval); timerInterval = null; } }, 1000);
  }
});
document.getElementById('btnTimerReset').addEventListener('click', () => { clearInterval(timerInterval); timerInterval = null; totalSeconds = 25 * 60; btnTimer.classList.remove('running', 'warning'); renderTimer(); });

const btnTheme = document.getElementById('btnTheme');
function toggleTheme() { document.body.classList.toggle('light-mode'); if (btnTheme) btnTheme.classList.toggle('active', document.body.classList.contains('light-mode')); playTone(640, 0.05); }
if (btnTheme) btnTheme.addEventListener('click', toggleTheme);

document.getElementById('btnCloseHazard').addEventListener('click', () => document.getElementById('hazardOverlay').classList.add('hidden'));

// ===== 5. CALCULADORA COMPACTA (SOLO 1:300 Y 1:75) =====
const litersRange = document.getElementById('litersRange');
const litersValue = document.getElementById('litersValue');
const resRatio = document.getElementById('resRatio');
const resRinse = document.getElementById('resRinse');
const resAmount = document.getElementById('resAmount');
const resSub = document.getElementById('resSub');

let activeTask = document.querySelector('.task-btn.active');
let currentDisplayedMl = 16.5;

function updateCalc() {
  const liters = parseInt(litersRange.value, 10);
  const mlPerLiter = parseFloat(activeTask.dataset.ml);
  const targetMl = liters * mlPerLiter;

  litersValue.textContent = `${liters} L`;
  resRatio.textContent = `${activeTask.dataset.ratio} · ${activeTask.dataset.ppm}`;
  resRinse.textContent = activeTask.dataset.rinse;
  resRinse.className = `res-rinse ${activeTask.dataset.rinseOk}`;
  resSub.textContent = `en ${liters} ${liters === 1 ? 'litro' : 'litros'} de agua`;

  if (window.__setBeakerLevel3D) window.__setBeakerLevel3D(liters / 20);
  document.querySelectorAll('.ql-chip').forEach(ch => ch.classList.toggle('active', parseInt(ch.dataset.l, 10) === liters));
  if (typeof gsap !== 'undefined') {
    const obj = { val: currentDisplayedMl };
    gsap.to(obj, { val: targetMl, duration: 0.3, onUpdate: () => { resAmount.textContent = `${obj.val.toFixed(1)} ml`; }, onComplete: () => { currentDisplayedMl = targetMl; } });
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
    if (!autoMode && !slideTourRunning) {
      const msg = btn.dataset.rinseOk === 'ok' ? '✅ ¡Ojo! Esta dilución NO requiere enjuague.' : '💧 Requiere enjuague tras 5–10 min.';
      setBuddyMood(btn.dataset.rinseOk === 'ok' ? 'happyOpen' : 'normal', msg, false);
      playBuddyGesture('nod');
    }
  });
});
if (litersRange) litersRange.addEventListener('input', updateCalc);
document.querySelectorAll('.ql-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    haptic(14);
    if (litersRange) { litersRange.value = chip.dataset.l; updateCalc(); }
    playTone(620, 0.05);
  });
});

// ===== 6. REACCIONES Y CONFETI =====
function spawnReaction(emoji) {
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('div');
    el.className = 'reaction-bubble';
    el.textContent = emoji;
    el.style.left = `${15 + Math.random() * 70}%`;
    document.body.appendChild(el);
    if (typeof gsap !== 'undefined') {
      gsap.to(el, { y: -(240 + Math.random() * 200), x: (Math.random() - 0.5) * 90, opacity: 0, scale: 1.3, duration: 1.5, ease: 'power1.out', onComplete: () => el.remove() });
    } else el.remove();
  }
  playTone(720, 0.06);
}

function spawnConfetti(count = 28) {
  const colors = ['#2DD4BF', '#38BDF8', '#FACC15', '#4ADE80'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.background = colors[i % colors.length];
    el.style.left = `${15 + Math.random() * 70}%`;
    el.style.top = '30%';
    document.body.appendChild(el);
    if (typeof gsap !== 'undefined') {
      gsap.to(el, { x: (Math.random() - 0.5) * 420, y: 180 + Math.random() * 280, rotation: Math.random() * 680, opacity: 0, duration: 1.3, ease: 'power2.out', onComplete: () => el.remove() });
    } else el.remove();
  }
}

// ===== 7. QUIZ CLÍNICO (SOLO 1:300 Y 1:75) =====
const quizData = [
  { q: '¿Con qué producto está PROHIBIDO mezclar SWIPE® Peracetic?', options: ['Agua fría', 'Cloro (lavandina) o productos clorados', 'Agua de la llave'], correct: 1, feedback: '¡Exacto! Mezclarlo con cloro libera gas cloro altamente tóxico.' },
  { q: '¿Cuál es el tiempo de contacto recomendado sobre la superficie?', options: ['5 a 10 segundos', '5 a 10 minutos', '2 horas'], correct: 1, feedback: '¡Correcto! Dejar actuar de 5 a 10 minutos asegura la desinfección.' },
  { q: 'Para dosis de choque y áreas críticas (500 ppm / 1:300), ¿cuánto se agrega por cada litro de agua?', options: ['3.3 ml por litro', '13.3 ml por litro', '50 ml por litro'], correct: 0, feedback: '¡Muy bien! 3.3 ml por litro (1:300) es la dilución indicada.' },
  { q: 'Si el producto concentrado salpica a los ojos, ¿qué hacemos primero?', options: ['Gotas oftálmicas', 'Enjuagar con abundante agua mínimo 15 minutos y buscar atención médica', 'Paño seco'], correct: 1, feedback: '¡Así es! Mínimo 15 minutos de agua y atención médica urgente.' }
];

let qIndex = 0, qScore = 0;
const quizProgress = document.getElementById('quizProgress');
const quizScore = document.getElementById('quizScore');
const quizQuestion = document.getElementById('quizQuestion');
const quizOptions = document.getElementById('quizOptions');
const quizFeedback = document.getElementById('quizFeedback');
const btnQuizNext = document.getElementById('btnQuizNext');
const btnQuizRestart = document.getElementById('btnQuizRestart');

function renderQuiz() {
  const item = quizData[qIndex];
  quizProgress.textContent = `Pregunta ${qIndex + 1} / ${quizData.length}`;
  quizScore.textContent = `Aciertos: ${qScore}`;
  quizQuestion.textContent = item.q;
  quizFeedback.classList.add('hidden');
  const quizBadge = document.getElementById('quizBadge');
  if (quizBadge) quizBadge.classList.add('hidden');
  btnQuizNext.classList.add('hidden');
  btnQuizRestart.classList.add('hidden');
  quizOptions.innerHTML = '';

  const optLetters = ['A', 'B', 'C', 'D'];
  item.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.textContent = `${optLetters[idx]}. ${opt}`;
    btn.addEventListener('click', () => {
      const allBtns = Array.from(quizOptions.children);
      allBtns.forEach(b => b.disabled = true);
      if (idx === item.correct) { haptic(25); btn.classList.add('correct'); qScore++; quizScore.textContent = `Aciertos: ${qScore}`; playTone(780, 0.14); spawnConfetti(28); setBuddyMood('happyOpen', '¡Excelente respuesta! 🎉'); playBuddyGesture('cheer'); }
      else { haptic([30, 40, 30]); btn.classList.add('wrong'); allBtns[item.correct].classList.add('correct'); playTone(260, 0.16, 'triangle'); setBuddyMood('normal', '¡Casi! Revisa la explicación.'); }
      quizFeedback.textContent = item.feedback;
      quizFeedback.classList.remove('hidden');
      if (qIndex < quizData.length - 1) btnQuizNext.classList.remove('hidden');
      else {
        quizFeedback.textContent += ` · Final: ${qScore}/${quizData.length}`;
        if (quizBadge) quizBadge.classList.remove('hidden');
        spawnConfetti(50);
        btnQuizRestart.classList.remove('hidden');
      }
    });
    quizOptions.appendChild(btn);
  });
}
btnQuizNext.addEventListener('click', () => { qIndex++; renderQuiz(); lookBuddyAtElement(quizQuestion, 0.25); });
btnQuizRestart.addEventListener('click', () => { qIndex = 0; qScore = 0; renderQuiz(); lookBuddyAtElement(quizQuestion, 0.25); });
const btnQuizSpeak = document.getElementById('btnQuizSpeak');
if (btnQuizSpeak) {
  btnQuizSpeak.addEventListener('click', () => {
    const letters = ['A', 'B', 'C', 'D'];
    const item = quizData[qIndex];
    if (!item) return;
    const spoken = `Pregunta ${qIndex + 1}. ${item.q} ` + item.options.map((o, i) => `Opción ${letters[i]}: ${o}.`).join(' ');
    setBuddyMood('normal', spoken, soundEnabled);
    playBuddyGesture('point');
  });
}

// Pocket Card Modal & QR
const pocketModal = document.getElementById('pocketModal');
document.getElementById('btnOpenPocket').addEventListener('click', () => { haptic(16); pocketModal.classList.remove('hidden'); });
document.getElementById('btnClosePocket').addEventListener('click', () => pocketModal.classList.add('hidden'));
pocketModal.addEventListener('click', (e) => { if (e.target === pocketModal) pocketModal.classList.add('hidden'); });
const hazardOverlayEl = document.getElementById('hazardOverlay');
if (hazardOverlayEl) hazardOverlayEl.addEventListener('click', (e) => { if (e.target === hazardOverlayEl) hazardOverlayEl.classList.add('hidden'); });
document.addEventListener('click', (e) => {
  if (buddyQuickMenu && !buddyQuickMenu.classList.contains('hidden')) {
    if (!buddyQuickMenu.contains(e.target) && e.target !== btnAskGemi && e.target !== eppGemiSvg) {
      buddyQuickMenu.classList.add('hidden');
    }
  }
});

const qrContainer = document.getElementById('qrContainer');
if (qrContainer && typeof QRCode !== 'undefined') {
  const qrUrl = window.location.protocol.startsWith('http') ? window.location.href : 'https://swipeamg-hue.github.io/gemi-arboledas/';
  new QRCode(qrContainer, { text: qrUrl, width: 84, height: 84, colorDark: '#0B2D48', colorLight: '#ffffff' });
}

// ===== 8. ESTADOS Y PARPADEO DE GEMI =====
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

const normalEyesHtml = '<rect x="5" y="5" width="2" height="2" fill="#2DD4BF"/><rect x="9" y="5" width="2" height="2" fill="#2DD4BF"/><g id="eppPupils"><rect x="5.55" y="5.55" width="0.9" height="0.9" fill="#020617"/><rect x="9.55" y="5.55" width="0.9" height="0.9" fill="#020617"/><rect x="5.15" y="5.15" width="0.38" height="0.38" fill="#F8FAFC"/><rect x="9.15" y="5.15" width="0.38" height="0.38" fill="#F8FAFC"/></g>';
const happyOpenEyesHtml = '<rect x="5" y="5" width="2" height="2" fill="#4ADE80"/><rect x="9" y="5" width="2" height="2" fill="#4ADE80"/><g id="eppPupils"><rect x="5.55" y="5.55" width="0.9" height="0.9" fill="#020617"/><rect x="9.55" y="5.55" width="0.9" height="0.9" fill="#020617"/><rect x="5.15" y="5.15" width="0.38" height="0.38" fill="#F8FAFC"/><rect x="9.15" y="5.15" width="0.38" height="0.38" fill="#F8FAFC"/></g>';
const alertEyesHtml = '<rect x="5" y="4" width="2" height="3" fill="#EF4444"/><rect x="9" y="4" width="2" height="3" fill="#EF4444"/><g id="eppPupils"><rect x="5.55" y="5.0" width="0.9" height="1.15" fill="#020617"/><rect x="9.55" y="5.0" width="0.9" height="1.15" fill="#020617"/></g>';
const happyEyesHtml = '<rect x="5" y="5" width="2" height="1" fill="#4ADE80"/><rect x="9" y="5" width="2" height="1" fill="#4ADE80"/><rect x="4" y="6" width="1" height="1" fill="#4ADE80"/><rect x="7" y="6" width="1" height="1" fill="#4ADE80"/><rect x="8" y="6" width="1" height="1" fill="#4ADE80"/><rect x="11" y="6" width="1" height="1" fill="#4ADE80"/>';

function setBuddyMood(mood, text, shouldSpeak = false) {
  if (text && eppSpeechBubble) {
    setBubbleContent(eppSpeechBubble, text);
    if (shouldSpeak) speakWithLipSync(text);
  }
  const eppEyesEl = document.getElementById('eppEyes');
  if (eppEyesEl) {
    if (mood === 'happy') eppEyesEl.innerHTML = happyEyesHtml;
    else if (mood === 'happyOpen') eppEyesEl.innerHTML = happyOpenEyesHtml;
    else if (mood === 'alert') eppEyesEl.innerHTML = alertEyesHtml;
    else eppEyesEl.innerHTML = normalEyesHtml;
  }
  applyGazeAttrs();
}

function updateBuddyForSlide(idx) {
  if (autoMode || slideTourRunning) return;
  const line = buddyLines[idx] || '¡Seguimos!';
  const curtainHidden = welcomeCurtain ? welcomeCurtain.classList.contains('hidden') : true;
  currentReadingEl = eppSpeechBubble;
  setBuddyMood(idx === 3 ? 'alert' : 'normal', line, curtainHidden);
  if (idx === 10 && curtainHidden) { spawnConfetti(40); playBuddyGesture('cheer'); }
}

if (buddyQuickMenu) {
  document.getElementById('btnCloseBqm').addEventListener('click', () => buddyQuickMenu.classList.add('hidden'));
  buddyQuickMenu.querySelectorAll('.bqm-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.act;
      if (act === 'explain') startSlideTour(currentSlide);
      else if (act === 'greet') { setBuddyMood('happyOpen', '¡Bienvenidos personal de enfermería de Hospital Arboledas! Es un gusto saludarlos.', true); playBuddyGesture('wave'); }
      else if (act === 'celebrate') { setBuddyMood('happyOpen', '¡Excelente participación equipo! 🎉', true); spawnConfetti(45); playBuddyGesture('cheer'); }
      else if (btn.dataset.faq) setBuddyMood('normal', btn.dataset.faq, true);
      buddyQuickMenu.classList.add('hidden');
    });
  });
}

setInterval(() => {
  const eppEyesEl = document.getElementById('eppEyes');
  if (!eppEyesEl || !eppEyesEl.querySelector('#eppPupils')) return;
  if (typeof anime !== 'undefined') anime({ targets: '#eppBlink', scaleY: [1, 0.08, 1], duration: 190, easing: 'easeInOutQuad' });
}, 3800);

// Init
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('nocurtain') === '1' && welcomeCurtain) welcomeCurtain.classList.add('hidden');
const startIdx = parseInt(urlParams.get('slide'), 10);
openSlide(!isNaN(startIdx) && startIdx >= 0 && startIdx < slides.length ? startIdx : 0);
updateCalc();
renderQuiz();

// ===== 9. SOPORTE OFFLINE PWA (SERVICE WORKER) =====
(function setupOfflinePwa() {
  const pills = [
    document.getElementById('offlineStatusCurtain'),
    document.getElementById('offlineStatusMenu')
  ].filter(Boolean);
  const btnInstall = document.getElementById('btnInstallPwa');
  let deferredInstall = null;

  function setOfflineText(txt, isReady = false) {
    pills.forEach(p => { p.textContent = txt; p.classList.toggle('ready', isReady); });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    if (btnInstall) btnInstall.classList.remove('hidden');
  });

  if (btnInstall) {
    btnInstall.addEventListener('click', async () => {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      await deferredInstall.userChoice.catch(() => {});
      deferredInstall = null;
      btnInstall.classList.add('hidden');
    });
  }

  window.addEventListener('appinstalled', () => { if (btnInstall) btnInstall.classList.add('hidden'); });

  if (!('serviceWorker' in navigator) || (!window.location.protocol.startsWith('http'))) {
    setOfflineText('📁 Modo archivo local activo', true);
    return;
  }

  const hadSwController = !!navigator.serviceWorker.controller;
  let swRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadSwController && !swRefreshing) {
      swRefreshing = true;
      window.location.reload();
    }
  });

  navigator.serviceWorker.addEventListener('message', (ev) => {
    const d = ev.data || {};
    if (d.type === 'SW_PROGRESS') {
      const pct = Math.round((d.done / Math.max(1, d.total)) * 100);
      setOfflineText(`⏳ Guardando modo sin internet (${pct}%)...`, false);
    } else if (d.type === 'SW_READY') {
      setOfflineText(navigator.onLine ? '✅ Lista para usar sin internet (100% guardada)' : '📴 Modo sin internet activo (100% operativa)', true);
    }
  });

  window.addEventListener('offline', () => setOfflineText('📴 Modo sin internet activo (caché local)', true));
  window.addEventListener('online', () => { if (pills.some(p => p.classList.contains('ready'))) setOfflineText('✅ Lista para usar sin internet (100% guardada)', true); });

  navigator.serviceWorker.register('./sw.js', { scope: './' }).then(reg => {
    reg.update().catch(() => {});
    if (reg.active && !reg.installing && !reg.waiting) {
      setOfflineText(navigator.onLine ? '✅ Lista para usar sin internet (100% guardada)' : '📴 Modo sin internet activo (100% operativa)', true);
    }
  }).catch(() => {
    setOfflineText('ℹ️ Caché offline disponible solo sobre HTTPS/localhost', false);
  });
})();
