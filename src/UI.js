import {
  HEROES,
  WEAPONS,
  PASSIVES,
  SHOP,
  MODES,
  BOSS_SCHEDULE,
  STAGES,
  CLASS_SKILLS,
} from "./data.js?v=2.0.1";
import { drawHero } from "./Sprites.js?v=2.0.1";
import { drawHeldWeapon } from "./WeaponVisuals.js?v=2.0.1";
export const clock = (t) =>
  `${Math.floor(Math.max(0, t) / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(Math.max(0, t) % 60)
    .toString()
    .padStart(2, "0")}`;
export class UI {
  constructor(game) {
    this.game = game;
    this.overlay = document.querySelector("#overlay");
    this.hud = document.querySelector("#hud");
    this.hero = "soldier";
    this.stage = "forest";
    this.mode = "quick";
    this.lastLoadout = "";
    document.querySelector("#pause").onclick = () => game.togglePause();
    document.querySelector("#music").onclick = async () => {
      try {
        await game.audio.unlock();
        game.audio.setMusic(!game.audio.music);
        this.audioButtons();
      } catch {
        game.toast("AUDIO UNAVAILABLE IN THIS BROWSER");
      }
    };
    document.querySelector("#sound").onclick = async () => {
      try {
        await game.audio.unlock();
        game.audio.setSound(!game.audio.sfx);
        this.audioButtons();
      } catch {
        game.toast("AUDIO UNAVAILABLE IN THIS BROWSER");
      }
    };
    this.audioButtons();
  }
  audioButtons() {
    for (let [id, on] of [
      ["music", this.game.audio.music],
      ["sound", this.game.audio.sfx],
    ]) {
      let el = document.querySelector("#" + id);
      el.textContent = `${id === "music" ? "Music" : "SFX"}: ${on ? "on" : "off"}`;
      el.setAttribute("aria-pressed", on);
    }
  }
  show(html, focus = true) {
    this.overlay.innerHTML = html;
    if (focus)
      requestAnimationFrame(() =>
        this.overlay
          .querySelector("button:not(:disabled)")
          ?.focus({ preventScroll: true }),
      );
  }
  menu() {
    const g = this.game;
    g.state = "menu";
    this.hud.hidden = true;
    document.querySelector("#dash").hidden = true;
    document.querySelector("#skill").hidden = true;
    document.querySelector("#interact").hidden = true;
    document.querySelector("#arena").classList.remove("playing", "expanded");
    this.show(
      `<div class="menu"><div class="eyeline">NO RESCUE IS COMING</div><h1>DEADWOOD<br><span>SIGNAL.</span></h1><p class="intro">The last transmission went silent.<br>Now the dead are listening.<br>Build your arsenal. Survive the night.</p><div class="menu-actions"><button class="primary" id="deploy">DEPLOY SURVIVOR →</button><button id="shop">UPGRADE SHOP</button><button id="guide">FIELD GUIDE</button></div><div class="meta-line">${g.save.data.runs} RUNS &nbsp; / &nbsp; <b>${g.save.data.gold} GOLD</b> &nbsp; / &nbsp; BEST ${g.save.data.bestKills} KILLS</div></div>`,
    );
    this.overlay.querySelector("#deploy").onclick = () => this.select();
    this.overlay.querySelector("#shop").onclick = () => this.shop();
    this.overlay.querySelector("#guide").onclick = () => this.guide();
  }
  select() {
    const g = this.game,
      hero = HEROES.find((h) => h.id === this.hero);
    this.show(
      `<div class="panel selection-panel"><div class="panel-head"><div><span class="tiny">PREPARE FOR DEPLOYMENT</span><h2>Choose your survivor</h2></div><button id="back">Back</button></div><div class="roster">${HEROES.map(
        (h) => {
          let locked = h.unlock && g.save.data.totalGold < h.unlock;
          return `<button class="hero-card ${h.id === this.hero ? "selected" : ""}" data-hero="${h.id}" aria-pressed="${h.id === this.hero}" ${locked ? "disabled" : ""}><canvas width="72" height="64" aria-hidden="true"></canvas>${h.name}${locked ? "<br>LOCKED" : ""}</button>`;
        },
      ).join(
        "",
      )}</div><div class="hero-info"><div><strong>${hero.name}</strong><p>${hero.desc}</p><p class="class-skill-preview"><b>[E] ${CLASS_SKILLS[hero.id].name}</b> · ${CLASS_SKILLS[hero.id].cool}s<br>${CLASS_SKILLS[hero.id].desc}</p></div><small class="muted">${hero.hp} HP<br>${hero.speed} SPEED</small></div><div class="select-row"><label>STAGE<select id="stage">${Object.entries(
        STAGES,
      )
        .map(
          ([id, stage]) =>
            `<option value="${id}" ${this.stage === id ? "selected" : ""}>${stage.name}</option>`,
        )
        .join(
          "",
        )}</select></label><label>MISSION<select id="mode">${Object.entries(
        MODES,
      )
        .map(
          ([id, m]) =>
            `<option value="${id}" ${id === this.mode ? "selected" : ""}>${m.name} · ${m.duration / 60} min</option>`,
        )
        .join(
          "",
        )}</select></label></div><p class="briefing" id="brief">${MODES[this.mode].desc}</p><p id="stage-brief" class="map-brief">${STAGES[this.stage].desc}</p><div class="menu-actions"><button class="primary" id="start">ENTER THE DEADWOOD →</button><button id="expand">Larger arena: ${g.expanded ? "on" : "off"}</button></div><p class="muted" style="font-size:10px">Farmer unlocks at 250 lifetime gold · Arbalist at 750. Progress saves on this device.</p></div>`,
    );
    for (let card of this.overlay.querySelectorAll("[data-hero]")) {
      let h = HEROES.find((h) => h.id === card.dataset.hero);
      const portrait = card.querySelector("canvas").getContext("2d");
      portrait.imageSmoothingEnabled = false;
      drawHero(portrait, h, 27, 46, 0, false, 1, 0);
      drawHeldWeapon(portrait, { hero: h, aimAngle: -0.25 }, 27, 46, 0);
      card.onclick = () => {
        this.hero = h.id;
        this.select();
      };
    }
    this.overlay.querySelector("#back").onclick = () => this.menu();
    this.overlay.querySelector("#stage").onchange = (e) => {
      this.stage = e.target.value;
      this.overlay.querySelector("#stage-brief").textContent =
        STAGES[this.stage].desc;
    };
    this.overlay.querySelector("#mode").onchange = (e) => {
      this.mode = e.target.value;
      this.overlay.querySelector("#brief").textContent = MODES[this.mode].desc;
    };
    this.overlay.querySelector("#expand").onclick = (e) => {
      g.expanded = !g.expanded;
      e.target.textContent = `Larger arena: ${g.expanded ? "on" : "off"}`;
    };
    this.overlay.querySelector("#start").onclick = () =>
      g.start(this.hero, this.stage, this.mode);
  }
  shop() {
    const g = this.game;
    this.show(
      `<div class="panel"><div class="panel-head"><div><span class="tiny">BETWEEN THE TRANSMISSIONS</span><h2>Upgrade shop</h2></div><button id="back">Back</button></div><p>Permanent upgrades for every survivor. Wallet: <b style="color:var(--amber)">${g.save.data.gold} gold</b></p><div class="shop-grid">${Object.entries(
        SHOP,
      )
        .map(([id, s]) => {
          let lv = g.save.data.shop[id],
            cost = Math.floor(s.base * (lv + 1) ** 1.45);
          return `<div class="shop-card"><b>${s.name}</b><small>${s.desc}<br>Level ${lv} / 10</small><button data-buy="${id}" ${lv >= 10 || g.save.data.gold < cost ? "disabled" : ""}>${lv >= 10 ? "MAXED" : cost + " gold"}</button></div>`;
        })
        .join(
          "",
        )}</div><p>Bosses drop gold and chests. Finish a run or use “Extract” to bank your gold. Quick missions award double gold.</p></div>`,
    );
    this.overlay.querySelector("#back").onclick = () => this.menu();
    for (let b of this.overlay.querySelectorAll("[data-buy]"))
      b.onclick = () => {
        g.save.purchase(b.dataset.buy, SHOP[b.dataset.buy].base);
        this.shop();
        g.audio.effect("coin");
      };
  }
  guide() {
    this.show(
      `<div class="panel"><div class="panel-head"><h2>Field guide</h2><button id="back">Back</button></div><p><b>Move</b> with WASD / arrow keys or the touch stick. <b>Dash</b> with Space (3 second recharge). Use <b>E</b> for your class skill and <b>F</b> near a locked door (starts with 2 keys; more drop from enemies and boss chests). Weapons aim and fire automatically. Collect XP gems to choose upgrades. Level-ups also restore 8 HP.</p><p><b>Class skills</b><br>${HEROES.map((h) => h.name + " · " + CLASS_SKILLS[h.id].name + ": " + CLASS_SKILLS[h.id].desc).join("<br>")}</p><p><b>Stage hazards</b><br>${Object.values(
        STAGES,
      )
        .map((s) => s.name + ": " + s.desc)
        .join(
          "<br>",
        )}</p><p>Carry up to six weapons. Weapons and passives reach level 5. Collect a boss chest with a max-level weapon and its matching passive to evolve it.</p><p><b>Evolution recipes</b><br>${Object.values(
        WEAPONS,
      )
        .filter((w) => w.name !== "Wunderwaffe")
        .map((w) => `${w.name} + ${PASSIVES[w.passive].name} → ${w.evolved}`)
        .join(
          "<br>",
        )}</p><p><b>Boss signals (Standard)</b><br>${BOSS_SCHEDULE.map((b) => `${clock(b.at)} · ${b.name}`).join("<br>")}<br>Every mode uses the same strict 2-minute elapsed-time interval. The boss roster repeats after 10 minutes. Hordes disperse for 6 seconds at each signal. A final timed boss must be defeated to finish a survival run.</p><p>Margwa’s gold mouths mark its vulnerable window. Stay outside the Panzer’s flame cone. Kill the Thief before its escape timer ends to recover your weapon at full strength. Defeat both Megaton halves. George enrages when hit and drops the Wunderwaffe.</p><p>Music is an original synthesized score, enabled by clicking “Music: off.” No account needed; saves stay in this browser. Clearing site data clears progress.</p></div>`,
    );
    this.overlay.querySelector("#back").onclick = () => this.menu();
  }
  levelUp() {
    const g = this.game;
    g.state = "upgrade";
    g.input.clear();
    g.audio.effect("level");
    let choices = g.weapons.choices();
    this.show(
      `<div class="panel"><span class="tiny">EVOLVE OR BE OVERRUN</span><h2>Level ${g.player.level} · Choose an upgrade</h2><p>The horde is paused. Make it count.</p><div class="choices">${choices.map((c, i) => `<button class="upgrade" data-choice="${i}"><span>${c.type.toUpperCase()}<br>LV ${c.level}</span><strong>${c.name}</strong><small>${c.desc}</small></button>`).join("")}</div></div>`,
    );
    for (let b of this.overlay.querySelectorAll("[data-choice]"))
      b.onclick = () => {
        g.weapons.choose(choices[+b.dataset.choice]);
        this.overlay.innerHTML = "";
        g.state = "playing";
        g.input.clear();
        this.update(true);
      };
  }
  pause() {
    this.show(
      `<div class="panel" style="max-width:440px"><span class="tiny">TRANSMISSION ON HOLD</span><h2>Catch your breath.</h2><p>Simulation and mission timer are paused.</p><div class="menu-actions"><button class="primary" id="resume">RESUME →</button><button id="extract">EXTRACT & BANK GOLD</button></div><p>Extracting ends this run and keeps the gold you collected.</p></div>`,
    );
    this.overlay.querySelector("#resume").onclick = () =>
      this.game.togglePause();
    this.overlay.querySelector("#extract").onclick = () =>
      this.game.end(false, true);
  }
  result(won, extracted) {
    const g = this.game;
    this.hud.hidden = true;
    document.querySelector("#dash").hidden = true;
    document.querySelector("#skill").hidden = true;
    document.querySelector("#interact").hidden = true;
    document.querySelector("#arena").classList.remove("playing");
    this.show(
      `<div class="panel" style="max-width:550px"><span class="tiny">${won ? "TRANSMISSION RECEIVED" : extracted ? "EVACUATION CONFIRMED" : "SIGNAL LOST"}</span><h2>${won ? "You survived the night." : extracted ? "Live to fight again." : "The forest remembers."}</h2><p>${g.player.hero.name} · ${STAGES[g.world.stage].name} · ${g.mode.name}</p><div class="result-stats"><div><strong>${g.kills}</strong><small>ELIMINATIONS</small></div><div><strong>${clock(g.time)}</strong><small>SURVIVED</small></div><div><strong>+${Math.floor(g.runGold)}</strong><small>GOLD BANKED</small></div></div><div class="menu-actions"><button class="primary" id="retry">DEPLOY AGAIN →</button><button id="home">MAIN MENU</button></div><p>Created by Georgia Rachel · ${g.save.available ? "Progress saved on this device." : "Browser storage unavailable. Keep this tab open to retain progress."}</p></div>`,
    );
    this.overlay.querySelector("#retry").onclick = () => this.select();
    this.overlay.querySelector("#home").onclick = () => this.menu();
  }
  begin() {
    this.overlay.innerHTML = "";
    this.hud.hidden = false;
    document.querySelector("#arena").classList.add("playing");
    document
      .querySelector("#arena")
      .classList.toggle("expanded", this.game.expanded);
    document.querySelector("#dash").hidden = false;
    document.querySelector("#skill").hidden = false;
    document.querySelector("#interact").hidden = !["dungeon", "base"].includes(
      this.game.world.stage,
    );
    document.querySelector("#hero-label").textContent =
      this.game.player.hero.name.toUpperCase();
    document.querySelector("#mode-label").textContent =
      this.game.mode.name.toUpperCase();
    this.lastLoadout = "";
    this.update(true);
  }
  update(force = false) {
    const g = this.game,
      p = g.player;
    if (!p) return;
    document.querySelector("#hp").textContent =
      `${Math.ceil(p.hp)} / ${p.maxHp} HP`;
    document.querySelector("#health-fill").style.width =
      `${(100 * p.hp) / p.maxHp}%`;
    document.querySelector("#timer").textContent = clock(
      g.modeId === "speedrun" ? g.mode.duration - g.time : g.time,
    );
    document.querySelector("#kills").textContent =
      g.modeId === "speedrun" ? `${g.kills}/1000` : g.kills;
    document.querySelector("#gold").textContent = Math.floor(g.runGold);
    document.querySelector("#level").textContent = `LV ${p.level}`;
    document.querySelector("#xp-fill").style.width =
      `${Math.min(100, (100 * p.xp) / p.need)}%`;
    let key =
      g.weapons.weapons
        .map((w) => w.id + w.level + w.evolved + w.disabled)
        .join(",") + JSON.stringify(p.passives);
    if (force || key !== this.lastLoadout) {
      this.lastLoadout = key;
      document.querySelector("#loadout").innerHTML =
        g.weapons.weapons
          .map(
            (w) =>
              `<span>${w.disabled ? "STOLEN: " : ""}${w.evolved ? WEAPONS[w.id].evolved : WEAPONS[w.id].name} ${w.evolved ? "★" : w.level + "/5"}</span>`,
          )
          .join("") +
        Object.entries(p.passives)
          .map(([id, lv]) => `<span>${PASSIVES[id].name} ${lv}</span>`)
          .join("");
    }
    const bosses = g.enemies.pool.filter((e) => e.active && (e.boss || e.half)),
      el = document.querySelector("#boss-hud");
    el.hidden = !bosses.length;
    el.innerHTML = bosses
      .slice(0, 4)
      .map((b) => {
        const name =
          BOSS_SCHEDULE.find((n) => n.type === b.type)?.name ||
          (b.type === "bomber" ? "Megaton Bomber" : "Megaton Blaster");
        return `<div>${name}<progress max="${b.maxHp}" value="${Math.max(0, b.hp)}" aria-label="${name} health"></progress></div>`;
      })
      .join("");
    const skill = document.querySelector("#skill");
    skill.textContent = `[E] ${g.skills.definition.name} · ${g.skills.cooldown > 0 ? Math.ceil(g.skills.cooldown) + "s" : "READY"}`;
    skill.disabled = g.skills.cooldown > 0;
    skill.setAttribute("aria-label", skill.textContent);
    document.querySelector("#interact").textContent =
      `[F] Unlock · ${p.keys} keys`;
    document.querySelector("#mission-info").textContent =
      `${STAGES[g.world.stage].name} · RUN ${clock(g.time)} · ${g.time >= g.mode.duration ? "FINAL BOSS" : "NEXT BOSS " + clock(g.director.nextSpawn)}${p.fireBuff > 0 ? " · RAPID FIRE" : ""}${p.immunity > 0 ? " · IMMUNE" : ""}`;
    let dash = document.querySelector("#dash");
    dash.textContent =
      p.dashCooldown > 0 ? Math.ceil(p.dashCooldown) + "s" : "Dash";
  }
}
