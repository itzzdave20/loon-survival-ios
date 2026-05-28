const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const healthEl = document.getElementById("health");
const healthFillEl = document.getElementById("health-fill");
const killsEl = document.getElementById("kills");
const messageEl = document.getElementById("message");
const installBtn = document.getElementById("install");
const soundBtn = document.getElementById("sound");
const appBase = new URL(".", document.baseURI);
const resourceBase = appBase.pathname.endsWith("/webapp/") ? new URL("../", appBase) : appBase;

function asset(path) {
  return new URL(path, appBase).href;
}

function resource(path) {
  return new URL(path, resourceBase).href;
}

const state = {
  map: [],
  objects: [],
  textures: {},
  audio: {},
  player: { x: 17.5, y: 2.5, angle: 2.95, health: 100 },
  keys: new Set(),
  sticks: {
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 }
  },
  fire: false,
  lastFire: 0,
  lastHit: 0,
  damageFlash: 0,
  kills: 0,
  deferredInstall: null,
  audioUnlocked: false,
  justUnlockedAudio: false,
  soundEnabled: false,
  ready: false
};

const texturePaths = {
  wall2: resource("resources/textures/wall/2.png"),
  wall3: resource("resources/textures/wall/3.png"),
  wall5: resource("resources/textures/wall/5.png"),
  sky: resource("resources/textures/sky/cloudy_sky.png"),
  gun0: resource("scripts/resources/textures/shotgun/0.png"),
  gun1: resource("scripts/resources/textures/shotgun/1.png"),
  gun2: resource("scripts/resources/textures/shotgun/2.png"),
  gun3: resource("scripts/resources/textures/shotgun/3.png"),
  gun4: resource("scripts/resources/textures/shotgun/4.png"),
  gun5: resource("scripts/resources/textures/shotgun/5.png"),
  npc0: resource("scripts/resources/textures/npc_sprites/idle/0.png"),
  npc1: resource("scripts/resources/textures/npc_sprites/idle/1.png"),
  npc2: resource("scripts/resources/textures/npc_sprites/idle/2.png"),
  npc3: resource("scripts/resources/textures/npc_sprites/idle/3.png"),
  npc4: resource("scripts/resources/textures/npc_sprites/idle/4.png"),
  npc5: resource("scripts/resources/textures/npc_sprites/idle/5.png"),
  npc6: resource("scripts/resources/textures/npc_sprites/idle/6.png"),
  npc7: resource("scripts/resources/textures/npc_sprites/idle/7.png"),
  flame: resource("resources/sprites/animated_sprites/red_light/0.png")
};

const gunCrops = [
  { x: 0, y: 345, w: 836, h: 705 },
  { x: 0, y: 189, w: 836, h: 861 },
  { x: 0, y: 116, w: 837, h: 934 },
  { x: 166, y: 555, w: 609, h: 487 },
  { x: 168, y: 0, w: 661, h: 1042 },
  { x: 56, y: 8, w: 797, h: 1034 }
];

const audioPaths = {
  music: resource("scripts/resources/audio/theme.mp3"),
  shoot: resource("scripts/resources/audio/player_atk.wav"),
  npcShoot: resource("scripts/resources/audio/npc_atk.wav"),
  hit: resource("scripts/resources/audio/npc_hit.wav"),
  death: resource("scripts/resources/audio/npc_death.wav"),
  hurt: resource("scripts/resources/audio/player_hit.wav"),
  notice: resource("scripts/resources/audio/notification.wav")
};

function createAudio(src, options = {}) {
  const audio = new Audio(src);
  audio.preload = options.preload || "auto";
  audio.loop = Boolean(options.loop);
  audio.volume = options.volume ?? 0.6;
  return audio;
}

