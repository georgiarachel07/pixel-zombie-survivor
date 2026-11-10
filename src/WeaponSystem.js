import { WEAPONS, PASSIVES } from "./data.js";
import { inArc, inThrust } from "./Combat.js";
import { drawHeldWeapon } from "./WeaponVisuals.js";
export class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.weapons = [];
    this.passives = game.player.passives;
    this.projectiles = Array.from({ length: 500 }, () => ({
      active: false,
      hitIds: new Int32Array(1800),
    }));
    this.attackId = 0;
    this.melee = Array.from({ length: 32 }, () => ({
      active: false,
      hitIds: new Int32Array(1800),
    }));
    this.lasers = Array.from({ length: 32 }, () => ({ life: 0 }));
    this.orbHeal = 0;
    this.stolen = null;
    this.add(game.player.hero.weapon);
  }
  add(id) {
    let existing = this.weapons.find((w) => w.id === id);
    if (existing) {
      existing.level = Math.min(5, existing.level + 1);
      return;
    }
    if (id === "wunder" && this.weapons.length >= 6) this.weapons.pop();
    if (this.weapons.length < 6)
      this.weapons.push({
        id,
        level: 1,
        cool: 0,
        evolved: false,
        disabled: false,
      });
  }
  get primary() {
    return this.weapons[0];
  }
  steal() {
    if (this.stolen || !this.primary) return false;
    this.stolen = { level: this.primary.level, evolved: this.primary.evolved };
    this.primary.disabled = true;
    return true;
  }
  restore(escaped) {
    if (!this.stolen) return;
    if (escaped) {
      this.primary.level = 1;
      this.primary.evolved = false;
    }
    this.primary.disabled = false;
    this.stolen = null;
  }
  evolve() {
    let w = this.weapons.find(
      (w) =>
        !w.disabled &&
        w.level === 5 &&
        !w.evolved &&
        this.passives[WEAPONS[w.id].passive],
    );
    if (w) {
      w.evolved = true;
      return WEAPONS[w.id].evolved;
    }
    return null;
  }
  grantChest() {
    let w = this.weapons.find((w) => w.level < 5);
    if (w) w.level++;
    else
      this.game.player.hp = Math.min(
        this.game.player.maxHp,
        this.game.player.hp + 40,
      );
  }
  choices() {
    let options = [];
    for (let id in WEAPONS) {
      if (id === "wunder") continue;
      let w = this.weapons.find((w) => w.id === id);
      if ((w && w.level < 5) || (!w && this.weapons.length < 6))
        options.push({
          type: "weapon",
          id,
          name: WEAPONS[id].name,
          desc: WEAPONS[id].desc,
          level: w ? w.level + 1 : 1,
        });
    }
    for (let id in PASSIVES)
      if ((this.passives[id] || 0) < 5)
        options.push({
          type: "passive",
          id,
          name: PASSIVES[id].name,
          desc: PASSIVES[id].desc,
          level: (this.passives[id] || 0) + 1,
        });
    if (this.game.skills && this.game.skills.level < 5)
      options.push({
        type: "class",
        id: "class",
        name: this.game.skills.definition.name,
        desc: "Class skill deals 15% more damage and recharges 10% faster.",
        level: this.game.skills.level + 1,
      });
    for (let i = options.length - 1; i > 0; i--) {
      let j = (Math.random() * (i + 1)) | 0;
      [options[i], options[j]] = [options[j], options[i]];
    }
    if (options.length < 3)
      options.push(
        {
          type: "heal",
          id: "heal",
          name: "Field Rations",
          desc: "Recover 45 health.",
          level: 1,
        },
        {
          type: "gold",
          id: "gold",
          name: "Supply Cache",
          desc: "Gain 25 gold.",
          level: 1,
        },
      );
    return options.slice(0, 3);
  }
  choose(c) {
    if (c.type === "class") {
      this.game.skills.level++;
      return;
    }
    if (c.type === "weapon") this.add(c.id);
    else if (c.type === "passive")
      this.passives[c.id] = (this.passives[c.id] || 0) + 1;
    else if (c.type === "heal")
      this.game.player.hp = Math.min(
        this.game.player.maxHp,
        this.game.player.hp + 45,
      );
    else this.game.runGold += 25;
  }

  damageValue(base, level = 1, evolved = false) {
    const p = this.game.player;
    let d = base * (1 + (level - 1) * 0.3) * (evolved ? 2.4 : 1) * p.damage;
    if (Math.random() < p.critChance) d *= p.critMultiplier;
    return d;
  }
  onKill() {
    let p = this.game.player;
    if (Math.random() < (p.passives.lifesteal || 0) * 0.08)
      p.hp = Math.min(p.maxHp, p.hp + 1);
  }
  target(highHP = false) {
    const g = this.game,
      p = g.player;
    if (!highHP) return g.enemies.hash.nearest(p.x, p.y, 600);
    const candidates = [];
    for (let e of g.enemies.pool) {
      if (
        !e.active ||
        Math.abs(e.x - p.x) > g.canvas.width / 2 ||
        Math.abs(e.y - p.y) > g.canvas.height / 2
      )
        continue;
      candidates.push(e);
    }
    candidates.sort((a, b) => b.hp - a.hp);
    return (
      candidates[Math.floor(Math.random() * Math.min(5, candidates.length))] ||
      null
    );
  }
  area(x, y, r, damage, options = {}) {
    this.game.enemies.hash.query(x, y, r + 30, (e) => {
      if (Math.hypot(e.x - x, e.y - y) <= r + e.radius)
        this.game.enemies.hit(e, damage, {
          ...options,
          angle: Math.atan2(e.y - y, e.x - x),
        });
    });
  }
  laser(x, y, tx, ty, color = "#a4fff1") {
    let l = this.lasers.find((l) => l.life <= 0);
    if (l) Object.assign(l, { x, y, tx, ty, color, life: 0.13 });
  }
  beginMelee(w, angle, damage, reach, owner = this.game.player) {
    let a = this.melee.find((a) => !a.active);
    if (!a) return;
    let d = WEAPONS[w.id];
    Object.assign(a, {
      active: true,
      owner,
      x: owner.x,
      y: owner.y,
      angle,
      age: 0,
      duration: d.duration || 0.3,
      kind: d.melee,
      reach,
      width: d.width || 0.65,
      damage,
      bleed: d.bleed || 0,
      knock: d.knock || 70,
      color: d.color,
      hitCount: 0,
      id: w.id,
    });
    if (owner === this.game.player && w === this.primary)
      owner.weaponAnimation = {
        id: w.id,
        angle,
        age: 0,
        duration: a.duration,
        kind: a.kind,
      };
  }
  updateMelee(dt) {
    const g = this.game;
    for (let a of this.melee) {
      if (!a.active) continue;
      a.age += dt;
      a.x = a.owner.x;
      a.y = a.owner.y;
      const t = Math.min(1, a.age / a.duration),
        angle =
          a.kind === "arc" ? a.angle - a.width / 2 + a.width * t : a.angle;
      g.enemies.hash.query(a.x, a.y, a.reach + 30, (e) => {
        const key = e.id + (e.generation || 1) * 2048;
        for (let i = 0; i < a.hitCount; i++) if (a.hitIds[i] === key) return;
        const hit =
          a.kind === "arc"
            ? inArc(e.x, e.y, a.x, a.y, angle, a.reach, 0.6, e.radius)
            : inThrust(
                e.x,
                e.y,
                a.x,
                a.y,
                angle,
                a.reach * Math.sin(Math.PI * Math.min(0.95, t + 0.15)),
                a.id === "chainsaw" ? 17 : 10,
                e.radius,
              );
        if (hit) {
          a.hitIds[a.hitCount++] = key;
          g.enemies.hit(e, a.damage, {
            knock: a.knock,
            angle: a.angle,
            bleed: a.bleed,
          });
          g.fx.burst(e.x, e.y, a.color, 3);
        }
      });
      if (a.age >= a.duration) a.active = false;
    }
  }
  update(dt) {
    const g = this.game,
      p = g.player;
    this.orbHeal = Math.max(0, this.orbHeal - dt);
    if (p.weaponAnimation) p.weaponAnimation.age += dt;
    let near = this.target();
    if (near) p.aimAngle = Math.atan2(near.y - p.y, near.x - p.x);
    for (let l of this.lasers) l.life = Math.max(0, l.life - dt);
    for (let w of this.weapons) {
      if (w.disabled) continue;
      w.cool -= dt;
      if (w.cool > 0) continue;
      const d = WEAPONS[w.id],
        target = w.id === "thunder" ? this.target(true) : this.target();
      if (!target && w.id !== "holy" && w.id !== "necro") continue;
      if (
        d.melee &&
        target &&
        Math.hypot(target.x - p.x, target.y - p.y) > d.radius * 1.5
      )
        continue;
      w.cool =
        (d.cool *
          (p.hero.rate || 1) *
          Math.max(0.35, 1 - (this.passives.cooldown || 0) * 0.08)) /
        (1 + (w.level - 1) * 0.09) /
        (p.fireBuff > 0 ? 1.8 : 1);
      let damage = this.damageValue(d.damage, w.level, w.evolved),
        radius =
          (d.radius || 0) * (1 + (w.level - 1) * 0.1) * (w.evolved ? 1.4 : 1),
        angle = target
          ? Math.atan2(target.y - p.y, target.x - p.x)
          : p.aimAngle;
      if (w === this.primary) g.skills?.mirrorAttack(w, angle, damage, radius);
      if (d.melee) {
        this.beginMelee(w, angle, damage, radius);
        g.audio.effect("slash");
      } else if (w.id === "holy") {
        this.area(p.x, p.y, radius, damage);
        g.fx.ring(p.x, p.y, radius, d.color, 0.5);
        if (Math.random() < 0.12) g.fx.emit("holy", p.x, p.y);
      } else if (w.id === "thunder" || w.id === "wunder") {
        this.area(target.x, target.y, radius, damage);
        g.fx.emit("lightning", target.x, target.y);
        g.fx.bolt(target.x, target.y);
        if (w.evolved || w.id === "wunder") {
          let n = 0;
          g.enemies.hash.query(target.x, target.y, 180, (e) => {
            if (++n < 9) g.enemies.hit(e, damage * 0.6);
          });
        }
        g.audio.effect("lightning");
      } else if (w.id === "robot") {
        let n = 1 + Math.floor(w.level / 2) + (w.evolved ? 1 : 0);
        for (let i = 0; i < n; i++) {
          let a = g.time * 2 + (i * Math.PI * 2) / n,
            x = p.x + Math.cos(a) * 34,
            y = p.y + Math.sin(a) * 34,
            t = g.enemies.hash.nearest(x, y, 500);
          if (t) {
            g.enemies.hit(t, damage);
            this.laser(x, y, t.x, t.y);
          }
        }
        g.audio.effect("shot");
      } else if (w.id === "necro") {
        /* Orbiting souls are resolved below at fixed contact intervals. */
      } else {
        if (w === this.primary)
          p.weaponAnimation = {
            id: w.id,
            angle,
            age: 0,
            duration: w.id === "bow" ? 0.4 : 0.22,
            kind: "ranged",
          };
        let n = w.evolved ? 3 : w.level >= 4 ? 2 : 1;
        for (let i = 0; i < n; i++)
          this.shoot(
            w,
            p.x,
            p.y,
            angle + (i - (n - 1) / 2) * 0.13,
            damage,
            radius,
          );
        g.audio.effect(w.id === "fireball" ? "fire" : "shot");
      }
    }
    this.updateMelee(dt);
    const orb = this.weapons.find((w) => w.id === "necro" && !w.disabled);
    if (orb) {
      let count = 2 + Math.floor(orb.level / 2) + (orb.evolved ? 2 : 0);
      for (let i = 0; i < count; i++) {
        let a = g.time * 2.2 + (i * Math.PI * 2) / count,
          x = p.x + Math.cos(a) * 52,
          y = p.y + Math.sin(a) * 52;
        g.enemies.hash.query(x, y, 30, (e) => {
          if (
            (e.orbUntil || 0) > g.time ||
            Math.hypot(e.x - x, e.y - y) > 16 + e.radius
          )
            return;
          e.orbUntil = g.time + 0.4;
          if (
            g.enemies.hit(e, this.damageValue(17, orb.level, orb.evolved)) &&
            this.orbHeal <= 0
          ) {
            p.hp = Math.min(p.maxHp, p.hp + 1);
            this.orbHeal = 0.3;
            this.laser(x, y, p.x, p.y, "#c5a0ef");
          }
        });
      }
    }
    for (let b of this.projectiles) {
      if (!b.active) continue;
      b.life -= dt;
      let ox = b.x,
        oy = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const obstruction =
        g.world.damageSegment?.(
          ox,
          oy,
          b.x,
          b.y,
          b.damage,
          g,
          b.radius,
          b.ballista,
        ) || false;
      if (
        b.life <= 0 ||
        (!b.ballista && (obstruction || g.world.blocked(b.x, b.y, b.radius)))
      ) {
        if (b.id === "fireball") this.explode(b);
        b.active = false;
        continue;
      }
      if (b.id === "tornado") {
        g.enemies.hash.query(b.x, b.y, b.radius + 42, (e) => {
          let dx = b.x - e.x,
            dy = b.y - e.y,
            d = Math.hypot(dx, dy);
          if (d < b.radius + 35 && !e.boss)
            g.world.move(e, (dx * 4 + b.vx) * dt, (dy * 4 + b.vy) * dt);
        });
      }
      let mx = (ox + b.x) / 2,
        my = (oy + b.y) / 2,
        r = Math.hypot(b.x - ox, b.y - oy) / 2 + b.radius + 30;
      g.enemies.hash.query(mx, my, r, (e) => {
        if (!b.active || b.hitCount >= b.hitIds.length) return;
        let vx = b.x - ox,
          vy = b.y - oy,
          l2 = vx * vx + vy * vy,
          t = l2
            ? Math.max(0, Math.min(1, ((e.x - ox) * vx + (e.y - oy) * vy) / l2))
            : 0;
        if (
          (e.x - ox - vx * t) ** 2 + (e.y - oy - vy * t) ** 2 >
          (e.radius + b.radius) ** 2
        )
          return;
        let key = e.id + (e.generation || 1) * 2048;
        for (let i = 0; i < b.hitCount; i++) if (b.hitIds[i] === key) return;
        b.hitIds[b.hitCount++] = key;
        g.enemies.hit(e, b.damage, {
          ignoreArmor: b.ballista,
          knock: b.ballista ? 140 : 0,
          angle: Math.atan2(b.vy, b.vx),
        });
        if (b.id === "fireball") {
          this.explode(b);
          b.active = false;
        } else if (--b.pierce <= 0) b.active = false;
        g.fx.burst(e.x, e.y, b.color, 3);
        if (Math.random() < 0.03) g.fx.emit("impact", e.x, e.y);
      });
    }
  }
  shoot(w, x, y, angle, damage, radius = 0, options = {}) {
    let b = this.projectiles.find((b) => !b.active);
    if (!b) return;
    let d = WEAPONS[w.id],
      speed = options.speed || d.speed * (this.game.player.hero.shotSpeed || 1);
    Object.assign(b, {
      active: true,
      id: w.id,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      radius:
        options.radius ||
        (w.id === "tornado" ? radius : w.id === "fireball" ? 6 : 3),
      explosionRadius: radius,
      pierce: options.pierce || d.pierce + (w.evolved ? 4 : 0),
      life: options.life || (w.id === "tornado" ? 5 : 2.2),
      color: d.color,
      hitCount: 0,
      ballista: !!options.ballista,
    });
    if (w.id === "tornado") this.game.fx.emit("tornado", x, y, b.vx, b.vy);
    return b;
  }
  explode(b) {
    this.area(b.x, b.y, b.explosionRadius, b.damage * 0.8);
    this.game.fx.emit("explosion", b.x, b.y);
    this.game.fx.ring(b.x, b.y, b.explosionRadius, "#ffa65f", 0.4);
    this.game.fx.shake = 2;
    this.game.audio.effect("explosion");
    for (let o of this.game.world.obstacles)
      if (o.active && Math.hypot(o.x - b.x, o.y - b.y) < b.explosionRadius)
        this.game.world.damageObject?.(o, b.damage, this.game);
  }
  draw(ctx, cx, cy, time) {
    const p = this.game.player;
    for (let a of this.melee) {
      if (!a.active) continue;
      ctx.save();
      ctx.translate(a.x - cx, a.y - cy);
      ctx.rotate(a.angle);
      ctx.strokeStyle = a.color + "88";
      ctx.lineWidth = a.id === "chainsaw" ? 7 : 3;
      let t = a.age / a.duration;
      if (a.kind === "arc") {
        ctx.beginPath();
        ctx.arc(0, 0, a.reach * 0.85, -a.width / 2, -a.width / 2 + a.width * t);
        ctx.stroke();
      } else {
        ctx.fillStyle = a.color + "55";
        ctx.fillRect(
          6,
          -8,
          a.reach * Math.sin(Math.PI * Math.min(0.95, t + 0.15)),
          16,
        );
      }
      ctx.restore();
    }
    for (let b of this.projectiles) {
      if (!b.active) continue;
      let x = b.x - cx,
        y = b.y - cy;
      ctx.fillStyle = b.color;
      if (b.id === "tornado") {
        for (let i = 0; i < 7; i++) {
          let a = time * 9 + i * 1.7;
          ctx.fillRect(
            x + Math.cos(a) * (14 - i) - 2,
            y - i * 4 + Math.sin(a) * 3,
            9 - i,
            3,
          );
        }
      } else if (b.id === "shuriken") {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 20);
        ctx.fillRect(-5, -1, 10, 2);
        ctx.fillRect(-1, -5, 2, 10);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.fillRect(
          b.ballista ? -24 : -6,
          b.ballista ? -4 : -1,
          b.ballista ? 48 : b.id === "fireball" ? 11 : 8,
          b.ballista ? 8 : b.id === "fireball" ? 6 : 2,
        );
        ctx.fillStyle = "#fff7ce";
        ctx.fillRect(0, -1, b.ballista ? 18 : 3, 2);
        ctx.restore();
      }
    }
    for (let l of this.lasers)
      if (l.life > 0) {
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(l.x - cx, l.y - cy - 8);
        ctx.lineTo(l.tx - cx, l.ty - cy - 8);
        ctx.stroke();
      }
    const robot = this.weapons.find((w) => w.id === "robot" && !w.disabled);
    if (robot) {
      let n = 1 + Math.floor(robot.level / 2) + (robot.evolved ? 1 : 0);
      for (let i = 0; i < n; i++) {
        let a = time * 2 + (i * Math.PI * 2) / n,
          x = p.x - cx + Math.cos(a) * 34,
          y = p.y - cy + Math.sin(a) * 34;
        ctx.fillStyle = "#869e96";
        ctx.fillRect(x - 6, y - 12, 12, 10);
        ctx.fillStyle = "#a1ffee";
        ctx.fillRect(x - 4, y - 10, 8, 3);
      }
    }
    const orb = this.weapons.find((w) => w.id === "necro" && !w.disabled);
    if (orb) {
      let n = 2 + Math.floor(orb.level / 2) + (orb.evolved ? 2 : 0);
      for (let i = 0; i < n; i++) {
        let a = time * 2.2 + (i * Math.PI * 2) / n,
          x = p.x - cx + Math.cos(a) * 52,
          y = p.y - cy + Math.sin(a) * 52;
        ctx.fillStyle = "#79639c55";
        ctx.fillRect(x - 7, y - 7, 14, 14);
        ctx.fillStyle = "#b599df";
        ctx.fillRect(x - 4, y - 4, 8, 8);
        ctx.fillStyle = "#e0d0ff";
        ctx.fillRect(x - 1, y - 2, 3, 3);
      }
    }
    drawHeldWeapon(ctx, p, p.x - cx, p.y - cy, time, this.primary?.disabled);
  }
}
