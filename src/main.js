import { Player } from "./Player.js";
import { EnemyManager } from "./EnemyManager.js";
import { WeaponSystem } from "./WeaponSystem.js";
import { PickupManager } from "./PickupManager.js";
import { FXManager } from "./FXManager.js";
import { World } from "./World.js";
import { Save } from "./Save.js";
import { UI } from "./UI.js";
import { AudioManager } from "./Audio.js";
import { Input } from "./Input.js";
import { ClassSkills } from "./ClassSkills.js";
import { BossDirector } from "./BossDirector.js";
import { drawHero, drawSprite } from "./Sprites.js";
import { HEROES, MODES } from "./data.js";

export class Game {
  constructor() {
    this.canvas = document.querySelector("#game");
    this.ctx = this.canvas.getContext("2d", { alpha: false });
    this.canvas.width = 640;
    this.canvas.height = 360;
    this.ctx.imageSmoothingEnabled = false;
    this.state = "menu";
    this.save = new Save();
    this.audio = new AudioManager(this.save);
    this.input = new Input(this);
    this.fx = new FXManager();
    this.world = new World("forest");
    this.ui = new UI(this);
    this.expanded = false;
    this.time = 0;
    this.kills = 0;
    this.runGold = 0;
    this.lastTime = 0;
    this.accumulator = 0;
    this.uiClock = 0;
    this.ambientTime = 0;
    this.toastTime = 0;
    this.errors = [];
    this.ui.menu();
    this.resizeObserver = new ResizeObserver((entries) => {
      let { width, height } = entries[0].contentRect;
      let ratio = width / height;
      this.canvas.width = ratio < 1 ? 480 : 640;
      this.canvas.height = Math.round(this.canvas.width / ratio);
      this.ctx.imageSmoothingEnabled = false;
    });
    this.resizeObserver.observe(document.querySelector("#arena"));
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }
  async start(heroId, stage, modeId) {
    let hero = HEROES.find((h) => h.id === heroId);
    if (!hero || (hero.unlock && this.save.data.totalGold < hero.unlock))
      return;
    this.modeId = modeId;
    this.mode = MODES[modeId];
    this.player = new Player(hero, this.save.data.shop);
    this.world = new World(stage);
    if (this.world.blocked(this.player.x, this.player.y, this.player.radius)) {
      for (let i = 0; i < 50; i++) {
        let x = 2048 + i * 4;
        if (!this.world.blocked(x, 2048, this.player.radius)) {
          this.player.x = x;
          break;
        }
      }
    }
    this.fx = new FXManager();
    this.enemies = new EnemyManager(this);
    this.pickups = new PickupManager(this);
    this.weapons = new WeaponSystem(this);
    if (hero.id === "paladin") this.weapons.add("holy");
    this.skills = new ClassSkills(this);
    this.director = new BossDirector(this);
    this.audio.setBoss(false);
    this.kills = 0;
    this.runGold = 0;
    this.time = 0;
    this.accumulator = 0;
    this.banked = false;
    this.state = "playing";
    this.input.clear();
    this.ui.begin();
    this.toast("WASD MOVE · SPACE DASH · E CLASS SKILL · F UNLOCK DOOR", 5);
    try {
      await this.audio.unlock();
    } catch {
      this.toast("AUDIO UNAVAILABLE · THE GAME IS STILL PLAYABLE", 3);
    }
  }
  togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.input.clear();
      this.ui.pause();
    } else if (this.state === "paused") {
      this.ui.overlay.innerHTML = "";
      this.state = "playing";
      this.input.clear();
      this.accumulator = 0;
    }
    this.audio.suspended = this.state === "paused";
  }
  toast(text, seconds = 2.5) {
    document.querySelector("#toast").textContent = text;
    this.toastTime = seconds;
  }
  end(won, extracted = false) {
    if (this.banked || !this.player) return;
    this.banked = true;
    this.state = "ended";
    this.input.clear();
    this.runGold = Math.floor(this.runGold + (won ? 100 * this.mode.mult : 0));
    this.save.bank(this.runGold, this.kills);
    this.audio.suspended = false;
    this.audio.setBoss(false);
    this.ui.result(won, extracted);
    this.toastTime = 0;
    document.querySelector("#toast").textContent = "";
  }
  update(dt) {
    this.time += dt;
    this.player.update(dt, this.input, this.world);
    this.director.update();
    this.world.update(dt, this);
    if (this.state !== "playing") return;
    this.skills.update(dt);
    this.enemies.update(dt);
    if (this.state !== "playing") return;
    this.weapons.update(dt);
    if (this.state !== "playing") return;
    this.pickups.update(dt);
    this.fx.update(dt);
    if (this.player.xp >= this.player.need) {
      this.player.levelUp();
      this.ui.levelUp();
    }
    if (
      this.time >= this.mode.duration &&
      this.state === "playing" &&
      (this.modeId === "speedrun" ||
        !this.enemies.pool.some((e) => e.active && (e.boss || e.half)))
    )
      this.end(this.modeId !== "speedrun");
    this.audio.intensity = Math.min(1, this.enemies.count / 350);
  }
  frame(now) {
    let dt = this.lastTime ? Math.min(0.1, (now - this.lastTime) / 1000) : 0;
    this.lastTime = now;
    this.ambientTime += dt;
    if (this.toastTime > 0) {
      this.toastTime -= dt;
      if (this.toastTime <= 0)
        document.querySelector("#toast").textContent = "";
    }
    try {
      if (this.state === "playing") {
        this.accumulator += dt;
        let steps = 0;
        while (
          this.accumulator >= 1 / 60 &&
          steps++ < 5 &&
          this.state === "playing"
        ) {
          this.update(1 / 60);
          this.accumulator -= 1 / 60;
        }
        if (this.state !== "playing" || steps >= 5) this.accumulator = 0;
        this.uiClock += dt;
        if (this.uiClock > 0.1) {
          this.uiClock = 0;
          this.ui.update();
        }
      }
      this.draw();
    } catch (error) {
      console.error(error);
      this.errors.push(error.message);
      if (this.state === "playing") {
        this.state = "paused";
        this.toast("GAME PAUSED · SEE CONSOLE FOR DIAGNOSTICS", 8);
        this.ui.pause();
      }
    }
    requestAnimationFrame(this.frame);
  }
  draw() {
    const ctx = this.ctx,
      w = this.canvas.width,
      h = this.canvas.height;
    let p = this.player,
      ambient = this.state === "menu",
      cx = ambient
        ? 1800 + Math.sin(this.ambientTime * 0.06) * 15
        : p
          ? p.x - w / 2
          : 1800,
      cy = ambient ? 1850 : p ? p.y - h / 2 : 1850;
    ctx.save();
    let shake = this.fx.reduced ? 0 : this.fx.shake;
    if (shake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * shake,
        (Math.random() - 0.5) * shake,
      );
    }
    this.world.draw(ctx, cx, cy, w, h, this.ambientTime);
    if (!ambient && p) {
      this.pickups.draw(ctx, cx, cy, this.ambientTime, w, h);
      this.enemies.draw(ctx, cx, cy, this.ambientTime, w, h);
      if (this.weapons.weapons.some((x) => x.id === "holy")) {
        ctx.strokeStyle = "#e4d89766";
        ctx.lineWidth = 1;
        ctx.beginPath();
        let radius =
          62 *
          (1 +
            (this.weapons.weapons.find((x) => x.id === "holy").level - 1) *
              0.1);
        ctx.ellipse(
          p.x - cx,
          p.y - cy,
          radius,
          radius * 0.72,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      drawHero(
        ctx,
        p.hero,
        p.x - cx,
        p.y - cy,
        this.time,
        p.moving,
        1,
        p.aimAngle,
        p.invulnerable > 0.1 && ((this.time * 12) | 0) % 2 === 0,
      );
      this.weapons.draw(ctx, cx, cy, this.time);
      this.skills.draw(ctx, cx, cy, this.time);
      this.fx.draw(ctx, cx, cy);
      if (p.dashCooldown <= 0) {
        ctx.fillStyle = "#e1c681";
        ctx.fillRect(p.x - cx - 5, p.y - cy + 11, 10, 1);
      }
    } else {
      for (let i = 0; i < 10; i++) {
        let x = 370 + ((i * 89) % 220),
          y = 100 + ((i * 59) % 225);
        drawSprite(
          ctx,
          "zombie",
          ["#617656", "#84906b", "#637e6b"][i % 3],
          x + Math.sin(this.ambientTime * 0.3 + i) * 10,
          y + Math.cos(this.ambientTime * 0.2 + i) * 6,
          this.ambientTime + i,
          true,
          0.9,
          -1,
        );
      }
      drawSprite(
        ctx,
        "hero",
        "#84a877",
        410,
        225,
        this.ambientTime,
        false,
        1,
        1,
      );
      ctx.strokeStyle = "#e3cc7c44";
      ctx.beginPath();
      ctx.ellipse(410, 224, 48, 20, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#d6d2a155";
      for (let i = 0; i < 5; i++) ctx.fillRect(430 + i * 18, 210 - i * 4, 3, 1);
    }
    this.world.drawAtmosphere(ctx, cx, cy, w, h, this.ambientTime);
    const v = ctx.createRadialGradient(
      w / 2,
      h / 2,
      h * 0.2,
      w / 2,
      h / 2,
      w * 0.65,
    );
    v.addColorStop(0, "#08120c00");
    v.addColorStop(1, "#030a08c9");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
    if (this.fx.flash > 0 && !this.fx.reduced) {
      ctx.fillStyle = `rgba(255,240,218,${this.fx.flash * 1.5})`;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }
}
const game = new Game();
// Read-only diagnostic snapshot for local QA; no debug cheats exposed to public play.
Object.defineProperty(window, "deadwoodDiagnostics", {
  get: () => ({
    state: game.state,
    time: game.time,
    kills: game.kills,
    enemies: game.enemies?.count || 0,
    level: game.player?.level || 0,
    hp: game.player?.hp || 0,
    errors: [...game.errors],
    weapons:
      game.weapons?.weapons.map((w) => ({
        id: w.id,
        level: w.level,
        evolved: w.evolved,
      })) || [],
  }),
});