function setupAudio() {
  state.audio = {
    music: createAudio(audioPaths.music, { loop: true, volume: 0.28 }),
    shoot: createAudio(audioPaths.shoot, { volume: 0.64 }),
    npcShoot: createAudio(audioPaths.npcShoot, { volume: 0.36 }),
    hit: createAudio(audioPaths.hit, { volume: 0.48 }),
    death: createAudio(audioPaths.death, { volume: 0.56 }),
    hurt: createAudio(audioPaths.hurt, { volume: 0.6 }),
    notice: createAudio(audioPaths.notice, { volume: 0.34 })
  };
}

async function unlockAudio() {
  if (state.audioUnlocked) {
    return;
  }
  setupAudio();
  state.audioUnlocked = true;
  state.justUnlockedAudio = true;
  state.soundEnabled = true;
  soundBtn.textContent = "Sound On";
  window.setTimeout(() => {
    state.justUnlockedAudio = false;
  }, 250);
  try {
    await state.audio.notice.play();
    state.audio.notice.pause();
    state.audio.notice.currentTime = 0;
    await state.audio.music.play();
  } catch (error) {
    state.soundEnabled = false;
    soundBtn.textContent = "Sound";
  }
}

function playSound(name) {
  if (!state.soundEnabled || !state.audio[name]) {
    return;
  }
  const source = state.audio[name];
  const sound = source.cloneNode();
  sound.volume = source.volume;
  sound.play().catch(() => {});
}

async function toggleSound() {
  if (!state.audioUnlocked) {
    await unlockAudio();
    flashMessage(state.soundEnabled ? "Sound on" : "Tap again to enable sound");
    return;
  }
  if (state.justUnlockedAudio) {
    flashMessage("Sound on");
    return;
  }

  state.soundEnabled = !state.soundEnabled;
  soundBtn.textContent = state.soundEnabled ? "Sound On" : "Sound Off";
  if (state.soundEnabled) {
    state.audio.music.play().catch(() => {});
    playSound("notice");
    flashMessage("Sound on");
  } else {
    state.audio.music.pause();
    flashMessage("Sound off");
  }
}

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }
  return response.text();
}

function parseMap(text) {
  return text.trim().split(/\r?\n/).map(line => line.trim().split(""));
}

function parseObjects(text) {
  return text.trim().split(/\r?\n/).slice(1).flatMap(line => {
    if (!line || line.startsWith("#")) {
      return [];
    }
    const [kind, id, x, y] = line.split(",");
    return [{ kind, id, x: Number(x), y: Number(y), alive: true, hit: 0, lastShot: Math.random() * 1200 }];
  });
}

function isWall(x, y) {
  const row = state.map[Math.floor(y)];
  if (!row) {
    return true;
  }
  const cell = row[Math.floor(x)];
  return !cell || cell !== ".";
}

function hasLineOfSight(x1, y1, x2, y2) {
  const distance = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(2, Math.ceil(distance / 0.12));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (isWall(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) {
      return false;
    }
  }
  return true;
}

function wallTexture(cell) {
  if (cell === "5") {
    return state.textures.wall5;
  }
  if (cell === "3") {
    return state.textures.wall3;
  }
  return state.textures.wall2;
}

function castRay(angle) {
  const step = 0.025;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  let distance = 0;

  while (distance < 22) {
    const x = state.player.x + cos * distance;
    const y = state.player.y + sin * distance;
    const row = state.map[Math.floor(y)];
    const cell = row && row[Math.floor(x)];

    if (!cell || cell !== ".") {
      const hitX = x - Math.floor(x);
      const hitY = y - Math.floor(y);
      const edge = Math.min(hitX, 1 - hitX) < Math.min(hitY, 1 - hitY);
      const offset = edge ? hitY : hitX;
      return { distance, cell: cell || "2", offset };
    }
    distance += step;
  }

  return { distance: 22, cell: "2", offset: 0 };
}

