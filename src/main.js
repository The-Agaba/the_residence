import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ══════════════════════════════════════════════════════════════════════════════
// ARCHITECTURAL COORDINATES & DIMENSIONS (strictly aligned with client sketch)
//
// North:  12 ft (Master BR)  |  5 ft (Corridor)  |  12 ft (Bed 02)   = 29 ft
// South:  12 ft (Dining)     | 17 ft (Living)    |   6 ft (Veranda)  = 35 ft
// West:   16 ft (Master BR)  | 10 ft (2x Baths)  |  16 ft (Kitchen+Dining) = 42 ft
// East:   12 ft (Bed 02)     | 12 ft (Bed 03)    |  18 ft (Living)   = 42 ft
// ══════════════════════════════════════════════════════════════════════════════

const FP = {
  // X coordinates (West to East)
  xW:   0.0,   // West exterior boundary
  xWC:  5.0,   // Bathroom west wall / lightcourt boundary
  xKStore: 8.0,// Wooden cabinet / store divider in kitchen
  xM:  12.0,   // West wing divider / Corridor west wall
  xB:  17.0,   // Corridor east wall / Right bedroom west wall
  xE:  29.0,   // East exterior wall of bedrooms and living room
  xV:  35.0,   // East exterior boundary of front veranda

  // Z coordinates (North to South) — strictly aligned with sketch numbers (14, 5, 5, 9, 9)
  zN:   0.0,   // North exterior boundary
  zB2: 12.0,   // Bed 02 south divider / Bed 03 north wall (12 ft)
  zMB: 14.0,   // Master Bedroom south wall (14 ft)
  zEN: 19.0,   // Ensuite south wall / Common bath north wall (5 ft)
  zWC: 24.0,   // Common bath south wall / Kitchen north wall (5 ft)
  zB3: 24.0,   // Bed 03 south wall / Living room north wall (12 ft)
  zK:  33.0,   // Kitchen south wall / Dining north wall (9 ft)
  zS:  42.0,   // South exterior boundary (Dining 9 ft, Living 18 ft)
};

// Heights
const WALL_H    = 9.5;   // Wall height in feet
const DOOR_H    = 7.0;   // Standard door height
const DOOR_W    = 3.0;   // Standard door width
const WIN_SILL  = 2.8;   // Window sill height
const WIN_TOP   = 7.0;   // Window top height (head)
const WIN_H     = WIN_TOP - WIN_SILL; // 4.2 ft window height
const THICK     = 0.45;  // Wall thickness (ft)

// ─────────────────────── THREE.JS SCENE SETUP ─────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c1516);
scene.fog = new THREE.FogExp2(0x0c1516, 0.007);

const stage = document.querySelector('#stage');
const camera = new THREE.PerspectiveCamera(50, stage.clientWidth / stage.clientHeight, 0.1, 1000);
camera.position.set(17.5, 36, 68);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(stage.clientWidth, stage.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
stage.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(17.5, 3.5, 21.0);
controls.maxPolarAngle = Math.PI / 2.02;
controls.minDistance = 4;
controls.maxDistance = 140;

// ─────────────────────── LIGHTING ─────────────────────────────────────────────
const hemiLight = new THREE.HemisphereLight(0xe4f2ed, 0x1d2926, 1.5);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff5e4, 2.6);
sun.position.set(-28, 48, 22);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1.0;
sun.shadow.camera.far = 160;
sun.shadow.camera.left   = -45;
sun.shadow.camera.right  =  55;
sun.shadow.camera.top    =  55;
sun.shadow.camera.bottom = -45;
sun.shadow.bias = -0.0004;
scene.add(sun);

const softFill = new THREE.DirectionalLight(0x7da4ba, 0.7);
softFill.position.set(30, 25, -25);
scene.add(softFill);

// ─────────────────────── PROCEDURAL TEXTURE GENERATORS ────────────────────────
function makeWoodTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b38255'; ctx.fillRect(0,0,512,512);
  const plankH = 32;
  for (let y = 0; y < 512; y += plankH) {
    ctx.fillStyle = (y / plankH) % 2 === 0 ? '#ba885a' : '#aa7c50';
    ctx.fillRect(0, y, 512, plankH - 2);
    ctx.strokeStyle = '#6f4a2d'; ctx.lineWidth = 2;
    ctx.strokeRect(0, y, 512, plankH);
    ctx.strokeStyle = 'rgba(100,60,25,0.12)'; ctx.lineWidth = 1;
    for (let g = 0; g < 4; g++) {
      ctx.beginPath();
      ctx.moveTo(0, y + 6 + g * 6);
      ctx.bezierCurveTo(150, y + 4 + g * 7, 350, y + 8 + g * 5, 512, y + 6 + g * 6);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

function makeTileTexture(color1, color2, groutColor, size = 64) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = groutColor; ctx.fillRect(0,0,256,256);
  for (let x = 0; x < 256; x += size) {
    for (let y = 0; y < 256; y += size) {
      ctx.fillStyle = ((x+y)/size) % 2 === 0 ? color1 : color2;
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function makePaverTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#655e58'; ctx.fillRect(0,0,256,256);
  const pw = 64, ph = 32;
  for (let y = 0; y < 256; y += ph) {
    const shift = ((y / ph) % 2) * (pw / 2);
    for (let x = -pw; x < 256 + pw; x += pw) {
      ctx.fillStyle = Math.random() > 0.5 ? '#9e8a76' : '#927e6a';
      ctx.fillRect(x + shift + 2, y + 2, pw - 4, ph - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  return tex;
}

function makeGrassTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#324a2d'; ctx.fillRect(0,0,256,256);
  ctx.fillStyle = '#405f3a';
  for (let i = 0; i < 3500; i++) {
    const x = Math.random()*256, y = Math.random()*256;
    ctx.fillRect(x, y, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  return tex;
}

function makeRugTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ded5c5'; ctx.fillRect(0,0,512,512);
  ctx.strokeStyle = '#294348'; ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, 472, 472);
  ctx.strokeStyle = '#c48f5a'; ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, 432, 432);
  ctx.fillStyle = '#294348';
  for (let i = 80; i < 440; i += 70) {
    ctx.beginPath();
    ctx.moveTo(i, 256); ctx.lineTo(i + 35, 210); ctx.lineTo(i + 70, 256); ctx.lineTo(i + 35, 302);
    ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

// ─────────────────────── MATERIALS ───────────────────────────────────────────
const mat = {
  wallExt:    new THREE.MeshStandardMaterial({ color: 0xdfd9ce, roughness: 0.85 }),
  wallInt:    new THREE.MeshStandardMaterial({ color: 0xe9e5dd, roughness: 0.88 }),
  floorWood:  new THREE.MeshStandardMaterial({ map: makeWoodTexture(), roughness: 0.55 }),
  floorTile:  new THREE.MeshStandardMaterial({ map: makeTileTexture('#e6dfd5', '#eee8de', '#b0a597'), roughness: 0.35 }),
  floorBath:  new THREE.MeshStandardMaterial({ map: makeTileTexture('#a2bab5', '#9ab0ab', '#708782', 32), roughness: 0.4 }),
  floorKit:   new THREE.MeshStandardMaterial({ map: makeTileTexture('#4a5354', '#3d4546', '#2b3132', 64), roughness: 0.4 }),
  floorPaver: new THREE.MeshStandardMaterial({ map: makePaverTexture(), roughness: 0.88 }),
  grass:      new THREE.MeshStandardMaterial({ map: makeGrassTexture(), roughness: 0.95 }),
  concrete:   new THREE.MeshStandardMaterial({ color: 0x8a8880, roughness: 0.9 }),
  baseboard:  new THREE.MeshStandardMaterial({ color: 0x3d2b20, roughness: 0.6 }),
  doorWood:   new THREE.MeshStandardMaterial({ color: 0x824e2e, roughness: 0.5 }),
  cabinetWood:new THREE.MeshStandardMaterial({ color: 0x9a6538, roughness: 0.55 }), // Wooden partition/joinery
  frameMetal: new THREE.MeshStandardMaterial({ color: 0x222a2a, metalness: 0.5, roughness: 0.4 }),

  // TRANSPARENT WINDOW GLASS (Translucent tinted glass for privacy)
  glass: new THREE.MeshStandardMaterial({
    color: 0xc2dfdd,
    transparent: true,
    opacity: 0.75,
    roughness: 0.3,
    metalness: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide
  }),
  frostedGlass: new THREE.MeshStandardMaterial({
    color: 0xd6f0f5,
    transparent: true,
    opacity: 0.85,
    roughness: 0.6,
    depthWrite: false,
    side: THREE.DoubleSide
  }),

  // Sliding Aluminum Window Frame
  aluFrame: new THREE.MeshStandardMaterial({
    color: 0xd0d5d9,
    metalness: 0.8,
    roughness: 0.3
  }),

  brass:      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 }),
  chrome:     new THREE.MeshStandardMaterial({ color: 0xdde6eb, metalness: 0.95, roughness: 0.15 }),
  porcelain:  new THREE.MeshStandardMaterial({ color: 0xfafcfa, roughness: 0.15 }),
  bedSheet:   new THREE.MeshStandardMaterial({ color: 0xf5f7f6, roughness: 0.7 }),
  bedDuvet:   new THREE.MeshStandardMaterial({ color: 0x304f52, roughness: 0.8 }),
  pillow:     new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
  sofaFabric: new THREE.MeshStandardMaterial({ color: 0x485856, roughness: 0.85 }),
  sofaCushion:new THREE.MeshStandardMaterial({ color: 0xb3864a, roughness: 0.8 }),
  tvScreen:   new THREE.MeshBasicMaterial({ color: 0x050808 }),
  kitchenCab: new THREE.MeshStandardMaterial({ color: 0x2c3b38, roughness: 0.5 }),
  countertop: new THREE.MeshStandardMaterial({ color: 0xf2f0eb, roughness: 0.25 }),
  roofTile:   new THREE.MeshStandardMaterial({ color: 0x8a4529, roughness: 0.65, side: THREE.DoubleSide }),
};

// ─────────────────────── LAYER GROUPS ─────────────────────────────────────────
const layerDefs = [
  ['plan',       'Floor Plan'],
  ['walls',      'Bare Walls'],
  ['doors',      'Doors'],
  ['windows',    'Windows'],
  ['furniture',  'Furniture'],
  ['kitchenJoinery', 'Kitchen Joinery & Store'],
  ['amenities',  'Fixtures'],
  ['roof',       'Roof Structure'],
  ['veranda',    'Veranda / Porch'],
  ['lighting',   'Interior Lights'],
  ['dimensions', 'Measurements'],
  ['labels',     'Room Labels'],
];

const groups = {};
layerDefs.forEach(([k]) => {
  groups[k] = new THREE.Group();
  scene.add(groups[k]);
});

// App State
const state = {
  layoutMode: 'ensuite', // 'ensuite' (Master ensuite) or 'public' (3 standard beds + 2 public baths)
  layers: {
    plan: true,
    walls: true,
    doors: true,
    windows: true,
    furniture: true,
    kitchenJoinery: true,
    amenities: true,
    roof: false,      // Roof starts OFF so user immediately sees the rich interior!
    veranda: true,
    lighting: true,
    dimensions: false,
    labels: true,
  },
  view: 'orbit',
  measure: false,
  measurePts: [],
  selectedRoom: null,
  nightLighting: false,
  allWindowsOpen: false,
  allDoorsOpen: false,
};

const selectable = [];
const collisionRects = [];
const doorsList = [];
const windowsList = [];

// ─────────────────────── GEOMETRY HELPERS ─────────────────────────────────────
function makeBox(group, size, pos, material, meta = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  m.userData = meta;
  group.add(m);
  if (meta.selectable) selectable.push(m);
  return m;
}

const labelSprites = {};
function spriteLabel(id, text, pos, target = groups.labels, isDim = false) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 110;
  const ctx = c.getContext('2d');
  ctx.fillStyle = isDim ? 'rgba(16, 26, 25, 0.88)' : 'rgba(18, 32, 31, 0.92)';
  ctx.beginPath();
  ctx.roundRect(10, 10, 620, 90, 16);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = isDim ? '#ddf277' : '#8ec3bb';
  ctx.stroke();

  ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = isDim ? '#ddf277' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(text.toUpperCase(), 320, 68);

  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c),
    transparent: true,
    depthTest: false,
    depthWrite: false
  }));
  s.position.set(...pos);
  s.scale.set(isDim ? 4.2 : 5.4, isDim ? 0.75 : 0.95, 1);
  target.add(s);
  labelSprites[id] = s;
  return s;
}

