import test from "node:test";
import assert from "node:assert/strict";
import { SpatialHash } from "../src/SpatialHash.js";
import { Player } from "../src/Player.js";
import { WeaponSystem } from "../src/WeaponSystem.js";
import { EnemyManager } from "../src/EnemyManager.js";
import { World } from "../src/World.js";
import { Save } from "../src/Save.js";
import { PickupManager } from "../src/PickupManager.js";
import { HEROES, MODES, WEAPONS } from "../src/data.js";
import {
  createFrame,
  createFx,
  composite,
} from "../vendor/pixelfx/src/core/index.js";
import * as explosion from "../vendor/pixelfx/src/fx/explosions/small-explosion.js";
const meta = { hp: 0, attack: 0, speed: 0, magnet: 0, armor: 0 };
function harness() {
  let drops = [],
    messages = [],
    g = {
      canvas: { width: 640, height: 360 },
      player: new Player(HEROES[0], meta),
      world: new World("forest"),
      time: 0,
      mode: MODES.quick,
      modeId: "quick",
      kills: 0,
      runGold: 0,
      audio: { effect() {} },
      fx: { burst() {}, emit() {}, text() {}, ring() {}, bolt() {} },
      toast(m) {
        messages.push(m);
      },
      end(won) {
        this.ended = won;
      },
    };
  g.pickups = {
    drop(...args) {
      drops.push(args);
    },
  };
  g.enemies = new EnemyManager(g);
  g.weapons = new WeaponSystem(g);
  g.drops = drops;
  g.messages = messages;
  return g;
}
test("spatial hash agrees with brute-force nearest query and ignores removed entities", () => {
  let list = Array.from({ length: 1500 }, (_, id) => ({
      id,
      x: (id * 239) % 4000,
      y: (id * 179) % 4000,
      active: id % 7 !== 0,
    })),
    hash = new SpatialHash(1500);
  hash.rebuild(list);
  for (let i = 0; i < 40; i++) {
    let x = i * 97,
      y = i * 83,
      r = 500,
      best = list
        .filter((e) => e.active && (e.x - x) ** 2 + (e.y - y) ** 2 < r * r)
        .sort(
          (a, b) =>
            (a.x - x) ** 2 + (a.y - y) ** 2 - ((b.x - x) ** 2 + (b.y - y) ** 2),
        )[0];
    assert.equal(hash.nearest(x, y, r)?.id, best?.id);
  }
});
test("movement normalizes diagonals, obstacles block and dash grants invulnerability", () => {
  let p = new Player(HEROES[0], meta),
    w = new World("forest"),
    start = p.x;
  p.update(
    0.1,
    { keys: new Set(["d", "s"]), touchX: 0, touchY: 0, dash: false },
    w,
  );
  assert.ok(
    Math.abs(Math.hypot(p.x - start, p.y - start) - p.speed * 0.1) < 0.001,
  );
  p.update(
    0.016,
    { keys: new Set(["d"]), touchX: 0, touchY: 0, dash: true },
    w,
  );
  assert.ok(p.dashCooldown > 0 && p.invulnerable > 0);
  let d = new World("dungeon");
  assert.equal(d.blocked(2050, 2050, 9), true);
});
test("all weapon evolutions require level five, matching passive and chest", () => {
  for (let id in WEAPONS) {
    let g = harness();
    g.weapons.weapons = [{ id, level: 4, evolved: false, disabled: false }];
    g.weapons.passives[WEAPONS[id].passive] = 1;
    assert.equal(g.weapons.evolve(), null);
    g.weapons.weapons[0].level = 5;
    assert.equal(g.weapons.evolve(), WEAPONS[id].evolved);
    assert.equal(g.weapons.evolve(), null);
  }
});
test("thief disables primary and returns full strength on kill; escape downgrades", () => {
  let g = harness(),
    w = g.weapons;
  w.primary.level = 5;
  w.primary.evolved = true;
  assert.equal(w.steal(), true);
  assert.equal(w.primary.disabled, true);
  w.restore(false);
  assert.equal(w.primary.level, 5);
  assert.equal(w.primary.evolved, true);
  w.steal();
  w.restore(true);
  assert.equal(w.primary.level, 1);
  assert.equal(w.primary.disabled, false);
  assert.equal(w.primary.evolved, false);
});
test("Margwa is immune outside mouth window and loses exactly three heads", () => {
  let g = harness(),
    e = g.enemies.spawn("margwa", 2200, 2048),
    hp = e.hp;
  g.enemies.hit(e, 9999);
  assert.equal(e.hp, hp);
  e.phase = 3;
  g.enemies.hit(e, e.maxHp);
  assert.equal(e.heads, 2);
  g.enemies.hit(e, e.maxHp);
  assert.equal(e.heads, 1);
  g.enemies.hit(e, e.maxHp);
  assert.equal(e.active, false);
  assert.equal(g.kills, 1);
});
test("Megaton splits into two halves and chest drops only after both are defeated", () => {
  let g = harness(),
    e = g.enemies.spawn("megaton", 2200, 2048);
  g.enemies.hit(e, 99999);
  let halves = g.enemies.pool.filter((e) => e.active && e.half);
  assert.equal(halves.length, 2);
  assert.equal(
    g.drops.some((d) => d[2] === "chest"),
    false,
  );
  g.enemies.hit(halves[0], 99999);
  assert.equal(
    g.drops.some((d) => d[2] === "chest"),
    false,
  );
  g.enemies.hit(halves[1], 99999);
  assert.equal(g.drops.filter((d) => d[2] === "chest").length, 1);
});
test("George enrages and drops the Wunderwaffe on defeat", () => {
  let g = harness(),
    e = g.enemies.spawn("george", 2200, 2048);
  g.enemies.hit(e, 1);
  assert.ok(e.enrage > 0);
  g.enemies.hit(e, 999999);
  assert.ok(g.weapons.weapons.some((w) => w.id === "wunder"));
});
test("swept projectile collision hits a zombie between frame positions once", () => {
  let g = harness(),
    e = g.enemies.spawn("normal", 2080, 2048);
  e.hp = e.maxHp = 1000;
  g.enemies.hash.rebuild(g.enemies.pool);
  g.weapons.primary.cool = 100;
  g.weapons.shoot(g.weapons.primary, 2048, 2048, 0, 30, 0);
  g.weapons.update(0.15);
  assert.equal(e.hp, 970);
  g.weapons.update(0.01);
  assert.equal(e.hp, 970);
});
test("quick mode pickup gains and gold banking persist; shop cannot overspend", () => {
  let g = harness();
  g.pickups = new PickupManager(g);
  g.pickups.drop(g.player.x, g.player.y, "xp", 3);
  g.pickups.drop(g.player.x, g.player.y, "gold", 5);
  g.pickups.update(0.016);
  assert.equal(g.player.xp, 6);
  assert.equal(g.runGold, 10);
  let values = new Map(),
    storage = {
      getItem: (k) => values.get(k),
      setItem: (k, v) => values.set(k, v),
    },
    s = new Save(storage);
  s.bank(100, 120);
  assert.equal(s.purchase("hp", 30), true);
  assert.equal(s.data.gold, 70);
  assert.equal(s.purchase("armor", 200), false);
  let loaded = new Save(storage);
  assert.equal(loaded.data.gold, 70);
  assert.equal(loaded.data.totalGold, 100);
  assert.equal(loaded.data.shop.hp, 1);
});
test("dungeon flow field reaches separated rooms through doorways", () => {
  let w = new World("dungeon"),
    p = { x: 2140, y: 2100 };
  w.updateFlow(p, 1);
  let e = { x: 1928, y: 1928 };
  let k = ((e.x / 16) | 0) + ((e.y / 16) | 0) * 256;
  assert.ok(w.flow[k] > 0);
  let v = w.steer(e, p);
  assert.ok(v && Math.hypot(v.x, v.y) > 0);
});
test("PixelFX produces real nontransparent live procedural explosion frames", () => {
  let f = createFrame(320, 320),
    fx = createFx(explosion, { x: 160, y: 250, seed: 2 }),
    out = new Uint8ClampedArray(320 * 320 * 4);
  for (let i = 0; i < 12; i++) fx.update(1 / 60);
  fx.draw(f);
  composite(f, out);
  assert.ok(out.some((v, i) => i % 4 === 3 && v > 0));
});
test("enemy and pickup pools remain bounded under saturation", () => {
  let g = harness();
  for (let i = 0; i < 2000; i++)
    g.enemies.spawn("normal", 2000 + (i % 100), 2000);
  assert.equal(g.enemies.count, 1800);
  assert.equal(g.enemies.pool.length, 1800);
  let p = new PickupManager(g);
  for (let i = 0; i < 3000; i++) p.drop(2100, 2100, "xp", 1);
  assert.equal(p.pool.length, 2500);
  assert.equal(
    p.pool.reduce((n, e) => n + (e.active ? e.value : 0), 0),
    3000,
  );
});
test("boss events and boss chests survive pool saturation", () => {
  let g = harness();
  for (let i = 0; i < 1800; i++) g.enemies.spawn("normal", 2200, 2100);
  let boss = g.enemies.spawn("panzer", 2300, 2100);
  assert.ok(boss?.active && boss.boss);
  assert.equal(g.enemies.count, 1800);
  let p = new PickupManager(g);
  for (let i = 0; i < 2500; i++) p.drop(2100, 2100, "xp", 1);
  p.drop(2110, 2100, "chest", 75);
  assert.ok(p.pool.some((q) => q.active && q.type === "chest"));
});
test("rare Wunderwaffe is granted even with a full six-weapon loadout", () => {
  let g = harness();
  for (let id of ["bow", "knife", "fireball", "holy", "robot"])
    g.weapons.add(id);
  assert.equal(g.weapons.weapons.length, 6);
  g.weapons.add("wunder");
  assert.equal(g.weapons.weapons.length, 6);
  assert.ok(g.weapons.weapons.some((w) => w.id === "wunder"));
  assert.equal(g.weapons.primary.id, "rifle");
});