function drawScene(now) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const horizon = height * 0.5;
  const fov = Math.PI / 3;
  const rays = Math.max(180, Math.floor(width / 3));
  const colWidth = width / rays + 1;

  ctx.fillStyle = "#15171c";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(state.textures.sky, 0, 0, width, horizon);

  const floorGradient = ctx.createLinearGradient(0, horizon, 0, height);
  floorGradient.addColorStop(0, "#3e3f3b");
  floorGradient.addColorStop(1, "#11110f");
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, horizon, width, height - horizon);

  const zBuffer = new Array(rays);
  for (let i = 0; i < rays; i += 1) {
    const angle = state.player.angle - fov / 2 + (i / rays) * fov;
    const hit = castRay(angle);
    const corrected = hit.distance * Math.cos(angle - state.player.angle);
    const wallHeight = Math.min(height * 1.5, height / Math.max(0.001, corrected));
    const top = horizon - wallHeight / 2;
    const tex = wallTexture(hit.cell);
    const sx = Math.floor(hit.offset * (tex.width - 1));
    const shade = Math.max(0.24, 1 - corrected / 14);

    ctx.globalAlpha = shade;
    ctx.drawImage(tex, sx, 0, 1, tex.height, i * colWidth, top, colWidth, wallHeight);
    ctx.globalAlpha = 1;
    zBuffer[i] = corrected;
  }

  drawSprites(zBuffer, rays, colWidth, fov, horizon);
  drawGun(now);
  drawMinimap();
  drawVignette(width, height);
  drawDamageFlash(width, height, now);
}

function drawSprites(zBuffer, rays, colWidth, fov, horizon) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const sorted = [...state.objects].filter(obj => obj.alive).sort((a, b) => {
    const da = (a.x - state.player.x) ** 2 + (a.y - state.player.y) ** 2;
    const db = (b.x - state.player.x) ** 2 + (b.y - state.player.y) ** 2;
    return db - da;
  });

  for (const obj of sorted) {
    const dx = obj.x - state.player.x;
    const dy = obj.y - state.player.y;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    let relative = angle - state.player.angle;
    while (relative > Math.PI) relative -= Math.PI * 2;
    while (relative < -Math.PI) relative += Math.PI * 2;
    if (Math.abs(relative) > fov * 0.62 || distance < 0.2) {
      continue;
    }

    const frame = Math.floor(performance.now() / 130 + obj.x + obj.y) % 8;
    const img = obj.kind === "npc_sprite" ? state.textures[`npc${frame}`] : state.textures.flame;
    const maxSize = obj.kind === "npc_sprite" ? height * 0.34 : height * 0.22;
    const scale = obj.kind === "npc_sprite" ? 0.55 : 0.28;
    const size = Math.min(maxSize, height / Math.max(distance, 1.25) * scale);
    const x = width / 2 + Math.tan(relative) * (width / fov) - size / 2;
    const y = horizon - size * 0.52;
    const startRay = Math.max(0, Math.floor(x / colWidth));
    const endRay = Math.min(rays - 1, Math.floor((x + size) / colWidth));
    const visible = zBuffer.slice(startRay, endRay + 1).some(depth => depth > distance - 0.3);

    if (visible) {
      ctx.globalAlpha = obj.hit > 0 ? 0.55 : Math.max(0.35, 1 - distance / 17);
      ctx.drawImage(img, x, y, size, size);
      ctx.globalAlpha = 1;
    }
  }
}

function drawGun(now) {
  const elapsed = now - state.lastFire;
  const frame = elapsed < 60 ? 1 : elapsed < 110 ? 2 : elapsed < 160 ? 3 : elapsed < 220 ? 4 : elapsed < 280 ? 5 : 0;
  const img = state.textures[`gun${frame}`] || state.textures.gun0;
  const crop = gunCrops[frame] || gunCrops[0];
  const width = window.innerWidth;
  const height = window.innerHeight;
  const recoil = elapsed < 180 ? Math.sin((elapsed / 180) * Math.PI) * 12 : 0;
  const compact = height < 520;
  const gunW = Math.min(width * 0.28, height * 0.52, compact ? 300 : 390);
  const gunH = gunW * (crop.h / crop.w);
  const x = width * 0.5 - gunW * 0.52;
  const y = height - gunH * (compact ? 0.86 : 0.9) + recoil;
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, x, y, gunW, gunH);
}

