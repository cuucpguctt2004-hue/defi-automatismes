/* Défi Automatismes – interface */
(function () {
  "use strict";

  // Prénom affiché sur l'accueil (laisser vide pour un simple « Salut ! »)
  const PRENOM = "Laura";
  const STORE_KEY = "defi-automatismes-historique";

  const $ = (id) => document.getElementById(id);
  const screens = ["home", "quiz", "result"];
  const show = (id) => {
    screens.forEach((s) => ($(s).hidden = s !== id));
    window.scrollTo(0, 0);
  };

  // ---------- stockage (protégé : peut échouer en navigation privée) ----------
  const load = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  };
  const save = (list) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(-200))); } catch (e) { /* ignoré */ }
  };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const dayKey = (d) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  };

  function streak(hist) {
    const days = new Set(hist.map((h) => dayKey(h.date)));
    let n = 0;
    const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // la série continue si on n'a pas encore joué aujourd'hui
    while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // ---------- accueil ----------
  function renderHome() {
    $("hello").textContent = PRENOM ? `Salut ${PRENOM} !` : "Salut !";
    const hist = load();
    const defis = hist.filter((h) => h.mode === "Défi du jour");
    const best = defis.filter((h) => h.score === h.total).sort((a, b) => a.time - b.time)[0];
    const bestScore = defis.length ? Math.max(...defis.map((h) => h.score)) : null;
    const s = streak(hist);
    $("stats").innerHTML = `
      <div class="stat"><span class="bignum">${s}</span><span class="muted">jour${s > 1 ? "s" : ""} d'affilée</span></div>
      <div class="stat"><span class="bignum">${bestScore === null ? "–" : bestScore + "/10"}</span><span class="muted">meilleur défi</span></div>
      <div class="stat"><span class="bignum">${best ? fmtTime(best.time) : "–"}</span><span class="muted">record sans faute</span></div>`;

    $("themes").innerHTML = Object.keys(Gen.THEMES)
      .map((t) => `<button type="button" class="theme" data-theme="${t}">${t}</button>`).join("");
    $("themes").querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => start(b.dataset.theme)));

    if (!hist.length) {
      $("history").innerHTML = `<p class="muted">Pas encore de séance. Lance ton premier défi !</p>`;
    } else {
      $("history").innerHTML = `<table><thead><tr><th>Date</th><th>Séance</th><th>Score</th><th>Temps</th></tr></thead><tbody>${
        hist.slice(-10).reverse().map((h) => `<tr><td>${new Date(h.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</td><td>${h.mode}</td><td>${h.score}/${h.total}</td><td>${fmtTime(h.time)}</td></tr>`).join("")
      }</tbody></table>`;
    }
    show("home");
  }

  // ---------- quiz ----------
  let state = null;
  let timerId = null;

  function start(mode) {
    const qs = mode === "Défi du jour" ? Gen.defiDuJour() : Gen.serieTheme(mode, 10);
    state = { mode, qs, i: 0, score: 0, errors: [], t0: Date.now(), answered: false };
    clearInterval(timerId);
    timerId = setInterval(() => {
      $("qTimer").textContent = fmtTime(Math.floor((Date.now() - state.t0) / 1000));
    }, 500);
    $("qTimer").textContent = "0:00";
    show("quiz");
    renderQuestion();
  }

  function renderQuestion() {
    const q = state.qs[state.i];
    state.answered = false;
    $("qTheme").textContent = q.theme;
    $("qCount").textContent = `Question ${state.i + 1} / ${state.qs.length}`;
    $("qBar").style.width = `${(state.i / state.qs.length) * 100}%`;
    $("qPrompt").innerHTML = q.prompt;
    $("feedback").hidden = true;
    $("nextBtn").hidden = true;

    if (q.type === "input") {
      $("inputForm").hidden = false;
      $("inputHelp").hidden = q.theme !== "Fractions";
      $("choices").hidden = true;
      const inp = $("answerInput");
      inp.value = "";
      inp.disabled = false;
      $("inputForm").querySelector("button").disabled = false;
      setTimeout(() => inp.focus(), 50);
    } else {
      $("inputForm").hidden = true;
      $("inputHelp").hidden = true;
      $("choices").hidden = false;
      $("choices").innerHTML = q.choices
        .map((c, k) => `<button type="button" class="choice" data-k="${k}">${c.html}</button>`).join("");
      $("choices").querySelectorAll("button").forEach((b) =>
        b.addEventListener("click", () => answerChoice(Number(b.dataset.k))));
    }
  }

  function feedback(ok, html) {
    const f = $("feedback");
    f.className = "feedback " + (ok ? "ok" : "ko");
    f.innerHTML = html;
    f.hidden = false;
    $("nextBtn").hidden = false;
    $("nextBtn").textContent = state.i + 1 < state.qs.length ? "Suivant" : "Voir mon résultat";
    $("nextBtn").focus();
  }

  function record(ok, q, given) {
    state.answered = true;
    if (ok) state.score++;
    else state.errors.push({ q, given });
  }

  function answerInput(e) {
    e.preventDefault();
    if (state.answered) return;
    const q = state.qs[state.i];
    const p = Gen.parseAnswer($("answerInput").value);
    if (!p) {
      const f = $("feedback");
      f.className = "feedback info";
      f.innerHTML = "Je n'ai pas compris ta réponse. Écris un nombre entier, un décimal ou une fraction comme <b>3/4</b>.";
      f.hidden = false;
      return;
    }
    $("answerInput").disabled = true;
    $("inputForm").querySelector("button").disabled = true;
    const ok = Gen.sameValue(p, q.answer);
    const good = Gen.frac(q.answer.n, q.answer.d);
    record(ok, q, Gen.frac(p.n, p.d));
    if (ok) {
      const note = q.theme === "Fractions" && !Gen.isReduced(p) && p.d !== 1
        ? `<p class="small">Pense à simplifier : la forme irréductible est ${good}.</p>` : "";
      feedback(true, `<p><b>Bravo !</b></p>${note}<p class="small">${q.explain}</p>`);
    } else {
      feedback(false, `<p><b>Pas tout à fait.</b> La bonne réponse est ${good}.</p><p class="small">${q.explain}</p>`);
    }
  }

  function answerChoice(k) {
    if (state.answered) return;
    const q = state.qs[state.i];
    const c = q.choices[k];
    const btns = $("choices").querySelectorAll("button");
    btns.forEach((b, j) => {
      b.disabled = true;
      if (q.choices[j].correct) b.classList.add("good");
    });
    if (!c.correct) btns[k].classList.add("bad");
    record(c.correct, q, c.html);
    if (c.correct) feedback(true, `<p><b>Bravo !</b></p><p class="small">${q.explain}</p>`);
    else feedback(false, `<p><b>Pas tout à fait.</b> ${c.why || ""}</p><p class="small">${q.explain}</p>`);
  }

  function next() {
    state.i++;
    if (state.i < state.qs.length) renderQuestion();
    else finish();
  }

  function finish() {
    clearInterval(timerId);
    const time = Math.floor((Date.now() - state.t0) / 1000);
    const total = state.qs.length;
    const hist = load();
    const prevBest = hist.filter((h) => h.mode === state.mode && h.score === total).sort((a, b) => a.time - b.time)[0];
    hist.push({ date: new Date().toISOString(), mode: state.mode, score: state.score, total, time });
    save(hist);

    $("qBar").style.width = "100%";
    $("rTitle").textContent = state.score === total ? "Sans faute !" : state.score >= total * 0.7 ? "Bien joué !" : "C'est en s'entraînant qu'on progresse !";
    $("rScore").textContent = `${state.score}/${total}`;
    $("rTime").textContent = fmtTime(time);
    let msg = "";
    if (state.score === total && (!prevBest || time < prevBest.time)) msg = "Nouveau record de temps sans faute 🎉";
    else if (state.score === total) msg = `Ton record sans faute reste ${fmtTime(prevBest.time)}. Essaie de le battre demain !`;
    else msg = "Relis les corrections ci-dessous, puis réessaie demain : tu verras la différence.";
    $("rMsg").textContent = msg;

    $("rErrors").innerHTML = state.errors.length
      ? `<h2>À revoir</h2>${state.errors.map((e) => `
          <div class="errcard">
            <p class="chip">${e.q.theme}</p>
            <p class="prompt small">${e.q.prompt}</p>
            <p class="small"><span class="muted">Ta réponse :</span> ${e.given}</p>
            <p class="small">${e.q.explain}</p>
          </div>`).join("")}`
      : "";
    show("result");
  }

  // ---------- fiche rappel ----------
  function renderSquares() {
    $("squares").innerHTML = Array.from({ length: 15 }, (_, i) => i + 1)
      .map((n) => `<span>${n}<sup>2</sup> = <b>${n * n}</b></span>`).join("");
  }
  function openRappel() {
    const d = $("rappel");
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
  }
  function closeRappel() {
    const d = $("rappel");
    if (typeof d.close === "function") d.close(); else d.removeAttribute("open");
  }

  // ---------- branchements ----------
  $("inputForm").addEventListener("submit", answerInput);
  $("nextBtn").addEventListener("click", next);
  $("defiBtn").addEventListener("click", () => start("Défi du jour"));
  $("againBtn").addEventListener("click", () => start(state.mode));
  $("backBtn").addEventListener("click", renderHome);
  $("homeBtn").addEventListener("click", () => { clearInterval(timerId); renderHome(); });
  $("rappelBtn").addEventListener("click", openRappel);
  $("closeRappel").addEventListener("click", closeRappel);
  $("rappel").addEventListener("click", (e) => { if (e.target === $("rappel")) closeRappel(); });

  renderSquares();
  renderHome();
})();