function updateSpriteText(id, text, isDim = false) {
  const s = labelSprites[id];
  if (!s) return;
  const c = document.createElement('canvas'); c.width = 640; c.height = 110;
  const ctx = c.getContext('2d');
  ctx.fillStyle = isDim ? 'rgba(16, 26, 25, 0.88)' : 'rgba(18, 32, 31, 0.92)';
  ctx.beginPath();
  ctx.roundRect(10, 10, 620, 90, 16);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = isDim ? '#ddf277' : '#8ec3bb';
  ctx.stroke();
  ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = isDim ? '#ddf277' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(text.toUpperCase(), 320, 68);
  s.material.map = new THREE.CanvasTexture(c);
  s.material.needsUpdate = true;
}

// ─────────────────────── SITE & FOUNDATION ────────────────────────────────────
// Lawn
const lawn = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), mat.grass);
lawn.rotation.x = -Math.PI / 2;
lawn.position.set(17.5, -0.05, 21);
lawn.receiveShadow = true;
groups.plan.add(lawn);

// Main Foundation Plinth
const foundationW = FP.xE - FP.xW + 1.0;
const foundationD = FP.zS - FP.zN + 1.0;
makeBox(groups.plan, [foundationW, 0.4, foundationD],
  [(FP.xW + FP.xE)/2, 0.2, (FP.zN + FP.zS)/2], mat.concrete, { name: 'Main Foundation' });

// Veranda Plinth extension
makeBox(groups.veranda, [FP.xV - FP.xE + 0.5, 0.4, FP.zS - FP.zB3 + 0.5],
  [(FP.xE + FP.xV)/2, 0.2, (FP.zB3 + FP.zS)/2], mat.concrete, { name: 'Veranda Foundation' });

// ─────────────────────── ROOM FLOOR SLABS & DATA ──────────────────────────────
const roomsData = [
  { id: 'master', name: 'Master Bedroom', cx: 6.0,  cz: 7.0,  w: 12.0, d: 14.0, floor: mat.floorWood, type: 'Bedroom', dims: "12' × 14'", sqft: 168, vent: 'North & West Windows', access: 'Central Hallway' },
  { id: 'ensuite',name: 'Master Ensuite', cx: 8.5,  cz: 16.5, w:  7.0, d:  5.0, floor: mat.floorBath, type: 'Bath',    dims: "7' × 5'",   sqft: 35,  vent: 'West Frosted Window', access: 'Master Bedroom (Private)' },
  { id: 'common', name: 'Common Washroom',cx: 8.5,  cz: 21.5, w:  7.0, d:  5.0, floor: mat.floorBath, type: 'Bath',    dims: "7' × 5'",   sqft: 35,  vent: 'West Frosted Window', access: 'Central Hallway' },
  { id: 'bed02',  name: 'Bedroom 02',     cx: 23.0, cz: 6.0,  w: 12.0, d: 12.0, floor: mat.floorWood, type: 'Bedroom', dims: "12' × 12'", sqft: 144, vent: 'North & East Windows', access: 'Central Hallway' },
  { id: 'bed03',  name: 'Bedroom 03',     cx: 23.0, cz: 18.0, w: 12.0, d: 12.0, floor: mat.floorWood, type: 'Bedroom', dims: "12' × 12'", sqft: 144, vent: 'East Window',           access: 'Central Hallway' },
  { id: 'hall',   name: 'Central Hallway',cx: 14.5, cz: 12.0, w:  5.0, d: 24.0, floor: mat.floorTile, type: 'Circ',    dims: "5' × 24'",  sqft: 120, vent: 'North Vent Window',     access: 'Direct' },
  { id: 'kitchen',name: 'Kitchen / Jiko', cx: 4.0,  cz: 28.5, w:  8.0, d:  9.0, floor: mat.floorKit,  type: 'Kitchen', dims: "8' × 9'",   sqft: 72,  vent: 'West Window & Yard Door', access: 'Dining Room (Enclosed)' },
  { id: 'store',  name: 'Pantry Store',   cx: 10.0, cz: 28.5, w:  4.0, d:  9.0, floor: mat.floorKit,  type: 'Store',   dims: "4' × 9'",   sqft: 36,  vent: 'Internal Joinery',      access: 'Within Kitchen Only' },
  { id: 'dining', name: 'Dining Hall',    cx: 6.0,  cz: 37.5, w: 12.0, d:  9.0, floor: mat.floorTile, type: 'Dining',  dims: "12' × 9'",  sqft: 108, vent: 'South & West Windows', access: 'Living Room' },
  { id: 'living', name: 'Living Room',    cx: 20.5, cz: 33.0, w: 17.0, d: 18.0, floor: mat.floorTile, type: 'Living',  dims: "17' × 18'", sqft: 306, vent: 'South & East Windows', access: 'Front Veranda' },
  { id: 'veranda',name: 'Front Veranda',  cx: 32.0, cz: 33.0, w:  6.0, d: 18.0, floor: mat.floorPaver,type: 'Outdoor', dims: "6' × 18'",  sqft: 108, vent: 'Open Air Porch',       access: 'Exterior Garden' },
];

roomsData.forEach(r => {
  const slab = makeBox(groups.plan, [r.w - 0.05, 0.08, r.d - 0.05], [r.cx, 0.44, r.cz], r.floor, {
    selectable: true,
    kind: 'room',
    id: r.id,
    name: r.name,
    dims: r.dims,
    sqft: r.sqft,
    vent: r.vent,
    access: r.access,
    floorName: r.floor === mat.floorWood ? 'Oak Hardwood' : r.floor === mat.floorBath ? 'Non-slip Ceramic' : r.floor === mat.floorKit ? 'Granite Tiles' : 'Polished Travertine'
  });

  // Room Name Sprite
  spriteLabel(`label-${r.id}`, r.name, [r.cx, 0.55, r.cz - 0.4], groups.labels, false);
  // Dimensions Sprite
  spriteLabel(`dim-${r.id}`, `${r.w} x ${r.d} ft · ${r.sqft} sqft`, [r.cx, 0.55, r.cz + 0.8], groups.dimensions, true);
});

// Living room designer area rug
const rugMesh = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 7.5), new THREE.MeshStandardMaterial({ map: makeRugTexture(), roughness: 0.9 }));
rugMesh.rotation.x = -Math.PI / 2;
rugMesh.position.set(20.5, 0.49, 34.0);
rugMesh.receiveShadow = true;
groups.furniture.add(rugMesh);

// ─────────────────────── ARCHITECTURAL WALL BUILDER ───────────────────────────
function addWallSeg(p1, p2, height = WALL_H, yBase = 0.4, targetGroup = groups.walls, collidable = true) {
  const dx = p2.x - p1.x, dz = p2.z - p1.z;
  const len = Math.hypot(dx, dz);
  if (len < 0.05) return null;
  const cx = (p1.x + p2.x) / 2, cz = (p1.z + p2.z) / 2;
  const angle = Math.atan2(dz, dx);

  const m = new THREE.Mesh(new THREE.BoxGeometry(len, height, THICK), mat.wallExt);
  m.position.set(cx, yBase + height / 2, cz);
  m.rotation.y = -angle;
  m.castShadow = true; m.receiveShadow = true;
  targetGroup.add(m);

  // Only solid geometry at human height should block walking. Door and window
  // lintels sit above the player and must not close the opening below them.
  if (collidable && yBase < 5.6) {
    const pad = 0.3;
    collisionRects.push({
      x1: Math.min(p1.x, p2.x) - pad,
      x2: Math.max(p1.x, p2.x) + pad,
      z1: Math.min(p1.z, p2.z) - pad,
      z2: Math.max(p1.z, p2.z) + pad,
    });
  }
  return m;
}

function buildWallWithOpenings(startPt, endPt, openings = [], targetGroup = groups.walls) {
  const dx = endPt.x - startPt.x, dz = endPt.z - startPt.z;
  const totalLen = Math.hypot(dx, dz);
  const dirX = dx / totalLen, dirZ = dz / totalLen;

  const sorted = [...openings].sort((a,b) => a.pos - b.pos);
  let cur = 0;

  sorted.forEach(op => {
    const opStart = Math.max(0, op.pos - op.width / 2);
    const opEnd   = Math.min(totalLen, op.pos + op.width / 2);

    if (opStart > cur) {
      const p1 = { x: startPt.x + dirX * cur, z: startPt.z + dirZ * cur };
      const p2 = { x: startPt.x + dirX * opStart, z: startPt.z + dirZ * opStart };
      addWallSeg(p1, p2, WALL_H, 0.4, targetGroup);
    }

    const opP1 = { x: startPt.x + dirX * opStart, z: startPt.z + dirZ * opStart };
    const opP2 = { x: startPt.x + dirX * opEnd,   z: startPt.z + dirZ * opEnd   };

    if (op.type === 'window') {
      addWallSeg(opP1, opP2, WIN_SILL, 0.4, targetGroup);
      addWallSeg(opP1, opP2, WALL_H - WIN_TOP, 0.4 + WIN_TOP, targetGroup);
    } else if (op.type === 'door') {
      addWallSeg(opP1, opP2, WALL_H - DOOR_H, 0.4 + DOOR_H, targetGroup);
    }

    cur = opEnd;
  });

  if (cur < totalLen) {
    const p1 = { x: startPt.x + dirX * cur, z: startPt.z + dirZ * cur };
    const p2 = { x: endPt.x, z: endPt.z };
    addWallSeg(p1, p2, WALL_H, 0.4, targetGroup);
  }
}

// ─────────────────────── BUILD PERMANENT WALLS ────────────────────────────────
// NORTH EXTERIOR WALL (x: 0 → 29, z: 0) — 12 ft Master BR | 5 ft Hallway | 12 ft Bed 02
buildWallWithOpenings(
  { x: FP.xW, z: FP.zN }, { x: FP.xE, z: FP.zN },
  [
    { pos: 6.0,  width: 4.5, type: 'window', id: 'win-master-n' }, // Master BR North Window (12 ft span)
    { pos: 14.5, width: 2.5, type: 'window', id: 'win-hall-n' },   // Corridor Ventilation Window (5 ft span)
    { pos: 23.0, width: 4.5, type: 'window', id: 'win-bed02-n' },  // Bed 02 North Window (12 ft span)
  ]
);

// EAST EXTERIOR WALL OF BEDROOMS (x: 29, z: 0 → 24) — Bed 02 (12 ft) | Bed 03 (12 ft)
buildWallWithOpenings(
  { x: FP.xE, z: FP.zN }, { x: FP.xE, z: FP.zB3 },
  [
    { pos: 6.0,  width: 4.5, type: 'window', id: 'win-bed02-e' }, // Bed 02 East Window (12 ft)
    { pos: 18.0, width: 4.5, type: 'window', id: 'win-bed03-e' }, // Bed 03 East Window (12 ft)
  ]
);

// EAST WALL OF LIVING ROOM (x: 29, z: 24 → 42) — Front Veranda entry & East Window
buildWallWithOpenings(
  { x: FP.xE, z: FP.zB3 }, { x: FP.xE, z: FP.zS },
  [
    { pos: 8.0,  width: 3.5, type: 'door',   id: 'door-front' },   // MAIN ENTRANCE FROM FRONT VERANDA!
    { pos: 14.5, width: 4.5, type: 'window', id: 'win-living-e' }, // Living East Window (18 ft)
  ]
);

// SOUTH EXTERIOR WALL (z: 42) — 12 ft Dining | 17 ft Living Room
buildWallWithOpenings(
  { x: FP.xW, z: FP.zS }, { x: FP.xM, z: FP.zS },
  [
    { pos: 6.0, width: 5.0, type: 'window', id: 'win-dining-s' }, // Dining South Window (labeled 12)
  ]
);
buildWallWithOpenings(
  { x: FP.xM, z: FP.zS }, { x: FP.xE, z: FP.zS },
  [
    { pos: 8.5, width: 7.0, type: 'window', id: 'win-living-s' }, // Large Panoramic South Window (labeled 17)
  ]
);

// WEST EXTERIOR WALLS
buildWallWithOpenings(
  { x: FP.xW, z: FP.zN }, { x: FP.xW, z: FP.zMB },
  [
    { pos: 8.0, width: 4.5, type: 'window', id: 'win-master-w' }, // Master BR West Window (labeled 16)
  ]
);
// Bathroom Ventilation Wall (recessed to x: 5.0, z: 16 → 26) — Frosted windows labeled "5" & "5"
buildWallWithOpenings(
  { x: FP.xWC, z: FP.zMB }, { x: FP.xWC, z: FP.zWC },
  [
    { pos: 2.5, width: 2.5, type: 'window', id: 'win-ensuite-w' }, // Ensuite Bathroom Frosted Window (5 ft)
    { pos: 7.5, width: 2.5, type: 'window', id: 'win-common-w' },  // Common Bathroom Frosted Window (5 ft)
  ]
);
addWallSeg({ x: FP.xW, z: FP.zMB }, { x: FP.xWC, z: FP.zMB });
addWallSeg({ x: FP.xW, z: FP.zWC }, { x: FP.xWC, z: FP.zWC });
// The bathroom-side ventilation gap remains open behind the toilets.

