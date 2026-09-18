/* Away Game · Routine Rings prototype
 *
 * Every feature here traces to a breakdown (B1–B10) in docs/01-task-model.md.
 * Comments tag the breakdown each piece is meant to address.
 */
(() => {
  "use strict";

  const D = window.AWAY_DATA;
  const STORE_KEY = "away-game-v1";
  const WALK_LIMIT = 20; // Amara will walk up to ~20 min (persona)

  // ---------------------------------------------------------------- state
  const defaults = () => ({
    day: 1,
    sleep: 5,
    travel: 14,
    tz: 5,
    dir: "east",
    session: "track_reps",
    rules: { minSleep: 6, tzEasy: 4, key: false },
    log: { train: null, meals: 0, water: 0, swap: null, place: null },
    stamps: [],       // { code, place, day }
    history: [],      // { day, verdict, action, followed }
    queue: [],        // day summaries waiting for signal (B8, B10)
    sent: [],
    simOffline: false,
    face: 0,
    filter: "need",
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return Object.assign(defaults(), JSON.parse(raw));
    } catch (e) { /* storage unavailable: run in memory */ }
    return defaults();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const isOnline = () => navigator.onLine && !state.simOffline;

  // ------------------------------------------------------ readiness (B1, B2)
  // Returns the coach-rule verdict plus a human explanation that separates
  // jet lag (passes) from fatigue (doesn't): the athlete's D1 question.
  function computeReadiness() {
    const { sleep, travel, tz, rules } = state;
    const sleepDebt = Math.max(0, 8 - sleep);
    const fatigue = sleepDebt * 9 + Math.max(0, travel - 4) * 1.5;
    const jetlag = tz * 4;
    const score = Math.max(0, Math.round(100 - fatigue - jetlag));

    const reasons = [];
    if (sleepDebt > 0) reasons.push(`${fmtH(sleep)} of sleep, ${fmtH(sleepDebt)} short of 8`);
    else reasons.push(`${fmtH(sleep)} of sleep, you're covered`);
    if (travel > 4) reasons.push(`${travel} hours of travel still in your legs`);
    if (tz > 0) reasons.push(`${tz} time zone${tz === 1 ? "" : "s"} ${state.dir}: your body thinks it's ${bodyTimeStr()}`);

    let cause = "";
    if (score < 80) {
      cause = jetlag >= fatigue
        ? "Mostly jet lag. This usually eases in a day or two."
        : "Mostly real fatigue, not just jet lag. Take it seriously.";
    }

    let verdict, rule, byCoach = true;
    if (rules.key && sleep >= rules.minSleep - 1.5) {
      verdict = "go";
      rule = "Key session: coach says go, even on a rough day.";
    } else if (sleep < rules.minSleep) {
      verdict = "recovery";
      rule = `Coach's rule: under ${fmtH(rules.minSleep)} of sleep means a recovery day.`;
    } else if (tz >= rules.tzEasy && state.day <= 2) {
      verdict = "easy";
      rule = `Coach's rule: ${rules.tzEasy}+ time zones means an easy first day.`;
    } else {
      byCoach = false;
      verdict = score >= 70 ? "go" : score >= 45 ? "easy" : "recovery";
      rule = "No coach rule applies today, so this is based on your readiness.";
    }
    return { verdict, rule, reasons, cause, score, byCoach };
  }

  const VERDICT = {
    go: { word: "Train", short: "Train", cls: "v-go" },
    easy: { word: "Easy day", short: "Easy day", cls: "v-easy" },
    recovery: { word: "Recovery", short: "Recover", cls: "v-recovery" },
  };
  const ACTION_LABEL = { go: "did the session", easy: "took it easy", recovery: "rested" };

  function fmtH(h) { return `${Number.isInteger(h) ? h : h.toFixed(1)}h`; }

  // --------------------------------------------------------- clock + jet lag
  function localTimeStr(d = new Date()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  function bodyTimeStr() {
    const offset = (state.dir === "east" ? -1 : 1) * state.tz;
    const d = new Date(Date.now() + offset * 3600e3);
    return localTimeStr(d);
  }

  // B9: which way to shift sleep, in plain words.
  function sleepTip() {
    if (state.tz <= 2) return { head: "Stay on local time", body: "Two zones or fewer: keep your normal routine on local time and you'll adjust on your own." };
    if (state.dir === "east") return {
      head: "Pull your bedtime earlier",
      body: "You flew east, so your body wants to stay up late. Get outside light this morning, avoid bright screens after dinner, and aim for bed 30 to 60 minutes earlier than feels natural.",
    };
    return {
      head: "Push your bedtime later",
      body: "You flew west, so you'll get sleepy early. Get light in the late afternoon and try to hold out until local bedtime instead of napping.",
    };
  }

  // ----------------------------------------------------------------- rings
  function ringProgress(r) {
    const train = state.log.train ? 1 : 0; // B3: resting on a recovery day still closes it
    const eat = Math.min(state.log.meals, 4) / 4 * 0.6 + Math.min(state.log.water, 8) / 8 * 0.4;
    const sleep = Math.min(state.sleep / 8, 1);
    const followed = state.log.train ? state.log.train === r.verdict : null;
    return { train, eat, sleep, followed };
  }

  // ------------------------------------------------------ places (B4, B5, B7)
  function todaysNeeds(r) {
    const key = r.verdict === "recovery" ? "swim_recovery" : state.session;
    return { key, needs: D.sessions[key].needs, label: D.sessions[key].label };
  }

  function placesFor(filter, r) {
    const all = D.places.slice().sort((a, b) => a.walk - b.walk);
    if (filter === "food") return all.filter((p) => p.kind === "food");
    if (filter === "train") return all.filter((p) => p.kind === "train");
    const { needs } = todaysNeeds(r);
    return all.filter((p) => p.kind === "train" && needs.some((n) => p.has.includes(n)));
  }

  function bestPlace(r) {
    return placesFor("need", r).find((p) => p.walk <= WALK_LIMIT) || null;
  }

  // B6: swaps that are actually possible with equipment nearby.
  function swapOptions(key) {
    const nearbyGear = new Set(
      D.places.filter((p) => p.kind === "train" && p.walk <= WALK_LIMIT).flatMap((p) => p.has)
    );
    return (D.swaps[key] || []).map((s) => ({
      ...s, possible: s.needs.every((n) => nearbyGear.has(n)),
    }));
  }

  // ================================================================ render
  function render() {
    const r = computeReadiness();
    renderHeader();
    renderWatch(r);
    renderWristButtons(r);
    renderToday(r);
    renderPlaces(r);
    renderPassport();
    renderCoach(r);
    save();
  }

  function renderHeader() {
    $("#trip-line").textContent = `Day ${state.day} in ${D.trip.city} · ${D.trip.hotel}`;
    const on = isOnline();
    const pill = $("#net-pill");
    pill.textContent = on ? "Online" : "No signal: working offline";
    pill.classList.toggle("off", !on);
    $("#sim-offline").checked = state.simOffline;
  }

  // ------------------------------------------------------------- watch face
  const SVGNS = "http://www.w3.org/2000/svg";
  const RINGS = [
    { key: "train", r: 128, color: "var(--train)" },
    { key: "eat", r: 106, color: "var(--eat)" },
    { key: "sleep", r: 84, color: "var(--sleep)" },
  ];

  function renderWatch(r) {
    const svg = $("#watch-svg");
    const title = svg.querySelector("title");
    svg.innerHTML = "";
    svg.appendChild(title);
    const face = state.face % 3;

    if (face === 0) {
      const p = ringProgress(r);
      RINGS.forEach(({ key, r: rad, color }) => {
        const circ = 2 * Math.PI * rad;
        svg.appendChild(el("circle", { cx: 150, cy: 150, r: rad, fill: "none", stroke: color, "stroke-width": 16, opacity: 0.22 }));
        const prog = el("circle", {
          class: "ring-progress", cx: 150, cy: 150, r: rad, fill: "none", stroke: color,
          "stroke-width": 16, "stroke-linecap": "round",
          "stroke-dasharray": circ, "stroke-dashoffset": circ * (1 - Math.max(p[key], 0.001)),
          transform: "rotate(-90 150 150)",
        });
        svg.appendChild(prog);
      });
      const v = VERDICT[r.verdict];
      svg.appendChild(text(v.short, 150, 146, "f-verdict", 32));
      svg.appendChild(text(r.byCoach ? "coach's rule" : "your readiness", 150, 170, "f-small", 13));
      svg.appendChild(text(`${localTimeStr()} · body ${bodyTimeStr()}`, 150, 190, "f-tiny", 11));
      if (p.followed === false) svg.appendChild(el("circle", { cx: 150, cy: 22, r: 6, fill: "var(--alert)" }));
      title.textContent = `Watch: ${v.word}. ${r.rule} Train ring ${Math.round(p.train * 100)}%, eat ${Math.round(p.eat * 100)}%, sleep ${Math.round(p.sleep * 100)}%.`;
    } else if (face === 1) {
      const place = bestPlace(r);
      svg.appendChild(text("Nearest for today", 150, 92, "f-small", 14));
      if (place) {
        svg.appendChild(text(`${place.walk} min`, 150, 150, "f-verdict", 50));
        wrapText(svg, place.name, 150, 180, 22, 13, "f-small");
        svg.appendChild(text(`verified by ${place.verified}${isOnline() ? "" : " · saved offline"}`, 150, 222, "f-tiny", 11));
        title.textContent = `Watch: nearest place for today is ${place.name}, ${place.walk} minutes' walk.`;
      } else {
        svg.appendChild(text("Nothing close", 150, 150, "f-verdict", 30));
        svg.appendChild(text("Try a swap session", 150, 178, "f-small", 13));
        title.textContent = "Watch: no nearby place for today's session. Try a swap.";
      }
    } else {
      const tip = sleepTip();
      svg.appendChild(el("circle", { cx: 150, cy: 150, r: 128, fill: "none", stroke: "var(--sleep)", "stroke-width": 4, opacity: 0.5 }));
      svg.appendChild(text("Tonight", 150, 100, "f-small", 14));
      wrapText(svg, tip.head, 150, 140, 16, 26, "f-verdict", 30);
      svg.appendChild(text(`body clock ${bodyTimeStr()}`, 150, 212, "f-tiny", 12));
      title.textContent = `Watch: sleep tip. ${tip.head}.`;
    }
  }

  function el(name, attrs) {
    const n = document.createElementNS(SVGNS, name);
    for (const k in attrs) {
      const v = String(attrs[k]);
      if (v.startsWith("var(")) n.style.setProperty(k, v); // CSS vars need style, not attributes
      else n.setAttribute(k, v);
    }
    return n;
  }
  function text(str, x, y, cls, size) {
    const t = el("text", { x, y, class: cls, "font-size": size, "text-anchor": "middle" });
    t.textContent = str;
    return t;
  }
  function wrapText(svg, str, x, y, maxChars, size, cls, lh) {
    const words = str.split(" ");
    const lines = [];
    let line = "";
    words.forEach((w) => {
      if ((line + " " + w).trim().length > maxChars) { lines.push(line.trim()); line = w; }
      else line += " " + w;
    });
    lines.push(line.trim());
    lines.forEach((l, i) => svg.appendChild(text(l, x, y + i * (lh || size + 4), cls, size)));
  }

  function renderWristButtons() {
    $$("[data-train]").forEach((b) => b.setAttribute("aria-pressed", String(state.log.train === b.dataset.train)));
    $("#add-meal").textContent = `+ Meal (${state.log.meals})`;
    $("#add-water").textContent = `+ Water (${state.log.water})`;
  }

  // ---------------------------------------------------------------- today
  function renderToday(r) {
    const v = VERDICT[r.verdict];
    const reasons = r.reasons.map((x) => `<li>${esc(x)}</li>`).join("");
    $("#verdict-block").innerHTML = `
      <p class="v-word ${v.cls}">${v.word}</p>
      <p class="v-rule">${esc(r.rule)}</p>
      <ul class="v-reasons">${reasons}${r.cause ? `<li><strong>${esc(r.cause)}</strong></li>` : ""}</ul>`;

    $("#in-sleep").value = state.sleep; $("#o-sleep").textContent = fmtH(state.sleep);
    $("#in-travel").value = state.travel; $("#o-travel").textContent = `${state.travel}h`;
    $("#in-tz").value = state.tz; $("#o-tz").textContent = state.tz;
    $$('input[name="dir"]').forEach((i) => (i.checked = i.value === state.dir));
    const sel = $("#in-session");
    if (!sel.options.length) {
      Object.entries(D.sessions).filter(([k]) => k !== "swim_recovery").forEach(([k, s]) => {
        sel.add(new Option(s.label, k));
      });
    }
    sel.value = state.session;

    // Where to do it + swaps (B4, B5, B6)
    const need = todaysNeeds(r);
    const place = bestPlace(r);
    const swaps = swapOptions(need.key);
    const planLine = r.verdict === "recovery"
      ? `Plan swapped for a recovery day: <strong>${esc(need.label)}</strong>.`
      : r.verdict === "easy"
        ? `Planned: <strong>${esc(need.label)}</strong>. Keep it at about 70% effort.`
        : `Planned: <strong>${esc(need.label)}</strong>.`;
    const chosen = state.log.swap ? `<p>You picked: <strong>${esc(state.log.swap)}</strong></p>` : "";
    $("#where-block").innerHTML = `
      <h3>Where to do it</h3>
      <p>${planLine}</p>
      <p>${place
        ? `${esc(place.name)}: ${place.walk} min walk, verified by ${place.verified} athletes. ${esc(place.note)}`
        : `Nothing within a ${WALK_LIMIT} minute walk has what this session needs.`}</p>
      ${chosen}
      <details ${place ? "" : "open"}>
        <summary>Swap for an equivalent session</summary>
        <ul class="swap-list">${swaps.map((s, i) => `
          <li class="${s.possible ? "" : "unavailable"}">
            <span>${esc(s.label)}${s.possible ? "" : " (nothing nearby has the gear)"}</span>
            ${s.possible ? `<button class="small" data-swap="${i}">Use this</button>` : ""}
          </li>`).join("")}
        </ul>
      </details>`;

    const tip = sleepTip();
    const sb = $("#sleep-block");
    sb.className = "card sleep";
    sb.innerHTML = `<h3>${esc(tip.head)}</h3><p>${esc(tip.body)}</p>`;
  }

  // --------------------------------------------------------------- places
  function renderPlaces(r) {
    $$(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === state.filter)));
    const list = placesFor(state.filter, r);
    const ul = $("#places-list");
    if (!list.length) {
      ul.innerHTML = `<li class="empty">No verified places match today's session. Check the swap options on the Today tab.</li>`;
      return;
    }
    const stamped = new Set(state.stamps.map((s) => s.place));
    ul.innerHTML = list.map((p) => {
      const tags = (p.kind === "food" ? p.tags : p.has.map(gearLabel))
        .map((t) => `<span class="tag ${p.kind === "food" ? "food" : ""}">${esc(t)}</span>`).join("");
      const action = p.kind === "food"
        ? `<button class="small" data-eat="${p.id}">Ate here</button>`
        : `<button class="small" data-stamp="${p.id}">${stamped.has(p.name) ? "Trained here again" : "Trained here"}</button>`;
      return `
        <li class="place">
          <div class="walk"><strong>${p.walk}</strong><span>min walk</span></div>
          <div>
            <h3>${esc(p.name)}</h3>
            <div class="tags">${tags}</div>
            <p>${esc(p.note)}</p>
            <p class="meta">${p.dayPass ? `${esc(p.dayPass)} · ` : ""}${esc(p.hours)} · verified by ${p.verified}</p>
            ${action}
          </div>
        </li>`;
    }).join("");
  }
  function gearLabel(g) {
    return { track: "track", run_route: "run route", treadmill: "treadmill", dumbbells: "dumbbells", weights: "racks + barbells", pool: "pool" }[g] || g;
  }

  // ------------------------------------------------------------- passport
  function streak() {
    let n = 0;
    for (let i = state.history.length - 1; i >= 0; i--) {
      if (state.history[i].followed) n++; else break;
    }
    return n;
  }

  function renderPassport() {
    $("#streak-num").textContent = streak();
    const tilts = [-8, 5, -3, 7, -6, 2];
    const stamps = state.stamps.map((s, i) => `
      <div class="stamp" style="--tilt:${tilts[i % tilts.length]}deg">
        <strong>${esc(s.code)}</strong><span>${esc(s.place)}</span><span>Day ${s.day}</span>
      </div>`).join("");
    const blanks = Array.from({ length: Math.max(0, 6 - state.stamps.length) }, () =>
      `<div class="stamp blank"><span>next place</span></div>`).join("");
    $("#stamps").innerHTML = stamps + blanks;

    const h = $("#history");
    h.innerHTML = state.history.length
      ? state.history.map((d) => `<li>Day ${d.day}: ${VERDICT[d.verdict].word.toLowerCase()} planned, ${d.action ? ACTION_LABEL[d.action] : "nothing logged"}${d.followed ? " ✓" : ""}</li>`).join("")
      : `<li>No finished days yet. Use "Start next day" on the Today tab.</li>`;

    // printable sheet (B10)
    const r = computeReadiness();
    const boxes = state.stamps.map((s) => `<div class="pp-box filled"><strong>${esc(s.code)}</strong><br>${esc(s.place)}<br>Day ${s.day}</div>`).join("")
      + Array.from({ length: Math.max(0, 9 - state.stamps.length) }, () => `<div class="pp-box">City / place / date</div>`).join("");
    $("#print-passport-sheet").innerHTML = `
      <h1>Training Passport</h1>
      <p>Trip: ${esc(D.trip.city)}. Keep this in your bag for when your phone or signal dies.</p>
      <div class="pp-rules"><strong>Coach's rules for this trip</strong><br>
        Under ${fmtH(state.rules.minSleep)} of sleep: recovery day.<br>
        ${state.rules.tzEasy}+ time zones: easy first days.<br>
        Today's call: ${VERDICT[r.verdict].word}.</div>
      <div class="pp-grid">${boxes}</div>`;
  }

  // ---------------------------------------------------------------- coach
  function renderCoach(r) {
    $("#in-minsleep").value = state.rules.minSleep; $("#o-minsleep").textContent = fmtH(state.rules.minSleep);
    $("#in-tzeasy").value = state.rules.tzEasy; $("#o-tzeasy").textContent = state.rules.tzEasy;
    $("#in-key").checked = state.rules.key;

    const last = state.sent.filter((s) => s.day === state.day).pop();
    let amara;
    if (last) {
      amara = { status: last.followed ? "green" : "red", line: last.text };
    } else if (state.queue.some((q) => q.day === state.day)) {
      amara = { status: "amber", line: "Summary written, waiting for her signal" };
    } else {
      amara = { status: "amber", line: `No summary yet. Today's call: ${VERDICT[r.verdict].word.toLowerCase()}` };
    }
    const team = [{ name: "Amara", ...amara }, ...D.teammates];
    const order = { red: 0, amber: 1, green: 2 };
    team.sort((a, b) => order[a.status] - order[b.status]);
    $("#team").innerHTML = team.map((t) => `
      <li><span class="dot ${t.status}" aria-hidden="true"></span>
        <strong>${esc(t.name)}</strong><span>${esc(t.line)}<span class="visually-hidden"> (status ${t.status})</span></span></li>`).join("");

    $("#queue-note").textContent = state.queue.length
      ? `${state.queue.length} summary${state.queue.length > 1 ? "s" : ""} queued on Amara's device. They'll arrive when she has signal.`
      : "";
  }

  // ======================================================= actions & events
  function logTrain(action) {
    state.log.train = state.log.train === action ? null : action;
    render();
  }

  function stampPlace(id) {
    const p = D.places.find((x) => x.id === id);
    if (!p) return;
    if (!state.stamps.some((s) => s.place === p.name)) {
      state.stamps.push({ code: D.trip.cityCode, place: p.name, day: state.day });
    }
    const r = computeReadiness();
    if (!state.log.train) state.log.train = r.verdict === "recovery" ? "recovery" : r.verdict;
    state.log.place = p.name;
    render();
  }

  function summaryText(r) {
    const a = state.log.train;
    const followed = a === r.verdict;
    const act = a ? ACTION_LABEL[a] : "didn't log training";
    return {
      followed,
      text: `${followed ? "Followed plan" : "Off plan"}: ${act} on a${r.verdict === "easy" ? "n" : ""} ${VERDICT[r.verdict].word.toLowerCase()} day, slept ${fmtH(state.sleep)}`,
    };
  }

  // B8 + B10: summaries queue offline and flush when signal returns.
  function sendSummary() {
    const r = computeReadiness();
    const s = { day: state.day, ...summaryText(r) };
    state.queue = state.queue.filter((q) => q.day !== state.day);
    if (isOnline()) {
      state.sent = state.sent.filter((q) => q.day !== state.day);
      state.sent.push(s);
      note("Sent. Coach Reyes will see it in her team view.");
    } else {
      state.queue.push(s);
      note("No signal. Summary saved and will send automatically when you're back online.");
    }
    render();
  }

  function flushQueue() {
    if (!isOnline() || !state.queue.length) return;
    const n = state.queue.length;
    state.queue.forEach((q) => {
      state.sent = state.sent.filter((s) => s.day !== q.day);
      state.sent.push(q);
    });
    state.queue = [];
    note(`Back online. ${n} queued summar${n > 1 ? "ies" : "y"} sent to Coach Reyes.`);
    render();
  }

  function nextDay() {
    const r = computeReadiness();
    state.history.push({ day: state.day, verdict: r.verdict, action: state.log.train, followed: state.log.train === r.verdict });
    state.day += 1;
    state.log = { train: null, meals: 0, water: 0, swap: null, place: null };
    // Travel is behind you; sleep and time zones improve as you adapt.
    state.travel = 0;
    state.tz = Math.max(0, state.tz - 1);
    state.sleep = Math.min(8, state.sleep + 1);
    note(`Day ${state.day}. Travel hours reset; your body is about one time zone closer to local.`);
    render();
  }

  function note(msg) { $("#summary-note").textContent = msg; }

  function bind() {
    // wrist
    $$("[data-train]").forEach((b) => b.addEventListener("click", () => logTrain(b.dataset.train)));
    $("#add-meal").addEventListener("click", () => { state.log.meals++; render(); });
    $("#add-water").addEventListener("click", () => { state.log.water++; render(); });
    const cycle = () => { state.face = (state.face + 1) % 3; render(); };
    $("#watch").addEventListener("click", cycle);
    $("#crown").addEventListener("click", cycle);

    // today inputs
    $("#in-sleep").addEventListener("input", (e) => { state.sleep = +e.target.value; render(); });
    $("#in-travel").addEventListener("input", (e) => { state.travel = +e.target.value; render(); });
    $("#in-tz").addEventListener("input", (e) => { state.tz = +e.target.value; render(); });
    $$('input[name="dir"]').forEach((i) => i.addEventListener("change", (e) => { state.dir = e.target.value; render(); }));
    $("#in-session").addEventListener("change", (e) => { state.session = e.target.value; state.log.swap = null; render(); });
    $("#where-block").addEventListener("click", (e) => {
      const b = e.target.closest("[data-swap]");
      if (!b) return;
      const r = computeReadiness();
      const s = swapOptions(todaysNeeds(r).key)[+b.dataset.swap];
      state.log.swap = s.label;
      render();
    });
    $("#send-summary").addEventListener("click", sendSummary);
    $("#next-day").addEventListener("click", nextDay);

    // places
    $$(".chip").forEach((c) => c.addEventListener("click", () => { state.filter = c.dataset.filter; render(); }));
    $("#places-list").addEventListener("click", (e) => {
      const s = e.target.closest("[data-stamp]");
      const f = e.target.closest("[data-eat]");
      if (s) stampPlace(s.dataset.stamp);
      if (f) { state.log.meals++; render(); }
    });

    // passport
    $("#print-passport").addEventListener("click", () => window.print());

    // coach
    $("#in-minsleep").addEventListener("input", (e) => { state.rules.minSleep = +e.target.value; render(); });
    $("#in-tzeasy").addEventListener("input", (e) => { state.rules.tzEasy = +e.target.value; render(); });
    $("#in-key").addEventListener("change", (e) => { state.rules.key = e.target.checked; render(); });

    // network
    $("#sim-offline").addEventListener("change", (e) => {
      state.simOffline = e.target.checked;
      render();
      flushQueue();
    });
    window.addEventListener("online", () => { render(); flushQueue(); });
    window.addEventListener("offline", render);

    // reset
    $("#reset").addEventListener("click", () => {
      state = defaults();
      note("");
      render();
    });

    bindTabs();
    setInterval(() => renderWatch(computeReadiness()), 30e3); // keep the clock fresh
  }

  // accessible tabs with arrow-key support
  function bindTabs() {
    const tabs = $$('[role="tab"]');
    const select = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") select(tabs[(i + 1) % tabs.length]);
        if (e.key === "ArrowLeft") select(tabs[(i - 1 + tabs.length) % tabs.length]);
      });
    });
  }

  // offline support (B10)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => { /* prototype still works online */ });
  }

  bind();
  render();
})();
