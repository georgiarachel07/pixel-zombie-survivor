export class Player {
  constructor(hero, meta) {
    this.hero = hero;
    this.x = 2048;
    this.y = 2048;
    this.radius = 9;
    this.maxHp = hero.hp + meta.hp * 10;
    this.hp = this.maxHp;
    this.baseSpeed = hero.speed * (1 + meta.speed * 0.03);
    this.attack = 1 + meta.attack * 0.05;
    this.baseArmor = (hero.armor || 0) + meta.armor;
    this.baseMagnet = 52 + meta.magnet * 12;
    this.passives = {};
    this.level = 1;
    this.xp = 0;
    this.need = 9;
    this.invulnerable = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.facing = 1;
    this.moving = false;
    this.aimAngle = 0;
    this.immunity = 0;
    this.fireBuff = 0;
    this.spinTime = 0;
    this.keys = 2;
    this.lastX = 1;
    this.lastY = 0;
  }
  get speed() {
    return this.baseSpeed * (1 + (this.passives.boots || 0) * 0.1);
  }
  get armor() {
    return this.baseArmor + (this.passives.armor || 0) * 2;
  }
  get magnet() {
    return this.baseMagnet + (this.passives.magnet || 0) * 55;
  }
  get damage() {
    return this.attack * (1 + (this.passives.battery || 0) * 0.12);
  }
  get critChance() {
    return Math.min(
      0.9,
      0.05 + (this.hero.crit || 0) + (this.passives.crit || 0) * 0.07,
    );
  }
  get critMultiplier() {
    return 2 + (this.passives.crit || 0) * 0.2;
  }
  update(dt, input, world) {
    this.immunity = Math.max(0, this.immunity - dt);
    this.fireBuff = Math.max(0, this.fireBuff - dt);
    this.spinTime = Math.max(0, this.spinTime - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    let x =
        Number(input.keys.has("d") || input.keys.has("arrowright")) -
        Number(input.keys.has("a") || input.keys.has("arrowleft")) +
        input.touchX,
      y =
        Number(input.keys.has("s") || input.keys.has("arrowdown")) -
        Number(input.keys.has("w") || input.keys.has("arrowup")) +
        input.touchY;
    let len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    this.moving = len > 0.05;
    if (this.moving) {
      this.lastX = x;
      this.lastY = y;
      if (x) this.facing = Math.sign(x);
    }
    if (input.dash && this.dashCooldown <= 0) {
      this.dashTimer = 0.18;
      this.dashCooldown = 3;
      this.invulnerable = 0.25;
    }
    input.dash = false;
    let speed = this.speed;
    if (this.dashTimer > 0) {
      x = this.lastX;
      y = this.lastY;
      speed *= 3.5;
    }
    world.move(this, x * speed * dt, y * speed * dt);
  }
  hurt(amount, game) {
    if (this.invulnerable > 0 || this.immunity > 0) return;
    if (
      Math.random() <
      Math.min(0.7, (this.hero.dodge || 0) + (this.passives.boots || 0) * 0.03)
    ) {
      game.fx.text(this.x, this.y, "DODGE", "#b7e4db");
      this.invulnerable = 0.25;
      return;
    }
    this.hp = Math.max(0, this.hp - Math.max(1, amount - this.armor));
    this.invulnerable = 0.65;
    game.fx.flash = 0.14;
    game.fx.shake = 4;
    game.audio.effect("hurt");
    if (this.hp <= 0) game.end(false);
  }
  addXP(value) {
    this.xp += value;
    return this.xp >= this.need;
  }
  levelUp() {
    this.xp -= this.need;
    this.level++;
    this.need = Math.floor(9 + this.level * 5 + this.level ** 1.35);
    this.hp = Math.min(this.maxHp, this.hp + 8);
  }
}