// Kitchen & Dining West Wall (x: 0, z: 26 → 42)
buildWallWithOpenings(
  { x: FP.xW, z: FP.zWC }, { x: FP.xW, z: FP.zS },
  [
    { pos: 3.5,  width: 4.0, type: 'window', id: 'win-kitchen-w' }, // Kitchen West Window
    { pos: 7.0,  width: 2.8, type: 'door',   id: 'door-kitchen-yard' }, // Kitchen Service Door to Yard!
    { pos: 12.5, width: 4.0, type: 'window', id: 'win-dining-w' },  // Dining West Window
  ]
);

// ─────────────────────── PERMANENT INTERNAL PARTITIONS ────────────────────────
// Bed 02 & Bed 03 Divider Wall (z: 12, x: 17 → 29)
addWallSeg({ x: FP.xB, z: FP.zB2 }, { x: FP.xE, z: FP.zB2 });

// Bed 03 & Living Room Divider Wall (z: 24, x: 17 → 29)
addWallSeg({ x: FP.xB, z: FP.zB3 }, { x: FP.xE, z: FP.zB3 });

// Corridor East Wall / Bedrooms West Wall (x: 17, z: 0 → 24)
buildWallWithOpenings(
  { x: FP.xB, z: FP.zN }, { x: FP.xB, z: FP.zB3 },
  [
    { pos: 6.0,  width: 3.0, type: 'door', id: 'door-bed02' }, // Bed 02 Entrance Door
    { pos: 18.0, width: 3.0, type: 'door', id: 'door-bed03' }, // Bed 03 Entrance Door
  ]
);

// Common Bathroom South Wall / Kitchen North Wall (z: 26, x: 0 → 12) — SOLID
addWallSeg({ x: FP.xW, z: FP.zWC }, { x: FP.xM, z: FP.zWC });

// Divider between Upper Bathroom & Lower Bathroom (z: 21, x: 5 → 12) — SOLID
addWallSeg({ x: FP.xWC, z: FP.zEN }, { x: FP.xM, z: FP.zEN });

// Corridor West Wall around Common Bathroom (x: 12, z: 21 → 26)
buildWallWithOpenings(
  { x: FP.xM, z: FP.zEN }, { x: FP.xM, z: FP.zWC },
  [
    { pos: 2.5, width: 2.8, type: 'door', id: 'door-common' }, // Common Bathroom Entrance Door from Hallway
  ]
);

// Corridor West Wall around Master Bedroom (x: 12, z: 0 → 16)
buildWallWithOpenings(
  { x: FP.xM, z: FP.zN }, { x: FP.xM, z: FP.zMB },
  [
    { pos: 11.5, width: 3.0, type: 'door', id: 'door-master' }, // Master Bedroom Entrance Door from Hallway
  ]
);

// ENCLOSED KITCHEN EAST WALL (x: 12, z: 26 → 34) — 100% SOLID WALL! (Kitchen is enclosed from hallway/living)
addWallSeg({ x: FP.xM, z: FP.zWC }, { x: FP.xM, z: FP.zK });

// KITCHEN & DINING PARTITION WALL (z: 34, x: 0 → 12)
// Accessible via Dining Room! (Door at x: 8.5 to 11.5)
buildWallWithOpenings(
  { x: FP.xW, z: FP.zK }, { x: FP.xM, z: FP.zK },
  [
    { pos: 4.5, width: 3.0, type: 'door', id: 'door-kitchen-dining' }, // Entrance into Kitchen FROM DINING ROOM!
  ]
);

// Dining to Living Room open connection (x: 12, z: 34 → 42)
// Open fluid space (no wall)

// Veranda Exterior Enclosure & Columns
addWallSeg({ x: FP.xE, z: FP.zS }, { x: FP.xV, z: FP.zS }, 2.0);
addWallSeg({ x: FP.xV, z: FP.zB3 }, { x: FP.xV, z: FP.zS }, 2.0);
addWallSeg({ x: FP.xE, z: FP.zB3 }, { x: FP.xV - 3.2, z: FP.zB3 }, 2.0);

function makeColumn(x, z) {
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, WALL_H, 16), mat.wallExt);
  col.position.set(x, 0.4 + WALL_H/2, z);
  col.castShadow = true;
  groups.veranda.add(col);
}
makeColumn(FP.xV - 0.4, FP.zS - 0.4);
makeColumn(FP.xV - 0.4, (FP.zB3 + FP.zS)/2);
makeColumn(FP.xV - 0.4, FP.zB3 + 0.4);

// ─────────────────────── DYNAMIC CONFIGURABLE WALLS & DOORS ───────────────────
// Group A: Master Ensuite Config (Default)
const groupEnsuite = new THREE.Group();
scene.add(groupEnsuite);
// 1. South wall of Master BR has private Ensuite door
buildWallWithOpenings(
  { x: FP.xW, z: FP.zMB }, { x: FP.xM, z: FP.zMB },
  [{ pos: 8.5, width: 2.8, type: 'door', id: 'door-ensuite-private' }],
  groupEnsuite
);
// 2. Hallway wall at x=12, z: 16->21 is SOLID
addWallSeg({ x: FP.xM, z: FP.zMB }, { x: FP.xM, z: FP.zEN }, WALL_H, 0.4, groupEnsuite);

// Group B: Public Washroom Config (3 standard beds + 2 public hallway washrooms)
const groupPublic = new THREE.Group();
groupPublic.visible = false;
scene.add(groupPublic);
// 1. South wall of Master BR is completely SOLID (no door from bedroom into bath)
addWallSeg({ x: FP.xW, z: FP.zMB }, { x: FP.xM, z: FP.zMB }, WALL_H, 0.4, groupPublic);
// 2. Hallway wall at x=12, z: 16->21 now has a public entrance door
buildWallWithOpenings(
  { x: FP.xM, z: FP.zMB }, { x: FP.xM, z: FP.zEN },
  [{ pos: 2.5, width: 2.8, type: 'door', id: 'door-bath1-public' }],
  groupPublic
);

// ─────────────────────── KITCHEN WOODEN JOINERY & STORE SEPARATION ───────────
// User requirement: Inside the kitchen there is a separation (dotted line) working as a store.
// Not a real wall, but a wooden wall with an entrance from within the kitchen,
// and on the other side it has cabinets that can hold stuff.
const joineryGroup = groups.kitchenJoinery;

function buildKitchenJoinery() {
  const kx = FP.xKStore; // x = 8.0 ft
  const zStart = FP.zWC + 0.3; // z = 26.3
  const zEnd   = FP.zK - 0.3;  // z = 33.7
  const length = zEnd - zStart; // 7.4 ft
  const h = 8.5; // Joinery height

  // Wooden Partition Base/Frame
  const woodWall = new THREE.Group();
  woodWall.position.set(kx, 0.4, (zStart + zEnd) / 2);

  // Doorway opening at z = 28.5 (pos 2.2 from north)
  const opWidth = 2.4;
  const opPos = -1.5; // relative to center

  // Solid wooden panels
  const p1Len = (length/2 + opPos - opWidth/2);
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, h, p1Len), mat.cabinetWood);
  p1.position.set(0, h/2, -length/2 + p1Len/2);
  p1.castShadow = true; p1.receiveShadow = true;

  const p2Len = (length/2 - (opPos + opWidth/2));
  const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, h, p2Len), mat.cabinetWood);
  p2.position.set(0, h/2, length/2 - p2Len/2);
  p2.castShadow = true; p2.receiveShadow = true;

  // Lintel above pantry door
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.18, h - DOOR_H, opWidth), mat.cabinetWood);
  lintel.position.set(0, DOOR_H + (h - DOOR_H)/2, opPos);

  woodWall.add(p1, p2, lintel);

  // Pantry Entrance Door Leaf (openable from kitchen)
  const pantryDoorPivot = new THREE.Group();
  pantryDoorPivot.position.set(0, 0, opPos - opWidth/2);
  const pLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.1, DOOR_H - 0.1, opWidth - 0.08), mat.doorWood);
  pLeaf.position.set(0, DOOR_H/2, (opWidth - 0.08)/2);
  pLeaf.castShadow = true;
  pantryDoorPivot.add(pLeaf);

  const pHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), mat.brass);
  pHandle.position.set(-0.08, 3.2, opWidth - 0.3);
  pantryDoorPivot.add(pHandle);

  woodWall.add(pantryDoorPivot);

  // STORAGE CABINETS ON THE KITCHEN COOKING SIDE (facing West towards cooking area)
  // Multi-tier storage cabinet unit holding kitchen groceries, crockery, appliances
  const cabDepth = 1.2;
  const cabGroup = new THREE.Group();
  cabGroup.position.set(-cabDepth/2 - 0.09, 0, length/2 - p2Len/2);

  // Lower counter cabinets
  const lowerCab = new THREE.Mesh(new THREE.BoxGeometry(cabDepth, 3.0, p2Len), mat.kitchenCab);
  lowerCab.position.set(0, 1.5, 0);
  lowerCab.castShadow = true;

  const cabCounter = new THREE.Mesh(new THREE.BoxGeometry(cabDepth + 0.1, 0.15, p2Len + 0.1), mat.countertop);
  cabCounter.position.set(0, 3.05, 0);

  // Upper storage wall cupboards
  const upperCab = new THREE.Mesh(new THREE.BoxGeometry(cabDepth * 0.8, 2.8, p2Len), mat.kitchenCab);
  upperCab.position.set(0.1, 6.0, 0);
  upperCab.castShadow = true;

  cabGroup.add(lowerCab, cabCounter, upperCab);
  woodWall.add(cabGroup);

  // STORAGE SHELVES INSIDE THE PANTRY (facing East towards Store room)
  for (let sy = 1.8; sy <= 7.0; sy += 1.7) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 3.4), mat.cabinetWood);
    shelf.position.set(0.5, sy, length/2 - p2Len/2);
    woodWall.add(shelf);
  }

  joineryGroup.add(woodWall);

  const pantryDoorData = {
    id: 'door-pantry-store',
    name: 'Pantry Store Wooden Door',
    kind: 'door',
    pivot: pantryDoorPivot,
    open: false,
    swing: Math.PI / 2.2,
    selectable: true
  };
  pLeaf.userData = pantryDoorData;
  selectable.push(pLeaf);
  doorsList.push(pantryDoorData);
}
buildKitchenJoinery();

// ─────────────────────── INTERACTIVE DOORS ────────────────────────────────────
function createDoor(id, name, x, z, angle, width = DOOR_W, swing = -Math.PI / 2, parentGroup = groups.doors) {
  const group = new THREE.Group();
  group.position.set(x, 0.4, z);
  group.rotation.y = angle;

  // Frame
  const frameMat = mat.frameMetal;
  const jamb1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, DOOR_H, THICK + 0.04), frameMat);
  jamb1.position.set(-width/2, DOOR_H/2, 0);
  const jamb2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, DOOR_H, THICK + 0.04), frameMat);
  jamb2.position.set(width/2, DOOR_H/2, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, THICK + 0.04), frameMat);
  head.position.set(0, DOOR_H - 0.06, 0);
  group.add(jamb1, jamb2, head);

  // Door leaf pivot
  const pivot = new THREE.Group();
  pivot.position.set(-width/2 + 0.06, 0, 0);

  const leaf = new THREE.Mesh(new THREE.BoxGeometry(width - 0.12, DOOR_H - 0.1, 0.12), mat.doorWood);
  leaf.position.set((width - 0.12)/2, DOOR_H/2, 0);
  leaf.castShadow = true;
  pivot.add(leaf);

  // Brass handle
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8), mat.brass);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(width - 0.35, 3.2, 0.1);
  pivot.add(handle);

  group.add(pivot);
  parentGroup.add(group);

  const doorData = {
    id, name, kind: 'door', pivot, open: false, swing, selectable: true
  };
  leaf.userData = doorData;
  selectable.push(leaf);
  doorsList.push(doorData);
  return doorData;
}

// Permanent doors
createDoor('d-front',   'Front Entrance Door',   FP.xE, FP.zB3 + 8.0,  Math.PI / 2, 3.5,  Math.PI / 2.2);
createDoor('d-master',  'Master Bedroom Door',    FP.xM, FP.zN + 11.5,  Math.PI / 2, 3.0, -Math.PI / 2.2);
createDoor('d-bed02',   'Bedroom 02 Door',        FP.xB, FP.zN + 6.0,  -Math.PI / 2, 3.0,  Math.PI / 2.2);
createDoor('d-bed03',   'Bedroom 03 Door',        FP.xB, FP.zN + 18.0, -Math.PI / 2, 3.0,  Math.PI / 2.2);
createDoor('d-common',  'Common Washroom Door',   FP.xM, FP.zEN + 2.5,  Math.PI / 2, 2.8, -Math.PI / 2.2);
createDoor('d-kyard',   'Kitchen Yard Door',      FP.xW, FP.zWC + 7.0,  Math.PI / 2, 2.8,  Math.PI / 2.2);
createDoor('d-kdining', 'Kitchen Dining Door',    4.5,   FP.zK,         0,           3.0, -Math.PI / 2.2);

