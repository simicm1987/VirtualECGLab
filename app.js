"use strict";

const canvas = document.getElementById("appCanvas");
const ctx = canvas.getContext("2d");

const MIN_W = 1200;
const MIN_H = 720;

let width = 0, height = 0;
let mouseX = 0, mouseY = 0;
let key = "", keyCode = 0;

const CODED = "CODED";
const UP = 38, DOWN = 40;
const LEFT = "left", RIGHT = "right", CENTER = "center", BASELINE = "baseline";
const PI = Math.PI, TWO_PI = Math.PI * 2;
const FONT_FAMILY = 'Arial, "Helvetica Neue", Helvetica, "DejaVu Sans", sans-serif';

const startTime = performance.now();
function millis() { return Math.floor(performance.now() - startTime); }

let fillOn = true, fillCol = { r: 255, g: 255, b: 255, a: 255 };
let strokeOn = true, strokeCol = { r: 0, g: 0, b: 0, a: 255 }, strokeW = 1;
let alignX = LEFT, alignY = BASELINE, txtSize = 12;
let shapePts = null;

function min(a, b) { return Math.min(a, b); }
function max(a, b) { return Math.max(a, b); }
function floor(x) { return Math.floor(x); }
function ceil(x) { return Math.ceil(x); }
function round(x) { return Math.round(x); }
function sqrt(x) { return Math.sqrt(x); }
function sq(x) { return x * x; }
function pow(a, b) { return Math.pow(a, b); }
function sin(x) { return Math.sin(x); }
function cos(x) { return Math.cos(x); }
function exp(x) { return Math.exp(x); }
function log(x) { return Math.log(x); }
function lerp(a, b, t) { return a + (b - a) * t; }
function constrain(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function println(s) { console.log(s); }

function nf(num, left, right) {
  const s = Math.abs(num).toFixed(right);
  let parts = s.split(".");
  let ip = parts[0];
  while (ip.length < left) ip = "0" + ip;
  const sign = (num < 0 && Number(s) !== 0) ? "-" : "";
  return sign + ip + (parts.length > 1 ? "." + parts[1] : "");
}

function toColor(a, g, b, al) {
  if (typeof a === "object") return a;
  if (g === undefined) return { r: a, g: a, b: a, a: 255 };
  if (b === undefined) return { r: a, g: a, b: a, a: g };
  return { r: a, g: g, b: b, a: al === undefined ? 255 : al };
}
function color(r, g, b, a) { return toColor(r, g, b, a); }
function ch255(v) { return constrain(Math.round(v), 0, 255); }
function css(c) {
  return "rgba(" + ch255(c.r) + "," + ch255(c.g) + "," + ch255(c.b) + "," + (ch255(c.a) / 255) + ")";
}
function lerpColor(c1, c2, amt) {
  amt = constrain(amt, 0, 1);
  return {
    r: c1.r + (c2.r - c1.r) * amt,
    g: c1.g + (c2.g - c1.g) * amt,
    b: c1.b + (c2.b - c1.b) * amt,
    a: c1.a + (c2.a - c1.a) * amt
  };
}

function fill(a, g, b, al) { fillOn = true; fillCol = toColor(a, g, b, al); }
function noFill() { fillOn = false; }
function stroke(a, g, b, al) { strokeOn = true; strokeCol = toColor(a, g, b, al); }
function noStroke() { strokeOn = false; }
function strokeWeight(w) { strokeW = w; }

function applyStroke() {
  ctx.strokeStyle = css(strokeCol);
  ctx.lineWidth = strokeW;
  ctx.lineCap = "round";
  ctx.lineJoin = "miter";
}
function paint(closeForFill) {
  if (fillOn) { ctx.fillStyle = css(fillCol); ctx.fill(); }
  if (strokeOn) { applyStroke(); ctx.stroke(); }
}

function background(c) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = css(toColor(c));
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function rect(x, y, w, h, r) {
  ctx.beginPath();
  if (r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  } else {
    ctx.rect(x, y, w, h);
  }
  paint();
}

function ellipse(cx, cy, w, h) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.abs(w / 2), Math.abs(h / 2), 0, 0, TWO_PI);
  paint();
}

function line(x1, y1, x2, y2) {
  if (!strokeOn) return;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  applyStroke();
  ctx.stroke();
}

function beginShape() { shapePts = []; }
function vertex(x, y) { if (shapePts) shapePts.push(x, y); }
function endShape() {
  const p = shapePts;
  shapePts = null;
  if (!p || p.length < 4) return;
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  if (fillOn) { ctx.fillStyle = css(fillCol); ctx.fill(); }
  if (strokeOn) { applyStroke(); ctx.stroke(); }
}

