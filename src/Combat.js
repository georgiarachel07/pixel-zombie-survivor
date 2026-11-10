export const TAU = Math.PI * 2;
export const angleDelta = (a, b) =>
  Math.atan2(Math.sin(a - b), Math.cos(a - b));
export function inArc(x, y, ox, oy, angle, reach, width, radius = 0) {
  let dx = x - ox,
    dy = y - oy,
    d = Math.hypot(dx, dy);
  return (
    d <= reach + radius &&
    Math.abs(angleDelta(Math.atan2(dy, dx), angle)) <=
      width / 2 + Math.asin(Math.min(1, radius / Math.max(radius, d)))
  );
}
export function inThrust(
  x,
  y,
  ox,
  oy,
  angle,
  reach,
  halfWidth = 10,
  radius = 0,
) {
  let dx = x - ox,
    dy = y - oy,
    c = Math.cos(angle),
    s = Math.sin(angle),
    forward = dx * c + dy * s,
    side = -dx * s + dy * c;
  return (
    forward >= -radius &&
    forward <= reach + radius &&
    Math.abs(side) <= halfWidth + radius
  );
}
export function segmentRect(x0, y0, x1, y1, o, padding = 0) {
  let lo = 0,
    hi = 1,
    dx = x1 - x0,
    dy = y1 - y0;
  for (let [p, q] of [
    [-dx, x0 - o.x + padding],
    [dx, o.x + o.w + padding - x0],
    [-dy, y0 - o.y + padding],
    [dy, o.y + o.h + padding - y0],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      let t = q / p;
      if (p < 0) lo = Math.max(lo, t);
      else hi = Math.min(hi, t);
      if (lo > hi) return false;
    }
  }
  return true;
}
export function impulse(enemy, angle, power) {
  enemy.kx = (enemy.kx || 0) + Math.cos(angle) * power;
  enemy.ky = (enemy.ky || 0) + Math.sin(angle) * power;
}