// Configurable Doors
// Ensuite Private Door (in groupEnsuite)
const doorEnsuitePrivate = createDoor('d-ensuite-p', 'Master Ensuite Door', 8.5, FP.zMB, 0, 2.8, Math.PI / 2.2, groupEnsuite);
// Public Washroom 1 Door (in groupPublic)
const doorBath1Public    = createDoor('d-bath1-pub', 'Public Washroom 1 Door', FP.xM, FP.zMB + 2.5, Math.PI / 2, 2.8, -Math.PI / 2.2, groupPublic);

// ─────────────────────── TRANSPARENT & OPENABLE WINDOWS ───────────────────────
function createWindow(id, name, x, z, angle, width, height = WIN_H, isFrosted = false) {
  const group = new THREE.Group();
  group.position.set(x, 0.4 + WIN_SILL, z);
  group.rotation.y = angle;

  const frameMat = mat.aluFrame;
  const glassMat = isFrosted ? mat.frostedGlass : mat.glass;

  // Outer Window Frame
  const fTop = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, THICK + 0.06), frameMat);
  fTop.position.set(0, height - 0.04, 0);
  const fBottom = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 0.12, THICK + 0.15), frameMat); // Window Sill
  fBottom.position.set(0, 0.06, 0);
  const fLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, height, THICK + 0.06), frameMat);
  fLeft.position.set(-width/2 + 0.04, height/2, 0);
  const fRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, height, THICK + 0.06), frameMat);
  fRight.position.set(width/2 - 0.04, height/2, 0);
  group.add(fTop, fBottom, fLeft, fRight);

  // Left Fixed Glass Pane
  const halfW = width / 2;
  const paneFixed = new THREE.Mesh(new THREE.BoxGeometry(halfW - 0.06, height - 0.18, 0.04), glassMat);
  paneFixed.position.set(-halfW/2 + 0.02, height/2, -0.02);
  paneFixed.castShadow = false; paneFixed.receiveShadow = true;
  group.add(paneFixed);

  // Right Operable Sliding Glass Sash
  const sashGroup = new THREE.Group();
  sashGroup.position.set(halfW/2 - 0.02, height/2, 0.02);

  const sashFrame = new THREE.Mesh(new THREE.BoxGeometry(halfW - 0.04, height - 0.16, 0.06), frameMat);
  const sashGlass = new THREE.Mesh(new THREE.BoxGeometry(halfW - 0.12, height - 0.24, 0.03), glassMat);
  sashGlass.castShadow = false; sashGlass.receiveShadow = true;
  sashGroup.add(sashFrame, sashGlass);

  group.add(sashGroup);
  groups.windows.add(group);

  const winData = {
    id, name, kind: 'window',
    group, sashGroup,
    open: false,
    baseX: halfW/2 - 0.02,
    openOffset: -(halfW - 0.35),
    selectable: true
  };

  sashGlass.userData = winData;
  sashFrame.userData = winData;
  paneFixed.userData = winData;
  selectable.push(sashGlass, sashFrame, paneFixed);
  windowsList.push(winData);
  return winData;
}

// Windows (Aligned perfectly with wall openings)
createWindow('w-m-n',  'Master BR North Window', 6.0,  FP.zN,  0, 4.5);
createWindow('w-m-w',  'Master BR West Window',  FP.xW, 8.0,   Math.PI/2, 4.5); // was 7.0, wall is 8.0
createWindow('w-h-n',  'Hallway Vent Window',    14.5, FP.zN,  0, 2.5);
createWindow('w-b2-n', 'Bed 02 North Window',    23.0, FP.zN,  0, 4.5);
createWindow('w-b2-e', 'Bed 02 East Window',     FP.xE, 6.0,   Math.PI/2, 4.5);
createWindow('w-b3-e', 'Bed 03 East Window',     FP.xE, 18.0,  Math.PI/2, 4.5);
createWindow('w-ens',  'Ensuite Frosted Window', FP.xWC, FP.zMB + 2.5, Math.PI/2, 2.5, 3.0, true);
createWindow('w-com',  'Common Frosted Window',  FP.xWC, FP.zMB + 7.5, Math.PI/2, 2.5, 3.0, true);
createWindow('w-kit-w','Kitchen West Window',    FP.xW, FP.zWC + 3.5, Math.PI/2, 4.0); // was 3.0/3.5, wall is 3.5/4.0
createWindow('w-din-w','Dining West Window',     FP.xW, FP.zWC + 12.5, Math.PI/2, 4.0); // was 13.5, wall is 12.5
createWindow('w-din-s','Dining South Window',    6.0,  FP.zS,  0, 5.0);
createWindow('w-liv-s','Living Panoramic Window',20.5, FP.zS,  0, 7.0);
createWindow('w-liv-e','Living East Window',     FP.xE, FP.zB3 + 14.5, Math.PI/2, 4.5); // was 9.0, wall is 14.5

// ─────────────────────── REALISTIC FURNITURE (NO WALL PENETRATION) ────────────
function createBed(cx, cz, rot, isKing = false) {
  const g = new THREE.Group();
  g.position.set(cx, 0.44, cz);
  g.rotation.y = rot;

  const bw = isKing ? 6.2 : 5.0, bl = 6.6;
  // Frame
  makeBox(g, [bw, 0.6, bl], [0, 0.3, 0], mat.baseboard);
  // Mattress
  makeBox(g, [bw - 0.2, 0.7, bl - 0.2], [0, 0.8, 0], mat.bedSheet);
  // Duvet
  makeBox(g, [bw - 0.15, 0.25, bl * 0.7], [0, 1.15, 0.8], mat.bedDuvet);
  // Headboard
  makeBox(g, [bw + 0.3, 3.0, 0.3], [0, 1.5, -bl/2 + 0.15], mat.baseboard);
  // Pillows
  makeBox(g, [1.5, 0.3, 1.1], [-bw/4, 1.3, -bl/2 + 0.9], mat.pillow);
  makeBox(g, [1.5, 0.3, 1.1], [ bw/4, 1.3, -bl/2 + 0.9], mat.pillow);

  // Nightstands (safely spaced)
  [-bw/2 - 0.95, bw/2 + 0.95].forEach(x => {
    makeBox(g, [1.3, 1.4, 1.3], [x, 0.7, -bl/2 + 0.8], mat.doorWood);
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), mat.brass);
    lampStem.position.set(x, 1.75, -bl/2 + 0.8);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.45, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfffae0, side: THREE.DoubleSide }));
    shade.position.set(x, 2.05, -bl/2 + 0.8);
    g.add(lampStem, shade);
  });

  groups.furniture.add(g);
}

// 1. MASTER BEDROOM (x: 0..12, z: 0..14)
// Bed placed centrally at cz = 7.0, headboard against north wall
createBed(6.0, 7.0, 0, true);
// Wardrobe along west wall (moved to z=12.2 to avoid west window at z=8)
makeBox(groups.furniture, [1.4, 7.5, 3.0], [1.2, 0.44 + 3.75, 12.2], mat.doorWood, { name: 'Master Wardrobe' });

// 2. BEDROOM 02 (x: 17..29, z: 0..12)
// Bed placed at cz = 5.5, rot = Math.PI (headboard south)
createBed(24.0, 6.0, Math.PI);
// Wardrobe on West wall at z=10.0 (safely clear of door swing at z=6 and windows)
makeBox(groups.furniture, [1.4, 7.2, 3.2], [17.7, 0.44 + 3.6, 10.0], mat.doorWood, { name: 'Bed02 Wardrobe' });
makeBox(groups.furniture, [3.2, 2.4, 1.5], [18.5, 0.44 + 1.2, 1.2], mat.doorWood, { name: 'Study Desk' });

// 3. BEDROOM 03 (x: 17..29, z: 12..24)
// Bed placed at cz = 18.0, rot = Math.PI
createBed(24.0, 18.0, Math.PI);
// Wardrobe on West wall at z=22.0 (safely clear of door swing at z=18 and windows)
makeBox(groups.furniture, [1.4, 7.2, 3.2], [17.7, 0.44 + 3.6, 22.0], mat.doorWood, { name: 'Bed03 Wardrobe' });
makeBox(groups.furniture, [3.2, 2.4, 1.5], [18.5, 0.44 + 1.2, 13.2], mat.doorWood, { name: 'Study Desk' });

// BATHROOM FIXTURES (Toilets, Vanities, Mirrors, Showers)
function createBathroomSet(cx, cz) {
  const g = new THREE.Group();
  g.position.set(cx, 0.44, cz);

  // Keep the entry side clear in both layouts. The two bathrooms share this
  // fixture set, while their doors enter from different sides.
  // Modern Toilet (Choo), placed toward the far/north-west corner.
  const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 1.3, 16), mat.porcelain);
  pan.position.set(-1.8, 0.65, 1.35);
  const tank = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.6), mat.porcelain);
  tank.position.set(-1.8, 1.5, 1.95);
  g.add(pan, tank);

  // Floating Vanity Sink & Mirror, shifted away from the east-side public doors.
  const vanity = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 1.4), mat.kitchenCab);
  vanity.position.set(1.05, 1.1, 1.45);
  const basin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 1.1), mat.porcelain);
  basin.position.set(1.05, 2.25, 1.45);
  const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), mat.chrome);
  faucet.position.set(1.05, 2.65, 1.75);
  const mirror = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 0.05), new THREE.MeshStandardMaterial({ color: 0xccdede, roughness: 0.05, metalness: 0.9 }));
  mirror.position.set(1.05, 4.1, 2.1);
  g.add(vanity, basin, faucet, mirror);

  // Glass Shower enclosure stays in the rear half, outside the door swing.
  const showerGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 6.5, 2.4), mat.glass);
  showerGlass.position.set(-0.2, 3.25, 0.55);
  const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 16), mat.chrome);
  showerHead.position.set(-1.6, 6.2, 0.55);
  g.add(showerGlass, showerHead);

  groups.amenities.add(g);
}
createBathroomSet(8.5, 16.5); // Bath 1 (Ensuite or Public 1)
createBathroomSet(8.5, 21.5); // Bath 2 (Common or Public 2)

// KITCHEN MAIN COOKING ZONE COUNTERS (x: 0..8, z: 24..33)
const kitMain = new THREE.Group();
kitMain.position.set(4.0, 0.44, 28.5);

// Counter along North wall (z = 24)
const cNorth = makeBox(kitMain, [6.0, 2.8, 2.0], [0.5, 1.4, -3.5], mat.kitchenCab);
const topN   = makeBox(kitMain, [6.2, 0.15, 2.2], [0.5, 2.85, -3.5], mat.countertop);

// Sink & Gooseneck Faucet
const sink = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 1.3), mat.chrome);
sink.position.set(1.8, 2.75, -3.5);
const gooseneck = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 16, Math.PI), mat.chrome);
gooseneck.rotation.z = Math.PI / 2;
gooseneck.position.set(1.8, 3.2, -3.5);
kitMain.add(sink, gooseneck);

// Gas Cooking Hob & Extractor Hood
const hob = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.5), mat.frameMetal);
hob.position.set(-1.2, 2.92, -3.5);
const hood = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.6), mat.chrome);
hood.position.set(-1.2, 6.5, -3.5);
kitMain.add(hob, hood);

// Stainless Double-Door Refrigerator (placed against North-East wooden store partition — 100% UNBLOCKS West Yard Door!)
const fridge = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6.5, 2.4), mat.chrome);
fridge.position.set(2.5, 3.25, -2.0);
kitMain.add(fridge);

groups.amenities.add(kitMain);

// DINING ROOM FURNITURE (x: 0..12, z: 33..42)
const dinGroup = new THREE.Group();
dinGroup.position.set(6.0, 0.44, 37.5);

// Solid Dining Table
makeBox(dinGroup, [5.2, 0.18, 3.2], [0, 2.5, 0], mat.doorWood);
[[-2.3,-1.3],[2.3,-1.3],[-2.3,1.3],[2.3,1.3]].forEach(([tx,tz]) => {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 2.4, 8), mat.frameMetal);
  leg.position.set(tx, 1.2, tz);
  dinGroup.add(leg);
});

