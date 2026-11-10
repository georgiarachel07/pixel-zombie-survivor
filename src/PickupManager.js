export class PickupManager {
  constructor(game) {
    this.game = game;
    this.pool = Array.from({ length: 2500 }, () => ({ active: false }));
    this.cursor = 0;
  }
  drop(x, y, type, value) {
    let item = null;
    for (let i = 0; i < this.pool.length; i++) {
      let j = (this.cursor + i) % this.pool.length;
      if (!this.pool[j].active) {
        item = this.pool[j];
        this.cursor = (j + 1) % this.pool.length;
        break;
      }
    }
    if (!item && type !== "xp") item = this.pool.find((q) => q.type === "xp");
    if (!item && type === "chest")
      item =
        this.pool.find((q) => q.type !== "chest") ||
        this.pool[this.cursor % this.pool.length];
    if (!item) {
      if (type === "xp") {
        // Merge XP in a bounded pool instead of allocating more drops.
        let near = this.pool.find(
          (q) =>
            q.active && q.type === "xp" && Math.hypot(q.x - x, q.y - y) < 80,
        );
        if (near) near.value += value;
      }
      return;
    }
    Object.assign(item, {
      active: true,
      x,
      y,
      type,
      value,
      age: 0,
      magnetized: false,
    });
  }
  update(dt) {
    let g = this.game,
      p = g.player;
    for (let q of this.pool) {
      if (!q.active) continue;
      q.age += dt;
      let dx = p.x - q.x,
        dy = p.y - q.y,
        d = Math.hypot(dx, dy);
      if (d < p.magnet || (q.type === "chest" && d < 36)) q.magnetized = true;
      if (q.magnetized && d > 0) {
        q.x += (dx / d) * Math.min(d, dt * (180 + q.age * 5));
        q.y += (dy / d) * Math.min(d, dt * (180 + q.age * 5));
      }
      if (d < 15) {
        q.active = false;
        let gain = g.mode.mult * (p.hero.gain || 1);
        if (q.type === "xp") {
          p.addXP(q.value * gain);
          g.audio.effect("gem");
        } else if (q.type === "gold") {
          g.runGold += Math.round(q.value * gain);
          g.audio.effect("coin");
        } else if (q.type === "heal") {
          p.hp = Math.min(p.maxHp, p.hp + q.value);
          g.fx.text(p.x, p.y, "+15 HP", "#a6db97");
        } else if (q.type === "rapid") {
          p.fireBuff = Math.max(p.fireBuff, 6);
          g.toast("RAPID FIRE · 6 SECONDS");
          g.audio.effect("chest");
        } else if (q.type === "key") {
          p.keys++;
          g.toast("KEY ACQUIRED · F TO UNLOCK A NEARBY DOOR");
        } else {
          p.keys++;
          g.runGold += Math.round(q.value * gain);
          const evo = g.weapons.evolve();
          if (evo) g.toast(`EVOLUTION · ${evo}`, 4);
          else {
            g.weapons.grantChest();
            g.toast("BOSS CACHE · GOLD + ARSENAL UPGRADE", 3);
          }
          g.audio.effect("chest");
          g.fx.emit("holy", p.x, p.y);
        }
      }
      if (q.age > 180 && q.type === "xp" && !q.magnetized) {
        q.active = false;
        p.addXP(q.value * 0.5 * gainFor(g, p));
      }
    }
  }
  draw(ctx, cx, cy, time, w, h) {
    for (let q of this.pool) {
      if (!q.active) continue;
      let x = Math.round(q.x - cx),
        y = Math.round(q.y - cy);
      if (x < -12 || y < -12 || x > w + 12 || y > h + 12) continue;
      let bob = Math.sin(time * 3 + q.x) * 1;
      if (q.type === "xp") {
        ctx.fillStyle = q.value >= 5 ? "#d1b3f2" : "#66c8ba";
        ctx.beginPath();
        ctx.moveTo(x, y - 4 + bob);
        ctx.lineTo(x + 3, y + bob);
        ctx.lineTo(x, y + 4 + bob);
        ctx.lineTo(x - 3, y + bob);
        ctx.fill();
        ctx.fillStyle = "#c6ffdf";
        ctx.fillRect(x - 1, y - 2 + bob, 1, 2);
      } else if (q.type === "gold") {
        ctx.fillStyle = "#e7ba63";
        ctx.fillRect(x - 3, y - 3 + bob, 6, 6);
        ctx.fillStyle = "#fff3b4";
        ctx.fillRect(x - 1, y - 2 + bob, 1, 4);
      } else if (q.type === "chest") {
        ctx.fillStyle = "#846039";
        ctx.fillRect(x - 9, y - 7, 18, 13);
        ctx.fillStyle = "#f5cd73";
        ctx.fillRect(x - 9, y - 5, 18, 3);
        ctx.fillRect(x - 2, y - 5, 4, 8);
        ctx.strokeStyle = "#f2ce7655";
        ctx.strokeRect(x - 13, y - 12, 26, 23);
      } else if (q.type === "key") {
        ctx.fillStyle = "#f1d48a";
        ctx.fillRect(x - 4, y - 3, 5, 5);
        ctx.fillRect(x, y - 1, 7, 2);
        ctx.fillRect(x + 4, y + 1, 2, 3);
      } else if (q.type === "rapid") {
        ctx.fillStyle = "#99cda8";
        ctx.fillRect(x - 6, y - 5, 12, 10);
        ctx.fillStyle = "#f8dc8e";
        ctx.fillRect(x - 1, y - 5, 3, 10);
      } else {
        ctx.fillStyle = "#e7947f";
        ctx.fillRect(x - 4, y - 3, 8, 6);
        ctx.fillRect(x - 2, y - 5, 4, 10);
      }
    }
  }
}
function gainFor(g, p) {
  return g.mode.mult * (p.hero.gain || 1);
}