function textFont(f) { txtSize = f.size; }
function textSize(s) { txtSize = s; }
function textAlign(ax, ay) { alignX = ax; alignY = (ay === undefined) ? BASELINE : ay; }
function setFont() { ctx.font = txtSize + "px " + FONT_FAMILY; }
function textAscent() {
  setFont();
  const m = ctx.measureText("d");
  return m.fontBoundingBoxAscent || txtSize * 0.9;
}
function text(s, x, y) {
  setFont();
  ctx.textAlign = alignX;
  ctx.textBaseline = "alphabetic";
  if (alignY === CENTER) y += textAscent() / 2;
  if (fillOn) {
    ctx.fillStyle = css(fillCol);
    ctx.fillText(String(s), x, y);
  }
}

function createFont(name, size, smoothFont) { return { name: name, size: size }; }

function loadImage(name) {
  const img = { width: 0, height: 0, el: new Image() };
  const sources = ["data/" + name, name];
  let idx = 0;
  img.el.onload = function () { img.width = img.el.naturalWidth; img.height = img.el.naturalHeight; };
  img.el.onerror = function () { idx++; if (idx < sources.length) img.el.src = sources[idx]; };
  img.el.src = sources[0];
  return img;
}
function image(img, x, y, w, h) {
  if (!img || img.width === 0) return;
  ctx.drawImage(img.el, x, y, w, h);
}

const surface = {
  setTitle: function (t) { document.title = t; },
  setResizable: function (b) {}
};
function frameRate(f) {}
function smooth(level) {}