// 6 Dining Chairs
function addChair(cx, cz, ry) {
  const cg = new THREE.Group();
  cg.position.set(cx, 0, cz);
  cg.rotation.y = ry;
  makeBox(cg, [1.3, 0.1, 1.3], [0, 1.5, 0], mat.sofaFabric);
  makeBox(cg, [1.3, 1.7, 0.12], [0, 2.35, -0.6], mat.sofaFabric);
  [[-0.55,-0.55],[0.55,-0.55],[-0.55,0.55],[0.55,0.55]].forEach(([lx,lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 1.45, 8), mat.frameMetal);
    leg.position.set(lx, 0.725, lz);
    cg.add(leg);
  });
  dinGroup.add(cg);
}
addChair(-1.7, -2.1, 0); addChair(0, -2.1, 0); addChair(1.7, -2.1, 0);
addChair(-1.7,  2.1, Math.PI); addChair(0,  2.1, Math.PI); addChair(1.7,  2.1, Math.PI);

// Dining Hanging Pendant Light
const dinPendant = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.55, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x334547, roughness: 0.3 }));
dinPendant.position.set(0, 7.2, 0);
const dinCord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.0, 8), mat.frameMetal);
dinCord.position.set(0, 8.2, 0);
dinGroup.add(dinPendant, dinCord);

groups.furniture.add(dinGroup);

// LIVING ROOM FURNITURE (x: 12..29, z: 24..42)
const livGroup = new THREE.Group();
livGroup.position.set(20.5, 0.44, 33.0);

// L-Sectional Sofa (safely positioned with clearance from all walls)
makeBox(livGroup, [8.4, 1.2, 3.0], [0, 0.6, -1.8], mat.sofaFabric);
makeBox(livGroup, [8.4, 1.8, 0.5], [0, 1.5, -3.1], mat.sofaFabric);
makeBox(livGroup, [3.0, 1.2, 4.6], [-3.5, 0.6, 1.3], mat.sofaFabric);
makeBox(livGroup, [0.5, 1.8, 4.6], [-4.8, 1.5, 1.3], mat.sofaFabric);

// Accent Pillows
makeBox(livGroup, [1.1, 0.9, 0.28], [-2.3, 1.5, -2.6], mat.sofaCushion);
makeBox(livGroup, [1.1, 0.9, 0.28], [ 1.4, 1.5, -2.6], mat.sofaCushion);
makeBox(livGroup, [0.28, 0.9, 1.1], [-4.3, 1.5,  0.4], mat.sofaCushion);

// Coffee Table
makeBox(livGroup, [4.2, 0.15, 2.4], [0.5, 1.2, 1.1], mat.doorWood);
[[-1.6,-0.9],[2.0,-0.9],[-1.6,0.9],[2.0,0.9]].forEach(([cx,cz]) => {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 1.1, 8), mat.frameMetal);
  leg.position.set(cx + 0.5, 0.55, cz + 1.1);
  livGroup.add(leg);
});

// TV Media Console against South wall (at z = 40.5, inner face of wall is 41.75 -> Safe!)
makeBox(livGroup, [7.5, 1.5, 1.4], [0, 0.75, 7.2], mat.doorWood);
const tvPanel = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.4, 0.15), mat.tvScreen);
tvPanel.position.set(0, 3.6, 7.2);
livGroup.add(tvPanel);

// Arc Floor Lamp
const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16), mat.brass);
lampBase.position.set(4.4, 0.05, -2.8);
const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 7.5, 8), mat.brass);
lampPole.position.set(4.4, 3.75, -2.8);
const lampDome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16, 0, Math.PI*2, 0, Math.PI/2), mat.brass);
lampDome.position.set(3.2, 7.5, -1.8);
livGroup.add(lampBase, lampPole, lampDome);

// Potted Fiddle Leaf Fig
const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.45, 1.5, 16), mat.porcelain);
pot.position.set(-4.8, 0.75, -2.8);
const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1), new THREE.MeshStandardMaterial({ color: 0x2b4c38, roughness: 0.9 }));
plant.position.set(-4.8, 2.0, -2.8);
livGroup.add(pot, plant);

groups.furniture.add(livGroup);

// VERANDA OUTDOOR FURNITURE
const verGroup = new THREE.Group();
verGroup.position.set(FP.xV - 2.5, 0.44, (FP.zB3 + FP.zS)/2);
makeBox(verGroup, [1.8, 1.4, 1.8], [0, 0.7, -3.0], mat.sofaFabric);
makeBox(verGroup, [1.8, 1.4, 1.8], [0, 0.7,  3.0], mat.sofaFabric);
makeBox(verGroup, [1.4, 1.2, 1.4], [0, 0.6,  0.0], mat.doorWood);
groups.veranda.add(verGroup);

// ─────────────────────── CEILING & ROOF ───────────────────────────────────────
function createGableRoof() {
  const x1 = -1.5, x2 = 30.5, z1 = -1.5, z2 = 43.5;
  const cx = (x1 + x2) / 2;
  const ridgeY = 0.4 + WALL_H + 5.5;
  const eaveY  = 0.4 + WALL_H + 0.2;

  const leftSlope = new THREE.Mesh(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, eaveY, z1), new THREE.Vector3(cx, ridgeY, z1), new THREE.Vector3(cx, ridgeY, z2),
      new THREE.Vector3(x1, eaveY, z1), new THREE.Vector3(cx, ridgeY, z2), new THREE.Vector3(x1, eaveY, z2),
    ]),
    mat.roofTile
  );
  leftSlope.geometry.computeVertexNormals();

  const rightSlope = new THREE.Mesh(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(cx, ridgeY, z1), new THREE.Vector3(x2, eaveY, z1), new THREE.Vector3(x2, eaveY, z2),
      new THREE.Vector3(cx, ridgeY, z1), new THREE.Vector3(x2, eaveY, z2), new THREE.Vector3(cx, ridgeY, z2),
    ]),
    mat.roofTile
  );
  rightSlope.geometry.computeVertexNormals();

  const verSlope = new THREE.Mesh(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(28.5, eaveY + 1.2, 23.5), new THREE.Vector3(36.0, eaveY - 0.8, 23.5), new THREE.Vector3(36.0, eaveY - 0.8, 43.5),
      new THREE.Vector3(28.5, eaveY + 1.2, 23.5), new THREE.Vector3(36.0, eaveY - 0.8, 43.5), new THREE.Vector3(28.5, eaveY + 1.2, 43.5),
    ]),
    mat.roofTile
  );
  verSlope.geometry.computeVertexNormals();

  // Dedicated infill over the bathroom-side ventilation gap. Keep this as a
  // separate panel so the open lightcourt remains open at wall level while
  // the roof layer still covers it from above.
  const gapX1 = x1 - 0.05;
  const gapX2 = FP.xWC + 0.65;
  const gapZ1 = FP.zMB - 0.55;
  const gapZ2 = FP.zWC + 0.55;
  const roofYAt = x => eaveY + ((x - x1) / (cx - x1)) * (ridgeY - eaveY) + 0.06;
  const gapCover = new THREE.Mesh(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(gapX1, roofYAt(gapX1), gapZ1),
      new THREE.Vector3(gapX2, roofYAt(gapX2), gapZ1),
      new THREE.Vector3(gapX2, roofYAt(gapX2), gapZ2),
      new THREE.Vector3(gapX1, roofYAt(gapX1), gapZ1),
      new THREE.Vector3(gapX2, roofYAt(gapX2), gapZ2),
      new THREE.Vector3(gapX1, roofYAt(gapX1), gapZ2),
    ]),
    mat.roofTile
  );
  gapCover.geometry.computeVertexNormals();

  // Close the triangular gable ends so the wall line meets the roof ridge.
  // These are roof-dependent structural infills and appear with the roof
  // layer, preventing the large open triangles visible from either end.
  const gableMaterial = mat.wallExt.clone();
  gableMaterial.side = THREE.DoubleSide;
  const northGable = new THREE.Mesh(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, eaveY, z1),
      new THREE.Vector3(x2, eaveY, z1),
      new THREE.Vector3(cx, ridgeY, z1),
    ]),
    gableMaterial
  );
  const southGable = new THREE.Mesh(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, eaveY, z2),
      new THREE.Vector3(cx, ridgeY, z2),
      new THREE.Vector3(x2, eaveY, z2),
    ]),
    gableMaterial
  );
  northGable.geometry.computeVertexNormals();
  southGable.geometry.computeVertexNormals();

  // Add flat ceiling for the interior
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(x2 - x1, z2 - z1),
    mat.wallInt
  );
  ceiling.rotation.x = Math.PI / 2; // Face downwards for interior view
  ceiling.position.set(cx, 0.4 + WALL_H, (z1 + z2) / 2);
  ceiling.receiveShadow = true;

  groups.roof.add(leftSlope, rightSlope, verSlope, gapCover, northGable, southGable, ceiling);
}
createGableRoof();

// ─────────────────────── INTERIOR LIGHT SOURCES ───────────────────────────────
const interiorPointLights = [];
const interiorLights = [
  { room: 'master',  pos: [6.0,  0.4 + WALL_H - 0.5, 8.0] },
  { room: 'ensuite', pos: [8.5,  0.4 + WALL_H - 0.5, 18.5] },
  { room: 'common',  pos: [8.5,  0.4 + WALL_H - 0.5, 23.5] },
  { room: 'bed02',   pos: [23.0, 0.4 + WALL_H - 0.5, 6.0] },
  { room: 'bed03',   pos: [23.0, 0.4 + WALL_H - 0.5, 18.0] },
  { room: 'hall',    pos: [14.5, 0.4 + WALL_H - 0.5, 12.0] },
  { room: 'kitchen', pos: [4.0,  0.4 + WALL_H - 0.5, 30.0] },
  { room: 'store',   pos: [10.0, 0.4 + WALL_H - 0.5, 30.0] },
  { room: 'dining',  pos: [6.0,  0.4 + WALL_H - 0.5, 38.0] },
  { room: 'living',  pos: [20.5, 0.4 + WALL_H - 0.5, 33.0] },
  { room: 'veranda', pos: [32.0, 0.4 + WALL_H - 0.5, 33.0] },
];

interiorLights.forEach(l => {
  const pLight = new THREE.PointLight(0xffecd1, 0.9, 22, 1.8);
  pLight.position.set(...l.pos);
  pLight.userData = { room: l.room };
  groups.lighting.add(pLight);
  interiorPointLights.push(pLight);

  const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16), new THREE.MeshBasicMaterial({ color: 0xfff6dd }));
  fixture.position.set(...l.pos);
  groups.lighting.add(fixture);
});

// ─────────────────────── INTERACTIVE FUNCTIONS & TOGGLES ──────────────────────
// Toggle Windows open / closed
function toggleWindow(win, forceState = null) {
  win.open = (forceState !== null) ? forceState : !win.open;
  const targetX = win.open ? win.baseX + win.openOffset : win.baseX;
  win.sashGroup.position.x = targetX;
}

function toggleAllWindows() {
  state.allWindowsOpen = !state.allWindowsOpen;
  windowsList.forEach(w => toggleWindow(w, state.allWindowsOpen));
  const lbl = document.querySelector('#labelToggleWindows');
  if (lbl) lbl.textContent = state.allWindowsOpen ? 'Close Windows' : 'Open Windows';
  const btn = document.querySelector('#btnToggleWindows');
  if (btn) btn.classList.toggle('active', state.allWindowsOpen);
}

// Toggle Doors open / closed
function toggleDoor(door, forceState = null) {
  door.open = (forceState !== null) ? forceState : !door.open;
  door.pivot.rotation.y = door.open ? door.swing : 0;
}

function toggleAllDoors() {
  state.allDoorsOpen = !state.allDoorsOpen;
  doorsList.forEach(d => toggleDoor(d, state.allDoorsOpen));
  const lbl = document.querySelector('#labelToggleDoors');
  if (lbl) lbl.textContent = state.allDoorsOpen ? 'Close Doors' : 'Open Doors';
  const btn = document.querySelector('#btnToggleDoors');
  if (btn) btn.classList.toggle('active', state.allDoorsOpen);
}

// Night / Day Lighting Toggle
function toggleLighting() {
  state.nightLighting = !state.nightLighting;
  if (state.nightLighting) {
    scene.background.setHex(0x060b0c);
    scene.fog.color.setHex(0x060b0c);
    hemiLight.intensity = 0.4;
    sun.intensity = 0.3;
    sun.color.setHex(0x9fc2c9); // Cool moonlight
    softFill.intensity = 0.1;
    interiorPointLights.forEach(pl => { pl.intensity = 1.8; pl.color.setHex(0xffdfa8); });
  } else {
    scene.background.setHex(0x0c1516);
    scene.fog.color.setHex(0x0c1516);
    hemiLight.intensity = 1.5;
    sun.intensity = 2.6;
    sun.color.setHex(0xfff5e4); // Warm daylight
    softFill.intensity = 0.7;
    interiorPointLights.forEach(pl => { pl.intensity = 0.9; pl.color.setHex(0xffecd1); });
  }
  const lbl = document.querySelector('#labelToggleLighting');
  if (lbl) lbl.textContent = state.nightLighting ? 'Daylight' : 'Night Lights';
  const btn = document.querySelector('#btnToggleLighting');
  if (btn) btn.classList.toggle('active', state.nightLighting);
}

