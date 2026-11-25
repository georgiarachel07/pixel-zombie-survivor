import test from "node:test";
import assert from "node:assert/strict";
import { EnemyManager } from "../src/EnemyManager.js";
import { World } from "../src/World.js";
import { Player } from "../src/Player.js";
import { HEROES, MODES } from "../src/data.js";

const meta = { hp: 0, attack: 0, speed: 0, armor: 0, magnet: 0 };
function game() {
  const g = { canvas: { width: 640, height: 360 }, time: 60, mode: MODES.standard, modeId: "standard", player: new Player(HEROES[0], meta), world: new World("dungeon"), kills: 0, runGold: 0, audio: { effect() {} }, fx: { burst() {}, emit() {}, text() {}, shake: 0 }, toast() {}, weapons: { area() {}, onKill() {}, restore() {}, steal() { return false; }, add() {} }, pickups: { drop() {} }, director: { suppressing: true } };
  g.enemies = new EnemyManager(g); return g;
}
test("five new zombie variants have distinct combat data and throwers use pooled projectiles", () => {
  const g = game();
  const variants = ["thrower", "crawler", "runner", "tank", "exploder"].map((type, i) => g.enemies.spawn(type, 2200 + i * 20, 2048));
  assert.deepEqual(variants.map((e) => e.type), ["thrower", "crawler", "runner", "tank", "exploder"]);
  assert.ok(variants[1].radius < variants[0].radius && variants[2].speed > variants[0].speed && variants[3].armor > 0);
  const thrower = variants[0]; thrower.cool = 0; g.enemies.variantAI(thrower, 190, 190, 0, .1);
  assert.ok(g.enemies.projectiles.some((p) => p.active && p.kind === "rock"));
});
test("portal interaction is silent away from exits and consumes one key only at a portal", () => {
  const g = game(); const before = g.player.keys;
  assert.equal(g.world.interact(g), false); assert.equal(g.player.keys, before);
  const portal = g.world.obstacles.find((o) => o.kind === "portal");
  g.player.x = portal.x + portal.w / 2; g.player.y = portal.y;
  assert.equal(g.world.interact(g), true); assert.equal(g.player.keys, before - 1); assert.equal(portal.unlocked, true);
});

