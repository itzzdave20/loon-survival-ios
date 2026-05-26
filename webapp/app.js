const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const healthEl = document.getElementById("health");
const messageEl = document.getElementById("message");
const installBtn = document.getElementById("install");
const appBase = new URL(".", document.baseURI);

function asset(path) {
  return new URL(path, appBase).href;
}

const state = {
  map: [],
  objects: [],
  textures: {},
  player: { x: 1.5, y: 1.5, angle: 5.41, health: 100 },
  keys: new Set(),
  sticks: {
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 }
  },
  fire: false,
  lastFire: 0,
  deferredInstall: null,
  ready: false
};

const texturePaths = {
  wall2: asset("../resources/textures/wall/2.png"),
  wall3: asset("../resources/textures/wall/3.png"),
  wall5: asset("../resources/textures/wall/5.png"),
  sky: asset("../resources/textures/sky/cloudy_sky.png"),
  gun: asset("../resources/textures/controller/gun.png"),
  gunFire: asset("../resources/textures/controller/gun_firing.png"),
  npc: asset("../resources/sprites/npc/caco_demon/0.png"),
  flame: asset("../resources/sprites/animated_sprites/red_light/0.png")
};

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
    return [{ kind, id, x: Number(x), y: Number(y), alive: true, hit: 0 }];
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

    const img = obj.kind === "npc_sprite" ? state.textures.npc : state.textures.flame;
    const size = Math.min(height * 0.85, height / distance * (obj.kind === "npc_sprite" ? 0.9 : 0.42));
    const x = width / 2 + Math.tan(relative) * (width / fov) - size / 2;
    const y = horizon - size / 2;
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
  const img = now - state.lastFire < 120 ? state.textures.gunFire : state.textures.gun;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const gunW = Math.min(width * 0.34, 300);
  const gunH = gunW * (img.height / img.width);
  ctx.drawImage(img, width * 0.5 - gunW * 0.2, height - gunH - 4, gunW, gunH);
}

function drawMinimap() {
  const scale = 5;
  const pad = 14;
  ctx.globalAlpha = 0.74;
  ctx.fillStyle = "#050506";
  ctx.fillRect(pad, pad + 44, state.map[0].length * scale + 8, state.map.length * scale + 8);
  for (let y = 0; y < state.map.length; y += 1) {
    for (let x = 0; x < state.map[y].length; x += 1) {
      ctx.fillStyle = state.map[y][x] === "." ? "#222522" : "#d6d6cd";
      ctx.fillRect(pad + 4 + x * scale, pad + 48 + y * scale, scale - 1, scale - 1);
    }
  }
  ctx.fillStyle = "#d72828";
  ctx.fillRect(pad + 4 + state.player.x * scale - 2, pad + 48 + state.player.y * scale - 2, 4, 4);
  ctx.globalAlpha = 1;
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
      flashMessage("Hit");
    }
  }

  for (const obj of state.objects) {
    if (!obj.alive || obj.kind !== "npc_sprite") {
      continue;
    }
    const distance = Math.hypot(obj.x - state.player.x, obj.y - state.player.y);
    if (distance < 0.75 && now % 420 < 24) {
      state.player.health = Math.max(0, state.player.health - 1);
    }
  }
  healthEl.textContent = String(Math.round(state.player.health));
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
  document.getElementById("fire").addEventListener("pointerdown", () => state.fire = true);
  document.getElementById("fire").addEventListener("pointerup", () => state.fire = false);
  document.getElementById("fire").addEventListener("pointercancel", () => state.fire = false);
  setupStick("left-stick", "left");
  setupStick("right-stick", "right");

  const [mapText, objectText, images] = await Promise.all([
    loadText(asset("../resources/maps/arena_map.txt")),
    loadText(asset("../resources/objects/arena_objects.csv")),
    Promise.all(Object.entries(texturePaths).map(async ([key, src]) => [key, await loadImage(src)]))
  ]);

  state.map = parseMap(mapText);
  state.objects = parseObjects(objectText);
  state.textures = Object.fromEntries(images);
  state.ready = true;
  flashMessage("Move with left stick, look with right stick, fire with FIRE");

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
