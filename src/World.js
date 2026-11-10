import { segmentRect } from "./Combat.js";
export class World {
  constructor(stage) {
    this.stage = stage;
    this.size = 4096;
    this.obstacles = [];
    this.lava = [];
    this.bridges = [];
    this.graves = [];
    this.graveClock = 18;
    this.rising = [];
    this.hazardClock = 0;
    this.flowClock = 0;
    this.flowCell = -1;
    this.geometryDirty = false;
    this.route = { x: 0, y: 0 };
    this.build();
    if (stage !== "forest") {
      let n = 256 * 256;
      this.flow = new Int32Array(n);
      this.flow.fill(-1);
      this.solid = new Uint8Array(n);
      this.queue = new Int32Array(n);
      this.bakeNavigation();
    }
  }
  add(kind, x, y, w, h, hp = Infinity) {
    const o = { kind, x, y, w, h, hp, maxHp: hp, active: true };
    this.obstacles.push(o);
    return o;
  }
  build() {
    if (this.stage === "forest") {
      for (let i = 0; i < 62; i++) {
        let x = 1180 + ((i * 317) % 1780),
          y = 1180 + ((i * 197) % 1780);
        if (Math.hypot(x - 2048, y - 2048) > 120)
          this.add(
            i % 4 ? "tree" : "rock",
            x,
            y,
            i % 4 ? 16 : 25,
            i % 4 ? 13 : 19,
          );
      }
    }
    if (this.stage === "dungeon" || this.stage === "base") {
      for (let x = 1376; x < 2944; x += 224)
        for (let y = 1376; y < 2944; y += 224) {
          this.add("wall", x, y, 72, 18);
          this.add("wall", x + 144, y, 80, 18);
          this.add("wall", x, y + 18, 18, 64);
          this.add("wall", x, y + 154, 18, 70);
          if (
            (((x + y) / 224) | 0) % 3 === 0 &&
            Math.hypot(x + 108 - 2048, y - 2048) > 130
          )
            this.add("door", x + 72, y, 72, 14, 120);
          if (this.stage === "dungeon")
            this.add("pillar", x + 48, y + 64, 22, 22);
          else this.add("crate", x + 140, y + 120, 24, 24, 85);
          if (
            this.stage === "base" &&
            Math.hypot(x + 108 - 2048, y + 92 - 2048) > 90
          )
            this.add("barrel", x + 108, y + 92, 14, 18, 22);
        }
    }
    if (this.stage === "graveyard") {
      for (let i = 0; i < 110; i++) {
        let x = 1180 + ((i * 173) % 1770),
          y = 1180 + ((i * 251) % 1770);
        if (Math.hypot(x - 2048, y - 2048) < 100) continue;
        this.graves.push({ x: x + 5, y: y + 24 });
        this.add("tomb", x, y, 14 + (i % 3) * 3, 12, 65);
      }
      for (let i = 0; i < 12; i++)
        this.add("rock", 1300 + i * 139, 1400 + ((i * 191) % 1400), 24, 18);
    }
    if (this.stage === "volcano") {
      for (let y of [1728, 2240, 2752]) {
        this.lava.push({ x: 0, y, w: 4096, h: 76 });
        for (let x = 80; x < 4096; x += 256)
          this.bridges.push({ x, y: y - 7, w: 48, h: 90 });
      }
      for (let i = 0; i < 22; i++) {
        let x = 1200 + ((i * 193) % 1800),
          y = 1100 + ((i * 349) % 1900);
        if (Math.hypot(x - 2048, y - 2048) > 110)
          this.add("basalt", x, y, 32, 24);
      }
      for (let x = 1376; x < 2800; x += 224) {
        this.add("wall", x, 1968, 80, 18);
        this.add("wall", x, 2480, 80, 18);
      }
    }
  }
  bakeNavigation() {
    if (!this.flow) return;
    this.solid.fill(0);
    for (let o of this.obstacles) {
      if (!o.active || o.kind === "door") continue;
      let x0 = Math.max(0, Math.floor((o.x - 10 - 8) / 16)),
        x1 = Math.min(255, Math.ceil((o.x + o.w + 10 - 8) / 16)),
        y0 = Math.max(0, Math.floor((o.y - 10 - 8) / 16)),
        y1 = Math.min(255, Math.ceil((o.y + o.h + 10 - 8) / 16));
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++)
          if (
            x * 16 + 18 > o.x &&
            x * 16 - 2 < o.x + o.w &&
            y * 16 + 18 > o.y &&
            y * 16 - 2 < o.y + o.h
          )
            this.solid[x + y * 256] = 1;
    }
    this.flowCell = -1;
    this.geometryDirty = false;
  }
  blocked(x, y, r = 0) {
    if (x < r || y < r || x > this.size - r || y > this.size - r) return true;
    for (let o of this.obstacles)
      if (
        o.active &&
        x + r > o.x &&
        x - r < o.x + o.w &&
        y + r > o.y &&
        y - r < o.y + o.h
      )
        return true;
    return false;
  }
  move(e, dx, dy) {
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 7),
    );
    for (let i = 0; i < steps; i++) {
      let x = e.x + dx / steps,
        y = e.y + dy / steps;
      if (!this.blocked(x, e.y, e.radius)) e.x = x;
      if (!this.blocked(e.x, y, e.radius)) e.y = y;
    }
    if (e.active && e.type)
      for (let o of this.obstacles)
        if (
          o.active &&
          o.kind === "door" &&
          Math.hypot(e.x - o.x - o.w / 2, e.y - o.y - o.h / 2) < 62
        ) {
          o.hp -= Math.hypot(dx, dy) * 2;
          if (o.hp <= 0) {
            o.active = false;
            this.geometryDirty = true;
          }
        }
  }
  safePoint(x, y, r = 10) {
    for (let i = 0; i < 80; i++) {
      let a = i * 2.4,
        d = i * 4,
        nx = Math.max(r, Math.min(4096 - r, x + Math.cos(a) * d)),
        ny = Math.max(r, Math.min(4096 - r, y + Math.sin(a) * d));
      if (!this.blocked(nx, ny, r) && !this.inLava(nx, ny))
        return { x: nx, y: ny };
    }
    return { x: 2048, y: 2112 };
  }
  inLava(x, y) {
    return (
      this.lava.some(
        (o) => x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h,
      ) &&
      !this.bridges.some(
        (o) => x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h,
      )
    );
  }
  interact(g) {
    const p = g.player,
      o = this.obstacles.find(
        (o) =>
          o.active &&
          o.kind === "door" &&
          Math.hypot(p.x - o.x - o.w / 2, p.y - o.y - o.h / 2) < 72,
      );
    if (!o) {
      g.toast("NO LOCKED DOOR NEARBY");
      return;
    }
    if (p.keys < 1) {
      g.toast("A KEY IS REQUIRED · FIND ONE IN DROPS OR CHESTS");
      return;
    }
    p.keys--;
    o.active = false;
    this.geometryDirty = true;
    g.toast("DOOR UNLOCKED");
    g.audio.effect("chest");
  }
  damageSegment(x0, y0, x1, y1, damage, g, r = 1, penetrate = false) {
    let hit = false;
    for (let o of this.obstacles) {
      if (!o.active || !segmentRect(x0, y0, x1, y1, o, r)) continue;
      hit = true;
      if (Number.isFinite(o.hp)) this.damageObject(o, damage, g);
      if (!penetrate) break;
    }
    return hit;
  }
  damageObject(o, damage, g) {
    if (!o.active || !Number.isFinite(o.hp)) return;
    o.hp -= damage;
    if (o.hp > 0) return;
    o.active = false;
    this.geometryDirty = true;
    if (o.kind === "barrel") {
      let x = o.x + o.w / 2,
        y = o.y + o.h / 2;
      g.fx.emit("explosion", x, y);
      g.fx.ring(x, y, 92, "#ffae59", 0.5);
      g.fx.shake = 6;
      g.audio.effect("explosion");
      g.enemies.hash.query(x, y, 120, (e) => {
        if (Math.hypot(e.x - x, e.y - y) < 92 + e.radius) g.enemies.hit(e, 150);
      });
      if (Math.hypot(g.player.x - x, g.player.y - y) < 92) g.player.hurt(24, g);
      for (let n of this.obstacles)
        if (
          n.active &&
          Number.isFinite(n.hp) &&
          Math.hypot(n.x - x, n.y - y) < 92
        )
          this.damageObject(n, 150, g);
    } else {
      g.fx.burst(o.x, o.y, "#a8aaa0", 8);
      if (o.kind === "tomb" && Math.random() < 0.18)
        g.pickups.drop(o.x, o.y, "key", 1);
    }
  }
  update(dt, g) {
    if (g.input.interact) {
      this.interact(g);
      g.input.interact = false;
    }
    this.hazardClock -= dt;
    if (this.hazardClock <= 0) {
      this.hazardClock = 0.5;
      if (this.inLava(g.player.x, g.player.y)) g.player.hurt(14, g);
      for (let e of g.enemies.pool)
        if (e.active && this.inLava(e.x, e.y)) g.enemies.hit(e, 18);
    }
    if (this.stage === "graveyard") {
      this.graveClock -= dt;
      if (this.graveClock <= 0 && !g.director?.suppressing) {
        this.graveClock += 18;
        let near = this.graves.filter(
          (o) => Math.hypot(o.x - g.player.x, o.y - g.player.y) < 350,
        );
        if (!near.length) near = this.graves;
        for (let i = 0; i < Math.min(6, 2 + Math.floor(g.time / 60)); i++) {
          let grave = near[((g.time * 3 + i * 17) | 0) % near.length];
          if (grave) {
            this.rising.push({ x: grave.x, y: grave.y, delay: 1 });
            g.fx.ring(grave.x, grave.y, 18, "#a8bed7", 1);
          }
        }
      }
      for (let i = this.rising.length - 1; i >= 0; i--)
        if ((this.rising[i].delay -= dt) <= 0) {
          let a = this.rising[i],
            p = this.safePoint(a.x, a.y, 8);
          g.enemies.spawn("normal", p.x, p.y);
          g.fx.emit("dissolve", p.x, p.y);
          this.rising.splice(i, 1);
        }
    }
  }
  updateFlow(player, dt) {
    if (!this.flow) return;
    if (this.geometryDirty) this.bakeNavigation();
    this.flowClock -= dt;
    let cell = Math.floor(player.x / 16) + Math.floor(player.y / 16) * 256;
    if (this.flowClock > 0 || cell === this.flowCell) return;
    this.flowClock = 0.3;
    this.flowCell = cell;
    this.flow.fill(-1);
    let first = 0,
      last = 0;
    this.queue[last++] = cell;
    this.flow[cell] = 0;
    while (first < last) {
      let k = this.queue[first++],
        x = k % 256,
        y = (k / 256) | 0;
      for (let dir = 0; dir < 4; dir++) {
        let j = k + (dir === 0 ? 1 : dir === 1 ? -1 : dir === 2 ? 256 : -256);
        if (
          (dir === 0 && x === 255) ||
          (dir === 1 && x === 0) ||
          (dir === 2 && y === 255) ||
          (dir === 3 && y === 0)
        )
          continue;
        if (!this.solid[j] && this.flow[j] === -1) {
          this.flow[j] = this.flow[k] + 1;
          this.queue[last++] = j;
        }
      }
    }
  }
  steer(e, player) {
    if (!this.flow) return null;
    let x = Math.floor(e.x / 16),
      y = Math.floor(e.y / 16),
      k = x + y * 256,
      best = this.flow[k],
      next = k;
    if (best < 0) return null;
    for (let dir = 0; dir < 4; dir++) {
      let j = k + (dir === 0 ? 1 : dir === 1 ? -1 : dir === 2 ? 256 : -256);
      if (
        j < 0 ||
        j >= this.flow.length ||
        (dir === 0 && x === 255) ||
        (dir === 1 && x === 0)
      )
        continue;
      if (this.flow[j] >= 0 && this.flow[j] < best) {
        best = this.flow[j];
        next = j;
      }
    }
    if (next === k) return null;
    this.route ??= { x: 0, y: 0 };
    this.route.x = (next % 256) * 16 + 8 - e.x;
    this.route.y = ((next / 256) | 0) * 16 + 8 - e.y;
    return this.route;
  }

  draw(ctx, cx, cy, w, h, time) {
    const stage = this.stage,
      indoor = stage === "dungeon" || stage === "base",
      colors = {
        forest: ["#1b2c20", "#29402a"],
        dungeon: ["#1b2024", "#343c3b"],
        graveyard: ["#222733", "#3b414c"],
        volcano: ["#2c2527", "#453638"],
        base: ["#1d2a2c", "#35474a"],
      },
      C = colors[stage] || colors.forest;
    ctx.fillStyle = C[0];
    ctx.fillRect(0, 0, w, h);
    for (let y = Math.floor(cy / 32); y < (cy + h) / 32; y++)
      for (let x = Math.floor(cx / 32); x < (cx + w) / 32; x++) {
        let n = Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1,
          sx = x * 32 - cx,
          sy = y * 32 - cy;
        ctx.fillStyle = C[1];
        if (indoor) {
          ctx.strokeStyle = C[1];
          ctx.strokeRect(sx, sy, 31, 31);
          if (n > 0.65) ctx.fillRect(sx + 5, sy + 7, 8, 2);
          if (stage === "base" && x % 7 === 0 && y % 5 === 0) {
            ctx.fillStyle = "#9d965d";
            ctx.fillRect(sx + 2, sy + 2, 28, 2);
          }
        } else {
          ctx.fillRect(
            sx + 4 + ((n * 15) | 0),
            sy + 8,
            2,
            stage === "forest" ? 3 : 1,
          );
          ctx.fillRect(sx + 19, sy + 24, 3, 1);
          if (stage === "graveyard" && n > 0.7) {
            ctx.fillStyle = "#48534d";
            ctx.fillRect(sx + 8, sy + 12, 1, 3);
          }
        }
      }
    for (let o of this.lava) {
      let y = o.y - cy;
      if (y > h || y + o.h < 0) continue;
      ctx.fillStyle = "#b34125";
      ctx.fillRect(0, y, w, o.h);
      for (let x = Math.floor(cx / 20) * 20; x < cx + w; x += 20) {
        ctx.fillStyle = Math.sin(time * 2 + x) > 0.1 ? "#ffb34f" : "#ed6a30";
        ctx.fillRect(x - cx, y + 8 + Math.sin(time + x) * 6, 12, 4);
        ctx.fillRect(x - cx + 6, y + 46 + Math.cos(time + x) * 6, 9, 3);
      }
    }
    for (let o of this.bridges) {
      let x = o.x - cx,
        y = o.y - cy;
      if (x > w || x + o.w < 0 || y > h || y + o.h < 0) continue;
      ctx.fillStyle = "#625c55";
      ctx.fillRect(x, y, o.w, o.h);
      ctx.fillStyle = "#9a8b6b";
      ctx.fillRect(x, y, 3, o.h);
      ctx.fillRect(x + o.w - 3, y, 3, o.h);
      ctx.strokeStyle = "#403b38";
      for (let v = 0; v < o.h; v += 12)
        ctx.strokeRect(x + 4, y + v, o.w - 8, 11);
    }
    if (stage === "graveyard")
      for (let o of this.graves) {
        let x = o.x - cx,
          y = o.y - cy;
        if (x < -30 || y < -30 || x > w + 30 || y > h + 30) continue;
        ctx.fillStyle = "#141b26";
        ctx.fillRect(x - 9, y, 24, 12);
        ctx.strokeStyle = "#44513e";
        ctx.strokeRect(x - 9, y, 24, 12);
      }
    for (let o of this.obstacles) {
      if (!o.active) continue;
      let x = o.x - cx,
        y = o.y - cy;
      if (x < -90 || y < -90 || x > w + 60 || y > h + 60) continue;
      ctx.fillStyle = "#080f1688";
      ctx.fillRect(x + 4, y + 7, o.w + 5, o.h + 4);
      if (o.kind === "tree") {
        ctx.fillStyle = "#544633";
        ctx.fillRect(x + 4, y - 6, 7, 23);
        ctx.fillStyle = "#14291a";
        ctx.fillRect(x - 12, y - 31, 42, 27);
        ctx.fillStyle = "#355333";
        ctx.fillRect(x - 8, y - 39, 33, 23);
        ctx.fillStyle = "#496540";
        ctx.fillRect(x - 2, y - 44, 21, 11);
      } else if (o.kind === "tomb") {
        ctx.fillStyle = "#6b747d";
        ctx.fillRect(x, y - 17, o.w, o.h + 17);
        ctx.fillRect(x + 3, y - 21, o.w - 6, 4);
        ctx.fillStyle = "#adb4b3";
        ctx.fillRect(x + 4, y - 14, 2, 10);
        ctx.fillRect(x + 1, y - 12, 8, 2);
        ctx.fillStyle = "#3f4b52";
        ctx.fillRect(x + 4, y + 1, o.w - 8, 2);
      } else if (o.kind === "barrel") {
        ctx.fillStyle = "#7a4f30";
        ctx.fillRect(x, y - 8, o.w, o.h + 8);
        ctx.fillStyle = "#dec664";
        ctx.fillRect(x, y - 1, o.w, 8);
        ctx.fillStyle = "#292c29";
        ctx.fillRect(x + 5, y, 4, 5);
        ctx.fillStyle = "#b6804a";
        ctx.fillRect(x, y - 8, o.w, 3);
      } else if (o.kind === "door") {
        ctx.fillStyle = "#71583b";
        ctx.fillRect(x, y - 8, o.w, o.h + 8);
        ctx.fillStyle = "#bea767";
        ctx.fillRect(x, y - 5, o.w, 3);
        ctx.fillRect(x + o.w / 2 - 3, y - 4, 6, 9);
        ctx.fillStyle = "#242322";
        ctx.fillRect(x + o.w / 2 - 1, y - 1, 2, 4);
      } else {
        ctx.fillStyle =
          o.kind === "crate"
            ? "#6e6b48"
            : o.kind === "rock" || o.kind === "basalt"
              ? "#5a5d59"
              : stage === "base"
                ? "#52676a"
                : "#53605d";
        ctx.fillRect(x, y - 8, o.w, o.h + 8);
        ctx.fillStyle = stage === "volcano" ? "#96715a" : "#839082";
        ctx.fillRect(x, y - 8, o.w, 3);
        ctx.strokeStyle = "#293431";
        for (let j = 0; j < o.w; j += 20)
          ctx.strokeRect(x + j, y - 5, Math.min(19, o.w - j), o.h + 4);
        if (o.kind === "crate") {
          ctx.strokeStyle = "#aaa16b";
          ctx.beginPath();
          ctx.moveTo(x + 3, y - 4);
          ctx.lineTo(x + o.w - 3, y + o.h - 3);
          ctx.stroke();
        }
      }
      if (Number.isFinite(o.hp) && o.hp < o.maxHp) {
        ctx.fillStyle = "#191b22";
        ctx.fillRect(x, y - 25, o.w, 2);
        ctx.fillStyle = "#d9bf82";
        ctx.fillRect(x, y - 25, (o.w * o.hp) / o.maxHp, 2);
      }
    }
  }
  drawAtmosphere(ctx, cx, cy, w, h, time) {
    if (this.stage === "graveyard") {
      for (let i = 0; i < 7; i++) {
        let y = (i * 87 + time * 3 - cy * 0.2) % h;
        ctx.fillStyle = "#b9c5db0c";
        ctx.fillRect(0, (y + h) % h, w, 32);
        ctx.fillRect(0, (y + h + 14) % h, w, 18);
      }
    }
    if (this.stage === "volcano")
      for (let i = 0; i < 24; i++) {
        let x = (i * 73 + Math.sin(time + i) * 9 - cx * 0.2) % w,
          y = (i * 41 - time * 13 - cy * 0.1) % h;
        ctx.fillStyle = "#ffa464aa";
        ctx.fillRect((x + w) % w, (y + h) % h, 1, 2);
      }
    if (this.stage === "forest")
      for (let i = 0; i < 20; i++) {
        let x = (i * 151 + Math.sin(time * 0.3 + i) * 18 - cx * 0.1) % w,
          y = (i * 79 + Math.cos(time * 0.2 + i) * 12 - cy * 0.1) % h;
        ctx.fillStyle =
          "rgba(195,217,128," + (0.25 + 0.25 * Math.sin(time * 2 + i)) + ")";
        ctx.fillRect((x + w) % w, (y + h) % h, 1, 1);
      }
  }
}
