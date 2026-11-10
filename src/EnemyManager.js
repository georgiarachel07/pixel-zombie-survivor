import { SpatialHash } from "./SpatialHash.js";
import { BOSS_SCHEDULE } from "./data.js";
import { drawSprite } from "./Sprites.js";
const COLORS = {
  panzer: "#9b9d89",
  margwa: "#a77a88",
  george: "#8aacc5",
  thief: "#b291cf",
  megaton: "#bedb62",
  bomber: "#acc15c",
  blaster: "#8dd38c",
};
export class EnemyManager {
  constructor(game, capacity = 1800) {
    this.game = game;
    this.pool = Array.from({ length: capacity }, (_, id) => ({
      id,
      active: false,
      hit: 0,
      stamp: 0,
    }));
    this.hash = new SpatialHash(capacity);
    this.count = 0;
    this.spawnClock = 0;
    this.schedule = 0;
    this.projectiles = Array.from({ length: 200 }, () => ({ active: false }));
  }
  spawn(type = "normal", x, y) {
    let e = this.pool.find((e) => !e.active);
    if (!e && type !== "normal") {
      e = this.pool.find((e) => e.active && !e.boss && !e.half);
      if (e) this.remove(e);
    }
    if (!e) return null;
    const g = this.game,
      p = g.player,
      t = g.time * g.mode.pace;
    let boss = type !== "normal",
      half = type === "bomber" || type === "blaster";
    if (x === undefined) {
      let a = Math.random() * Math.PI * 2,
        d =
          Math.hypot(g.canvas?.width || 640, g.canvas?.height || 360) * 0.55 +
          Math.random() * 60;
      x = p.x + Math.cos(a) * d;
      y = p.y + Math.sin(a) * d;
      for (let i = 0; i < 20 && g.world.blocked(x, y, boss ? 16 : 8); i++) {
        a += 0.6;
        x = p.x + Math.cos(a) * d;
        y = p.y + Math.sin(a) * d;
      }
    }
    x = Math.max(25, Math.min(4070, x));
    y = Math.max(25, Math.min(4070, y));
    Object.assign(e, {
      active: true,
      x,
      y,
      type,
      boss: boss && !half,
      half,
      radius: boss ? (half ? 12 : 19) : 8,
      maxHp: boss
        ? half
          ? 280
          : ({
              panzer: 900,
              margwa: 1500,
              george: 3800,
              thief: 650,
              megaton: 1800,
            }[type] || 500) *
            (1 + t / 1000) *
            (g.world.stage === "dungeon" ? 1.2 : 1)
        : 23 + t * 0.07,
      speed: boss
        ? {
            panzer: 36,
            margwa: 39,
            george: 25,
            thief: 102,
            megaton: 30,
            bomber: 64,
            blaster: 57,
          }[type] || 35
        : 24 + Math.random() * 12 + Math.min(25, t * 0.025),
      hit: 0,
      age: 0,
      cool: 2,
      phase: 0,
      heads: 3,
      headHp: 0,
      enrage: 0,
      stolen: false,
      escape: 0,
      damage: boss ? 24 : 9,
      armor: type === "panzer" ? 8 : 0,
      color: COLORS[type] || ["#718e65", "#8e9867", "#77967d"][e.id % 3],
      stamp: 0,
    });
    e.hp = e.maxHp;
    e.headHp = e.maxHp / 3;
    this.count++;
    if (e.boss) {
      g.toast(
        BOSS_SCHEDULE.find((b) => b.type === type)?.name.toUpperCase() ||
          type.toUpperCase(),
        4,
      );
      g.audio.effect("boss");
    }
    return e;
  }
  update(dt) {
    const g = this.game,
      p = g.player,
      t = g.time * g.mode.pace;
    g.world.updateFlow?.(p, dt);
    this.spawnClock -= dt;
    const interval = Math.max(0.035, 0.7 - t * 0.0008) / g.mode.pace;
    while (this.spawnClock <= 0) {
      this.spawnClock += interval;
      let n = 1 + Math.floor(t / 100);
      for (let i = 0; i < Math.min(8, n); i++) this.spawn();
    }
    while (
      this.schedule < BOSS_SCHEDULE.length &&
      t >= BOSS_SCHEDULE[this.schedule].at
    ) {
      this.spawn(BOSS_SCHEDULE[this.schedule++].type);
    }
    for (let e of this.pool) {
      if (!e.active) continue;
      e.age += dt;
      e.hit = Math.max(0, e.hit - dt);
      e.enrage = Math.max(0, e.enrage - dt);
      let dx = p.x - e.x,
        dy = p.y - e.y,
        dist = Math.hypot(dx, dy) || 1,
        dir = 1,
        speed = e.speed;
      if (e.type === "thief" && e.stolen) {
        dir = -1;
        e.escape -= dt;
        if (e.escape <= 0) {
          g.weapons.restore(true);
          this.remove(e);
          g.toast("THE THIEF ESCAPED · WEAPON RECOVERED AT LEVEL 1");
          continue;
        }
      }
      if (e.type === "george" && e.enrage > 0) speed *= 2.8;
      if (dist > e.radius + p.radius || dir < 0) {
        let route = dir > 0 ? g.world.steer?.(e, p) : null,
          rx = route?.x ?? dx,
          ry = route?.y ?? dy,
          rl = Math.hypot(rx, ry) || 1;
        let mx = (rx / rl) * speed * dt * dir,
          my = (ry / rl) * speed * dt * dir;
        g.world.move(e, mx, my);
        if (e.boss && Math.hypot(mx, my) > 0 && Math.random() < 0.02) {
          /* bosses stay on navigable tiles */
        }
      }
      if (e.boss || e.half) this.bossAI(e, dist, dx, dy, dt);
      if (dist < e.radius + p.radius) {
        if (e.type === "thief") {
          if (!e.stolen) {
            e.stolen = g.weapons.steal();
            e.escape = 12;
            g.toast("PRIMARY STOLEN · STOP THE THIEF!");
          }
        } else p.hurt(e.damage, g);
      }
      if (!e.boss && !e.half && dist > 780) {
        this.remove(e);
        continue;
      }
    }
    for (let b of this.projectiles) {
      if (!b.active) continue;
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life <= 0 || g.world.blocked(b.x, b.y, 2)) {
        b.active = false;
        continue;
      }
      if (Math.hypot(b.x - p.x, b.y - p.y) < p.radius + b.r) {
        p.hurt(b.damage, g);
        b.active = false;
        g.fx.burst(b.x, b.y, "#a2cf62", 10);
      }
    }
    this.hash.rebuild(this.pool);
  }
  bossAI(e, dist, dx, dy, dt) {
    const g = this.game;
    e.cool -= dt;
    if (e.type === "margwa") e.phase = e.age % 5;
    else if (e.type === "panzer") {
      let prev = e.phase;
      e.phase = e.age % 6;
      if (e.phase >= 2.5 && prev < 2.5) e.aim = Math.atan2(dy, dx);
      let inCone =
        Math.abs(
          Math.atan2(
            Math.sin(Math.atan2(dy, dx) - (e.aim || 0)),
            Math.cos(Math.atan2(dy, dx) - (e.aim || 0)),
          ),
        ) < 0.45;
      if (e.phase > 1.2 && e.phase < 1.6 && dist < 95 && dist > 35)
        g.world.move(g.player, (-dx / dist) * 70 * dt, (-dy / dist) * 70 * dt);
      if (e.phase > 3.5 && e.phase < 5.2 && dist < 115 && inCone) {
        if (e.cool <= 0) {
          e.cool = 0.3;
          g.player.hurt(19, g);
          g.fx.burst(e.x + dx * 0.5, e.y + dy * 0.5, "#ffad56", 12);
          g.fx.shake = 3;
        }
      }
    } else if (
      ["megaton", "bomber", "blaster"].includes(e.type) &&
      e.cool <= 0
    ) {
      e.cool = e.half ? 1.8 : 2.6;
      const angle = Math.atan2(dy, dx);
      for (let i = -1; i <= 1; i++) {
        let b = this.projectiles.find((b) => !b.active);
        if (b)
          Object.assign(b, {
            active: true,
            x: e.x,
            y: e.y,
            vx: Math.cos(angle + i * 0.22) * 95,
            vy: Math.sin(angle + i * 0.22) * 95,
            r: 5,
            life: 5,
            damage: 17,
          });
      }
      g.fx.burst(e.x, e.y, "#b4df61", 8);
    }
  }
  hit(e, damage) {
    if (!e?.active) return false;
    const g = this.game;
    if (e.type === "margwa" && (e.phase < 2 || e.phase > 4)) {
      if (e.hit <= 0) g.fx.text(e.x, e.y - 20, "IMMUNE", "#a7a8bb");
      e.hit = 0.1;
      return false;
    }
    let amount = Math.max(1, damage - e.armor);
    e.hp -= amount;
    e.hit = 0.09;
    if (e.type === "margwa") {
      e.headHp -= amount;
      if (e.headHp <= 0) {
        e.heads--;
        e.headHp = e.maxHp / 3;
        e.hp = (e.heads * e.maxHp) / 3;
        g.fx.emit("explosion", e.x, e.y);
        g.toast(`${e.heads} MARGWA HEADS REMAIN`);
        if (e.heads <= 0) e.hp = 0;
      }
    }
    if (e.type === "george") e.enrage = 1.4;
    if (e.hp <= 0) this.kill(e);
    return true;
  }
  remove(e) {
    if (!e.active) return;
    e.active = false;
    this.count--;
  }
  kill(e) {
    const g = this.game;
    this.remove(e);
    g.kills++;
    g.fx.burst(e.x, e.y, "#ad6557", e.boss ? 30 : 5);
    if (e.boss) {
      g.fx.emit("explosion", e.x, e.y);
      g.fx.shake = 9;
      g.audio.effect("explosion");
      if (e.type === "megaton") {
        this.spawn("bomber", e.x - 22, e.y);
        this.spawn("blaster", e.x + 22, e.y);
        g.toast("MEGATON SPLIT · DEFEAT BOTH HALVES");
      } else {
        g.pickups.drop(e.x, e.y, "chest", e.type === "thief" ? 180 : 75);
        g.pickups.drop(e.x + 15, e.y, "gold", 45);
        if (e.type === "thief" && e.stolen) g.weapons.restore(false);
        if (e.type === "george") {
          g.weapons.add("wunder");
          g.toast("ULTRA RARE · WUNDERWAFFE ACQUIRED");
        }
      }
    } else if (e.half) {
      g.pickups.drop(e.x, e.y, "gold", 30);
      if (!this.pool.some((n) => n.active && n.half))
        g.pickups.drop(e.x, e.y, "chest", 100);
    } else {
      g.pickups.drop(e.x, e.y, "xp", Math.random() < 0.06 ? 5 : 1);
      if (Math.random() < 0.025) g.pickups.drop(e.x + 5, e.y, "gold", 1);
      if (Math.random() < 0.006) g.pickups.drop(e.x, e.y, "heal", 15);
      if (Math.random() < 0.0025) g.fx.emit("dissolve", e.x, e.y);
    }
    if (g.modeId === "speedrun" && g.kills >= 1000) g.end(true);
  }
  draw(ctx, cx, cy, time, w, h) {
    for (let e of this.pool) {
      if (!e.active) continue;
      let x = e.x - cx,
        y = e.y - cy;
      if (x < -50 || y < -70 || x > w + 50 || y > h + 70) continue;
      drawSprite(
        ctx,
        e.boss || e.half ? "boss" : "zombie",
        e.color,
        x,
        y,
        time + e.id * 0.1,
        true,
        e.boss ? 1.8 : e.half ? 1.2 : 0.85,
        e.x < this.game.player.x ? 1 : -1,
        e.hit > 0,
      );
      if (e.type === "margwa") {
        for (let i = 0; i < e.heads; i++) {
          ctx.fillStyle = e.phase >= 2 && e.phase <= 4 ? "#ffdc8a" : "#583a59";
          ctx.fillRect(x - 17 + i * 15, y - 48, 10, 9);
          ctx.fillStyle = e.phase >= 2 && e.phase <= 4 ? "#fff3bf" : "#b5a36f";
          ctx.fillRect(x - 14 + i * 15, y - 45, 4, 3);
        }
      }
      if (e.type === "panzer" && e.phase > 2.5) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(e.aim || 0);
        ctx.fillStyle = e.phase > 3.5 ? "#ff983955" : "#ffdc7825";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 115, -0.45, 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      if (e.type === "thief" && e.stolen) {
        ctx.fillStyle = "#e8c0ff";
        ctx.font = "9px monospace";
        ctx.fillText(`ESCAPE ${Math.ceil(e.escape)}`, x - 25, y - 57);
      }
      if (e.boss) {
        ctx.fillStyle = "#18261f";
        ctx.fillRect(x - 24, y - 57, 48, 4);
        ctx.fillStyle = "#dc9470";
        ctx.fillRect(x - 24, y - 57, 48 * Math.max(0, e.hp / e.maxHp), 4);
      }
    }
    for (let b of this.projectiles)
      if (b.active) {
        ctx.fillStyle = "#b6ec78";
        ctx.fillRect(b.x - cx - 4, b.y - cy - 4, 8, 8);
        ctx.fillStyle = "#e8ffad";
        ctx.fillRect(b.x - cx - 1, b.y - cy - 1, 3, 3);
      }
  }
}