function resizeCanvas() {
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;
  width = Math.max(vw, MIN_W);
  height = Math.max(vh, MIN_H);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function updateMouse(e) {
  const r = canvas.getBoundingClientRect();
  mouseX = Math.floor(e.clientX - r.left);
  mouseY = Math.floor(e.clientY - r.top);
}

// Sketch  
const FS = 360;
const FFT_SIZE = 512;
const CLIP_SECONDS = 30.0;
const VIEW_SECONDS = 8.0;
const BASE_URL = "https://physionet.org/files/mitdb/1.0.0/";

const MODE_NAMES = [
  "Normal sinus rhythm", "Sinus tachycardia", "Sinus bradycardia"
];
const RECORDS = [100, 100, 100];
const DESCRIPTIONS = [
  "Regular RR intervals and typical beat morphology.",
  "Elevated heart rate with normal beat morphology.",
  "Reduced heart rate with normal beat morphology."
];

class ECGClip {
  constructor(v, b, types, src, isReal) {
    this.values = v; this.beats = b; this.beatKinds = types; this.source = src; this.real = isReal;
    this.seconds = v.length / FS;
  }
  at(secondsPlayed) {
    if (this.values.length === 0) return 0;
    let local = secondsPlayed % this.seconds;
    if (local < 0) local += this.seconds;
    const sample = local * FS;
    const a = constrain(floor(sample), 0, this.values.length - 1);
    const b = (a + 1) % this.values.length;
    return lerp(this.values[a], this.values[b], sample - a);
  }
}

class ECGAnnotations {
  constructor() {
    this.samples = [];
    this.codes = [];
    this.rhythmSamples = [];
    this.rhythms = [];
  }
}

const clips = new Array(MODE_NAMES.length);
const downloading = new Array(300).fill(false);
const tried = new Array(300).fill(false);
let downloadMessage = "Loading MIT-BIH database in the background...";

let selectedMode = 0;
let dropdownOpen = false, paused = false, showNormal = true;
let playTime = 0;
let playbackSpeed = 1.0;
let lastFrameMillis;
let font;
let logo;

const SPEC_COLS = 54;
const SPEC_BINS = 64;
const spectrogram = Array.from({ length: SPEC_COLS }, () => new Float32Array(SPEC_BINS));
let lastSpecMillis = -9999;
let medianHz = 0;
let rmsMv = 0;
let bpm = -1, meanRR = -1, sdnn = -1, rmssd = -1;
let lastBeatAgo = 99;
let themeBg, panelBg, accent, muted;

function setup() {
  surface.setTitle("Virtual ECG Lab | Processing 4");
  surface.setResizable(true);
  frameRate(60);
  smooth(4);
  font = createFont("SansSerif", 15, true);
  textFont(font);
  logo = loadImage("logo.png");
  themeBg = color(9, 16, 29);
  panelBg = color(18, 30, 48);
  accent = color(42, 226, 176);
  muted = color(145, 166, 186);
  for (let i = 0; i < clips.length; i++) clips[i] = createDemo(i);
  lastFrameMillis = millis();
  requestRecord(100);
}

function draw() {
  const current = millis();
  const delta = min(0.12, (current - lastFrameMillis) / 1000.0);
  lastFrameMillis = current;
  if (!paused) playTime += delta * playbackSpeed;
  updateMetrics();
  if (current - lastSpecMillis > 230) {
    refreshSpectrum();
    lastSpecMillis = current;
  }
  background(themeBg);
  drawHeader();
  const leftX = 27, contentTop = 153;
  const leftW = max(400, width * 0.652 - 35);
  const rightX = leftX + leftW + 18;
  const rightW = width - rightX - 27;
  const ecgH = max(270, (height - contentTop - 40) * 0.50);
  const bottomY = contentTop + ecgH + 17;
  const bottomH = max(180, height - bottomY - 28);
  panel(leftX, contentTop, leftW, ecgH);
  panel(leftX, bottomY, leftW, bottomH);
  panel(rightX, contentTop, rightW, ecgH);
  panel(rightX, bottomY, rightW, bottomH);
  drawEcgPanel(leftX, contentTop, leftW, ecgH);
  drawSpectrogramPanel(leftX, bottomY, leftW, bottomH);
  drawPulsePanel(rightX, contentTop, rightW, ecgH);
  drawStatisticsPanel(rightX, bottomY, rightW, bottomH);
  drawDropdown();
}

function panel(x, y, w, h) {
  noStroke(); fill(panelBg); rect(x, y, w, h, 13);
  noFill(); stroke(38, 57, 78); strokeWeight(1); rect(x, y, w, h, 13);
}

function drawLogo() {
  if (logo == null || logo.width === 0) return;
  const lh = 46;
  const lw = lh * logo.width / logo.height;
  const pad = 6;
  const cardW = lw + pad * 2, cardH = lh + pad * 2;
  const cx = width - 27 - cardW, cy = 10;
  noStroke(); fill(255); rect(cx, cy, cardW, cardH, 9);
  image(logo, cx + pad, cy + pad, lw, lh);
}

function drawHeader() {
  fill(245); textAlign(LEFT, BASELINE); textSize(27);
  text("VIRTUAL ECG LAB", 28, 42);
  drawLogo();
  drawButton(27, 76, 346, 42, MODE_NAMES[selectedMode] + "   v", dropdownOpen);
  drawButton(385, 76, 103, 42, paused ? "PLAY" : "PAUSE", false);
  drawButton(499, 76, 88, 42, "RESTART", false);
  drawButton(598, 76, 101, 42, "x" + nf(playbackSpeed, 1, 1), false);
  drawButton(710, 76, 140, 42, showNormal ? "REF: ON" : "REF: OFF", showNormal);
  const c = clips[selectedMode];
  fill(muted); textSize(12);
  text(c.source, 869, 102);
  fill(178, 198, 212); textSize(12);
  text(DESCRIPTIONS[selectedMode], 28, 139);
}

function drawButton(x, y, w, h, s, chosen) {
  fill(chosen ? color(28, 69, 78) : color(25, 39, 60));
  stroke(chosen ? accent : color(59, 76, 98)); strokeWeight(1);
  rect(x, y, w, h, 7);
  fill(238); noStroke(); textAlign(CENTER, CENTER);
  textSize(s.length > 31 ? 12 : 14);
  text(s, x + w / 2, y + h / 2); textAlign(LEFT, BASELINE);
}

function drawEcgPanel(x, y, w, h) {
  fill(240); textSize(17); text("ECG MONITOR", x + 20, y + 32);
  fill(muted); textSize(12); text("8 s / lead 0 / 360 Hz", x + w - 172, y + 31);
  const gx = x + 39, gy = y + 56, gw = w - 65, gh = h - 96;
  strokeWeight(1);
  for (let i = 0; i <= 8; i++) {
    const px = gx + gw * i / 8.0;
    stroke(i % 2 === 0 ? color(47, 73, 90) : color(30, 49, 66));
    line(px, gy, px, gy + gh);
  }
  for (let j = 0; j <= 8; j++) {
    const py = gy + gh * j / 8.0;
    stroke(j === 4 ? color(80, 99, 117) : color(34, 54, 73));
    line(gx, py, gx + gw, py);
  }
  const refScale = gh * 0.18;
  const gwi = Math.trunc(gw);
  if (showNormal && selectedMode !== 0) {
    stroke(80, 119, 137, 150); strokeWeight(1.1); noFill();
    beginShape();
    for (let i = 0; i < gwi; i += 2) {
      const t = playTime - VIEW_SECONDS + i / gw * VIEW_SECONDS;
      if (t >= 0) vertex(gx + i, gy + gh / 2 - clips[0].at(t) * refScale);
    }
    endShape();
  }
  noFill(); stroke(accent); strokeWeight(2.0);
  beginShape();
  for (let i = 0; i <= gwi; i += 2) {
    const t = playTime - VIEW_SECONDS + i / gw * VIEW_SECONDS;
    if (t >= 0) vertex(gx + i, gy + gh / 2 - activeAt(t) * refScale);
  }
  endShape();
  const target = clips[selectedMode];
  stroke(250, 185, 89, 135); strokeWeight(1);
  const kFrom = max(0, floor((playTime - VIEW_SECONDS) / target.seconds) - 1);
  const kTo = ceil(playTime / target.seconds);
  for (let k = kFrom; k <= kTo; k++) {
    for (let b = 0; b < target.beats.length; b++) {
      const eventTime = k * target.seconds + target.beats[b];
      if (eventTime >= playTime - VIEW_SECONDS && eventTime <= playTime && eventTime >= 0) {
        const px = gx + gw * (eventTime - (playTime - VIEW_SECONDS)) / VIEW_SECONDS;
        line(px, gy + 2, px, gy + 12);
      }
    }
  }
  fill(muted); textSize(11);
  text("-8 s", gx, gy + gh + 20);
  textAlign(RIGHT); text("now", gx + gw, gy + gh + 20); textAlign(LEFT);
}

function blendAmount() {
  if (selectedMode === 0) return 1;
  return constrain((playTime - 0.35) / 2.8, 0, 1);
}
function activeAt(t) {
  if (t < 0) return 0;
  const v = clips[selectedMode].at(t);
  if (selectedMode === 0) return v;
  return lerp(clips[0].at(t), v, blendAmount());
}

function drawPulsePanel(x, y, w, h) {
  fill(238); textSize(17); text("HEARTBEAT VISUALIZATION", x + 19, y + 33);
  const cx = x + w * 0.5, cy = y + h * 0.53;
  const elapsed = lastBeatAgo;
  let pulse = 0;
  if (elapsed >= 0 && elapsed < 0.36) {
    pulse = pow(sin(PI * min(1, elapsed / 0.36)), 1.4);
  }
  const outer = min(w, h) * 0.155;
  noFill(); stroke(243, 78, 89, Math.trunc(pulse * 190)); strokeWeight(3);
  ellipse(cx, cy, (outer * 2 + 90 * pulse), (outer * 2 + 90 * pulse));
  noStroke(); fill(79 + floor(70 * pulse), 30, 51, 90);
  ellipse(cx, cy, outer * 2 + 38, outer * 2 + 38);
  fill(209 + floor(40 * pulse), 58 + floor(35 * pulse), 76 + floor(18 * pulse));
  ellipse(cx, cy, (outer + 27 * pulse) * 2, (outer + 27 * pulse) * 2);
  fill(255, 174, 179, 65 + floor(100 * pulse));
  ellipse(cx - outer * 0.30, cy - outer * 0.30, outer * 0.67, outer * 0.67);
  fill(248); textAlign(CENTER); textSize(27);
  text(bpm > 0 ? nf(bpm, 1, 0) : "--", cx, y + h - 47);
  fill(muted); textSize(12); text("BPM", cx, y + h - 25);
  textAlign(LEFT);
}

function drawSpectrogramPanel(x, y, w, h) {
  fill(239); textSize(17); text("STFT SPECTROGRAM", x + 20, y + 31);
  fill(muted); textSize(12); text("Hann 512 / 0-45 Hz / relative energy", x + w - 292, y + 31);
  const gx = x + 53, gy = y + 55, gw = w - 74, gh = h - 88;
  noStroke();
  const low = color(20, 36, 67), med = color(22, 178, 175), high = color(252, 210, 90);
  for (let c = 0; c < SPEC_COLS; c++) {
    for (let b = 0; b < SPEC_BINS; b++) {
      const z = constrain(spectrogram[c][b], 0, 1);
      fill(z < 0.68 ? lerpColor(low, med, z / 0.68) : lerpColor(med, high, (z - 0.68) / 0.32));
      rect(gx + c * gw / SPEC_COLS,
           gy + (SPEC_BINS - 1 - b) * gh / SPEC_BINS,
           gw / SPEC_COLS + 0.75, gh / SPEC_BINS + 0.4);
    }
  }
  fill(muted); textSize(11);
  for (let f = 0; f <= 45; f += 15) {
    const yy = gy + gh - f / 45.0 * gh;
    textAlign(RIGHT); text(f + " Hz", gx - 8, yy + 4);
  }
  textAlign(LEFT); text("-8 s", gx, gy + gh + 19);
  textAlign(RIGHT); text("now", gx + gw, gy + gh + 19); textAlign(LEFT);
}

function drawStatisticsPanel(x, y, w, h) {
  fill(239); textSize(17); text("NUMERICAL ANALYSIS", x + 19, y + 31);
  const rowH = (h - 72) / 6.0;
  const keys = ["RMS (4 s)", "Mean RR", "SDNN (RR)", "RMSSD", "MDF (FFT)", "Playback time"];
  const values = [
    nf(rmsMv, 1, 3) + " mV",
    meanRR > 0 ? nf(meanRR, 1, 0) + " ms" : "--",
    sdnn >= 0 ? nf(sdnn, 1, 0) + " ms" : "--",
    rmssd >= 0 ? nf(rmssd, 1, 0) + " ms" : "--",
    nf(medianHz, 1, 1) + " Hz",
    nf(playTime, 1, 1) + " s"
  ];
  for (let i = 0; i < keys.length; i++) {
    const yy = y + 51 + i * rowH;
    if (i > 0) { stroke(40, 59, 78); line(x + 18, yy - 8, x + w - 18, yy - 8); }
    noStroke(); fill(muted); textSize(13); text(keys[i], x + 19, yy + 12);
    fill(238); textSize(17); textAlign(RIGHT);
    text(values[i], x + w - 22, yy + 12); textAlign(LEFT);
  }
}

function drawDropdown() {
  if (!dropdownOpen) return;
  const x = 27, y = 122, w = 346, itemH = 29;
  noStroke(); fill(14, 26, 41);
  rect(x - 1, y - 1, w + 2, itemH * MODE_NAMES.length + 2, 8);
  for (let i = 0; i < MODE_NAMES.length; i++) {
    const yy = y + i * itemH;
    fill(i === selectedMode ? color(24, 88, 94) : (i % 2 === 0 ? color(27, 42, 61) : color(22, 36, 55)));
    rect(x, yy, w, itemH);
    fill(i === selectedMode ? accent : color(225, 234, 239)); textSize(12);
    text((i + 1) + ". " + MODE_NAMES[i], x + 12, yy + 19);
  }
}

function mousePressed() {
  if (dropdownOpen) {
    if (mouseX >= 27 && mouseX < 373 && mouseY >= 122 && mouseY < 122 + 29 * MODE_NAMES.length) {
      const id = Math.floor((mouseY - 122) / 29);
      selectMode(id);
    }
    dropdownOpen = false; return;
  }
  if (inside(27, 76, 346, 42)) { dropdownOpen = true; return; }
  if (inside(385, 76, 103, 42)) { paused = !paused; return; }
  if (inside(499, 76, 88, 42)) { playTime = 0; return; }
  if (inside(598, 76, 101, 42)) {
    playbackSpeed = playbackSpeed === 0.5 ? 1 : (playbackSpeed === 1 ? 1.5 : (playbackSpeed === 1.5 ? 2 : 0.5));
    return;
  }
  if (inside(710, 76, 140, 42)) { showNormal = !showNormal; return; }
}
function inside(x, y, w, h) { return mouseX >= x && mouseX < x + w && mouseY >= y && mouseY < y + h; }

function keyPressed() {
  if (key === " ") paused = !paused;
  if (key === "r" || key === "R") playTime = 0;
  if (key === "c" || key === "C") showNormal = !showNormal;
  if (key === CODED && keyCode === DOWN) selectMode((selectedMode + 1) % MODE_NAMES.length);
  if (key === CODED && keyCode === UP) selectMode((selectedMode + MODE_NAMES.length - 1) % MODE_NAMES.length);
}

function selectMode(id) {
  if (id < 0 || id >= clips.length) return;
  selectedMode = id;
  playTime = 0;
  paused = false;
  lastSpecMillis = -9999;
  if (RECORDS[id] > 0) requestRecord(RECORDS[id]);
}

function updateMetrics() {
  const track = clips[selectedMode];
  const bs = [];
  const start = max(0, playTime - 12);
  if (track.beats.length > 0) {
    const first = max(0, floor(start / track.seconds) - 1);
    const last = ceil(playTime / track.seconds);
    for (let cycle = first; cycle <= last; cycle++) {
      for (const b of track.beats) {
        const when = cycle * track.seconds + b;
        if (when >= start && when <= playTime) bs.push(when);
      }
    }
  }
  lastBeatAgo = 99;
  for (const bt of bs) lastBeatAgo = min(lastBeatAgo, playTime - bt);
  meanRR = -1; sdnn = -1; rmssd = -1; bpm = -1;
  if (bs.length >= 3) {
    const rr = [];
    let sum = 0;
    for (let i = 1; i < bs.length; i++) {
      const d = (bs[i] - bs[i - 1]) * 1000;
      if (d > 180 && d < 3500) { rr.push(d); sum += d; }
    }
    if (rr.length >= 2) {
      meanRR = sum / rr.length; bpm = 60000 / meanRR;
      let variance = 0, successive = 0;
      for (let i = 0; i < rr.length; i++) {
        variance += sq(rr[i] - meanRR);
        if (i > 0) successive += sq(rr[i] - rr[i - 1]);
      }
      sdnn = sqrt(variance / rr.length);
      rmssd = sqrt(successive / (rr.length - 1));
    }
  }
  let energy = 0;
  const samples = 4 * FS;
  for (let i = 0; i < samples; i++) {
    const t = playTime - (samples - i) / FS;
    const v = activeAt(t);
    energy += v * v;
  }
  rmsMv = sqrt(energy / samples);
}

function refreshSpectrum() {
  let maxDB = -99999;
  const dbs = Array.from({ length: SPEC_COLS }, () => new Float32Array(SPEC_BINS));
  for (let c = 0; c < SPEC_COLS; c++) {
    const center = playTime - VIEW_SECONDS + (c + 0.5) * VIEW_SECONDS / SPEC_COLS;
    const re = new Float32Array(FFT_SIZE), im = new Float32Array(FFT_SIZE);
    for (let k = 0; k < FFT_SIZE; k++) {
      const t = center + (k - FFT_SIZE / 2) / FS;
      const hann = 0.5 - 0.5 * cos(TWO_PI * k / (FFT_SIZE - 1));
      re[k] = activeAt(t) * hann;
    }
    fft(re, im);
    for (let b = 0; b < SPEC_BINS; b++) {
      const hz = b * 45.0 / (SPEC_BINS - 1);
      const bin = constrain(round(hz * FFT_SIZE / FS), 0, FFT_SIZE / 2);
      const power = re[bin] * re[bin] + im[bin] * im[bin];
      const db = 10 * log(power + 1e-9) / log(10);
      dbs[c][b] = db;
      if (center > 0) maxDB = max(maxDB, db);
    }
  }
  if (maxDB < -1000) maxDB = 0;
  for (let c = 0; c < SPEC_COLS; c++) {
    for (let b = 0; b < SPEC_BINS; b++) {
      spectrogram[c][b] = constrain((dbs[c][b] - maxDB + 53) / 53, 0, 1);
    }
  }
  // Median spectral frequency of the ECG signal.
  const re = new Float32Array(FFT_SIZE), im = new Float32Array(FFT_SIZE);
  for (let k = 0; k < FFT_SIZE; k++) {
    const hann = 0.5 - 0.5 * cos(TWO_PI * k / (FFT_SIZE - 1));
    re[k] = activeAt(playTime - (FFT_SIZE - k) / FS) * hann;
  }
  fft(re, im);
  let total = 0, cumulative = 0;
  const maxBin = floor(40 * FFT_SIZE / FS);
  for (let k = 1; k <= maxBin; k++) total += re[k] * re[k] + im[k] * im[k];
  medianHz = 0;
  for (let k = 1; k <= maxBin; k++) {
    cumulative += re[k] * re[k] + im[k] * im[k];
    if (cumulative >= total / 2) { medianHz = k * FS / FFT_SIZE; break; }
  }
}

function fft(real, imag) {
  const n = real.length;
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    while ((j & bit) !== 0) { j ^= bit; bit >>= 1; }
    j ^= bit;
    if (i < j) {
      let a = real[i]; real[i] = real[j]; real[j] = a;
      a = imag[i]; imag[i] = imag[j]; imag[j] = a;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = -TWO_PI / len;
    const wR0 = cos(angle), wI0 = sin(angle);
    for (let i = 0; i < n; i += len) {
      let wr = 1, wi = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = wr * real[b] - wi * imag[b];
        const ti = wr * imag[b] + wi * real[b];
        real[b] = real[a] - tr; imag[b] = imag[a] - ti;
        real[a] += tr; imag[a] += ti;
        const nextR = wr * wR0 - wi * wI0;
        wi = wr * wI0 + wi * wR0; wr = nextR;
      }
    }
  }
}

