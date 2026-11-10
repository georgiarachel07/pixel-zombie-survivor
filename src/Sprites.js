const cache = new Map();
export function sprite(kind, color = "#8ba774", variant = 0) {
  let key = kind + color + variant;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 40;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  const rect = (a, b, w, h, col) => {
    x.fillStyle = col;
    x.fillRect(a, b, w, h);
  };
  let boss = kind === "boss";
  if (boss) {
    rect(5, 12, 23, 19, "#172019");
    rect(7, 10, 19, 18, color);
    rect(2, 16, 6, 16, color);
    rect(26, 16, 5, 16, color);
    rect(8, 30, 6, 7, "#292c26");
    rect(21, 30, 6, 7, "#292c26");
    rect(9, 2, 15, 13, color);
    rect(11, 6, 4, 3, "#ffdf89");
    rect(19, 6, 4, 3, "#ffdf89");
    rect(13, 13, 8, 3, "#392b22");
    rect(11, 18, 12, 3, "#ffffff33");
  } else {
    let zombie = kind === "zombie",
      step = variant % 2;
    rect(9, 27, 5, 8 + (step ? 2 : 0), "#19241f");
    rect(18, 27, 5, 8 + (step ? 0 : 2), "#19241f");
    rect(8, 15, 16, 14, color);
    rect(5, 17 + step, 4, 11, zombie ? "#78906b" : "#d0ac83");
    rect(24, 17 - step, 4, 11, zombie ? "#78906b" : "#d0ac83");
    rect(10, 5, 12, 12, zombie ? "#8eac79" : "#cfb08a");
    rect(10, 4, 12, 4, zombie ? "#3d5040" : color);
    if (!zombie) {
      rect(8, 7, 16, 3, color);
      rect(18, 20, 13, 4, "#64766a");
      rect(27, 19, 4, 3, "#26302c");
      rect(10, 21, 12, 3, "#4e5c3e");
      rect(14, 15, 4, 5, "#e4d4b0");
    }
    rect(11, 10, 3, 2, zombie ? "#ffd778" : "#28352a");
    rect(19, 10, 2, 2, zombie ? "#ffd778" : "#28352a");
    if (zombie) {
      rect(17, 16, 4, 7, "#6f4b44");
      rect(11, 14, 7, 2, "#354936");
    }
    rect(9, 29, 5, 2, "#536348");
    rect(18, 29, 5, 2, "#536348");
  }
  cache.set(key, c);
  return c;
}
export function drawSprite(
  ctx,
  kind,
  color,
  x,
  y,
  time,
  moving = true,
  scale = 1,
  flip = 1,
  flash = false,
) {
  let s = sprite(kind, color, moving ? ((time * 8) | 0) % 2 : 0);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(flip * scale, scale);
  ctx.fillStyle = "#08110b88";
  ctx.beginPath();
  ctx.ellipse(0, 5, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (flash) ctx.filter = "brightness(2.5)";
  ctx.drawImage(s, -16, -30);
  ctx.restore();
}