function drawMinimap() {
  const scale = window.innerHeight < 430 ? 2.2 : 3;
  const pad = 12;
  const top = window.innerHeight < 430 ? 50 : 56;
  const width = state.map[0].length * scale + 12;
  const height = state.map.length * scale + 12;
  ctx.globalAlpha = 0.54;
  ctx.fillStyle = "rgba(5, 5, 6, 0.7)";
  ctx.fillRect(pad, top, width, height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.strokeRect(pad + 0.5, top + 0.5, width - 1, height - 1);
  for (let y = 0; y < state.map.length; y += 1) {
    for (let x = 0; x < state.map[y].length; x += 1) {
      ctx.fillStyle = state.map[y][x] === "." ? "rgba(34, 37, 34, 0.9)" : "rgba(214, 214, 205, 0.86)";
      ctx.fillRect(pad + 6 + x * scale, top + 6 + y * scale, scale - 1, scale - 1);
    }
  }
  ctx.fillStyle = "#e5b44f";
  ctx.fillRect(pad + 6 + state.player.x * scale - 2, top + 6 + state.player.y * scale - 2, 4, 4);
  ctx.globalAlpha = 1;
}

function drawVignette(width, height) {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, height * 0.2, width / 2, height / 2, width * 0.75);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.42)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawDamageFlash(width, height, now) {
  const age = now - state.damageFlash;
  if (age > 220) {
    return;
  }
  ctx.globalAlpha = Math.max(0, 0.28 * (1 - age / 220));
  ctx.fillStyle = "#b51f1d";
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
}

function damagePlayer(amount, now, message) {
  state.lastHit = now;
  state.damageFlash = now;
  state.player.health = Math.max(0, state.player.health - amount);
  playSound("hurt");
  if (message) {
    flashMessage(message);
  }
}

function movePlayer(dt) {
  const left = state.sticks.left;
  const right = state.sticks.right;
  const forward = (state.keys.has("KeyW") || state.keys.has("ArrowUp") ? 1 : 0)
    - (state.keys.has("KeyS") || state.keys.has("ArrowDown") ? 1 : 0)
    - left.y;
  const strafe = (state.keys.has("KeyD") ? 1 : 0) - (state.keys.has("KeyA") ? 1 : 0) + left.x;
  const turn = (state.keys.has("ArrowRight") ? 1 : 0) - (state.keys.has("ArrowLeft") ? 1 : 0) + right.x;
  const speed = 2.25 * dt;
  const turnSpeed = 2.35 * dt;

  state.player.angle += turn * turnSpeed;

  const dx = Math.cos(state.player.angle) * forward * speed + Math.cos(state.player.angle + Math.PI / 2) * strafe * speed;
  const dy = Math.sin(state.player.angle) * forward * speed + Math.sin(state.player.angle + Math.PI / 2) * strafe * speed;

  if (!isWall(state.player.x + dx, state.player.y)) {
    state.player.x += dx;
  }
  if (!isWall(state.player.x, state.player.y + dy)) {
    state.player.y += dy;
  }
}

function updateCombat(now) {
  if (state.fire && now - state.lastFire > 260) {
    state.lastFire = now;
    playSound("shoot");
    const target = state.objects
      .filter(obj => obj.alive && obj.kind === "npc_sprite")
      .map(obj => {
        const angle = Math.atan2(obj.y - state.player.y, obj.x - state.player.x);
        let relative = angle - state.player.angle;
        while (relative > Math.PI) relative -= Math.PI * 2;
        while (relative < -Math.PI) relative += Math.PI * 2;
        return { obj, distance: Math.hypot(obj.x - state.player.x, obj.y - state.player.y), relative };
      })
      .filter(item => Math.abs(item.relative) < 0.16 && item.distance < 8)
      .sort((a, b) => a.distance - b.distance)[0];

    if (target) {
      target.obj.alive = false;
      state.kills += 1;
      killsEl.textContent = String(state.kills);
      playSound("hit");
      playSound("death");
      flashMessage("Target down");
    }
  }

  for (const obj of state.objects) {
    if (!obj.alive || obj.kind !== "npc_sprite") {
      continue;
    }
    const distance = Math.hypot(obj.x - state.player.x, obj.y - state.player.y);
    const canSeePlayer = distance < 9 && hasLineOfSight(obj.x, obj.y, state.player.x, state.player.y);
    if (canSeePlayer && now - obj.lastShot > 1500 + Math.random() * 650) {
      obj.lastShot = now;
      playSound("npcShoot");
      damagePlayer(distance < 4 ? 6 : 4, now, "Enemy fire");
    } else if (distance < 0.75 && now - state.lastHit > 420) {
      damagePlayer(2, now, "Enemy hit");
    }
  }
  healthEl.textContent = String(Math.round(state.player.health));
  healthFillEl.style.width = `${state.player.health}%`;
}