// ---------------------------- OFFLINE SIGNALS ----------------------------
function createDemo(mode) {
  const count = round(CLIP_SECONDS * FS);
  const data = new Float32Array(count);
  const beatList = [];
  const kinds = [];
  let t = 0.35;
  while (t < CLIP_SECONDS - 0.55) {
    beatList.push(t); kinds.push("N");
    let rr = 0.83;
    if (mode === 1) rr = 0.47;
    if (mode === 2) rr = 1.42;
    t += rr;
  }
  for (let i = 0; i < count; i++) {
    t = i / FS;
    let y = 0.017 * sin(TWO_PI * 0.32 * t) + 0.006 * sin(TWO_PI * 22 * t);
    for (let b = 0; b < beatList.length; b++) {
      const d = t - beatList[b];
      if (d < -0.38 || d > 0.56) continue;
      y += 0.11 * gauss(d, -0.20, 0.04);
      y += -0.13 * gauss(d, -0.038, 0.013) + 1.14 * gauss(d, 0, 0.014)
        - 0.23 * gauss(d, 0.039, 0.016) + 0.26 * gauss(d, 0.27, 0.08);
    }
    data[i] = y;
  }
  const bt = Float32Array.from(beatList);
  const types = kinds.slice();
  return new ECGClip(data, bt, types, "Built-in signal (offline)", false);
}
function gauss(x, u, s) { const z = (x - u) / s; return exp(-0.5 * z * z); }

