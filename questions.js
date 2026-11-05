/* Générateurs de questions – Défi Automatismes
   Chaque générateur renvoie un objet :
   { theme, prompt (HTML), type: 'input' | 'qcm',
     answer: {n, d}            (pour 'input')
     choices: [{html, correct, why, fn}]  (pour 'qcm' ; fn sert aux tests)
     explain (HTML) }
*/
(function (root) {
  "use strict";

  // ---------- outils ----------
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
  const reduce = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
  const MINUS = "−";

  const num = (n) => (n < 0 ? MINUS + Math.abs(n) : String(n));
  const frac = (n, d) => {
    const r = { n, d };
    if (r.d === 1) return num(r.n);
    const sign = r.n * r.d < 0 ? MINUS : "";
    return `${sign}<span class="frac"><span>${Math.abs(r.n)}</span><span>${Math.abs(r.d)}</span></span>`;
  };
  const sup = (e) => `<sup>${num(e)}</sup>`;
  const pow = (base, e) => `${base}${sup(e)}`;

  // Monôme a·x (a entier non nul) : "x", "3x", "−x"
  const mono = (a, v = "x") => (a === 1 ? v : a === -1 ? MINUS + v : num(a) + v);
  // Polynôme c2·x² + c1·x + c0
  const poly = (c2, c1, c0) => {
    const terms = [];
    if (c2) terms.push({ c: c2, s: "x<sup>2</sup>" });
    if (c1) terms.push({ c: c1, s: "x" });
    if (c0) terms.push({ c: c0, s: "" });
    if (!terms.length) return "0";
    return terms.map((t, i) => {
      const abs = Math.abs(t.c);
      const body = t.s ? (abs === 1 ? t.s : abs + t.s) : String(abs);
      if (i === 0) return (t.c < 0 ? MINUS : "") + body;
      return (t.c < 0 ? ` ${MINUS} ` : " + ") + body;
    }).join("");
  };
  // Binôme a·x + b
  const lin = (a, b) => `${mono(a)}${b < 0 ? ` ${MINUS} ` + Math.abs(b) : " + " + b}`;
  const sq = (inner) => `(${inner})<sup>2</sup>`;
  // carré d'un monôme : x² ou (3x)²
  const sqm = (a) => (a === 1 ? "x<sup>2</sup>" : `(${mono(a)})<sup>2</sup>`);

  const qcm = (theme, prompt, correct, distractors, explain) => {
    const seen = new Set([correct.html]);
    const ds = [];
    for (const d of distractors) {
      if (!seen.has(d.html)) { seen.add(d.html); ds.push(d); }
    }
    return {
      theme, prompt, type: "qcm", explain,
      choices: shuffle([{ ...correct, correct: true }, ...ds.slice(0, 3).map((d) => ({ ...d, correct: false }))]),
    };
  };

  // ---------- 1. Carrés ----------
  function carres() {
    if (Math.random() < 0.5) {
      const n = pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 20, 25]);
      return {
        theme: "Carrés", type: "input",
        prompt: `Calcule ${pow(n, 2)}`,
        answer: { n: n * n, d: 1 },
        explain: `${pow(n, 2)} = ${n} × ${n} = ${n * n}`,
      };
    }
    const n = pick([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    return {
      theme: "Carrés", type: "input",
      prompt: `${n * n} est le carré de quel nombre positif ?`,
      answer: { n, d: 1 },
      explain: `${n} × ${n} = ${n * n}, donc ${n * n} = ${pow(n, 2)}. Repérer les carrés t'aidera à factoriser !`,
    };
  }

  // ---------- 2. Fractions ----------
  const DENS = [2, 3, 4, 5, 6, 8, 10, 12];
  function fractions() {
    const op = pick(["+", "−", "×", "÷"]);
    let b = pick(DENS), d = pick(DENS);
    while (d === b && (op === "+" || op === "−")) d = pick(DENS);
    let a = rnd(1, b + 2), c = rnd(1, d + 2);
    while (a % b === 0) a = rnd(1, b + 2);
    while (c % d === 0) c = rnd(1, d + 2);
    let r, explain;
    if (op === "+" || op === "−") {
      if (op === "−" && a * d < c * b) { [a, b, c, d] = [c, d, a, b]; }
      const l = lcm(b, d), A = a * (l / b), C = c * (l / d);
      const N = op === "+" ? A + C : A - C;
      r = reduce(N, l);
      explain = `Même dénominateur (${l}) : ${frac(A, l)} ${op} ${frac(C, l)} = ${frac(N, l)}`;
      if (r.d !== l) explain += ` = ${frac(r.n, r.d)}`;
    } else if (op === "×") {
      r = reduce(a * c, b * d);
      explain = `On multiplie les numérateurs entre eux et les dénominateurs entre eux : ${frac(a * c, b * d)}`;
      if (r.d !== b * d) explain += ` = ${frac(r.n, r.d)}`;
    } else {
      r = reduce(a * d, b * c);
      explain = `Diviser par une fraction, c'est multiplier par son inverse : ${frac(a, b)} × ${frac(d, c)} = ${frac(a * d, b * c)}`;
      if (r.d !== b * c || r.n !== a * d) explain += ` = ${frac(r.n, r.d)}`;
    }
    return {
      theme: "Fractions", type: "input",
      prompt: `${frac(a, b)} ${op} ${frac(c, d)}`,
      answer: r, explain,
    };
  }

  // ---------- 3. Puissances ----------
  function puissances() {
    const kind = pick(["prod", "quot", "powpow", "neg", "zero"]);
    const a = pick([2, 3, 5, 7, 10]);
    if (kind === "prod") {
      const n = rnd(2, 5), m = rnd(2, 5);
      return qcm("Puissances", `${pow(a, n)} × ${pow(a, m)}`,
        { html: pow(a, n + m) },
        [
          { html: pow(a, n * m), why: "On n'a pas multiplié les exposants : pour un produit, on les additionne." },
          { html: pow(a * a, n + m), why: "La base ne change pas : on garde " + a + "." },
          { html: pow(a, Math.abs(n - m) || n + m + 1), why: "Pour un produit, on additionne les exposants." },
          { html: pow(a, n + m + 1), why: "Pour un produit, on additionne les exposants." },
        ],
        `Produit de puissances de même base : on additionne les exposants. ${pow(a, n)} × ${pow(a, m)} = ${a}<sup>${n}+${m}</sup> = ${pow(a, n + m)}`);
    }
    if (kind === "quot") {
      const m = rnd(2, 4), n = m + rnd(1, 4);
      return qcm("Puissances", `${pow(a, n)} / ${pow(a, m)}`,
        { html: pow(a, n - m) },
        [
          { html: pow(a, n + m), why: "Pour un quotient, on soustrait les exposants." },
          { html: Number.isInteger(n / m) && n / m !== n - m ? pow(a, n / m) : pow(a, n * m), why: "Pour un quotient, on soustrait les exposants (on ne les divise pas)." },
          { html: pow(1, n - m), why: "La base ne change pas : on garde " + a + "." },
          { html: pow(a, n - m + 1), why: "Pour un quotient, on soustrait les exposants." },
        ],
        `Quotient de puissances de même base : on soustrait les exposants. ${pow(a, n)} / ${pow(a, m)} = ${a}<sup>${n}−${m}</sup> = ${pow(a, n - m)}`);
    }
    if (kind === "powpow") {
      const n = rnd(2, 4), m = rnd(2, 3);
      return qcm("Puissances", `(${pow(a, n)})${sup(m)}`,
        { html: pow(a, n * m) },
        [
          { html: pow(a, n + m), why: "Pour une puissance de puissance, on multiplie les exposants." },
          { html: pow(a * m, n), why: "On ne multiplie pas la base : on multiplie les exposants." },
          { html: pow(a, n * m + 1), why: "Pour une puissance de puissance, on multiplie les exposants." },
        ],
        `Puissance de puissance : on multiplie les exposants. (${pow(a, n)})${sup(m)} = ${a}<sup>${n}×${m}</sup> = ${pow(a, n * m)}`);
    }
    if (kind === "neg") {
      const b = pick([2, 3, 4, 5, 10]), n = b === 10 ? rnd(1, 3) : rnd(2, 3);
      const v = Math.pow(b, n);
      return qcm("Puissances", `${pow(b, -n)}`,
        { html: frac(1, v), fn: () => 1 / v },
        [
          { html: num(-v), why: "Un exposant négatif ne rend pas le nombre négatif : il le fait passer sous la barre de fraction." },
          { html: num(-b * n), why: "Un exposant négatif fait passer sous la barre de fraction : a<sup>−n</sup> = 1/a<sup>n</sup>." },
          { html: frac(1, b * n), why: `${pow(b, n)} = ${Array(n).fill(b).join(" × ")}, pas ${b} × ${n}.` },
          { html: frac(-1, v), why: "Le résultat reste positif : a<sup>−n</sup> = 1/a<sup>n</sup>, sans signe moins." },
        ],
        `Un exposant négatif fait passer sous la barre de fraction : ${pow(b, -n)} = 1 / ${pow(b, n)} = ${frac(1, v)}`);
    }
    // zero
    const b = pick([2, 3, 5, 7, 10, 12, 25]);
    return qcm("Puissances", `${pow(b, 0)}`,
      { html: "1" },
      [
        { html: "0", why: "Tout nombre non nul à la puissance 0 vaut 1." },
        { html: String(b), why: "Tout nombre non nul à la puissance 0 vaut 1." },
        { html: MINUS + "1", why: "Tout nombre non nul à la puissance 0 vaut 1." },
      ],
      `Pour tout nombre a non nul, a<sup>0</sup> = 1. Donc ${pow(b, 0)} = 1.`);
  }

  // ---------- 4. Notation scientifique ----------
  const fmtFR = (x) => {
    // évite les erreurs d'arrondi binaires
    const s = Number(x.toPrecision(12));
    return s.toLocaleString("fr-FR", { maximumFractionDigits: 10, useGrouping: true });
  };
  function scientifique() {
    const m = pick([2, 3, 4, 5, 6, 7, 8, 9, 1.5, 2.5, 4.5, 7.2]);
    let e = pick([-5, -4, -3, -2, 2, 3, 4, 5, 6]);
    const x = m * Math.pow(10, e);
    const mStr = String(m).replace(".", ",");
    const sci = (k) => `${mStr} × 10${sup(k)}`;
    return qcm("Notation scientifique", `Écris ${fmtFR(x)} en notation scientifique`,
      { html: sci(e) },
      [
        { html: sci(-e), why: e < 0 ? "Un nombre plus petit que 1 a un exposant négatif." : "Un grand nombre a un exposant positif." },
        { html: sci(e + 1), why: "Compte bien de combien de rangs la virgule se déplace." },
        { html: sci(e - 1), why: "Compte bien de combien de rangs la virgule se déplace." },
      ],
      `On place la virgule après le premier chiffre non nul (${mStr}), puis on compte de combien de rangs elle s'est déplacée : ${fmtFR(x)} = ${sci(e)}.`);
  }

  // ---------- 5. Développer ----------
  function developper() {
    const a = pick([1, 2, 2, 3, 3, 4, 5]);
    const b = rnd(1, 9) * (Math.random() < 0.5 ? 1 : -1);
    const kind = Math.random() < 0.75 ? "carre" : "diff";
    if (kind === "carre") {
      const target = (x) => (a * x + b) ** 2;
      const correct = { html: poly(a * a, 2 * a * b, b * b), fn: (x) => a * a * x * x + 2 * a * b * x + b * b };
      const forgotCoef = a > 1
        ? { html: poly(a, 2 * a * b, b * b), fn: (x) => a * x * x + 2 * a * b * x + b * b,
            why: `Attention : (${mono(a)})<sup>2</sup> = ${mono(a)} × ${mono(a)} = ${a * a}x<sup>2</sup>, et non ${a}x<sup>2</sup>. Le nombre devant le x est lui aussi au carré !` }
        : { html: poly(1, b, b * b), fn: (x) => x * x + b * x + b * b,
            why: "Le double produit vaut 2 × a × b : n'oublie pas le 2." };
      return qcm("Développer", `Développe ${sq(lin(a, b))}`,
        correct,
        [
          forgotCoef,
          { html: poly(a * a, 0, b * b), fn: (x) => a * a * x * x + b * b,
            why: "Il manque le double produit 2ab : (a + b)<sup>2</sup> n'est pas égal à a<sup>2</sup> + b<sup>2</sup>." },
          { html: poly(a * a, a * b, b * b), fn: (x) => a * a * x * x + a * b * x + b * b,
            why: "Le terme du milieu est 2 × a × b : n'oublie pas le 2." },
          { html: poly(a * a, -2 * a * b, b * b), fn: (x) => a * a * x * x - 2 * a * b * x + b * b,
            why: "Attention au signe du double produit." },
        ],
        `${sq(lin(a, b))} = ${sqm(a)} ${b < 0 ? MINUS : "+"} 2 × ${mono(a)} × ${Math.abs(b)} + ${Math.abs(b)}<sup>2</sup> = ${poly(a * a, 2 * a * b, b * b)}`,
      );
    }
    const B = Math.abs(b);
    return qcm("Développer", `Développe (${lin(a, B)})(${lin(a, -B)})`,
      { html: poly(a * a, 0, -B * B), fn: (x) => a * a * x * x - B * B },
      [
        { html: poly(a * a, 0, B * B), fn: (x) => a * a * x * x + B * B, why: "(a + b)(a − b) = a<sup>2</sup> − b<sup>2</sup> : c'est un moins." },
        a > 1
          ? { html: poly(a, 0, -B * B), fn: (x) => a * x * x - B * B, why: `(${mono(a)})<sup>2</sup> = ${a * a}x<sup>2</sup> : le nombre devant le x est aussi au carré !` }
          : { html: poly(1, -2 * B, -B * B), fn: (x) => x * x - 2 * B * x - B * B, why: "Les termes en x s'annulent : (a + b)(a − b) = a<sup>2</sup> − b<sup>2</sup>." },
        { html: poly(a * a, -2 * a * B, -B * B), fn: (x) => a * a * x * x - 2 * a * B * x - B * B, why: "Les termes en x s'annulent : il ne reste que a<sup>2</sup> − b<sup>2</sup>." },
      ],
      `C'est l'identité (a + b)(a − b) = a<sup>2</sup> − b<sup>2</sup> avec a = ${mono(a)} et b = ${B} : ${sqm(a)} − ${B}<sup>2</sup> = ${poly(a * a, 0, -B * B)}`,
    );
  }

  // ---------- 6. Factoriser ----------
  function factoriser() {
    const a = pick([1, 1, 2, 3, 4, 5]);
    const B = rnd(1, 9);
    if (Math.random() < 0.5) {
      // a²x² − B²
      const target = (x) => a * a * x * x - B * B;
      return qcm("Factoriser", `Factorise ${poly(a * a, 0, -B * B)}`,
        { html: `(${lin(a, -B)})(${lin(a, B)})`, fn: (x) => (a * x - B) * (a * x + B) },
        [
          { html: sq(lin(a, -B)), fn: (x) => (a * x - B) ** 2, why: "(a − b)<sup>2</sup> donne a<sup>2</sup> − 2ab + b<sup>2</sup> : il y aurait un terme en x." },
          { html: `(${lin(a, -B * B)})(${lin(a, B * B)})`, fn: (x) => (a * x - B * B) * (a * x + B * B), why: `${B * B} est le carré de ${B} : il faut prendre ${B}, pas ${B * B}.` },
          a > 1
            ? { html: `(${lin(a * a, -B)})(${lin(a * a, B)})`, fn: (x) => (a * a * x - B) * (a * a * x + B), why: `${a * a}x<sup>2</sup> est le carré de ${a}x : il faut prendre ${a}x.` }
            : { html: sq(lin(1, B)), fn: (x) => (x + B) ** 2, why: "(a + b)<sup>2</sup> donne a<sup>2</sup> + 2ab + b<sup>2</sup> : ici il n'y a pas de terme en x et c'est un moins." },
        ],
        `C'est a<sup>2</sup> − b<sup>2</sup> = (a − b)(a + b) avec a = ${mono(a)} (car ${poly(a * a, 0, 0)} = ${sqm(a)}) et b = ${B} (car ${B * B} = ${B}<sup>2</sup>).`,
      );
    }
    // a²x² ± 2aBx + B²
    const s = Math.random() < 0.5 ? 1 : -1;
    const b = s * B;
    return qcm("Factoriser", `Factorise ${poly(a * a, 2 * a * b, B * B)}`,
      { html: sq(lin(a, b)), fn: (x) => (a * x + b) ** 2 },
      [
        { html: sq(lin(a, -b)), fn: (x) => (a * x - b) ** 2, why: "Regarde le signe du terme en x : il donne le signe dans la parenthèse." },
        { html: `(${lin(a, -B)})(${lin(a, B)})`, fn: (x) => (a * x - B) * (a * x + B), why: "(a − b)(a + b) donne a<sup>2</sup> − b<sup>2</sup>, sans terme en x." },
        { html: sq(lin(a, 2 * b)), fn: (x) => (a * x + 2 * b) ** 2, why: `Le dernier terme ${B * B} est le carré de ${B} : la parenthèse contient ${B}, pas ${2 * B}.` },
      ],
      `C'est a<sup>2</sup> ${s > 0 ? "+" : MINUS} 2ab + b<sup>2</sup> = (a ${s > 0 ? "+" : MINUS} b)<sup>2</sup> avec a = ${mono(a)} et b = ${B}. Vérifie le terme du milieu : 2 × ${mono(a)} × ${B} = ${mono(2 * a * B)}.`,
    );
  }

  const THEMES = {
    "Carrés": carres,
    "Fractions": fractions,
    "Puissances": puissances,
    "Notation scientifique": scientifique,
    "Développer": developper,
    "Factoriser": factoriser,
  };

  // Défi du jour : 10 questions dans un ordre « échauffement »
  function defiDuJour() {
    const plan = [carres, carres, fractions, fractions, puissances,
      Math.random() < 0.5 ? scientifique : puissances,
      developper, developper, factoriser, factoriser];
    return plan.map((g) => g());
  }

  function serieTheme(name, n = 10) {
    return Array.from({ length: n }, () => THEMES[name]());
  }

  // Lecture d'une réponse tapée : "3/4", "-2", "0,5", "−1/3"
  function parseAnswer(str) {
    if (typeof str !== "string") return null;
    const s = str.trim().replace(/\s+/g, "").replace(/[−–]/g, "-").replace(",", ".");
    if (!s) return null;
    let m = s.match(/^(-?\d+)\/(-?\d+)$/);
    if (m) { const d = parseInt(m[2], 10); if (d === 0) return null; return { n: parseInt(m[1], 10), d }; }
    m = s.match(/^-?\d+(\.\d+)?$/);
    if (m) {
      const dec = (s.split(".")[1] || "").length;
      const d = Math.pow(10, dec);
      return { n: Math.round(parseFloat(s) * d), d };
    }
    return null;
  }
  const sameValue = (p, q) => p.n * q.d === q.n * p.d;
  const isReduced = (p) => gcd(p.n, p.d) === 1 && p.d > 0;

  const api = { THEMES, defiDuJour, serieTheme, parseAnswer, sameValue, isReduced, reduce, frac, _internals: { poly, lin, mono } };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Gen = api;
})(typeof window !== "undefined" ? window : globalThis);
