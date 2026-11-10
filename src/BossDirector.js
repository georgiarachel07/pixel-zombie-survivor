import { BOSS_SCHEDULE } from "./data.js";
// This clock deliberately uses elapsed simulation time, never mode.pace or the countdown display.
export class BossDirector {
  constructor(game) {
    this.game = game;
    this.nextSpawn = 120;
    this.index = 0;
    this.suppressUntil = 0;
    this.events = [];
  }
  update() {
    const g = this.game;
    while (
      g.time + 1e-6 >= this.nextSpawn &&
      this.nextSpawn <= g.mode.duration
    ) {
      const timestamp = this.nextSpawn,
        entry = BOSS_SCHEDULE[this.index % BOSS_SCHEDULE.length];
      for (let e of g.enemies.pool)
        if (e.active && !e.boss && !e.half) g.enemies.remove(e);
      for (let p of g.enemies.projectiles) p.active = false;
      this.suppressUntil = timestamp + 6;
      const boss = g.enemies.spawn(entry.type);
      if (boss) {
        boss.timed = true;
        boss.encounter = ++this.index;
        this.events.push({
          at: timestamp,
          type: entry.type,
          id: boss.encounter,
        });
      }
      this.nextSpawn += 120;
      g.toast(
        `${String(timestamp / 60).padStart(2, "0")}:00 · ${entry.name.toUpperCase()}`,
        4,
      );
    }
    const active = g.enemies.pool.some((e) => e.active && (e.boss || e.half));
    g.audio.setBoss?.(active);
  }
  get suppressing() {
    return this.game.time < this.suppressUntil;
  }
}