// --------------------------- PHYSIONET / WFDB --------------------------
function requestRecord(record) {
  if (record < 0 || record >= 300 || downloading[record] || tried[record]) return;
  downloading[record] = true;
  tried[record] = true;
  (async function () {
    try {
      downloadMessage = "Downloading MIT-BIH record " + record + "...";
      const hea = await cachedDownload(record + ".hea");
      const atr = await cachedDownload(record + ".atr");
      const dat = await cachedDownload(record + ".dat");
      const annotations = parseAnnotations(atr);
      const hdr = asciiString(hea, 0, hea.length);
      const lines = hdr.split(/\r?\n/);
      const master = lines[0].trim().split(/\s+/);
      const fsHeader = round(Number.parseFloat(master[2]));
      if (fsHeader !== FS) throw new Error("Unexpected sampling rate: " + fsHeader);
      const ch = lines[1].trim().split(/\s+/);
      if (!ch[1].startsWith("212")) throw new Error("Only WFDB format 212 is supported");
      let gain = leadingNumber(ch[2], 200);
      const baseline = ch.length > 4 ? leadingNumber(ch[4], 1024) : 1024;
      if (gain === 0) gain = 200;
      const totalSamples = Math.floor(dat.length / 3);
      const start = findEpisode(annotations, totalSamples);
      if (start >= 0) {
        const out = decodeClip(dat, annotations, start, record, gain, baseline);
        if (out != null) clips[0] = out;
      }
      if (record === 100 && clips[0].real) {
        clips[1] = makeRateVariant(clips[0], 1.63, "PhysioNet MIT-BIH / record 100 / channel 0");
        clips[2] = makeRateVariant(clips[0], 0.61, "PhysioNet MIT-BIH / record 100 / channel 0");
      }
      downloadMessage = "Loaded MIT-BIH record " + record;
    } catch (e) {
      downloadMessage = "MIT-BIH record " + record + " not downloaded; using offline signal.";
      println("Download/parse " + record + ": " + e);
    } finally {
      downloading[record] = false;
    }
  })();
}

