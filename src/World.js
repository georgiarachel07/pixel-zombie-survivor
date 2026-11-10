export class World {
  constructor(stage) {
    this.stage = stage;
    this.size = 4096;
    this.obstacles = [];
    if (stage === "dungeon") {
      // Repeating rooms with wide doorways; continuous openings keep rooms reachable.
      for (let x = 1600; x <= 2496; x += 224)
        for (let y = 1600; y <= 2496; y += 224) {
          this.obstacles.push(
            { x, y, w: 72, h: 18 },
            { x: x + 144, y, w: 80, h: 18 },
            { x, y: y + 18, w: 18, h: 64 },
            { x, y: y + 154, w: 18, h: 70 },
          );
        }
    } else {
      for (let i = 0; i < 100; i++) {
        let x = 1480 + ((i * 317) % 1190),
          y = 1480 + ((i * 197) % 1190);
        if (Math.hypot(x - 2048, y - 2048) > 100)
          this.obstacles.push({ x, y, w: 18, h: 15 });
      }
    }
    this.flowClock = 0;
    this.flowCell = -1;
    if (stage === "dungeon") {
      this.gridSize = 256;
      this.gridCell = 16;
      let n = this.gridSize ** 2;
      this.flow = new Int32Array(n);
      this.flow.fill(-1);
      this.solid = new Uint8Array(n);
      this.queue = new Int32Array(n);
      for (let i = 0; i < n; i++)
        this.solid[i] = this.blocked(
          (i % 256) * 16 + 8,
          ((i / 256) | 0) * 16 + 8,
          10,
        )
          ? 1
          : 0;
    }
  }
  updateFlow(player, dt) {
    if (!this.flow) return;
    this.flowClock -= dt;
    let cell = Math.floor(player.x / 16) + Math.floor(player.y / 16) * 256;
    if (this.flowClock > 0 || cell === this.flowCell) return;
    this.flowClock = 0.3;
    this.flowCell = cell;
    this.flow.fill(-1);
    let first = 0,
      last = 0;
    this.queue[last++] = cell;
    this.flow[cell] = 0;
    while (first < last) {
      let k = this.queue[first++],
        x = k % 256,
        y = (k / 256) | 0;
      for (let dir = 0; dir < 4; dir++) {
        let j = k + (dir === 0 ? 1 : dir === 1 ? -1 : dir === 2 ? 256 : -256);
        if (
          (dir === 0 && x === 255) ||
          (dir === 1 && x === 0) ||
          (dir === 2 && y === 255) ||
          (dir === 3 && y === 0)
        )
          continue;
        if (!this.solid[j] && this.flow[j] === -1) {
          this.flow[j] = this.flow[k] + 1;
          this.queue[last++] = j;
        }
      }
    }
  }
  steer(e, player) {
    if (!this.flow) return null;
    let x = Math.floor(e.x / 16),
      y = Math.floor(e.y / 16),
      k = x + y * 256,
      best = this.flow[k],
      next = k;
    if (best < 0) return null;
    for (let dir = 0; dir < 4; dir++) {
      let j = k + (dir === 0 ? 1 : dir === 1 ? -1 : dir === 2 ? 256 : -256);
      if (
        j < 0 ||
        j >= this.flow.length ||
        (dir === 0 && x === 255) ||
        (dir === 1 && x === 0)
      )
        continue;
      if (this.flow[j] >= 0 && this.flow[j] < best) {
        best = this.flow[j];
        next = j;
      }
    }
    if (next === k) return null;
    this.route ??= { x: 0, y: 0 };
    this.route.x = (next % 256) * 16 + 8 - e.x;
    this.route.y = ((next / 256) | 0) * 16 + 8 - e.y;
    return this.route;
  }
  blocked(x, y, r) {
    if (x < r || y < r || x > this.size - r || y > this.size - r) return true;
    for (let o of this.obstacles)
      if (x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h)
        return true;
    return false;
  }
  move(entity, dx, dy) {
    let steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 7),
    );
    for (let i = 0; i < steps; i++) {
      let x = entity.x + dx / steps,
        y = entity.y + dy / steps;
      if (!this.blocked(x, entity.y, entity.radius)) entity.x = x;
      if (!this.blocked(entity.x, y, entity.radius)) entity.y = y;
    }
  }
  draw(ctx, cx, cy, w, h, time) {
    const dungeon = this.stage === "dungeon";
    ctx.fillStyle = dungeon ? "#1b2024" : "#1b2c20";
    ctx.fillRect(0, 0, w, h);
    const tile = 32,
      x0 = Math.floor(cx / tile),
      y0 = Math.floor(cy / tile);
    for (let y = y0; y < (cy + h) / tile; y++)
      for (let x = x0; x < (cx + w) / tile; x++) {
        let n = Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1,
          sx = x * tile - cx,
          sy = y * tile - cy;
        if (dungeon) {
          ctx.strokeStyle = "#293032";
          ctx.strokeRect(sx, sy, 31, 31);
          ctx.fillStyle = "#313637";
          if (n > 0.6) ctx.fillRect(sx + 5, sy + 7, 8, 2);
        } else {
          ctx.fillStyle = n > 0.5 ? "#273b28" : "#233526";
          ctx.fillRect(sx + 4 + ((n * 15) | 0), sy + 8, 2, 3);
          ctx.fillRect(sx + 19, sy + 24, 3, 1);
          if (n > 0.92) {
            ctx.fillStyle = "#a0a866";
            ctx.fillRect(sx + 12, sy + 18, 2, 2);
          }
        }
      }
    for (let o of this.obstacles) {
      const x = o.x - cx,
        y = o.y - cy;
      if (x < -100 || y < -100 || x > w + 100 || y > h + 100) continue;
      if (dungeon) {
        ctx.fillStyle = "#10171b";
        ctx.fillRect(x + 3, y + 6, o.w, o.h + 6);
        ctx.fillStyle = "#414b48";
        ctx.fillRect(x, y - 8, o.w, o.h + 8);
        ctx.fillStyle = "#5b6555";
        ctx.fillRect(x, y - 8, o.w, 3);
        ctx.strokeStyle = "#293431";
        for (let j = 0; j < o.w; j += 20)
          ctx.strokeRect(x + j, y - 5, 19, o.h + 4);
      } else {
        ctx.fillStyle = "#101e16";
        ctx.fillRect(x - 10, y + 8, 40, 11);
        ctx.fillStyle = "#524532";
        ctx.fillRect(x + 5, y - 7, 7, 24);
        ctx.fillStyle = "#101f17";
        ctx.fillRect(x - 12, y - 36, 44, 27);
        ctx.fillStyle = "#2c492d";
        ctx.fillRect(x - 8, y - 42, 36, 22);
        ctx.fillStyle = "#385535";
        ctx.fillRect(x - 3, y - 46, 24, 15);
        ctx.fillStyle = "#45603b";
        ctx.fillRect(x, y - 44, 14, 3);
      }
    }
    // Drifting fireflies, deterministic; no allocation or particle simulation.
    if (!dungeon)
      for (let i = 0; i < 22; i++) {
        let x = (i * 151 + Math.sin(time * 0.3 + i) * 18 - cx * 0.1) % w,
          y = (i * 79 + Math.cos(time * 0.2 + i) * 12 - cy * 0.1) % h;
        ctx.fillStyle = `rgba(195,217,128,${0.25 + 0.25 * Math.sin(time * 2 + i)})`;
        ctx.fillRect((x + w) % w, (y + h) % h, 1, 1);
      }
  }
}