// ─────────────────────── LAYOUT MODE TOGGLE ───────────────────────────────────
// Master Ensuite vs 3-Bed / 2-Public-Baths Toggle
function setLayoutMode(mode) {
  state.layoutMode = mode;
  const isEnsuite = (mode === 'ensuite');

  // Toggle 3D groups
  groupEnsuite.visible = isEnsuite;
  groupPublic.visible = !isEnsuite;

  // Update UI Pills
  const btnEns = document.querySelector('#btnLayoutEnsuite');
  const btnPub = document.querySelector('#btnLayoutPublic');
  if (btnEns) btnEns.classList.toggle('active', isEnsuite);
  if (btnPub) btnPub.classList.toggle('active', !isEnsuite);

  // Update Header & Footer badges
  const cfgBadge = document.querySelector('#currentConfigBadge');
  if (cfgBadge) cfgBadge.textContent = isEnsuite ? 'Ensuite Config' : '2 Public Baths';
  const actTag = document.querySelector('#activeConfigTag');
  if (actTag) actTag.textContent = isEnsuite ? 'Master Ensuite Plan' : '3-Bed / 2-Public-Baths Plan';
  const fDesc = document.querySelector('#footerLayoutDesc');
  if (fDesc) fDesc.textContent = isEnsuite
    ? 'Current: Master Ensuite Layout (Private Bath attached to Master BR)'
    : 'Current: Standard 3-Bed Layout (2 Hallway Public Washrooms)';

  // Update 3D Sprites
  if (isEnsuite) {
    updateSpriteText('label-master', 'Master Bedroom');
    updateSpriteText('label-ensuite', 'Master Ensuite');
    updateSpriteText('label-common', 'Common Washroom');
  } else {
    updateSpriteText('label-master', 'Bedroom 01 (Master)');
    updateSpriteText('label-ensuite', 'Public Washroom 01');
    updateSpriteText('label-common', 'Public Washroom 02');
  }

  // Update Room Inspector if open
  if (state.selectedRoom) {
    showRoomCard(state.selectedRoom);
  }
}

document.querySelector('#btnLayoutEnsuite')?.addEventListener('click', () => setLayoutMode('ensuite'));
document.querySelector('#btnLayoutPublic')?.addEventListener('click', () => setLayoutMode('public'));

// ─────────────────────── LAYER VISIBILITY CONTROLS ────────────────────────────
const layerEl = document.querySelector('#layers');
if (layerEl) {
  layerEl.innerHTML = '';
  layerDefs.forEach(([key, labelText], idx) => {
    const row = document.createElement('div');
    row.className = 'layer-item';
    row.innerHTML = `
      <input type="checkbox" id="layer-${key}" data-layer="${key}" ${state.layers[key] ? 'checked' : ''} />
      <label for="layer-${key}">${labelText}</label>
      <span class="layer-shortcut">${idx + 1}</span>
    `;
    row.querySelector('input').onchange = (e) => {
      state.layers[key] = e.target.checked;
      refreshLayers();
    };
    layerEl.appendChild(row);
  });
}

function refreshLayers() {
  Object.entries(groups).forEach(([k, g]) => {
    if (state.view === 'top' && k === 'roof') {
      g.visible = false;
    } else {
      g.visible = !!state.layers[k];
    }
  });

  document.querySelectorAll('.layer-item input').forEach(inp => {
    inp.checked = !!state.layers[inp.dataset.layer];
  });
}
refreshLayers();

// ─────────────────────── ROOM INSPECTION CARD ─────────────────────────────────
function showRoomCard(meta) {
  const card = document.querySelector('#roomCard');
  if (!card) return;

  const isEnsuite = (state.layoutMode === 'ensuite');
  let displayName = meta.name;
  let statusText = meta.access;

  if (meta.id === 'master') {
    displayName = isEnsuite ? 'Master Bedroom' : 'Bedroom 01 (Standard)';
    statusText = isEnsuite ? 'Private Ensuite Attached' : 'Standard Room (Hallway Baths)';
  } else if (meta.id === 'ensuite') {
    displayName = isEnsuite ? 'Master Ensuite' : 'Public Washroom 01';
    statusText = isEnsuite ? 'Private to Master' : 'Hallway Access';
  } else if (meta.id === 'common') {
    displayName = isEnsuite ? 'Common Washroom' : 'Public Washroom 02';
  }

  document.querySelector('#cardRoomType').textContent = meta.type || 'ROOM';
  document.querySelector('#cardRoomTitle').textContent = displayName;
  document.querySelector('#cardRoomDims').textContent = `${meta.dims} (${meta.sqft} sq ft)`;
  document.querySelector('#cardVent').textContent = meta.vent || 'Standard';
  document.querySelector('#cardAccess').textContent = meta.access || 'Hallway';
  document.querySelector('#cardFloor').textContent = meta.floorName || 'Tile';
  document.querySelector('#cardStatus').textContent = statusText;

  card.classList.remove('hidden');
}

document.querySelector('#btnCloseCard')?.addEventListener('click', () => {
  document.querySelector('#roomCard')?.classList.add('hidden');
});

// ─────────────────────── INTERACTION & OBJECT SELECTION ───────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getIntersection(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(selectable, true)[0];
}

let pointerDownPos = { x: 0, y: 0 };
renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos.x = e.clientX;
  pointerDownPos.y = e.clientY;
});

renderer.domElement.addEventListener('pointerup', (e) => {
  // If the user dragged to orbit the camera, don't trigger a click!
  const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (dist > 5) return;

  // Measurement tool logic
  if (state.measure) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(groups.plan.children, true)[0];
    if (hit) {
      state.measurePts.push(hit.point);
      if (state.measurePts.length === 2) {
        const distFt = state.measurePts[0].distanceTo(state.measurePts[1]);
        const distM  = distFt * 0.3048;
        const readout = document.querySelector('#measureReadout');
        if (readout) {
          readout.innerHTML = `Measured: <b>${distFt.toFixed(2)} ft</b> (${distM.toFixed(2)} m)`;
          readout.classList.remove('hidden');
        }
        state.measure = false;
        state.measurePts = [];
        document.querySelector('#measureBtn')?.classList.remove('active');
      }
    }
    return;
  }

  const hit = getIntersection(e);
  if (!hit) return;

  const obj = hit.object;
  const meta = obj.userData || {};

  // Interactive Doors: toggle open/closed
  if (meta.kind === 'door') {
    toggleDoor(meta);
    return;
  }

  // Interactive Windows: toggle open/closed
  if (meta.kind === 'window') {
    toggleWindow(meta);
    return;
  }

  // Room Inspection Selection
  if (meta.kind === 'room') {
    state.selectedRoom = meta;
    showRoomCard(meta);
    const readout = document.querySelector('#measureReadout');
    if (readout) {
      readout.innerHTML = `Selected: <b>${meta.name}</b> · ${meta.dims} · ${meta.sqft} sq ft`;
      readout.classList.remove('hidden');
    }
  }
});

// ─────────────────────── FIRST-PERSON WALK NAVIGATION ─────────────────────────
const activeKeys = new Set();
let yaw = 0, pitch = 0, isDragging = false, lastX = 0, lastY = 0;

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  const movementKey = ['w', 'a', 's', 'd'].includes(k);
  if (movementKey) e.preventDefault();
  activeKeys.add(k);

  // Number keys 1-9 to toggle layers
  const n = parseInt(k, 10);
  if (n >= 1 && n <= layerDefs.length) {
    const layerName = layerDefs[n - 1][0];
    state.layers[layerName] = !state.layers[layerName];
    refreshLayers();
  }

  // Shortcuts
  if (k === 'm') document.querySelector('#measureBtn')?.click();
  if (k === 'l') document.querySelector('#labelsBtn')?.click();

  // 'E' shortcut in walk mode to interact with doors/windows
  if (k === 'e' && state.view === 'walk') {
    raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
    const hit = raycaster.intersectObjects(selectable, true)[0];
    if (hit && hit.object.userData?.kind === 'door') {
      toggleDoor(hit.object.userData);
    } else if (hit && hit.object.userData?.kind === 'window') {
      toggleWindow(hit.object.userData);
    }
  }
});

window.addEventListener('keyup', e => activeKeys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => activeKeys.clear());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) activeKeys.clear();
});

renderer.domElement.addEventListener('pointerdown', e => {
  if (state.view !== 'walk') return;
  isDragging = true;
  lastX = e.clientX; lastY = e.clientY;
  renderer.domElement.setPointerCapture?.(e.pointerId);
});

renderer.domElement.addEventListener('pointerup', e => {
  if (state.view !== 'walk') return;
  isDragging = false;
  renderer.domElement.releasePointerCapture?.(e.pointerId);
});
renderer.domElement.addEventListener('pointercancel', e => {
  isDragging = false;
  renderer.domElement.releasePointerCapture?.(e.pointerId);
});

