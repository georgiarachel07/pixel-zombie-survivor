// Held weapons are independent of body facing: Canvas rotation uses the exact target angle.
export function drawHeldWeapon(ctx, p, x, y, time, disabled = false) {
  if (disabled) return;
  const id = p.hero.id,
    anim = p.weaponAnimation,
    active = anim && anim.age < anim.duration,
    t = active ? anim.age / anim.duration : 1;
  let angle = active ? anim.angle : p.aimAngle || 0,
    thrust = 0;
  if (p.spinTime > 0) angle += time * 22;
  if (active && ["warrior", "rogue"].includes(id))
    angle += (t - 0.5) * (id === "warrior" ? 1.9 : 1.5);
  if (active && ["paladin", "farmer"].includes(id))
    thrust = Math.sin(t * Math.PI) * 20;
  const recoil =
    active && ["soldier", "arbalist"].includes(id)
      ? Math.sin(Math.min(1, t * 2) * Math.PI) * 4
      : 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - 10));
  ctx.rotate(angle);
  if (Math.cos(angle) < 0) ctx.scale(1, -1);
  ctx.translate(7 - recoil + thrust, 0);
  const R = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  R(-3, -2, 5, 4, "#d3b08b");
  if (id === "soldier") {
    R(0, -3, 19, 6, "#617267");
    R(12, -4, 6, 2, "#a1ab95");
    R(18, -1, 8, 2, "#222b2a");
    R(4, 2, 4, 6, "#36423a");
    R(-4, -2, 6, 4, "#3f4d3c");
    if (active && t < 0.35) {
      R(25, -3, 7, 6, "#ffe4a0");
      R(30, -1, 6, 2, "#fff7df");
    }
  } else if (id === "warrior" || id === "paladin") {
    R(0, -2, 6, 4, "#76604a");
    R(5, -6, 3, 12, id === "paladin" ? "#edce77" : "#b0b7bb");
    R(
      8,
      -2,
      id === "warrior" ? 30 : 23,
      4,
      id === "paladin" ? "#fff0b0" : "#dce1e1",
    );
    R(10, -2, id === "warrior" ? 25 : 18, 1, "#ffffff");
    if (id === "paladin") {
      R(-5, 9, 10, 17, "#a5883e");
      R(-4, 8, 8, 3, "#ffe1a0");
      R(-1, 11, 2, 12, "#ffe7a5");
      R(-3, 15, 6, 2, "#ffe7a5");
    }
  } else if (id === "archer") {
    ctx.strokeStyle = "#ae8851";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, -15);
    ctx.quadraticCurveTo(26, 0, 8, 15);
    ctx.stroke();
    ctx.strokeStyle = "#e3d6b0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, -15);
    ctx.lineTo(active ? (t < 0.5 ? 2 : 8) : 8, 0);
    ctx.lineTo(8, 15);
    ctx.stroke();
    R(1, -1, 24, 2, "#c9bc8b");
    R(23, -2, 4, 4, "#d9e2ce");
  } else if (id === "rogue") {
    for (let side of [-1, 1]) {
      ctx.save();
      ctx.translate(side === 1 ? 1 : -5, side * 6);
      ctx.rotate(active ? side * (t - 0.5) * 1.7 : side * 0.3);
      R(0, -2, 5, 4, "#775b7e");
      R(5, -1, 14, 2, "#d4d9e5");
      R(4, -3, 2, 6, "#a9a3b8");
      ctx.restore();
    }
  } else if (id === "mage") {
    R(0, -2, 23, 4, "#735542");
    R(21, -5, 7, 10, "#6e86c2");
    R(23, -3, 4, 6, "#d2ddff");
    if (active) {
      R(20, -8, 11, 16, "#b2c9ff66");
      R(27, -2, 9, 4, "#f2deff");
    }
  } else if (id === "farmer") {
    R(-2, -1, 32, 3, "#9c774c");
    R(25, -7, 3, 15, "#aab7b4");
    R(27, -7, 11, 2, "#d4dcd1");
    R(27, -1, 13, 2, "#d4dcd1");
    R(27, 6, 11, 2, "#d4dcd1");
  } else if (id === "arbalist") {
    R(0, -3, 23, 6, "#7e6446");
    R(5, -12, 4, 24, "#566c72");
    R(9, -10, 3, 20, "#a5b7b6");
    R(19, -1, 13, 2, "#e1ded0");
    R(2, 4, 4, 6, "#353f3e");
    if (active && t < 0.3) R(29, -2, 8, 4, "#e7c88b");
    ctx.strokeStyle = "#a1a99a";
    ctx.beginPath();
    ctx.moveTo(8, -12);
    ctx.lineTo(active ? 3 : 11, 0);
    ctx.lineTo(8, 12);
    ctx.stroke();
  } else if (id === "ninja") {
    let r = time * 16;
    ctx.save();
    ctx.translate(active ? 9 : 3, 0);
    ctx.rotate(r);
    R(-6, -1, 12, 2, "#c1d7dc");
    R(-1, -6, 2, 12, "#c1d7dc");
    R(-2, -2, 4, 4, "#657a82");
    ctx.restore();
  }
  ctx.restore();
}
