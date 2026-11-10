import test from "node:test";
import assert from "node:assert/strict";
import { Player } from "../src/Player.js";
import { EnemyManager } from "../src/EnemyManager.js";
import { WeaponSystem } from "../src/WeaponSystem.js";
import { ClassSkills } from "../src/ClassSkills.js";
import { BossDirector } from "../src/BossDirector.js";
import { PickupManager } from "../src/PickupManager.js";
import { World } from "../src/World.js";
import { HEROES, MODES, STAGES, WEAPONS, PASSIVES } from "../src/data.js";
import { inArc, inThrust, segmentRect } from "../src/Combat.js";
test('new class starter weapons and passive options are distinct and available',()=>{assert.deepEqual(HEROES.map(h=>h.weapon),['rifle','slash','bow','daggers','fireball','sword','shuriken','pitchfork','bolt']);assert.ok(WEAPONS.chainsaw&&WEAPONS.necro&&PASSIVES.crit&&PASSIVES.lifesteal);});
const meta = { hp: 0, attack: 0, speed: 0, armor: 0, magnet: 0 };
function game(hero = "soldier", stage = "forest", mode = "standard") {
  const g = {
    canvas: { width: 640, height: 360 },
    time: 0,
    modeId: mode,
    mode: MODES[mode],
    player: new Player(
      HEROES.find((h) => h.id === hero),
      meta,
    ),
    world: new World(stage),
    kills: 0,
    runGold: 0,
    input: { skill: false, interact: false },
    audio: {
      effect() {},
      setBoss(b) {
        this.boss = b;
      },
    },
    fx: { emit() {}, ring() {}, burst() {}, bolt() {}, text() {} },
    toast() {},
    end(won) {
      this.ended = won;
    },
  };
  g.enemies = new EnemyManager(g);
  g.pickups = new PickupManager(g);
  g.weapons = new WeaponSystem(g);
  g.skills = new ClassSkills(g);
  g.director = new BossDirector(g);
  return g;
}
function target(g, x = g.player.x + 45, y = g.player.y) {
  let e = g.enemies.spawn("normal", x, y);
  e.hp = e.maxHp = 10000;
  g.enemies.hash.rebuild(g.enemies.pool);
  return e;
}
test('tornado contact physically drags an enemy along the projectile path',()=>{let g=game(),e=target(g,2090,2068);g.weapons.weapons=[];let before=e.y;g.weapons.shoot({id:'tornado',level:1,evolved:false},2090,2048,0,1,25);g.weapons.update(.05);assert.ok(e.y<before);});
test('robot companions use tracking laser damage and necromancy orbs siphon health',()=>{let g=game(),e=target(g,2100,2048);g.weapons.weapons=[];g.weapons.add('robot');let hp=e.hp;g.weapons.update(.016);assert.ok(e.hp<hp&&g.weapons.lasers.some(l=>l.life>0));assert.equal(g.weapons.projectiles.some(p=>p.active),false);g.weapons.weapons=[];g.weapons.add('necro');g.player.hp-=10;let playerHP=g.player.hp;g.weapons.update(.016);assert.ok(g.player.hp>playerHP);});
test('Thunderbolt high-HP targeting excludes off-screen enemies',()=>{let g=game();let normal=target(g,2100,2048),hidden=target(g,3000,2048);normal.hp=100;hidden.hp=1e7;g.enemies.hash.rebuild(g.enemies.pool);for(let i=0;i<10;i++)assert.equal(g.weapons.target(true),normal);});
test('boss signals cancel pending grave risings during the horde break',()=>{let g=game('soldier','graveyard');g.world.rising.push({x:2100,y:2100,delay:.1});g.time=120;g.director.update();assert.equal(g.world.rising.length,0);g.world.graveClock=0;g.world.update(.2,g);assert.equal(g.world.rising.length,0);});
test("all modes use elapsed boss signals exactly every 120 seconds, repeating the roster", () => {
  for (let mode of Object.keys(MODES)) {
    let g = game("soldier", "forest", mode);
    for (let t of [119.99, 120, 120, 239.99, 240, 360, 480, 600]) {
      g.time = t;
      g.director.update();
    }
    assert.deepEqual(
      g.director.events.map((e) => e.at),
      [120, 240, 360, 480, 600],
    );
    assert.equal(g.director.events.length, 5);
    assert.equal(g.audio.boss, true);
    if (mode === "standard") {
      g.time = 720;
      g.director.update();
      assert.equal(g.director.events[5].type, "panzer");
    }
  }
});
test("boss signal disperses regular hordes and suppresses spawning for six seconds", () => {
  let g = game();
  for (let i = 0; i < 50; i++) g.enemies.spawn("normal", 2200, 2100);
  g.time = 120;
  g.director.update();
  assert.equal(g.enemies.pool.filter((e) => e.active && !e.boss).length, 0);
  g.enemies.update(0.016);
  assert.equal(g.enemies.pool.filter((e) => e.active && !e.boss).length, 0);
  assert.equal(g.enemies.count, 1);
  g.time = 126.5;
  g.enemies.update(0.4);
  assert.ok(g.enemies.pool.some((e) => e.active && !e.boss));
});
test("all five bosses guarantee a chest, including after both Megaton halves", () => {
  for (let type of ["panzer", "margwa", "george", "thief", "megaton"]) {
    let g = game(),
      e = g.enemies.spawn(type, 2250, 2050);
    e.encounter = 10;
    e.timed = true;
    e.phase = 3;
    g.enemies.hit(e, 1e8);
    if (type === "margwa") {
      g.enemies.hit(e, 1e8);
      g.enemies.hit(e, 1e8);
    }
    if (type === "megaton") {
      let halves = g.enemies.pool.filter((n) => n.active && n.half);
      assert.equal(
        g.pickups.pool.some((q) => q.active && q.type === "chest"),
        false,
      );
      for (let h of halves) g.enemies.hit(h, 1e8);
    }
    assert.equal(
      g.pickups.pool.filter((q) => q.active && q.type === "chest").length,
      1,
      type,
    );
  }
});
test("arc and thrust hitboxes distinguish front, rear and side targets", () => {
  assert.ok(inArc(45, 0, 0, 0, 0, 70, 1.7, 8));
  assert.equal(inArc(-45, 0, 0, 0, 0, 70, 1.7, 8), false);
  assert.ok(inThrust(75, 4, 0, 0, 0, 90, 9, 8));
  assert.equal(inThrust(20, 35, 0, 0, 0, 90, 9, 8), false);
  assert.ok(segmentRect(0, 0, 100, 0, { x: 40, y: -10, w: 10, h: 20 }));
  assert.equal(
    segmentRect(0, 40, 100, 40, { x: 40, y: -10, w: 10, h: 20 }),
    false,
  );
});
test("greatsword hits once per swing in its swept front arc and produces knockback", () => {
  let g = game("warrior"),
    front = target(g, 2098, 2048),
    back = target(g, 1998, 2048);
  g.enemies.hash.rebuild(g.enemies.pool);
  g.weapons.beginMelee(g.weapons.primary, 0, 50, 76);
  for (let i = 0; i < 28; i++) g.weapons.updateMelee(1 / 60);
  assert.equal(front.hp, 9950);
  assert.equal(back.hp, 10000);
  assert.ok(front.kx > 0);
});
test("chain saw applies real damage over time, not only a visual bleed effect", () => {
  let g = game(),
    e = target(g);
  g.enemies.hit(e, 10, { bleed: 20 });
  let hp = e.hp;
  g.enemies.spawnClock = 100;
  for (let i = 0; i < 30; i++) {
    g.time += 1 / 60;
    g.enemies.update(1 / 60);
  }
  assert.ok(e.hp <= hp - 10);
  assert.ok(WEAPONS.chainsaw.melee && PASSIVES.crit && PASSIVES.lifesteal);
});
test("supply crate waits for impact and drops a collectible timed rapid-fire buff", () => {
  let g = game(),
    e = target(g);
  g.skills.activate();
  g.skills.update(0.5);
  assert.equal(e.hp, 10000);
  g.skills.update(0.71);
  assert.ok(e.hp < 10000);
  let buff = g.pickups.pool.find((q) => q.active && q.type === "rapid");
  assert.ok(buff);
  buff.x = g.player.x;
  buff.y = g.player.y;
  g.pickups.update(0.016);
  assert.equal(g.player.fireBuff, 6);
});
test("arrow rain resolves after one second and class skills respect cooldowns", () => {
  let g = game("archer"),
    e = target(g);
  assert.equal(g.skills.activate(), true);
  assert.equal(g.skills.activate(), false);
  g.skills.update(0.99);
  assert.equal(e.hp, 10000);
  g.skills.update(0.02);
  assert.ok(e.hp < 10000);
});
test("Shadow Dash teleports, grants 1.5s immunity, and its trail bleeds enemies", () => {
  let g = game("rogue"),
    e = target(g, 2100, 2048),
    x = g.player.x;
  g.skills.activate();
  assert.ok(g.player.x > x + 120);
  assert.equal(g.player.immunity, 1.5);
  g.skills.update(0.016);
  assert.ok(e.bleedTime > 0);
  let hp = g.player.hp;
  g.player.hurt(999, g);
  assert.equal(g.player.hp, hp);
});
test("Divine Aegis gives four seconds of full immunity and damages a nearby enemy", () => {
  let g = game("paladin"),
    e = target(g, 2070, 2048);
  g.skills.activate();
  assert.equal(g.player.immunity, 4);
  g.player.hurt(99999, g);
  assert.equal(g.player.hp, g.player.maxHp);
  g.skills.update(0.3);
  assert.ok(e.hp < 10000);
});
test("Supernova expands through a target once and leaves incendiary damage", () => {
  let g = game("mage"),
    e = target(g, 2140, 2048);
  g.skills.activate();
  for (let i = 0; i < 80; i++) g.skills.update(1 / 60);
  assert.ok(e.hp < 10000 && e.bleedTime > 0);
  assert.ok(e.hp >= 9700);
});
test("two shadow clones mirror movements and primary firing for six seconds", () => {
  let g = game("ninja");
  g.skills.activate();
  g.skills.update(0.1);
  assert.equal(g.skills.cloneTime, 5.9);
  g.player.x += 70;
  g.skills.update(0.1);
  assert.equal(g.skills.clones[0].x, g.player.x - 32);
  g.skills.mirrorAttack(g.weapons.primary, 0, 20, 0);
  assert.equal(g.weapons.projectiles.filter((b) => b.active).length, 2);
  g.skills.update(6);
  assert.equal(g.skills.cloneTime, 0);
});
test("Harvest Bounty guarantees triple gold and XP when marked enemies die", () => {
  let g = game("farmer"),
    e = target(g);
  g.skills.activate();
  assert.equal(e.bounty, 1);
  g.enemies.hit(e, 1e8);
  let xp = g.pickups.pool.find((q) => q.active && q.type === "xp"),
    gold = g.pickups.pool.find((q) => q.active && q.type === "gold");
  assert.ok(xp.value === 3 || xp.value === 15);
  assert.equal(gold.value, 3);
});
test("Ballista Bolt ignores armor, pierces every target, and crosses a full viewport", () => {
  let g = game("arbalist"),
    e = target(g);
  e.armor = 9999;
  g.skills.activate();
  let b = g.weapons.projectiles.find((b) => b.active);
  assert.equal(b.ballista, true);
  assert.ok(b.vx * b.life > g.canvas.width);
  assert.equal(b.pierce, 1800);
  g.weapons.primary.cool = 100;
  g.weapons.update(0.1);
  assert.ok(e.hp < 10000);
});
test("stage mechanics: destructible tombs, locked doors, damaging lava and explosive barrels", () => {
  assert.equal(Object.keys(STAGES).length, 5);
  let grave = game("soldier", "graveyard"),
    tomb = grave.world.obstacles.find((o) => o.kind === "tomb");
  grave.world.damageObject(tomb, 1000, grave);
  assert.equal(tomb.active, false);
  grave.world.graveClock = 0.01;
  grave.world.update(0.02, grave);
  assert.ok(grave.world.rising.length > 0);
  grave.world.update(1.1, grave);
  assert.ok(grave.enemies.count >= 2);
  let dungeon = game("soldier", "dungeon"),
    door = dungeon.world.obstacles.find((o) => o.kind === "door");
  dungeon.player.x = door.x + door.w / 2;
  dungeon.player.y = door.y - 25;
  dungeon.world.interact(dungeon);
  assert.equal(door.active, false);
  assert.equal(dungeon.player.keys, 1);
  let lava = game("soldier", "volcano");
  assert.equal(lava.world.inLava(2048, 1750), true);
  assert.equal(lava.world.inLava(1888, 1750), false);
  lava.player.x = 2048;
  lava.player.y = 1750;
  let z = target(lava, 2040, 1750),
    hp = z.hp;
  lava.world.update(0.6, lava);
  assert.ok(lava.player.hp < lava.player.maxHp && z.hp < hp);
  let base = game("soldier", "base"),
    barrel = base.world.obstacles.find((o) => o.kind === "barrel");
  let enemy = target(base, barrel.x + 30, barrel.y),
    old = enemy.hp;
  base.world.damageSegment(
    barrel.x - 15,
    barrel.y + 5,
    barrel.x + 20,
    barrel.y + 5,
    100,
    base,
  );
  assert.equal(barrel.active, false);
  assert.ok(enemy.hp < old);
});
test("boots and crit passives change actual stats; medallion heals only on kills", () => {
  let g = game(),
    p = g.player;
  p.passives.boots = 3;
  p.passives.crit = 4;
  p.passives.magnet = 5;
  p.passives.lifesteal = 5;
  assert.ok(
    p.speed > p.baseSpeed &&
      p.critChance > 0.3 &&
      p.critMultiplier > 2.5 &&
      p.magnet > 300,
  );
  p.hp -= 10;
  let before = p.hp,
    random = Math.random;
  try {
    Math.random = () => 0.01;
    let e = target(g);
    g.enemies.hit(e, 1e8);
    assert.equal(p.hp, before + 1);
  } finally {
    Math.random = random;
  }
});