async function fetchBytes(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (response.status !== 200) throw new Error("HTTP " + response.status);
    return new Uint8Array(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

async function cachedDownload(fileName) {
  try {
    const local = await fetchBytes("data/mitdb/" + fileName, 9000 + 15000);
    if (local.length > 20) return local;
  } catch (e) {
  }
  const result = await fetchBytes(BASE_URL + fileName, 9000 + 15000);
  if (result.length < 20) throw new Error("Empty file " + fileName);
  return result;
}

function asciiString(bytes, offset, length) {
  let s = "";
  for (let i = offset; i < offset + length; i++) s += String.fromCharCode(bytes[i] & 127);
  return s;
}

function leadingNumber(s, fallback) {
  try {
    const m = /^\s*([-+]?[0-9]*\.?[0-9]+).*$/.exec(s);
    const digits = m ? m[1] : s;
    const v = Number(digits);
    if (digits.trim() === "" || isNaN(v)) return fallback;
    return v;
  } catch (e) { return fallback; }
}

function parseAnnotations(bytes) {
  const out = new ECGAnnotations();
  let absolute = 0;
  let lastRhythm = -1;
  for (let i = 0; i + 1 < bytes.length;) {
    const b0 = bytes[i++] & 255, b1 = bytes[i++] & 255;
    const packed = b0 + (b1 << 8), code = (packed >> 10) & 63, dt = packed & 1023;
    if (code === 0 && dt === 0) break;
    if (code === 59) {
      if (i + 3 >= bytes.length) break;
      const hi = (bytes[i] & 255) | ((bytes[i + 1] & 255) << 8);
      const lo = (bytes[i + 2] & 255) | ((bytes[i + 3] & 255) << 8);
      absolute += (hi << 16) | lo; i += 4;
    } else if (code === 63) {
      const length = min(dt, bytes.length - i);
      const label = asciiString(bytes, i, length);
      if (lastRhythm >= 0) out.rhythms[lastRhythm] = label.trim();
      i += length + (dt & 1);
      lastRhythm = -1;
    } else if (code === 60 || code === 61 || code === 62) {
      lastRhythm = -1;
    } else {
      absolute += dt;
      lastRhythm = -1;
      if (code === 28) {
        out.rhythmSamples.push(absolute);
        out.rhythms.push("");
        lastRhythm = out.rhythms.length - 1;
      } else if (isBeatCode(code)) {
        out.samples.push(absolute);
        out.codes.push(code);
      }
    }
  }
  return out;
}

function isBeatCode(code) {
  return (code >= 1 && code <= 13) || code === 34 || code === 35 || code === 38 || code === 41;
}

function findEpisode(a, totalSamples) {
  const window = Math.trunc(CLIP_SECONDS * FS);
  const last = totalSamples - window - 100;
  if (last <= 0) return -1;
  let best = -1e9;
  let bestStart = -1;
  // Find the 30-second window with the most normal beats.
  for (let start = 0; start <= last; start += 6 * FS) {
    const end = start + window;
    let score = 0;
    let normals = 0;
    for (let i = 0; i < a.samples.length; i++) {
      const s = a.samples[i];
      if (s < start) continue;
      if (s >= end) break;
      const code = a.codes[i];
      if (code === 1) normals++;
      score += (code === 1 ? 2 : -25);
    }
    if (normals < 17) continue;
    if (score > best) { best = score; bestStart = start; }
  }
  return bestStart;
}

function decodeClip(dat, ann, start, rec, gain, zero) {
  const len = Math.trunc(CLIP_SECONDS * FS);
  if ((start + len) * 3 > dat.length) return null;
  const v = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const off = (start + i) * 3;
    const b0 = dat[off] & 255, b1 = dat[off + 1] & 255;
    let raw = b0 | ((b1 & 15) << 8);
    if (raw >= 2048) raw -= 4096;
    v[i] = (raw - zero) / gain;
  }
  const beats = [];
  const kinds = [];
  for (let i = 0; i < ann.samples.length; i++) {
    const s = ann.samples[i], code = ann.codes[i];
    if (s >= start && s < start + len) {
      beats.push((s - start) / FS);
      kinds.push(annotationCharacter(code));
    }
  }
  if (beats.length < 6) return null;
  const times = Float32Array.from(beats);
  const types = kinds.slice();
  return new ECGClip(v, times, types, "PhysioNet MIT-BIH / record " + rec + " / channel 0", true);
}

function annotationCharacter(c) {
  if (c === 1) return "N";
  if (c === 2) return "L";
  if (c === 3) return "R";
  if (c === 5) return "V";
  if (c === 8) return "A";
  return "O";
}

function makeRateVariant(original, ratio, label) {
  const n = round(CLIP_SECONDS * FS);
  const v = new Float32Array(n);
  for (let i = 0; i < n; i++) v[i] = original.at(i * ratio / FS);
  const b = [];
  const kinds = [];
  for (let k = 0; k < 5; k++) for (let i = 0; i < original.beats.length; i++) {
    const t = (original.beats[i] + k * original.seconds) / ratio;
    if (t < CLIP_SECONDS) { b.push(t); kinds.push(original.beatKinds[i]); }
  }
  const times = Float32Array.from(b);
  const c = kinds.slice();
  return new ECGClip(v, times, c, label, true);
}

canvas.addEventListener("pointermove", updateMouse);
canvas.addEventListener("pointerdown", function (e) {
  updateMouse(e);
  mousePressed();
});

window.addEventListener("keydown", function (e) {
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    key = CODED;
    keyCode = e.key === "ArrowUp" ? UP : DOWN;
  } else if (e.key.length === 1) {
    key = e.key;
    keyCode = e.keyCode;
  } else {
    return;
  }
  if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
  keyPressed();
});

window.addEventListener("resize", resizeCanvas);

function loop() {
  draw();
  requestAnimationFrame(loop);
}

resizeCanvas();
setup();
requestAnimationFrame(loop);