function flashMessage(text) {
  messageEl.textContent = text;
  window.clearTimeout(flashMessage.timer);
  flashMessage.timer = window.setTimeout(() => {
    messageEl.textContent = "Move with left stick, look with right stick, fire with FIRE";
  }, 900);
}

function loop(now) {
  const dt = Math.min(0.05, (now - (loop.last || now)) / 1000);
  loop.last = now;
  if (state.ready) {
    movePlayer(dt);
    updateCombat(now);
    drawScene(now);
  }
  requestAnimationFrame(loop);
}

function setupStick(id, side) {
  const el = document.getElementById(id);
  const knob = el.querySelector("span");
  let pointer = null;

  function reset() {
    pointer = null;
    state.sticks[side].x = 0;
    state.sticks[side].y = 0;
    knob.style.transform = "translate(0, 0)";
  }

  el.addEventListener("pointerdown", event => {
    pointer = event.pointerId;
    el.setPointerCapture(pointer);
  });

  el.addEventListener("pointermove", event => {
    if (event.pointerId !== pointer) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const radius = rect.width / 2;
    const x = (event.clientX - rect.left - radius) / radius;
    const y = (event.clientY - rect.top - radius) / radius;
    const length = Math.max(1, Math.hypot(x, y));
    state.sticks[side].x = x / length;
    state.sticks[side].y = y / length;
    knob.style.transform = `translate(${state.sticks[side].x * radius * 0.45}px, ${state.sticks[side].y * radius * 0.45}px)`;
  });

  el.addEventListener("pointerup", reset);
  el.addEventListener("pointercancel", reset);
}

async function init() {
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", event => state.keys.add(event.code));
  window.addEventListener("keyup", event => state.keys.delete(event.code));
  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
  document.getElementById("fire").addEventListener("pointerdown", () => state.fire = true);
  document.getElementById("fire").addEventListener("pointerup", () => state.fire = false);
  document.getElementById("fire").addEventListener("pointercancel", () => state.fire = false);
  soundBtn.addEventListener("click", toggleSound);
  setupStick("left-stick", "left");
  setupStick("right-stick", "right");

  const [mapText, objectText, images] = await Promise.all([
    loadText(resource("resources/maps/arena_map.txt")),
    loadText(resource("resources/objects/arena_objects.csv")),
    Promise.all(Object.entries(texturePaths).map(async ([key, src]) => [key, await loadImage(src)]))
  ]);

  state.map = parseMap(mapText);
  state.objects = parseObjects(objectText);
  state.textures = Object.fromEntries(images);
  state.ready = true;
  flashMessage("Tap Sound, then hunt. Left stick moves, right stick looks.");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
  }
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  state.deferredInstall = event;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!state.deferredInstall) {
    flashMessage("On iPhone, use Safari Share, then Add to Home Screen");
    return;
  }
  state.deferredInstall.prompt();
  await state.deferredInstall.userChoice;
  state.deferredInstall = null;
  installBtn.hidden = true;
});

init().catch(error => {
  console.error(error);
  messageEl.textContent = error.message;
});
requestAnimationFrame(loop);
