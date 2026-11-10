const cache = new Map();
export function heroSprite(hero, frame = 0) {
  const key = "class-" + hero.id + "-" + frame;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement("canvas");
  c.width = 40;
  c.height = 48;
  const ctx = c.getContext("2d");
  const R = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const id = hero.id,
    step = frame % 2;
  const skin = "#d5b18b",
    dark = "#18232a";
  R(12, 34, 6, 8 + step, dark);
  R(23, 34, 6, 9 - step, dark);
  R(10, 39 + step, 9, 4, "#343c3b");
  R(23, 40 - step, 9, 4, "#343c3b");
  R(11, 20, 19, 16, hero.color);
  R(7, 22 + step, 5, 13, skin);
  R(30, 22 - step, 5, 13, skin);
  R(13, 8, 15, 14, skin);
  R(14, 14, 3, 2, dark);
  R(24, 14, 2, 2, dark);
  if (id === "soldier") {
    R(11, 6, 19, 7, "#62794f");
    R(8, 12, 25, 3, "#849668");
    R(11, 23, 19, 9, "#485e40");
    R(13, 24, 5, 5, "#9ba276");
    R(22, 24, 5, 5, "#9ba276");
    R(19, 20, 3, 16, "#bcaa78");
    R(8, 30, 5, 5, "#445342");
    R(29, 30, 5, 5, "#445342");
  }
  if (id === "warrior") {
    R(9, 20, 23, 16, "#778995");
    R(5, 18, 11, 8, "#a2b0b9");
    R(26, 18, 10, 8, "#a2b0b9");
    R(12, 23, 18, 5, "#bbc7cb");
    R(18, 25, 5, 11, "#526573");
    R(10, 32, 21, 3, "#b5bec1");
    R(11, 4, 19, 9, "#84939c");
    R(14, 8, 13, 6, "#354854");
    R(19, 5, 4, 16, "#b8c0bd");
    R(14, 41, 4, 3, "#aab5b7");
    R(25, 41, 4, 3, "#aab5b7");
  }
  if (id === "archer") {
    R(10, 5, 20, 14, "#365e38");
    R(13, 10, 14, 12, skin);
    R(11, 4, 18, 5, "#577c48");
    R(10, 7, 4, 18, "#406640");
    R(28, 7, 4, 18, "#406640");
    R(11, 21, 20, 15, "#567b43");
    R(13, 23, 15, 8, "#785f43");
    R(17, 20, 3, 16, "#c2a66b");
    R(8, 20, 4, 18, "#755237");
    R(6, 14, 2, 15, "#d1c495");
    R(9, 11, 2, 17, "#e1d7b4");
  }
  if (id === "rogue") {
    R(8, 17, 26, 20, "#343047");
    R(5, 30, 30, 9, "#282738");
    R(10, 3, 21, 20, "#353043");
    R(14, 10, 13, 8, "#151b2b");
    R(15, 13, 4, 2, "#cdb8e3");
    R(23, 13, 3, 2, "#cdb8e3");
    R(13, 18, 16, 6, "#5b4966");
    R(11, 24, 20, 3, "#897392");
    R(17, 27, 5, 10, "#594762");
    R(8, 23, 4, 12, "#373347");
    R(30, 23, 4, 12, "#373347");
  }
  if (id === "mage") {
    ctx.fillStyle = "#5268a0";
    ctx.beginPath();
    ctx.moveTo(12, 19);
    ctx.lineTo(5, 40);
    ctx.lineTo(35, 40);
    ctx.lineTo(28, 19);
    ctx.fill();
    R(16, 22, 4, 16, "#b5a0d5");
    R(8, 37, 26, 3, "#baafdc");
    R(8, 19, 5, 13, "#6e78ae");
    R(28, 19, 6, 13, "#6e78ae");
    ctx.fillStyle = "#657bb2";
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(9, 13);
    ctx.lineTo(31, 13);
    ctx.fill();
    R(6, 12, 29, 4, "#8096c5");
    R(20, 6, 3, 3, "#ead499");
    R(17, 20, 7, 3, "#e8dfca");
  }
  if (id === "paladin") {
    R(9, 20, 23, 16, "#c19b42");
    R(5, 18, 11, 8, "#ead180");
    R(27, 18, 10, 8, "#ead180");
    R(11, 23, 18, 5, "#ffe5a1");
    R(18, 22, 4, 13, "#f5e5b0");
    R(14, 28, 13, 3, "#f5e5b0");
    R(11, 5, 19, 10, "#d4b45f");
    R(14, 10, 13, 3, "#5f5a42");
    R(19, 3, 4, 17, "#ffe3a0");
    R(10, 35, 21, 3, "#f6dd94");
    R(30, 24, 8, 17, "#8e773c");
    R(31, 25, 6, 2, "#ffe3a0");
    R(33, 27, 2, 11, "#ffe3a0");
  }
  if (id === "ninja") {
    R(11, 20, 20, 16, "#1b2532");
    R(9, 6, 22, 16, "#202a3a");
    R(13, 12, 15, 4, "#9bafbf");
    R(15, 13, 3, 1, "#d4ecdf");
    R(24, 13, 3, 1, "#d4ecdf");
    R(12, 17, 18, 7, "#141d2c");
    R(11, 24, 20, 3, "#697b89");
    R(19, 23, 3, 14, "#44596d");
    R(30, 10, 8, 3, "#677b8c");
    R(34, 13, 4, 3, "#526b7f");
    R(8, 24, 4, 11, "#223344");
    R(30, 24, 4, 11, "#223344");
  }
  if (id === "farmer") {
    R(11, 20, 20, 16, "#9d7b51");
    R(13, 25, 17, 12, "#4e7fa1");
    R(13, 20, 3, 12, "#6d9cba");
    R(26, 20, 3, 12, "#6d9cba");
    R(16, 29, 2, 2, "#efd995");
    R(24, 29, 2, 2, "#efd995");
    R(9, 5, 23, 8, "#c9aa5f");
    R(4, 12, 33, 4, "#e3c67f");
    R(10, 10, 22, 3, "#9a793e");
    R(12, 36, 6, 7, "#4e7293");
    R(24, 36, 6, 7, "#4e7293");
  }
  if (id === "arbalist") {
    R(9, 20, 23, 16, "#66664e");
    R(8, 18, 9, 7, "#8b9c93");
    R(26, 18, 9, 7, "#8b9c93");
    R(13, 22, 16, 7, "#8d7857");
    R(17, 20, 4, 17, "#b2afa0");
    R(10, 7, 20, 6, "#627673");
    R(12, 5, 16, 4, "#91a5a0");
    R(12, 33, 19, 3, "#b0b9ae");
    R(28, 27, 4, 10, "#4c5f60");
  }
  cache.set(key, c);
  return c;
}
export function drawHero(
  ctx,
  hero,
  x,
  y,
  time,
  moving = true,
  scale = 1,
  angle = 0,
  flash = false,
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(Math.cos(angle) < 0 ? -scale : scale, scale);
  ctx.fillStyle = "#06101a88";
  ctx.beginPath();
  ctx.ellipse(0, 5, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (flash) ctx.filter = "brightness(2)";
  ctx.drawImage(heroSprite(hero, moving ? ((time * 8) | 0) % 2 : 0), -20, -38);
  ctx.restore();
}
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
