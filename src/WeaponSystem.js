import { WEAPONS, PASSIVES } from "./data.js";
export class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.weapons = [];
    this.passives = game.player.passives;
    this.projectiles = Array.from({ length: 500 }, () => ({
      active: false,
      hitIds: new Int32Array(40),
    }));
    this.attackId = 0;
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
  denseTarget() {
    let g = this.game,
      p = g.player,
      best = g.enemies.hash.nearest(p.x, p.y, 420),
      score = 0;
    if (!best) return null;
    for (let e of g.enemies.pool) {
      if (!e.active || Math.hypot(e.x - p.x, e.y - p.y) > 420 || e.id % 5 !== 0)
        continue;
      let n = 0;
      g.enemies.hash.query(e.x, e.y, 55, (o) => {
        if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 < 3025) n++;
      });
      if (n > score) {
        score = n;
        best = e;
      }
    }
    return best;
  }
  area(x, y, r, damage) {
    this.game.enemies.hash.query(x, y, r + 25, (e) => {
      if ((e.x - x) ** 2 + (e.y - y) ** 2 < (r + e.radius) ** 2)
        this.game.enemies.hit(e, damage);
    });
  }
  update(dt) {
    const g = this.game,
      p = g.player;
    for (let w of this.weapons) {
      if (w.disabled) continue;
      w.cool -= dt;
      if (w.cool > 0) continue;
      const d = WEAPONS[w.id],
        target =
          w.id === "thunder" || w.id === "wunder" || w.id === "fireball"
            ? this.denseTarget()
            : g.enemies.hash.nearest(p.x, p.y, 550);
      if (!target && w.id !== "holy") continue;
      w.cool =
        (d.cool *
          (p.hero.rate || 1) *
          Math.max(0.35, 1 - (this.passives.cooldown || 0) * 0.08)) /
        (1 + (w.level - 1) * 0.09);
      let damage =
        d.damage * (1 + (w.level - 1) * 0.3) * (w.evolved ? 2.4 : 1) * p.damage;
      if (Math.random() < 0.05 + (p.hero.crit || 0)) damage *= 2;
      let radius =
        (d.radius || 0) * (1 + (w.level - 1) * 0.1) * (w.evolved ? 1.4 : 1);
      if (w.id === "holy" || w.id === "slash") {
        this.area(p.x, p.y, radius, damage);
        g.fx.ring(p.x, p.y, radius, d.color, w.id === "slash" ? 0.24 : 0.5);
        if (w.id === "holy" && Math.random() < 0.15)
          g.fx.emit("holy", p.x, p.y);
        if (w.id === "slash") g.audio.effect("slash");
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
      } else {
        let n = w.evolved ? 3 : w.level >= 4 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          let a =
              Math.atan2(target.y - p.y, target.x - p.x) +
              (i - (n - 1) / 2) * 0.13,
            robot = w.id === "robot",
            ox = robot ? Math.cos(g.time * 2) * 28 : 0,
            oy = robot ? Math.sin(g.time * 2) * 28 : 0;
          this.shoot(w, p.x + ox, p.y + oy, a, damage, radius);
        }
        g.audio.effect(w.id === "fireball" ? "fire" : "shot");
      }
    }
    for (let b of this.projectiles) {
      if (!b.active) continue;
      b.life -= dt;
      let oldX = b.x,
        oldY = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life <= 0 || g.world.blocked(b.x, b.y, b.radius)) {
        if (b.id === "fireball") this.explode(b);
        b.active = false;
        continue;
      }
      const midX = (oldX + b.x) / 2,
        midY = (oldY + b.y) / 2,
        r = Math.hypot(b.x - oldX, b.y - oldY) / 2 + b.radius + 25;
      g.enemies.hash.query(midX, midY, r, (e) => {
        if (!b.active || b.hitCount >= 40) return;
        let vx = b.x - oldX,
          vy = b.y - oldY,
          l2 = vx * vx + vy * vy,
          t = l2
            ? Math.max(
                0,
                Math.min(1, ((e.x - oldX) * vx + (e.y - oldY) * vy) / l2),
              )
            : 0;
        if (
          (e.x - oldX - vx * t) ** 2 + (e.y - oldY - vy * t) ** 2 >
          (e.radius + b.radius) ** 2
        )
          return;
        for (let i = 0; i < b.hitCount; i++) if (b.hitIds[i] === e.id) return;
        b.hitIds[b.hitCount++] = e.id;
        g.enemies.hit(e, b.damage);
        if (b.id === "fireball") {
          this.explode(b);
          b.active = false;
        } else if (--b.pierce <= 0) b.active = false;
        g.fx.burst(e.x, e.y, b.color, 3);
        if (Math.random() < 0.04) g.fx.emit("impact", e.x, e.y);
      });
      if (b.id === "tornado" && Math.random() < 0.08)
        g.fx.burst(b.x, b.y, "#b9d9cd", 2);
    }
  }
  shoot(w, x, y, angle, damage, radius) {
    let b = this.projectiles.find((b) => !b.active);
    if (!b) return;
    let d = WEAPONS[w.id],
      speed = d.speed * (this.game.player.hero.shotSpeed || 1);
    Object.assign(b, {
      active: true,
      id: w.id,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      radius: w.id === "tornado" ? radius : w.id === "fireball" ? 6 : 3,
      explosionRadius: radius,
      pierce: d.pierce + (w.evolved ? 4 : 0),
      life: w.id === "tornado" ? 5 : 2.2,
      color: d.color,
      hitCount: 0,
    });
    if (w.id === "tornado") this.game.fx.emit("tornado", x, y, b.vx, b.vy);
  }
  explode(b) {
    this.area(b.x, b.y, b.explosionRadius, b.damage * 0.8);
    this.game.fx.emit("explosion", b.x, b.y);
    this.game.fx.ring(b.x, b.y, b.explosionRadius, "#ffa65f", 0.4);
    this.game.fx.shake = 2;
    this.game.audio.effect("explosion");
  }
  draw(ctx, cx, cy, time) {
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
          -6,
          -1,
          b.id === "fireball" ? 11 : 8,
          b.id === "fireball" ? 6 : 2,
        );
        ctx.fillStyle = "#fff7ce";
        ctx.fillRect(0, -1, 3, 2);
        ctx.restore();
      }
    }
    if (this.weapons.some((w) => w.id === "robot")) {
      let p = this.game.player,
        x = p.x - cx + Math.cos(time * 2) * 28,
        y = p.y - cy + Math.sin(time * 2) * 28;
      ctx.fillStyle = "#879d93";
      ctx.fillRect(x - 6, y - 8, 12, 10);
      ctx.fillStyle = "#adffed";
      ctx.fillRect(x - 4, y - 6, 8, 3);
    }
  }
}
