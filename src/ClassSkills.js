import { CLASS_SKILLS } from "./data.js?v=2.0.1";
import { inThrust } from "./Combat.js?v=2.0.1";
import { drawHero } from "./Sprites.js?v=2.0.1";
import { drawHeldWeapon } from "./WeaponVisuals.js?v=2.0.1";
export class ClassSkills {
  constructor(game) {
    this.game = game;
    this.definition = CLASS_SKILLS[game.player.hero.id];
    this.level = 1;
    this.cooldown = 0;
    this.cloneTime = 0;
    this.clones = [
      { x: 0, y: 0, hero: game.player.hero, aimAngle: 0 },
      { x: 0, y: 0, hero: game.player.hero, aimAngle: 0 },
    ];
    this.events = Array.from({ length: 24 }, () => ({
      active: false,
      hits: new Int32Array(1800),
    }));
  }
  event(kind, x, y, life, extra = {}) {
    let e = this.events.find((e) => !e.active);
    if (e)
      Object.assign(e, {
        active: true,
        kind,
        x,
        y,
        life,
        max: life,
        age: 0,
        tick: 0,
        hitCount: 0,
        fired: false,
        ...extra,
      });
    return e;
  }
  activate() {
    const g = this.game,
      p = g.player;
    if (this.cooldown > 0) return false;
    this.cooldown =
      this.definition.cool *
      Math.max(0.35, 1 - (p.passives.cooldown || 0) * 0.08) *
      0.9 ** (this.level - 1);
    const damage = (1 + (this.level - 1) * 0.15) * g.weapons.damageValue(1),
      near = g.enemies.hash.nearest(p.x, p.y, 500),
      angle = near ? Math.atan2(near.y - p.y, near.x - p.x) : p.aimAngle || 0,
      tx = near?.x ?? p.x + Math.cos(angle) * 90,
      ty = near?.y ?? p.y + Math.sin(angle) * 90;
    g.audio.effect("level");
    g.toast(this.definition.name.toUpperCase(), 1.5);
    switch (p.hero.id) {
      case "soldier":
        this.event("airdrop", tx, ty, 2, { delay: 1.2, damage: 175 * damage });
        g.fx.ring(tx, ty, 65, "#e7c478", 1.2);
        break;
      case "warrior":
        g.weapons.area(p.x, p.y, 110, 145 * damage, { knock: 280 });
        p.spinTime = 0.7;
        this.event("whirlwind", p.x, p.y, 0.7, { radius: 110 });
        break;
      case "archer":
        this.event("arrows", tx, ty, 1.5, { delay: 1, damage: 210 * damage });
        g.fx.ring(tx, ty, 100, "#c5df9a", 1);
        break;
      case "rogue": {
        let x = p.x,
          y = p.y;
        for (let i = 0; i < 24; i++) {
          let nx = p.x + Math.cos(angle) * 7,
            ny = p.y + Math.sin(angle) * 7;
          if (g.world.blocked(nx, ny, p.radius)) break;
          p.x = nx;
          p.y = ny;
        }
        p.immunity = Math.max(p.immunity, 1.5);
        this.event("shadow", x, y, 3, {
          tx: p.x,
          ty: p.y,
          angle,
          reach: Math.hypot(p.x - x, p.y - y),
          damage: 12 * damage,
        });
        g.fx.burst(p.x, p.y, "#c5a5e2", 20);
        break;
      }
      case "paladin":
        p.immunity = Math.max(p.immunity, 4);
        this.event("aegis", p.x, p.y, 4, { damage: 16 * damage });
        g.fx.emit("holy", p.x, p.y);
        break;
      case "mage":
        this.event("nova", p.x, p.y, 1.3, { damage: 220 * damage });
        g.fx.emit("explosion", p.x, p.y);
        g.fx.shake = 5;
        break;
      case "ninja":
        this.cloneTime = 6;
        g.fx.burst(p.x, p.y, "#9aa6d7", 22);
        break;
      case "farmer":
        this.event("harvest", tx, ty, 4, { radius: 130 });
        g.enemies.hash.query(tx, ty, 160, (e) => {
          if (Math.hypot(e.x - tx, e.y - ty) < 130 + e.radius) e.bounty = 1;
        });
        break;
      case "arbalist":
        g.weapons.shoot(
          { id: "bolt", level: 5, evolved: true },
          p.x,
          p.y,
          angle,
          280 * damage,
          0,
          { ballista: true, speed: 900, radius: 10, pierce: 1800, life: 2.5 },
        );
        p.weaponAnimation = {
          id: "bolt",
          angle,
          age: 0,
          duration: 0.45,
          kind: "ranged",
        };
        g.fx.shake = 4;
        break;
    }
    return true;
  }
  mirrorAttack(w, angle, damage, radius) {
    if (this.cloneTime <= 0) return;
    for (let c of this.clones) {
      c.aimAngle = angle;
      c.weaponAnimation = {
        id: w.id,
        angle,
        age: 0,
        duration: 0.25,
        kind: "ranged",
      };
      if (["slash", "sword", "daggers", "pitchfork", "chainsaw"].includes(w.id))
        this.game.weapons.beginMelee(w, angle, damage * 0.5, radius, c);
      else if (w.id === "robot")
        this.game.weapons.area(c.x, c.y, 100, damage * 0.5);
      else if (
        w.id !== "holy" &&
        w.id !== "necro" &&
        w.id !== "thunder" &&
        w.id !== "wunder"
      )
        this.game.weapons.shoot(w, c.x, c.y, angle, damage * 0.5, radius);
    }
  }
  update(dt) {
    const g = this.game,
      p = g.player;
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (g.input.skill) {
      this.activate();
      g.input.skill = false;
    }
    this.cloneTime = Math.max(0, this.cloneTime - dt);
    for (let i = 0; i < 2; i++) {
      const c = this.clones[i];
      c.x = p.x + (i === 0 ? -32 : 32);
      c.y = p.y + 18;
      c.aimAngle = p.aimAngle;
      c.moving = p.moving;
      if (c.weaponAnimation) c.weaponAnimation.age += dt;
    }
    for (let e of this.events) {
      if (!e.active) continue;
      e.age += dt;
      e.life -= dt;
      e.tick -= dt;
      if (e.kind === "airdrop" || e.kind === "arrows") {
        if (e.age >= e.delay && !e.fired) {
          e.fired = true;
          g.weapons.area(e.x, e.y, e.kind === "arrows" ? 100 : 65, e.damage, {
            knock: e.kind === "airdrop" ? 170 : 35,
          });
          g.fx.emit(e.kind === "airdrop" ? "explosion" : "impact", e.x, e.y);
          g.audio.effect("explosion");
          if (e.kind === "airdrop") g.pickups.drop(e.x, e.y, "rapid", 6);
        }
      }
      if (e.kind === "nova") {
        const r = 200 * Math.min(1, e.age / 1.1);
        g.enemies.hash.query(e.x, e.y, r + 35, (n) => {
          const key = n.id + (n.generation || 1) * 2048;
          for (let i = 0; i < e.hitCount; i++) if (e.hits[i] === key) return;
          if (Math.abs(Math.hypot(n.x - e.x, n.y - e.y) - r) < 22 + n.radius) {
            e.hits[e.hitCount++] = key;
            g.enemies.hit(n, e.damage, {
              bleed: 28,
              knock: 120,
              angle: Math.atan2(n.y - e.y, n.x - e.x),
            });
          }
        });
      }
      if (e.tick <= 0) {
        e.tick = 0.25;
        if (e.kind === "aegis") {
          e.x = p.x;
          e.y = p.y;
          g.weapons.area(e.x, e.y, 45 + e.age * 23, e.damage, { knock: 25 });
        }
        if (e.kind === "shadow")
          g.enemies.hash.query(
            (e.x + e.tx) / 2,
            (e.y + e.ty) / 2,
            e.reach / 2 + 35,
            (n) => {
              if (inThrust(n.x, n.y, e.x, e.y, e.angle, e.reach, 16, n.radius))
                g.enemies.hit(n, e.damage, { bleed: 18 });
            },
          );
        if (e.kind === "harvest")
          g.enemies.hash.query(e.x, e.y, 160, (n) => {
            if (Math.hypot(n.x - e.x, n.y - e.y) < 130 + n.radius) n.bounty = 1;
          });
      }
      if (e.life <= 0) e.active = false;
    }
  }
  draw(ctx, cx, cy, time) {
    const p = this.game.player;
    if (this.cloneTime > 0)
      for (let c of this.clones) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        drawHero(
          ctx,
          c.hero,
          c.x - cx,
          c.y - cy,
          time,
          c.moving,
          1,
          c.aimAngle,
        );
        drawHeldWeapon(ctx, c, c.x - cx, c.y - cy, time);
        ctx.restore();
      }
    for (let e of this.events) {
      if (!e.active) continue;
      let x = e.x - cx,
        y = e.y - cy;
      ctx.save();
      if (e.kind === "airdrop") {
        let h = Math.max(0, 1 - e.age / e.delay) * 170;
        ctx.strokeStyle = "#c3bc9866";
        ctx.beginPath();
        ctx.moveTo(x - 10, y - h - 38);
        ctx.lineTo(x, y - h - 8);
        ctx.lineTo(x + 10, y - h - 38);
        ctx.stroke();
        ctx.fillStyle = "#6b7951";
        ctx.fillRect(x - 13, y - h - 24, 26, 22);
        ctx.fillStyle = "#d2b76d";
        ctx.fillRect(x - 13, y - h - 18, 26, 4);
        ctx.fillRect(x - 2, y - h - 24, 4, 22);
      } else if (e.kind === "arrows") {
        ctx.strokeStyle = "#d7e5b4";
        ctx.lineWidth = 1;
        for (let i = 0; i < 24; i++) {
          let a = i * 2.4,
            r = Math.sqrt((i + 0.5) / 24) * 95,
            ax = x + Math.cos(a) * r,
            ay = y + Math.sin(a) * r,
            fall = Math.max(0, 1 - e.age) * 180;
          ctx.beginPath();
          ctx.moveTo(ax - 4, ay - fall - 16);
          ctx.lineTo(ax, ay - fall);
          ctx.stroke();
        }
      } else if (e.kind === "shadow") {
        ctx.strokeStyle = "#9b6ab977";
        ctx.lineWidth = 24;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(e.tx - cx, e.ty - cy);
        ctx.stroke();
      } else {
        const r =
          e.kind === "nova"
            ? 200 * Math.min(1, e.age / 1.1)
            : e.kind === "aegis"
              ? 45 + e.age * 23
              : e.kind === "harvest"
                ? 130
                : 110;
        ctx.strokeStyle =
          e.kind === "nova"
            ? "#ffa36bdd"
            : e.kind === "harvest"
              ? "#e6d583aa"
              : "#ffeda6bb";
        ctx.lineWidth = e.kind === "nova" ? 7 : 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