renderer.domElement.addEventListener('pointermove', e => {
  if (state.view !== 'walk' || !isDragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  yaw   -= dx * 0.0035;
  pitch -= dy * 0.003;
  pitch = Math.max(-1.25, Math.min(1.25, pitch));
  lastX = e.clientX; lastY = e.clientY;
});

function canMove(x, z) {
  if (x < FP.xW - 2.0 || x > FP.xV + 2.0 || z < FP.zN - 2.0 || z > FP.zS + 2.0) return false;
  return !collisionRects.some(r => x > r.x1 && x < r.x2 && z > r.z1 && z < r.z2);
}

function updateWalk(dt) {
  if (state.view !== 'walk') return;

  // Use the same orientation that the camera renders. This keeps W/S/A/D
  // and the touch arrows consistent after looking around or changing rooms.
  const fwd = new THREE.Vector3();
  camera.getWorldDirection(fwd);
  fwd.y = 0;
  fwd.normalize();

  // Camera-right is forward × world-up. Keeping this derived from `fwd`
  // prevents left/right from becoming mirrored at different yaw angles.
  const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  const moveDir = new THREE.Vector3();

  if (activeKeys.has('w')) moveDir.add(fwd);
  if (activeKeys.has('s')) moveDir.sub(fwd);
  if (activeKeys.has('d')) moveDir.add(rgt);
  if (activeKeys.has('a')) moveDir.sub(rgt);

  if (moveDir.lengthSq() > 0) moveDir.normalize();

  const walkSpeed = 6.5 * dt;
  const nextX = camera.position.x + moveDir.x * walkSpeed;
  const nextZ = camera.position.z + moveDir.z * walkSpeed;

  if (canMove(nextX, camera.position.z)) camera.position.x = nextX;
  if (canMove(camera.position.x, nextZ)) camera.position.z = nextZ;

  camera.position.y = 5.6; // Realistic human eye level (5.6 ft)
  camera.rotation.order = 'YXZ';
  camera.rotation.set(pitch, yaw, 0);
}

// ─────────────────────── VIEW MODES & PRESETS ─────────────────────────────────
function setViewMode(mode) {
  state.view = mode;
  controls.enabled = (mode !== 'walk');
  document.body.classList.toggle('walk-mode', mode === 'walk');

  document.querySelectorAll('.mode').forEach(b => {
    b.classList.toggle('active', b.dataset.view === mode);
  });

  const viewLabel = document.querySelector('#viewLabel');

  if (mode === 'top') {
    if (viewLabel) viewLabel.textContent = 'Architectural 2D Plan View';
    camera.position.set(17.5, 62, 21);
    controls.target.set(17.5, 0, 21);
    controls.enableRotate = false;
    controls.update();
    state.layers.dimensions = true;
    state.layers.roof = false;
  } else if (mode === 'walk') {
    if (viewLabel) viewLabel.textContent = 'Walk Mode · WASD + mouse drag · E to interact';
    camera.position.set(20.5, 5.6, 32.0); // Stand inside Living room entrance
    yaw = 0; pitch = 0;
    controls.enableRotate = true;
  } else {
    // Orbit view
    if (viewLabel) viewLabel.textContent = 'Orbit 3D View';
    camera.position.set(17.5, 36, 68);
    controls.target.set(17.5, 3.5, 21.0);
    controls.enableRotate = true;
    controls.update();
  }

  refreshLayers();
}

document.querySelectorAll('.mode').forEach(b => {
  b.onclick = () => setViewMode(b.dataset.view);
});

// Reset view button
document.querySelector('#resetView')?.addEventListener('click', () => setViewMode('orbit'));

// Presets
document.querySelector('#finishedPreset')?.addEventListener('click', () => {
  state.layers.furniture = true;
  state.layers.kitchenJoinery = true;
  state.layers.amenities = true;
  state.layers.roof = false;
  state.layers.walls = true;
  state.layers.dimensions = false;
  refreshLayers();
  setViewMode('orbit');
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#finishedPreset')?.classList.add('active');
});

document.querySelector('#barePreset')?.addEventListener('click', () => {
  state.layers.furniture = false;
  state.layers.kitchenJoinery = false;
  state.layers.amenities = false;
  state.layers.roof = false;
  state.layers.walls = true;
  state.layers.dimensions = true;
  refreshLayers();
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#barePreset')?.classList.add('active');
});

document.querySelector('#roofPreset')?.addEventListener('click', () => {
  state.layers.roof = true;
  refreshLayers();
  setViewMode('orbit');
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#roofPreset')?.classList.add('active');
});

// Quick Operations
document.querySelector('#btnToggleWindows')?.addEventListener('click', toggleAllWindows);
document.querySelector('#btnToggleDoors')?.addEventListener('click', toggleAllDoors);
document.querySelector('#btnToggleLighting')?.addEventListener('click', toggleLighting);

// Measurement & Labels buttons
const measureBtn = document.querySelector('#measureBtn');
const measureReadout = document.querySelector('#measureReadout');
if (measureBtn) {
  measureBtn.onclick = () => {
    state.measure = !state.measure;
    state.measurePts = [];
    measureBtn.classList.toggle('active', state.measure);
    if (measureReadout) {
      if (state.measure) {
        measureReadout.innerHTML = 'Measurement active: Click any two points in the model';
        measureReadout.classList.remove('hidden');
      } else {
        measureReadout.classList.add('hidden');
      }
    }
  };
}

const labelsBtn = document.querySelector('#labelsBtn');
if (labelsBtn) {
  labelsBtn.onclick = () => {
    state.layers.labels = !state.layers.labels;
    refreshLayers();
    labelsBtn.classList.toggle('active', state.layers.labels);
  };
}

// Mobile drawer toggle
const menuToggleBtn = document.querySelector('#btnMenuToggle');
const sidebarPanel  = document.querySelector('#sidebarPanel');
const closeDrawerBtn = document.querySelector('#btnCloseDrawer');
const drawerBackdrop = document.querySelector('#drawerBackdrop');

const closeDrawer = () => {
  sidebarPanel?.classList.remove('drawer-open');
  drawerBackdrop?.classList.remove('visible');
};

menuToggleBtn?.addEventListener('click', () => {
  const isOpen = sidebarPanel?.classList.toggle('drawer-open');
  drawerBackdrop?.classList.toggle('visible', Boolean(isOpen));
});
closeDrawerBtn?.addEventListener('click', () => {
  closeDrawer();
});
drawerBackdrop?.addEventListener('click', closeDrawer);

// Mobile on-screen touch D-Pad
document.querySelectorAll('[data-mobile-key]').forEach(btn => {
  const k = btn.dataset.mobileKey;
  const press = e => {
    e.preventDefault();
    activeKeys.add(k);
    btn.setPointerCapture?.(e.pointerId);
  };
  const release = e => {
    e.preventDefault();
    activeKeys.delete(k);
    if (btn.hasPointerCapture?.(e.pointerId)) btn.releasePointerCapture(e.pointerId);
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('lostpointercapture', () => activeKeys.delete(k));
});

// ─────────────────────── HIGH-RES A4 ARCHITECTURAL SVG GENERATOR ──────────────
function generateA4SvgString() {
  const W = 1188, H = 840, S = 14.5, OX = 180, OY = 140;
  const X = x => OX + x * S, Y = z => OY + z * S;
  const isEnsuite = (state.layoutMode === 'ensuite');

  let svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 ${W} ${H}">
  <defs>
    <marker id="tick" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <line x1="1" y1="7" x2="7" y2="1" stroke="#263a38" stroke-width="1.6"/>
    </marker>
    <pattern id="gridPattern" width="${S}" height="${S}" patternUnits="userSpaceOnUse">
      <path d="M${S} 0H0V${S}" fill="none" stroke="#e8efeb" stroke-width="0.35"/>
    </pattern>
  </defs>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; fill: #111e1c; }
    .sheet-border { fill: #ffffff; stroke: #121e1d; stroke-width: 2.2; }
    .drawing-grid { fill: url(#gridPattern); stroke: #2a3d3a; stroke-width: 1.2; }
    .wall-heavy { stroke: #101c1a; stroke-width: 6.5; stroke-linecap: square; stroke-linejoin: miter; fill: none; }
    .wall-part { stroke: #101c1a; stroke-width: 4.2; stroke-linecap: square; stroke-linejoin: miter; fill: none; }
    .opening-blank { stroke: #ffffff; stroke-width: 8; fill: none; }
    .window-line { stroke: #2b8b93; stroke-width: 3.2; fill: none; }
    .door-leaf { stroke: #9e5b29; stroke-width: 2.0; fill: none; }
    .door-swing { stroke: #9e5b29; stroke-width: 1.2; stroke-dasharray: 3,3; fill: none; }
    .joinery-line { stroke: #8a5534; stroke-width: 2.5; stroke-dasharray: 4,4; fill: none; }
    .dim-line { stroke: #3b5350; stroke-width: 1.0; fill: none; }
    .dim-label { font-size: 9.5px; font-weight: 700; fill: #1f3532; }
    .room-title { font-size: 9px; font-weight: 800; letter-spacing: 0.6px; fill: #0f1c1a; }
    .room-area { font-size: 8.5px; font-weight: 600; fill: #526864; }
    .title-hdr { font-size: 20px; font-weight: 800; letter-spacing: 1.2px; fill: #0f1c1a; }
    .title-sub { font-size: 9.5px; font-weight: 500; fill: #5b6f6b; letter-spacing: 0.8px; }
  </style>

  <!-- Sheet Border -->
  <rect class="sheet-border" x="18" y="18" width="${W - 36}" height="${H - 36}"/>
  <rect class="drawing-grid" x="${OX - 25}" y="${OY - 25}" width="${35 * S + 50}" height="${42 * S + 50}"/>

  <!-- Main Sheet Heading -->
  <text class="title-hdr" x="50" y="58">THE RESIDENCE — MEASURED GROUND FLOOR PLAN</text>
  <text class="title-sub" x="50" y="76">ALIGNED STRICTLY WITH CLIENT SKETCH · ALL DIMENSIONS IN FEET · CONFIG: ${isEnsuite ? 'MASTER ENSUITE (PRIVATE BATH)' : '3 STANDARD BEDROOMS (2 PUBLIC BATHS)'}</text>
`;

  function drawWall(x1, z1, x2, z2, cls = 'wall-heavy') {
    svg += `<line class="${cls}" x1="${X(x1)}" y1="${Y(z1)}" x2="${X(x2)}" y2="${Y(z2)}"/>`;
  }
  function drawWin(x1, z1, x2, z2) {
    svg += `<line class="opening-blank" x1="${X(x1)}" y1="${Y(z1)}" x2="${X(x2)}" y2="${Y(z2)}"/>`;
    svg += `<line class="window-line" x1="${X(x1)}" y1="${Y(z1)}" x2="${X(x2)}" y2="${Y(z2)}"/>`;
  }
  function drawDoor(px, pz, width, type = 'swing-x') {
    svg += `<line class="opening-blank" x1="${X(px)}" y1="${Y(pz)}" x2="${X(px + (type==='swing-x'?width:0))}" y2="${Y(pz + (type==='swing-z'?width:0))}"/>`;
    svg += `<circle cx="${X(px)}" cy="${Y(pz)}" r="2.5" fill="#9e5b29"/>`;
  }

  // 1. Exterior Walls
  // North (x: 0 -> 29, z: 0)
  drawWall(FP.xW, FP.zN, FP.xE, FP.zN);
  drawWin(3.75, FP.zN, 8.25, FP.zN);   // Master North Win (12)
  drawWin(13.25, FP.zN, 15.75, FP.zN); // Hallway Vent (5)
  drawWin(20.75, FP.zN, 25.25, FP.zN); // Bed 02 North Win (12)

  // East Bedrooms (x: 29, z: 0 -> 24)
  drawWall(FP.xE, FP.zN, FP.xE, FP.zB3);
  drawWin(FP.xE, 3.75, FP.xE, 8.25);   // Bed 02 East Win (12)
  drawWin(FP.xE, 15.75, FP.xE, 20.25); // Bed 03 East Win (12)

  // East Living Room (x: 29, z: 24 -> 42)
  drawWall(FP.xE, FP.zB3, FP.xE, FP.zS);
  drawWin(FP.xE, 36.25, FP.xE, 40.75); // Living East Win (18)
  drawDoor(FP.xE, 30.5, 3.5, 'swing-z'); // Front Entrance Door from Veranda

  // South Walls (z: 42)
  drawWall(FP.xW, FP.zS, FP.xE, FP.zS);
  drawWin(3.5, FP.zS, 8.5, FP.zS);     // Dining South Win (12)
  drawWin(17.0, FP.zS, 24.0, FP.zS);   // Living South Panoramic Win (17)

  // West Walls
  drawWall(FP.xW, FP.zN, FP.xW, FP.zMB); // Master West (14 ft)
  drawWin(FP.xW, 4.75, FP.xW, 9.25);      // Master BR West Window
  drawWall(FP.xWC, FP.zMB, FP.xWC, FP.zWC); // Baths West (5+5)
  drawWin(FP.xWC, FP.zMB + 1.5, FP.xWC, FP.zMB + 3.5); // Ensuite window
  drawWin(FP.xWC, FP.zEN + 1.5, FP.xWC, FP.zEN + 3.5); // Common bath window
  drawWall(FP.xW, FP.zMB, FP.xWC, FP.zMB);
  drawWall(FP.xW, FP.zWC, FP.xWC, FP.zWC);
  drawWall(FP.xW, FP.zWC, FP.xW, FP.zS); // Kitchen & Dining West
  drawWin(FP.xW, FP.zWC + 1.5, FP.xW, FP.zWC + 5.0);  // Kitchen West Window
  drawDoor(FP.xW, FP.zWC + 5.5, 2.8, 'swing-z');        // Kitchen Yard Door (z=24+6.5=30.5)
  drawWin(FP.xW, FP.zK + 2.5, FP.xW, FP.zK + 6.5);    // Dining West Window

  // 2. Interior Partitions
  drawWall(FP.xB, FP.zB2, FP.xE, FP.zB2, 'wall-part'); // Bed 02-03 divider
  drawWall(FP.xB, FP.zB3, FP.xE, FP.zB3, 'wall-part'); // Bed 03-Living divider
  drawWall(FP.xB, FP.zN, FP.xB, FP.zB3, 'wall-part');   // Corridor East
  drawDoor(FP.xB, 4.5, 3.0, 'swing-z');                  // Bed 02 door (z=6)
  drawDoor(FP.xB, 16.5, 3.0, 'swing-z');                 // Bed 03 door (z=18)

  drawWall(FP.xWC, FP.zEN, FP.xM, FP.zEN, 'wall-part'); // Divider between two washrooms
  drawWall(FP.xW, FP.zWC, FP.xM, FP.zWC, 'wall-part');  // Divider between washroom and kitchen

  drawWall(FP.xM, FP.zN, FP.xM, FP.zMB, 'wall-part');  // Corridor West to Master BR
  drawDoor(FP.xM, 10.0, 3.0, 'swing-z');                // Master BR Door (z=11.5)

  // DYNAMIC CONFIGURATION IN ARCHITECTURAL DRAWING
  if (isEnsuite) {
    // Ensuite: Door from Master BR, solid hallway
    drawWall(FP.xW, FP.zMB, FP.xM, FP.zMB, 'wall-part');
    drawDoor(7.0, FP.zMB, 2.8, 'swing-x'); // Private door into ensuite
    drawWall(FP.xM, FP.zMB, FP.xM, FP.zEN, 'wall-part'); // Solid hallway wall
    drawWall(FP.xM, FP.zEN, FP.xM, FP.zWC, 'wall-part');
    drawDoor(FP.xM, FP.zEN + 2.0, 2.8, 'swing-z'); // Common bath door
  } else {
    // Public: Solid wall to bedroom, door to hallway
    drawWall(FP.xW, FP.zMB, FP.xM, FP.zMB, 'wall-part'); // Solid wall
    drawWall(FP.xM, FP.zMB, FP.xM, FP.zEN, 'wall-part');
    drawDoor(FP.xM, FP.zMB + 1.5, 2.8, 'swing-z'); // Public bath 1 door
    drawWall(FP.xM, FP.zEN, FP.xM, FP.zWC, 'wall-part');
    drawDoor(FP.xM, FP.zEN + 2.0, 2.8, 'swing-z'); // Public bath 2 door
  }

  // Enclosed Kitchen East Wall (Solid)
  drawWall(FP.xM, FP.zWC, FP.xM, FP.zK, 'wall-part');

  // Kitchen - Dining Partition Wall with Dining Doorway
  drawWall(FP.xW, FP.zK, FP.xM, FP.zK, 'wall-part');
  drawDoor(3.0, FP.zK, 3.0, 'swing-x'); // Kitchen entrance via Dining Room!

  // KITCHEN WOODEN CABINET SEPARATION (Dotted line from sketch)
  svg += `<line class="joinery-line" x1="${X(FP.xKStore)}" y1="${Y(FP.zWC + 0.3)}" x2="${X(FP.xKStore)}" y2="${Y(FP.zK - 0.3)}"/>`;
  svg += `<text font-size="7.5" fill="#8a5534" font-weight="700" transform="rotate(-90 ${X(FP.xKStore) - 6} ${Y(28.5)})" x="${X(FP.xKStore) - 6}" y="${Y(28.5)}">WOODEN JOINERY</text>`;

  // Veranda
  drawWall(FP.xE, FP.zS, FP.xV, FP.zS, 'wall-part');
  drawWall(FP.xV, FP.zB3, FP.xV, FP.zS, 'wall-part');
  drawWall(FP.xE, FP.zB3, FP.xV, FP.zB3, 'wall-part');

  // Room Labels (with special positioning for kitchen/store to avoid overlap)
  roomsData.forEach(r => {
    let rName = r.name;
    if (r.id === 'master') rName = isEnsuite ? 'MASTER BEDROOM' : 'BEDROOM 01';
    else if (r.id === 'ensuite') rName = isEnsuite ? 'MASTER ENSUITE' : 'PUBLIC WASHROOM 01';
    else if (r.id === 'common') rName = isEnsuite ? 'COMMON WASHROOM' : 'PUBLIC WASHROOM 02';

    // Kitchen and Store labels need precise positioning to avoid overlap
    if (r.id === 'kitchen') {
      const kx = X(4.0), ky = Y(29.0);
      svg += `<text class="room-title" text-anchor="middle" font-size="8" x="${kx}" y="${ky}">KITCHEN / JIKO</text>`;
      svg += `<text class="room-area" text-anchor="middle" font-size="7.5" x="${kx}" y="${ky + 11}">${r.dims} (${r.sqft} sqft)</text>`;
    } else if (r.id === 'store') {
      const sx = X(10.0), sy = Y(32.0);
      svg += `<text class="room-title" text-anchor="middle" font-size="8" x="${sx}" y="${sy}">PANTRY STORE</text>`;
      svg += `<text class="room-area" text-anchor="middle" font-size="7.5" x="${sx}" y="${sy + 11}">${r.dims} (${r.sqft} sqft)</text>`;
    } else {
      svg += `<text class="room-title" text-anchor="middle" x="${X(r.cx)}" y="${Y(r.cz)}">${rName.toUpperCase()}</text>`;
      svg += `<text class="room-area" text-anchor="middle" x="${X(r.cx)}" y="${Y(r.cz) + 12}">${r.dims} (${r.sqft} sqft)</text>`;
    }
  });

  // Dimension Chains with Ticks (Strictly matching sketch)
  // North Chain: 12 | 5 | 12 (Overall 29 ft)
  const ny = Y(FP.zN) - 30;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${X(0)}" y1="${ny}" x2="${X(12)}" y2="${ny}"/><text class="dim-label" text-anchor="middle" x="${X(6)}" y="${ny - 5}">12'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${X(12)}" y1="${ny}" x2="${X(17)}" y2="${ny}"/><text class="dim-label" text-anchor="middle" x="${X(14.5)}" y="${ny - 5}">5'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${X(17)}" y1="${ny}" x2="${X(29)}" y2="${ny}"/><text class="dim-label" text-anchor="middle" x="${X(23)}" y="${ny - 5}">12'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${X(0)}" y1="${ny - 20}" x2="${X(29)}" y2="${ny - 20}"/><text class="dim-label" text-anchor="middle" x="${X(14.5)}" y="${ny - 25}">29'-0" OVERALL</text>`;

  // South Chain: 12 | 17 | 6 (Overall 35 ft)
  const sy = Y(FP.zS) + 24;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${X(0)}" y1="${sy}" x2="${X(12)}" y2="${sy}"/><text class="dim-label" text-anchor="middle" x="${X(6)}" y="${sy + 13}">12'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${X(12)}" y1="${sy}" x2="${X(29)}" y2="${sy}"/><text class="dim-label" text-anchor="middle" x="${X(20.5)}" y="${sy + 13}">17'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${X(29)}" y1="${sy}" x2="${X(35)}" y2="${sy}"/><text class="dim-label" text-anchor="middle" x="${X(32)}" y="${sy + 13}">6'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${X(0)}" y1="${sy + 24}" x2="${X(35)}" y2="${sy + 24}"/><text class="dim-label" text-anchor="middle" x="${X(17.5)}" y="${sy + 37}">35'-0" OVERALL</text>`;

  // Left (West) Chain: 14 | 5 | 5 | 9 | 9 (Overall 42 ft) — strictly matching sketch numbers
  const wx = X(FP.xW) - 28;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${wx}" y1="${Y(0)}" x2="${wx}" y2="${Y(14)}"/><text class="dim-label" text-anchor="middle" transform="rotate(-90 ${wx - 12} ${Y(7)})" x="${wx - 12}" y="${Y(7)}">14'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${wx}" y1="${Y(14)}" x2="${wx}" y2="${Y(19)}"/><text class="dim-label" text-anchor="middle" transform="rotate(-90 ${wx - 12} ${Y(16.5)})" x="${wx - 12}" y="${Y(16.5)}">5'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${wx}" y1="${Y(19)}" x2="${wx}" y2="${Y(24)}"/><text class="dim-label" text-anchor="middle" transform="rotate(-90 ${wx - 12} ${Y(21.5)})" x="${wx - 12}" y="${Y(21.5)}">5'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${wx}" y1="${Y(24)}" x2="${wx}" y2="${Y(33)}"/><text class="dim-label" text-anchor="middle" transform="rotate(-90 ${wx - 12} ${Y(28.5)})" x="${wx - 12}" y="${Y(28.5)}">9'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${wx}" y1="${Y(33)}" x2="${wx}" y2="${Y(42)}"/><text class="dim-label" text-anchor="middle" transform="rotate(-90 ${wx - 12} ${Y(37.5)})" x="${wx - 12}" y="${Y(37.5)}">9'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${wx - 22}" y1="${Y(0)}" x2="${wx - 22}" y2="${Y(42)}"/><text class="dim-label" text-anchor="middle" transform="rotate(-90 ${wx - 36} ${Y(21)})" x="${wx - 36}" y="${Y(21)}">42'-0" OVERALL</text>`;

  // Right (East) Chain: 12 | 12 | 18 (Overall 42 ft)
  const ex = X(FP.xV) + 18;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${ex}" y1="${Y(0)}" x2="${ex}" y2="${Y(12)}"/><text class="dim-label" text-anchor="middle" transform="rotate(90 ${ex+12} ${Y(6)})" x="${ex+12}" y="${Y(6)}">12'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${ex}" y1="${Y(12)}" x2="${ex}" y2="${Y(24)}"/><text class="dim-label" text-anchor="middle" transform="rotate(90 ${ex+12} ${Y(18)})" x="${ex+12}" y="${Y(18)}">12'-0"</text>`;
  svg += `<line marker-start="url(#tick)" marker-end="url(#tick)" class="dim-line" x1="${ex}" y1="${Y(24)}" x2="${ex}" y2="${Y(42)}"/><text class="dim-label" text-anchor="middle" transform="rotate(90 ${ex+12} ${Y(33)})" x="${ex+12}" y="${Y(33)}">18'-0"</text>`;

  // Title Block
  svg += `
  <g transform="translate(770, 600)">
    <rect width="380" height="195" fill="#ffffff" stroke="#121e1d" stroke-width="1.4"/>
    <line x1="0" y1="46" x2="380" y2="46" stroke="#121e1d" stroke-width="1"/>
    <line x1="0" y1="92" x2="380" y2="92" stroke="#121e1d" stroke-width="1"/>
    <line x1="0" y1="138" x2="380" y2="138" stroke="#121e1d" stroke-width="1"/>
    <line x1="240" y1="0" x2="240" y2="195" stroke="#121e1d" stroke-width="1"/>

    <text class="title-sub" x="14" y="20">PROJECT</text>
    <text class="room-title" x="14" y="38">THE RESIDENCE DIGITAL TWIN</text>
    <text class="title-sub" x="252" y="20">DWG NO.</text>
    <text class="room-title" x="252" y="38">ARC-001</text>

    <text class="title-sub" x="14" y="66">DRAWING TITLE</text>
    <text class="room-title" x="14" y="84">Ground Floor Architectural Plan</text>
    <text class="title-sub" x="252" y="66">SCALE</text>
    <text class="room-title" x="252" y="84">1 : 100 @ A4</text>

    <text class="title-sub" x="14" y="112">CONFIG STATUS</text>
    <text class="room-title" font-size="10" x="14" y="128">${isEnsuite ? 'MASTER ENSUITE (PRIVATE BATH)' : '3 BEDROOMS + 2 PUBLIC BATHS'}</text>
    <text class="title-sub" x="252" y="112">TOTAL AREA</text>
    <text class="room-title" x="252" y="128">1,249 SQ FT</text>

    <text class="title-sub" x="14" y="158">SOURCE REFERENCE</text>
    <text class="room-title" font-size="10" x="14" y="174">Client Hand-Drawn Sketch (Exact)</text>
    <text class="title-sub" x="252" y="158">DATE</text>
    <text class="room-title" x="252" y="174">${new Date().toISOString().slice(0,10)}</text>
  </g>

  <!-- North Compass Rose -->
  <g transform="translate(1080, 130)">
    <circle cx="0" cy="0" r="24" fill="#ffffff" stroke="#121e1d" stroke-width="1.4"/>
    <path d="M0 -19 L7 12 L0 6 L-7 12 Z" fill="#121e1d"/>
    <text x="0" y="-27" text-anchor="middle" font-size="12" font-weight="900">N</text>
  </g>

  <!-- Graphic Scale Bar -->
  <g transform="translate(770, 565)">
    <rect x="0" y="0" width="30" height="4" fill="#121e1d"/>
    <rect x="30" y="0" width="30" height="4" fill="#ffffff" stroke="#121e1d" stroke-width="0.5"/>
    <rect x="60" y="0" width="60" height="4" fill="#121e1d"/>
    <text font-size="8" x="0" y="-3">0</text>
    <text font-size="8" x="30" y="-3">5</text>
    <text font-size="8" x="60" y="-3">10</text>
    <text font-size="8" x="120" y="-3">20 FT</text>
  </g>

  <text class="title-sub" x="50" y="820">CONFIDENTIAL &amp; PROPRIETARY · ARCHITECTURAL RECORD DRAWING · FIELD VERIFY ALL STRUCTURAL ELEMENTS PRIOR TO CONSTRUCTION</text>
</svg>
`;
  return svg;
}

// Export SVG file download
function exportA4Plan() {
  const svg = generateA4SvgString();
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const cfgName = (state.layoutMode === 'ensuite') ? 'Master-Ensuite' : '3Bed-2PublicBaths';
  a.download = `The-Residence-Floor-Plan-${cfgName}-A4.svg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// In-app A4 Blueprint Preview Modal
function previewA4Plan() {
  const modal = document.querySelector('#blueprintModal');
  const container = document.querySelector('#blueprintContainer');
  if (!modal || !container) return;

  const svg = generateA4SvgString();
  container.innerHTML = svg;

  const sub = document.querySelector('#modalSubtitle');
  if (sub) {
    sub.textContent = `Scaled 1:100 · Vector High-Resolution Blueprint · ${state.layoutMode === 'ensuite' ? 'Master Ensuite Plan' : '3 Standard Beds / 2 Public Baths'}`;
  }

  modal.classList.remove('hidden');
}

// Connect Header & Modal Buttons
document.querySelector('#exportMap')?.addEventListener('click', exportA4Plan);
document.querySelector('#previewMap')?.addEventListener('click', previewA4Plan);
document.querySelector('#modalDownloadBtn')?.addEventListener('click', exportA4Plan);
document.querySelector('#modalCloseBtn')?.addEventListener('click', () => {
  document.querySelector('#blueprintModal')?.classList.add('hidden');
});
document.querySelector('#modalPrintBtn')?.addEventListener('click', () => {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(`<html><head><title>Print Floor Plan</title><style>@page{size:A4 landscape;margin:0}body{margin:0;display:flex;justify-content:center;align-items:center}svg{width:100vw;height:100vh}</style></head><body>${generateA4SvgString()}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  }
});

// ─────────────────────── ANIMATION & RENDER LOOP ──────────────────────────────
function handleResize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', handleResize);
handleResize();

let prevTime = performance.now();
function animate(currentTime) {
  requestAnimationFrame(animate);
  const dt = Math.min((currentTime - prevTime) / 1000, 0.05);
  prevTime = currentTime;

  updateWalk(dt);
  if (state.view !== 'walk') controls.update();

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
