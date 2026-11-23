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
  function fractions(p) {
    const op = p ? p.op : pick(["+", "−", "×", "÷"]);
    let a, b, c, d;
    if (p) ({ a, b, c, d } = p);
    else {
      b = pick(DENS); d = pick(DENS);
      while (d === b && (op === "+" || op === "−")) d = pick(DENS);
      a = rnd(1, b + 2); c = rnd(1, d + 2);
      while (a % b === 0) a = rnd(1, b + 2);
      while (c % d === 0) c = rnd(1, d + 2);
      // Résultat négatif autorisé une fois sur trois pour une soustraction
      const negResult = op === "−" && Math.random() < 0.35;
      if (op === "−" && !negResult && a * d < c * b) { [a, b, c, d] = [c, d, a, b]; }
      // Première fraction négative une fois sur quatre
      if (Math.random() < 0.25) a = -a;
    }
    let r, explain;
    if (op === "+" || op === "−") {
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
    if (r.n < 0 && !p) explain += ". Attention au signe : le résultat est négatif.";
    return {
      theme: "Fractions", type: "input",
      prompt: `${frac(a, b)} ${op} ${frac(c, d)}`,
      answer: r, explain,
    };
  }

  // ---------- 3. Puissances ----------
  const par = (k) => (k < 0 ? `(${num(k)})` : String(k));
  function puissances(p) {
    const kind = p ? p.kind : pick(["prod", "quot", "powpow", "neg", "zero"]);
    const a = p ? p.a : pick([2, 3, 5, 7, 10]);
    if (kind === "prod") {
      const n = p ? p.n : rnd(2, 5), m = p ? p.m : rnd(2, 5);
      return qcm("Puissances", `${pow(a, n)} × ${pow(a, m)}`,
        { html: pow(a, n + m) },
        [
          { html: pow(a, n * m), why: "On n'a pas multiplié les exposants : pour un produit, on les additionne." },
          { html: pow(a * a, n + m), why: "La base ne change pas : on garde " + a + "." },
          { html: pow(a, Math.abs(n - m) || n + m + 1), why: "Pour un produit, on additionne les exposants." },
          { html: pow(a, n + m + 1), why: "Pour un produit, on additionne les exposants." },
        ],
        `Produit de puissances de même base : on additionne les exposants. ${pow(a, n)} × ${pow(a, m)} = ${a}<sup>${num(n)}+${par(m)}</sup> = ${pow(a, n + m)}`);
    }
    if (kind === "quot") {
      const m = p ? p.m : rnd(2, 4), n = p ? p.n : m + rnd(1, 4);
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
      const n = p ? p.n : rnd(2, 4), m = p ? p.m : rnd(2, 3);
      return qcm("Puissances", `(${pow(a, n)})${sup(m)}`,
        { html: pow(a, n * m) },
        [
          { html: pow(a, n + m), why: "Pour une puissance de puissance, on multiplie les exposants." },
          m > 0
            ? { html: pow(a * m, n), why: "On ne multiplie pas la base : on multiplie les exposants." }
            : { html: pow(a, -n * m), why: "Attention au signe : on multiplie les exposants, et " + n + " × " + par(m) + " est négatif." },
          { html: pow(a, n * m + 1), why: "Pour une puissance de puissance, on multiplie les exposants." },
        ],
        `Puissance de puissance : on multiplie les exposants. (${pow(a, n)})${sup(m)} = ${a}<sup>${n}×${par(m)}</sup> = ${pow(a, n * m)}`);
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
  function scientifique(p) {
    const m = p ? p.m : pick([2, 3, 4, 5, 6, 7, 8, 9, 1.5, 2.5, 4.5, 7.2]);
    let e = p ? p.e : pick([-5, -4, -3, -2, 2, 3, 4, 5, 6]);
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
  function developper(p) {
    const a = p ? p.a : pick([1, 2, 2, 3, 3, 4, 5]);
    const b = p ? p.b : rnd(1, 9) * (Math.random() < 0.5 ? 1 : -1);
    const kind = p ? p.kind : Math.random() < 0.75 ? "carre" : "diff";
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
  function factoriser(p) {
    const a = p ? p.a : pick([1, 1, 2, 3, 4, 5]);
    const B = p ? p.B : rnd(1, 9);
    if (p ? p.kind === "diff" : Math.random() < 0.5) {
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
    const s = p ? p.s : Math.random() < 0.5 ? 1 : -1;
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


  // ---------- 7. Nombres négatifs ----------
  const par2 = (x) => (x < 0 ? `(${num(x)})` : String(x)); // parenthèses autour d'un négatif
  const nz = (min, max) => { let x = 0; while (x === 0) x = rnd(min, max); return x; };
  const nz2 = (max) => rnd(2, max) * (Math.random() < 0.5 ? -1 : 1); // entier non nul, différent de ±1
  const signeProduit = (a, b) => ((a < 0) !== (b < 0)
    ? "Un seul des deux nombres est négatif : le résultat est négatif."
    : "Les deux nombres sont négatifs : « moins par moins donne plus », le résultat est positif.");
  function negatifs() {
    const kind = pick(["add", "add", "sub", "sub", "mul", "div", "prio", "carre"]);
    const saisieN = (prompt, v, explain) => ({ theme: "Nombres négatifs", type: "input", prompt, answer: { n: v, d: 1 }, explain });
    if (kind === "add") {
      let a = nz(-12, 12), b = nz(-12, 12);
      if (a > 0 && b > 0) b = -b;
      const r = a + b, A = Math.abs(a), B = Math.abs(b);
      const explain = (a < 0) === (b < 0)
        ? `Deux nombres négatifs : on additionne ${A} + ${B} = ${A + B} et on garde le signe −. Résultat : ${num(r)}.`
        : `Signes différents : on calcule ${Math.max(A, B)} − ${Math.min(A, B)} = ${Math.abs(A - B)}, et on prend le signe du nombre le plus éloigné de zéro (${num(A > B ? a : b)}). Résultat : ${num(r)}.`;
      return saisieN(`${num(a)} + ${par2(b)}`, r, explain);
    }
    if (kind === "sub") {
      let a = nz(-12, 12), b = nz(-12, 12);
      if (b > 0 && a >= b) b = -b;
      return saisieN(`${num(a)} − ${par2(b)}`, a - b,
        `Soustraire un nombre, c'est ajouter son opposé : ${num(a)} − ${par2(b)} = ${num(a)} + ${par2(-b)} = ${num(a - b)}.`);
    }
    if (kind === "mul") {
      let a = nz2(9), b = nz2(9);
      if (a > 0 && b > 0) a = -a;
      return saisieN(`${num(a)} × ${par2(b)}`, a * b, `${signeProduit(a, b)} ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(a * b)}, donc ${num(a)} × ${par2(b)} = ${num(a * b)}.`);
    }
    if (kind === "div") {
      let q = nz2(9), b = nz2(9);
      if (q > 0 && b > 0) b = -b;
      const a = q * b;
      return saisieN(`${num(a)} ÷ ${par2(b)}`, q, `Même règle des signes que pour la multiplication. ${signeProduit(a, b)} ${Math.abs(a)} ÷ ${Math.abs(b)} = ${Math.abs(q)}, donc le résultat est ${num(q)}.`);
    }
    if (kind === "prio") {
      const x = nz(-10, 10), y = rnd(2, 6), z = -rnd(1, 6);
      const p2 = y * z, r = x - p2;
      return saisieN(`${num(x)} − ${y} × ${par2(z)}`, r,
        `La multiplication passe avant la soustraction : ${y} × ${par2(z)} = ${num(p2)}. Puis ${num(x)} − ${par2(p2)} = ${num(x)} + ${-p2} = ${num(r)}.`);
    }
    const n = rnd(2, 9);
    return qcm("Nombres négatifs", `Calcule (${MINUS}${n})<sup>2</sup> et ${MINUS}${n}<sup>2</sup>`,
      { html: `${n * n} et ${num(-n * n)}` },
      [
        { html: `${num(-n * n)} et ${num(-n * n)}`, why: `(${MINUS}${n})<sup>2</sup> = (${MINUS}${n}) × (${MINUS}${n}) : moins par moins donne plus, donc c'est positif.` },
        { html: `${n * n} et ${n * n}`, why: `Dans ${MINUS}${n}<sup>2</sup>, le carré ne porte que sur ${n} : on calcule ${n}<sup>2</sup> = ${n * n}, puis on met le signe moins.` },
        { html: `${num(-2 * n)} et ${num(-n * n)}`, why: `Le carré, ce n'est pas multiplier par 2 : (${MINUS}${n})<sup>2</sup> = (${MINUS}${n}) × (${MINUS}${n}).` },
      ],
      `(${MINUS}${n})<sup>2</sup> = (${MINUS}${n}) × (${MINUS}${n}) = ${n * n}, alors que ${MINUS}${n}<sup>2</sup> = ${MINUS}(${n} × ${n}) = ${num(-n * n)} : sans parenthèses, le carré ne porte que sur ${n}.`);
  }

  // ---------- 8. Suites ----------
  const ix = (v, k) => `${v}<sub>${k}</sub>`;
  // « a + b n » pour le terme général d'une suite arithmétique
  const arithN = (a, b) => {
    const bn = Math.abs(b) === 1 ? "n" : `${Math.abs(b)}n`;
    return `${num(a)} ${b < 0 ? MINUS : "+"} ${bn}`;
  };
  function suites() {
    const kind = pick(["arithTerme", "arithTerme", "geoTerme", "arithFormule", "geoFormule", "reconnaitre", "raison", "recurrence", "sommeEntiers", "sommeArith", "sommeGeo", "sigma"]);
    const saisieS = (prompt, v, explain) => ({ theme: "Suites", type: "input", prompt, answer: { n: v, d: 1 }, explain });
    const u = (k) => ix("u", k), v = (k) => ix("v", k);
    if (kind === "arithTerme") {
      const u0 = rnd(-5, 12), r = nz(-5, 6), n = pick([5, 8, 10, 12, 15, 20]);
      const val = u0 + n * r;
      return saisieS(`(${u("n")}) est arithmétique, avec ${u(0)} = ${num(u0)} et de raison r = ${num(r)}. Calcule ${u(n)}.`, val,
        `${u("n")} = ${u(0)} + n × r, donc ${u(n)} = ${num(u0)} + ${n} × ${par2(r)} = ${num(u0)} + ${par2(n * r)} = ${num(val)}.`);
    }
    if (kind === "geoTerme") {
      const q = pick([2, 2, 3, -2, 10]);
      const n = q === 10 ? rnd(2, 4) : q === 3 ? rnd(2, 4) : rnd(3, 5);
      const v0 = pick([1, 2, 3, 5]);
      const val = v0 * Math.pow(q, n);
      return saisieS(`(${v("n")}) est géométrique, avec ${v(0)} = ${v0} et de raison q = ${num(q)}. Calcule ${v(n)}.`, val,
        `${v("n")} = ${v(0)} × q<sup>n</sup>, donc ${v(n)} = ${v0} × ${par2(q)}<sup>${n}</sup> = ${v0} × ${num(Math.pow(q, n))} = ${num(val)}.`);
    }
    if (kind === "arithFormule") {
      const u0 = rnd(1, 9), r = nz(-5, 6);
      return qcm("Suites", `(${u("n")}) est arithmétique, avec ${u(0)} = ${u0} et r = ${num(r)}. Quel est son terme général ?`,
        { html: `${u("n")} = ${arithN(u0, r)}` },
        [
          { html: `${u("n")} = ${arithN(r, u0)}`, why: `On part de ${u(0)} = ${u0} et on ajoute n fois la raison : ${u(0)} + n × r.` },
          { html: `${u("n")} = ${u0} × ${par2(r)}<sup>n</sup>`, why: "C'est la forme d'une suite géométrique : ici on ajoute la raison, on ne multiplie pas." },
          { html: `${u("n")} = ${arithN(u0 + r, r)}`, why: `Vérifie avec n = 0 : on doit retrouver ${u(0)} = ${u0}.` },
        ],
        `Pour une suite arithmétique, ${u("n")} = ${u(0)} + n × r = ${arithN(u0, r)}. Vérification : pour n = 0, on retrouve ${u0}.`);
    }
    if (kind === "geoFormule") {
      const v0 = pick([2, 3, 4, 5]), q = pick([2, 3, 4]);
      return qcm("Suites", `(${v("n")}) est géométrique, avec ${v(0)} = ${v0} et q = ${q}. Quel est son terme général ?`,
        { html: `${v("n")} = ${v0} × ${q}<sup>n</sup>` },
        [
          { html: `${v("n")} = ${v0} + ${q}n`, why: "C'est la forme d'une suite arithmétique : ici on multiplie par la raison à chaque étape." },
          { html: `${v("n")} = ${v0 * q}<sup>n</sup>`, why: `Seule la raison est à la puissance n : ${v(0)} × q<sup>n</sup>, pas (${v(0)} × q)<sup>n</sup>.` },
          { html: `${v("n")} = ${v0} × ${q} × n`, why: "La raison est à la puissance n : on la multiplie n fois." },
        ],
        `Pour une suite géométrique, ${v("n")} = ${v(0)} × q<sup>n</sup> = ${v0} × ${q}<sup>n</sup>.`);
    }
    if (kind === "reconnaitre") {
      const t = pick(["arith", "geo", "ni"]);
      if (t === "arith") {
        const a = rnd(1, 9), r = rnd(2, 6), L = [0, 1, 2, 3].map((k) => a + k * r);
        return qcm("Suites", `Les premiers termes d'une suite sont ${L.join(" ; ")}. Cette suite est…`,
          { html: `arithmétique de raison ${r}` },
          [
            { html: `géométrique de raison ${r}`, why: `On passe d'un terme au suivant en ajoutant ${r} (${L[1]} − ${L[0]} = ${r}) : elle est arithmétique.` },
            { html: `arithmétique de raison ${a}`, why: `${a} est le premier terme. La raison est l'écart entre deux termes : ${L[1]} − ${L[0]} = ${r}.` },
            { html: "ni arithmétique ni géométrique", why: `L'écart entre deux termes est toujours ${r} : elle est arithmétique.` },
          ],
          `On ajoute toujours ${r} : ${L.slice(1).map((x, k) => `${x} − ${L[k]} = ${r}`).join(" ; ")}. C'est une suite arithmétique de raison ${r}.`);
      }
      if (t === "geo") {
        const a = pick([1, 2, 3, 5]), q = pick([2, 3]), L = [0, 1, 2, 3].map((k) => a * Math.pow(q, k));
        return qcm("Suites", `Les premiers termes d'une suite sont ${L.join(" ; ")}. Cette suite est…`,
          { html: `géométrique de raison ${q}` },
          [
            { html: `arithmétique de raison ${L[1] - L[0]}`, why: `${L[1]} − ${L[0]} = ${L[1] - L[0]} mais ${L[2]} − ${L[1]} = ${L[2] - L[1]} : l'écart change. En revanche, on multiplie toujours par ${q}.` },
            { html: `géométrique de raison ${q + 1}`, why: `Vérifie : ${L[1]} ÷ ${L[0]} = ${q}.` },
            { html: "ni arithmétique ni géométrique", why: `On multiplie toujours par ${q} : elle est géométrique.` },
          ],
          `On multiplie toujours par ${q} : ${L.slice(1).map((x, k) => `${x} ÷ ${L[k]} = ${q}`).join(" ; ")}. C'est une suite géométrique de raison ${q}.`);
      }
      const L = pick([[1, 4, 9, 16], [2, 5, 10, 17], [1, 2, 4, 7]]);
      const d1 = L[1] - L[0];
      return qcm("Suites", `Les premiers termes d'une suite sont ${L.join(" ; ")}. Cette suite est…`,
        { html: "ni arithmétique ni géométrique" },
        [
          { html: `arithmétique de raison ${d1}`, why: `${L[1]} − ${L[0]} = ${d1} mais ${L[2]} − ${L[1]} = ${L[2] - L[1]} : l'écart n'est pas constant.` },
          { html: `géométrique de raison ${fmtFR(L[1] / L[0])}`, why: `${L[1]} ÷ ${L[0]} et ${L[2]} ÷ ${L[1]} ne donnent pas le même résultat.` },
          { html: `arithmétique de raison ${L[2] - L[1]}`, why: "Il faut que l'écart soit le même entre tous les termes consécutifs." },
        ],
        `Les écarts (${L.slice(1).map((x, k) => x - L[k]).join(", ")}) ne sont pas constants, et les quotients non plus : la suite n'est ni arithmétique ni géométrique.`);
    }
    if (kind === "raison") {
      const r = nz(-5, 6);
      if (Math.random() < 0.5) {
        const k = rnd(1, 6), uk = rnd(-5, 15);
        return saisieS(`(${u("n")}) est arithmétique, avec ${u(k)} = ${num(uk)} et ${u(k + 1)} = ${num(uk + r)}. Quelle est sa raison ?`, r,
          `La raison est l'écart entre deux termes consécutifs : r = ${u(k + 1)} − ${u(k)} = ${num(uk + r)} − ${par2(uk)} = ${num(r)}.`);
      }
      const u0 = rnd(-5, 12), n = pick([4, 5, 10]);
      return saisieS(`(${u("n")}) est arithmétique, avec ${u(0)} = ${num(u0)} et ${u(n)} = ${num(u0 + n * r)}. Quelle est sa raison ?`, r,
        `${u(n)} = ${u(0)} + ${n} × r, donc ${n} × r = ${num(u0 + n * r)} − ${par2(u0)} = ${num(n * r)}, puis r = ${num(n * r)} ÷ ${n} = ${num(r)}.`);
    }
    if (kind === "sommeEntiers") {
      const n = pick([10, 20, 30, 40, 50, 100]);
      return saisieS(`Calcule 1 + 2 + 3 + … + ${n}.`, n * (n + 1) / 2,
        `On utilise 1 + 2 + … + n = n(n + 1) / 2 : ${n} × ${n + 1} / 2 = ${n * (n + 1) / 2}.`);
    }
    if (kind === "sommeArith") {
      let u0, r, n, S;
      do { u0 = rnd(1, 20); r = rnd(1, 6); n = pick([4, 5, 9, 10, 19]); S = (n + 1) * (2 * u0 + n * r) / 2; } while (!Number.isInteger(S));
      const un = u0 + n * r;
      return saisieS(`(${u("n")}) est arithmétique, avec ${u(0)} = ${u0} et r = ${r}. Calcule la somme ${u(0)} + ${u(1)} + … + ${u(n)}.`, S,
        `Somme d'une suite arithmétique = nombre de termes × (premier + dernier) / 2. De ${u(0)} à ${u(n)}, il y a ${n + 1} termes (attention, pas ${n}) ; le dernier vaut ${u(n)} = ${u0} + ${n} × ${r} = ${un}. Donc S = ${n + 1} × (${u0} + ${un}) / 2 = ${S}.`);
    }
    if (kind === "sommeGeo") {
      const v0 = pick([1, 2, 3, 5]), q = pick([2, 2, 3]), n = q === 3 ? rnd(2, 4) : rnd(3, 6);
      const N = n + 1, S = v0 * (Math.pow(q, N) - 1) / (q - 1);
      return saisieS(`(${v("n")}) est géométrique, avec ${v(0)} = ${v0} et q = ${q}. Calcule la somme ${v(0)} + ${v(1)} + … + ${v(n)}.`, S,
        `Somme d'une suite géométrique = premier terme × (1 − q<sup>N</sup>) / (1 − q), où N est le nombre de termes. De ${v(0)} à ${v(n)}, il y a N = ${N} termes. Donc S = ${v0} × (1 − ${q}<sup>${N}</sup>) / (1 − ${q}) = ${v0} × (${num(1 - Math.pow(q, N))}) / (${num(1 - q)}) = ${S}.`);
    }
    if (kind === "sigma") {
      const sig = (bas, haut) => `<span class="sigma"><span>${haut}</span><span>∑</span><span>${bas}</span></span>`;
      if (Math.random() < 0.6) {
        const m = rnd(4, 6), a = rnd(2, 4), b = nz(-3, 5);
        const terms = Array.from({ length: m }, (_, i) => a * (i + 1) + b);
        const S = terms.reduce((x, y) => x + y, 0);
        const expr = `${a}k ${b < 0 ? MINUS : "+"} ${Math.abs(b)}`;
        return saisieS(`Calcule ${sig("k=1", m)} (${expr}).`, S,
          `On remplace k par 1, 2, …, ${m} et on additionne : ${terms.map(num).join(" + ")} = ${num(S)}.`);
      }
      const m = rnd(3, 4), c = pick([1, 2, 3, 5]);
      const terms = Array.from({ length: m + 1 }, (_, k) => c * Math.pow(2, k));
      const S = terms.reduce((x, y) => x + y, 0);
      return saisieS(`Calcule ${sig("k=0", m)} ${c === 1 ? "" : c + " × "}2<sup>k</sup>.`, S,
        `On remplace k par 0, 1, …, ${m} (${m + 1} termes) : ${terms.join(" + ")} = ${S}. C'est la somme d'une suite géométrique de raison 2.`);
    }
    // récurrence
    const u0 = rnd(1, 5), a = pick([2, 3]), b = nz(-3, 3);
    const u1 = a * u0 + b, u2 = a * u1 + b;
    return saisieS(`On définit ${u(0)} = ${u0} et ${u("n+1")} = ${a}${u("n")} ${b < 0 ? MINUS : "+"} ${Math.abs(b)}. Calcule ${u(2)}.`, u2,
      `On calcule les termes un par un : ${u(1)} = ${a} × ${u0} ${b < 0 ? MINUS : "+"} ${Math.abs(b)} = ${num(u1)}, puis ${u(2)} = ${a} × ${par2(u1)} ${b < 0 ? MINUS : "+"} ${Math.abs(b)} = ${num(u2)}.`);
  }

  // ---------- 9. Pourcentages ----------
  function pourcentages() {
    const kind = pick(["coef", "applique", "applique", "taux", "successifs", "indice", "indice2", "moyen", "moyen"]);
    const saisieP = (prompt, ans, explain) => {
      const { display, ...answer } = ans;
      return { theme: "Pourcentages", type: "input", prompt, answer, display, explain };
    };
    if (kind === "coef") {
      const t = pick([3, 5, 10, 12, 15, 20, 25, 30, 40, 50]), up = Math.random() < 0.5;
      const c = reduce(100 + (up ? t : -t), 100);
      return saisieP(`${up ? "Augmenter" : "Diminuer"} de ${t} %, c'est multiplier par combien ?`, { ...c, display: fmtFR(c.n / c.d) },
        `${up ? "Augmenter" : "Diminuer"} de ${t} %, c'est multiplier par 1 ${up ? "+" : MINUS} ${fmtFR(t / 100)} = ${fmtFR((100 + (up ? t : -t)) / 100)}. On appelle ce nombre le coefficient multiplicateur.`);
    }
    if (kind === "applique") {
      const up = Math.random() < 0.5;
      let prix, t;
      do { prix = pick([20, 40, 50, 60, 80, 120, 150, 200, 250]); t = pick([5, 10, 20, 25, 30, 50]); } while ((prix * t) % 100 !== 0);
      const res = prix * (100 + (up ? t : -t)) / 100;
      return saisieP(`Un article coûte ${prix} €. Son prix ${up ? "augmente" : "baisse"} de ${t} %. Quel est son nouveau prix, en euros ?`, { n: res, d: 1 },
        `On multiplie par le coefficient ${fmtFR((100 + (up ? t : -t)) / 100)} : ${prix} × ${fmtFR((100 + (up ? t : -t)) / 100)} = ${res} €.`);
    }
    if (kind === "taux") {
      let v1, t;
      do { v1 = pick([20, 40, 50, 80, 100, 200]); t = pick([10, 20, 25, 50, -10, -20, -25, -50]); } while ((v1 * t) % 100 !== 0);
      const v2 = v1 * (100 + t) / 100;
      return saisieP(`Un prix passe de ${v1} € à ${v2} €. Quel est le taux d'évolution, en % ?`, { n: t, d: 1 },
        `Taux = (valeur finale − valeur initiale) ÷ valeur initiale × 100 = (${v2} − ${v1}) ÷ ${v1} × 100 = ${num(t)} %. ${t < 0 ? "Le taux est négatif car le prix baisse." : ""}`);
    }
    if (kind === "indice") {
      const v0 = pick([2000, 4000, 5000, 8000, 1200]), I = pick([85, 90, 104, 112, 115, 120, 135]);
      if (Math.random() < 0.5) {
        return saisieP(`La production d'un atelier est indexée sur 2023 (indice 100 en 2023). L'indice vaut ${fmtFR(I)} en 2025. Quel est le taux d'évolution entre 2023 et 2025, en % ?`, { n: I - 100, d: 1 },
          `Avec une base 100, le taux se lit directement : ${fmtFR(I)} − 100 = ${num(I - 100)} %.`);
      }
      const v = v0 * I / 100;
      return saisieP(`Une production vaut ${fmtFR(v0)} unités en 2023 (indice 100). En 2025, l'indice vaut ${I}. Combien d'unités produit-on en 2025 ?`, { n: v, d: 1 },
        `L'indice ${I} signifie ${I} pour 100 : ${fmtFR(v0)} × ${I} / 100 = ${fmtFR(v)} unités.`);
    }
    if (kind === "indice2") {
      const [I1, I2, t2] = pick([[125, 150, 20], [80, 100, 25], [120, 90, -25], [150, 120, -20], [110, 121, 10], [200, 250, 25], [160, 120, -25]]);
      return saisieP(`Base 100 en 2023. L'indice vaut ${I1} en 2024 et ${I2} en 2025. Quel est le taux d'évolution entre 2024 et 2025, en % ?`, { n: t2, d: 1 },
        `Attention, on ne soustrait pas les indices : le taux se calcule par rapport à ${I1}. (${I2} − ${I1}) ÷ ${I1} × 100 = ${num(t2)} %.`);
    }
    if (kind === "moyen") {
      const [glob, ans, n] = pick([[21, 10, 2], [44, 20, 2], [-19, -10, 2], [-36, -20, 2], [33.1, 10, 3], [-27.1, -10, 3], [72.8, 20, 3], [56.25, 25, 2]]);
      const cg = 1 + glob / 100, cm = 1 + ans / 100;
      return saisieP(`Une production ${glob > 0 ? "augmente" : "baisse"} de ${fmtFR(Math.abs(glob))} % en ${n} ans. Quel est le taux d'évolution moyen annuel, en % ?`, { n: ans, d: 1 },
        `On cherche le coefficient c tel que c<sup>${n}</sup> = ${fmtFR(cg)}. Donc c = ${fmtFR(cg)}<sup>1/${n}</sup> = ${fmtFR(cm)}, soit un taux moyen de ${num(ans)} % par an. Vérification : ${fmtFR(cm)}<sup>${n}</sup> = ${fmtFR(cg)}. Ce n'est pas ${fmtFR(glob / n)} % : les évolutions se multiplient, elles ne s'additionnent pas.`);
    }
    const t = pick([10, 20, 25, 50]);
    const perte = (t * t) / 100;
    return qcm("Pourcentages", `Un prix augmente de ${t} %, puis baisse de ${t} %. Au total, le prix…`,
      { html: `baisse de ${fmtFR(perte)} %` },
      [
        { html: "ne change pas", why: `La baisse s'applique sur un prix plus élevé : les deux évolutions ne se compensent pas. On multiplie les coefficients.` },
        { html: `augmente de ${fmtFR(perte)} %`, why: `Le produit des coefficients est inférieur à 1 : le prix baisse.` },
        { html: `baisse de ${t} %`, why: "On ne fait pas la somme des pourcentages : on multiplie les coefficients." },
      ],
      `On multiplie les coefficients : ${fmtFR(1 + t / 100)} × ${fmtFR(1 - t / 100)} = ${fmtFR((1 + t / 100) * (1 - t / 100))}. C'est même une identité remarquable : (1 + a)(1 − a) = 1 − a<sup>2</sup>. Le prix baisse donc de ${fmtFR(perte)} %.`);
  }

  // ---------- Questions fixes du programme de la semaine (PDF) ----------
  // QCM « plusieurs carrés » : Calcule 6², 9² et 12²
  function carresMulti(ns) {
    const list = (f) => ns.map(f).join(" ; ");
    return qcm("Carrés", `Calcule ${ns.map((n) => pow(n, 2)).join(", ")}`,
      { html: list((n) => n * n) },
      [
        { html: list((n) => 2 * n), why: `${pow(ns[0], 2)} = ${ns[0]} × ${ns[0]}, pas ${ns[0]} × 2.` },
        { html: list((n, i) => (i === ns.length - 1 ? n * n + n : n * n)), why: `Vérifie le dernier : ${ns[ns.length - 1]} × ${ns[ns.length - 1]} = ${ns[ns.length - 1] ** 2}.` },
        { html: list((n, i) => (i === 0 ? n * n - n : n * n)), why: `Vérifie le premier : ${ns[0]} × ${ns[0]} = ${ns[0] ** 2}.` },
      ],
      ns.map((n) => `${pow(n, 2)} = ${n} × ${n} = ${n * n}`).join(" ; "));
  }
  // QCM « de quels nombres sont-ils les carrés ? »
  function racinesMulti(ns) {
    const list = (f) => ns.map(f).join(" et ");
    return qcm("Carrés", `${ns.map((n) => n * n).join(" et ")} sont des carrés : de quels nombres ?`,
      { html: list((n) => n) },
      [
        { html: list((n) => String(n * n / 2).replace(".", ",")), why: "Le carré n'est pas le double : cherche le nombre qui, multiplié par lui-même, donne le résultat." },
        { html: list((n, i) => (i === ns.length - 1 ? n + 1 : n)), why: `${ns[ns.length - 1] + 1} × ${ns[ns.length - 1] + 1} = ${(ns[ns.length - 1] + 1) ** 2}, pas ${ns[ns.length - 1] ** 2}.` },
        { html: list((n, i) => (i === 0 ? n - 1 : n)), why: `${ns[0] - 1} × ${ns[0] - 1} = ${(ns[0] - 1) ** 2}, pas ${ns[0] ** 2}.` },
      ],
      ns.map((n) => `${n * n} = ${n} × ${n} = ${pow(n, 2)}`).join(" ; "));
  }
  // QCM « (3x)², (5x)², (10x)² »
  function carresMonomes(ks) {
    const list = (f) => ks.map(f).join(" ; ");
    return qcm("Carrés", `Calcule ${ks.map((k) => sq(k + "x")).join(", ")}`,
      { html: list((k) => `${k * k}x<sup>2</sup>`) },
      [
        { html: list((k) => `${k}x<sup>2</sup>`), why: `Le nombre devant le x est aussi au carré : (${ks[0]}x)<sup>2</sup> = ${ks[0]}x × ${ks[0]}x = ${ks[0] ** 2}x<sup>2</sup>.` },
        { html: list((k) => `${2 * k}x<sup>2</sup>`), why: `Élever au carré, ce n'est pas multiplier par 2 : ${ks[0]} × ${ks[0]} = ${ks[0] ** 2}.` },
        { html: list((k) => `${k * k}x`), why: "x × x = x<sup>2</sup> : le x aussi est au carré." },
      ],
      ks.map((k) => `(${k}x)<sup>2</sup> = ${k}x × ${k}x = ${k * k}x<sup>2</sup>`).join(" ; "));
  }
  // QCM « 36x² et 49x² sont les carrés de quoi ? » (+ cas mixte 225 et 25x²)
  function racinesMonomes(items) {
    // items : [{v: 36, x: true}, ...]
    const sqrt = (it) => Math.round(Math.sqrt(it.v));
    const show = (it) => (it.x ? `${it.v}x<sup>2</sup>` : String(it.v));
    const root = (it, f = (r) => r) => (it.x ? `${f(sqrt(it))}x` : String(f(sqrt(it))));
    const list = (f) => items.map(f).join(" et ");
    return qcm("Carrés", `${items.map(show).join(" et ")} sont des carrés : de quoi ?`,
      { html: list((it) => root(it)) },
      [
        { html: list((it) => (it.x ? `${sqrt(it)}x<sup>2</sup>` : String(sqrt(it)))), why: "Pour x<sup>2</sup>, la racine est x : (5x)<sup>2</sup> = 25x<sup>2</sup>, donc 25x<sup>2</sup> est le carré de 5x." },
        { html: list((it) => root(it, (r) => r * r / 2)), why: "Le carré n'est pas le double : cherche ce qui, multiplié par lui-même, donne le résultat." },
        { html: list((it, i) => (i === 0 ? root(it, (r) => r + 1) : root(it))), why: "Vérifie en multipliant le nombre par lui-même." },
      ],
      items.map((it) => `${show(it)} = (${root(it)})<sup>2</sup>`).join(" ; "));
  }
  // Réponse numérique simple
  const saisie = (theme, prompt, n, d, explain) => ({ theme, type: "input", prompt, answer: reduce(n, d), explain });
  // QCM libre
  const choix = (theme, prompt, correct, distractors, explain) =>
    qcm(theme, prompt, correct, distractors, explain);

  const PROGRAMME = [
    // Jour 1 – vendredi 6 novembre
    () => [
      carresMulti([6, 9, 12]),
      racinesMulti([8, 11]),
      fractions({ a: 2, b: 3, op: "+", c: 1, d: 4 }),
      fractions({ a: 7, b: 6, op: "−", c: 1, d: 3 }),
      puissances({ kind: "prod", a: 2, n: 4, m: 3 }),
      puissances({ kind: "quot", a: 10, n: 5, m: 2 }),
      developper({ kind: "carre", a: 1, b: 3 }),
      developper({ kind: "carre", a: 2, b: 1 }),
      factoriser({ kind: "diff", a: 1, B: 5 }),
      factoriser({ kind: "carre", a: 1, B: 3, s: 1 }),
    ],
    // Jour 2 – samedi 7 novembre
    () => [
      carresMulti([7, 11, 15]),
      racinesMulti([9, 12]),
      fractions({ a: 3, b: 5, op: "×", c: 10, d: 9 }),
      fractions({ a: 2, b: 3, op: "÷", c: 4, d: 9 }),
      puissances({ kind: "powpow", a: 3, n: 2, m: 3 }),
      saisie("Puissances", `${pow(5, 0)} + ${pow(2, -1)}`, 3, 2,
        `${pow(5, 0)} = 1 et ${pow(2, -1)} = ${frac(1, 2)}, donc ${pow(5, 0)} + ${pow(2, -1)} = 1 + ${frac(1, 2)} = ${frac(3, 2)}`),
      developper({ kind: "carre", a: 1, b: -5 }),
      developper({ kind: "carre", a: 3, b: 2 }),
      factoriser({ kind: "diff", a: 2, B: 3 }),
      factoriser({ kind: "carre", a: 1, B: 4, s: -1 }),
    ],
    // Jour 3 – dimanche 8 novembre
    () => [
      carresMulti([8, 13, 20]),
      racinesMonomes([{ v: 36, x: true }, { v: 49, x: true }]),
      fractions({ a: 5, b: 2, op: "−", c: 3, d: 4 }),
      fractions({ a: 1, b: 1, op: "+", c: 2, d: 5 }),
      puissances({ kind: "prod", a: 2, n: -2, m: 5 }),
      saisie("Puissances", `(2 × 5)${sup(3)}`, 1000, 1,
        `(2 × 5)${sup(3)} = ${pow(10, 3)} = 1000. On peut aussi écrire ${pow(2, 3)} × ${pow(5, 3)} = 8 × 125 = 1000.`),
      developper({ kind: "carre", a: 2, b: -3 }),
      developper({ kind: "diff", a: 1, b: 7 }),
      factoriser({ kind: "carre", a: 1, B: 7, s: 1 }),
      factoriser({ kind: "diff", a: 3, B: 1 }),
    ],
    // Jour 4 – lundi 9 novembre
    () => [
      carresMulti([14, 16]),
      racinesMulti([10, 13]),
      fractions({ a: 3, b: 4, op: "+", c: 5, d: 6 }),
      fractions({ a: 4, b: 7, op: "×", c: 21, d: 8 }),
      puissances({ kind: "prod", a: 10, n: 3, m: -5 }),
      scientifique({ m: 4.5, e: 3 }),
      developper({ kind: "carre", a: 4, b: 1 }),
      choix("Développer", `Développe (5 ${MINUS} x)<sup>2</sup>`,
        { html: `25 ${MINUS} 10x + x<sup>2</sup>`, fn: (x) => 25 - 10 * x + x * x },
        [
          { html: `25 ${MINUS} x<sup>2</sup>`, fn: (x) => 25 - x * x, why: "Il manque le double produit : (a − b)<sup>2</sup> = a<sup>2</sup> − 2ab + b<sup>2</sup>." },
          { html: `25 + 10x + x<sup>2</sup>`, fn: (x) => 25 + 10 * x + x * x, why: "Avec (a − b)<sup>2</sup>, le double produit est précédé d'un moins." },
          { html: `25 ${MINUS} 10x ${MINUS} x<sup>2</sup>`, fn: (x) => 25 - 10 * x - x * x, why: "(−x)<sup>2</sup> = x<sup>2</sup> : un carré est toujours positif." },
        ],
        `(5 − x)<sup>2</sup> = 5<sup>2</sup> − 2 × 5 × x + x<sup>2</sup> = 25 − 10x + x<sup>2</sup>`),
      factoriser({ kind: "carre", a: 2, B: 1, s: 1 }),
      choix("Factoriser", `Factorise 16 ${MINUS} x<sup>2</sup>`,
        { html: `(4 ${MINUS} x)(4 + x)`, fn: (x) => (4 - x) * (4 + x) },
        [
          { html: `(x ${MINUS} 4)(x + 4)`, fn: (x) => (x - 4) * (x + 4), why: "Attention à l'ordre : (x − 4)(x + 4) = x<sup>2</sup> − 16, et non 16 − x<sup>2</sup>." },
          { html: `(4 ${MINUS} x)<sup>2</sup>`, fn: (x) => (4 - x) ** 2, why: "(4 − x)<sup>2</sup> = 16 − 8x + x<sup>2</sup> : il y aurait un terme en x." },
          { html: `(16 ${MINUS} x)(16 + x)`, fn: (x) => (16 - x) * (16 + x), why: "16 est le carré de 4 : il faut prendre 4, pas 16." },
        ],
        `C'est a<sup>2</sup> − b<sup>2</sup> = (a − b)(a + b) avec a = 4 (car 16 = 4<sup>2</sup>) et b = x.`),
    ],
    // Jour 5 – mardi 10 novembre
    () => [
      carresMonomes([3, 5, 10]),
      racinesMonomes([{ v: 225, x: false }, { v: 25, x: true }]),
      fractions({ a: 1, b: 2, op: "−", c: 5, d: 6 }),
      fractions({ a: 5, b: 3, op: "÷", c: 10, d: 1 }),
      saisie("Puissances", `(${pow(2, 3)} × ${pow(2, 2)}) / ${pow(2, 4)}`, 2, 1,
        `${pow(2, 3)} × ${pow(2, 2)} = ${pow(2, 5)}, puis ${pow(2, 5)} / ${pow(2, 4)} = ${pow(2, 1)} = 2`),
      scientifique({ m: 7, e: -4 }),
      developper({ kind: "carre", a: 3, b: -4 }),
      developper({ kind: "diff", a: 2, b: 5 }),
      factoriser({ kind: "carre", a: 1, B: 5, s: -1 }),
      factoriser({ kind: "carre", a: 3, B: 1, s: 1 }),
    ],
    // Jour 6 – mercredi 11 novembre
    () => [
      choix("Carrés", `Calcule ${pow(12, 2)}. Puis : 225 est le carré de quel nombre ?`,
        { html: "144 ; 15" },
        [
          { html: "24 ; 15", why: `${pow(12, 2)} = 12 × 12 = 144, pas 12 × 2.` },
          { html: "144 ; 112,5", why: "Le carré n'est pas le double : 15 × 15 = 225." },
          { html: "144 ; 25", why: "25 × 25 = 625 : c'est 15 × 15 qui donne 225." },
        ],
        `${pow(12, 2)} = 12 × 12 = 144 ; 225 = 15 × 15 = ${pow(15, 2)}`),
      fractions({ a: 2, b: 3, op: "+", c: 3, d: 5 }),
      puissances({ kind: "powpow", a: 5, n: 2, m: -1 }),
      puissances({ kind: "prod", a: 3, n: 4, m: -2 }),
      developper({ kind: "carre", a: 5, b: 2 }),
      developper({ kind: "carre", a: 1, b: -6 }),
      factoriser({ kind: "diff", a: 5, B: 2 }),
      factoriser({ kind: "carre", a: 2, B: 3, s: -1 }),
      choix("Équations", `Résous x<sup>2</sup> ${MINUS} 9 = 0`,
        { html: `x = 3 ou x = ${MINUS}3` },
        [
          { html: "x = 3", why: `Il y a deux solutions : (${MINUS}3)<sup>2</sup> = 9 aussi.` },
          { html: "x = 9", why: "9<sup>2</sup> = 81, pas 9 : on cherche les nombres dont le carré vaut 9." },
          { html: "x = 4,5", why: "On ne divise pas par 2 : on factorise x<sup>2</sup> − 9 = (x − 3)(x + 3)." },
        ],
        `x<sup>2</sup> − 9 = (x − 3)(x + 3) = 0. Un produit est nul si l'un des facteurs est nul : x = 3 ou x = −3.`),
      choix("Équations", `Résous x<sup>2</sup> + 4x + 4 = 0`,
        { html: `x = ${MINUS}2` },
        [
          { html: "x = 2", why: "Remplace : 2<sup>2</sup> + 4 × 2 + 4 = 16, pas 0." },
          { html: `x = 2 ou x = ${MINUS}2`, why: "x<sup>2</sup> + 4x + 4 = (x + 2)<sup>2</sup> : une seule solution." },
          { html: `x = ${MINUS}4`, why: "Remplace : (−4)<sup>2</sup> + 4 × (−4) + 4 = 4, pas 0." },
        ],
        `x<sup>2</sup> + 4x + 4 = (x + 2)<sup>2</sup> = 0, donc x + 2 = 0, c'est-à-dire x = −2.`),
    ],
  ];

  const THEMES = {
    "Carrés": carres,
    "Fractions": fractions,
    "Nombres négatifs": negatifs,
    "Puissances": puissances,
    "Notation scientifique": scientifique,
    "Pourcentages": pourcentages,
    "Développer": developper,
    "Factoriser": factoriser,
    "Suites": suites,
  };

  // Défi du jour : 10 questions dans un ordre « échauffement »
  function defiDuJour(avoid) {
    // Priorités actuelles : fractions, nombres négatifs et suites ;
    // les identités remarquables (acquises) restent en entretien.
    const plan = [negatifs, negatifs, fractions, fractions, puissances, pourcentages,
      suites, suites,
      Math.random() < 0.5 ? developper : factoriser,
      Math.random() < 0.5 ? carres : scientifique];
    return plan.map((g) => fresh(g, avoid));
  }

  function serieTheme(name, n = 10, avoid) {
    return Array.from({ length: n }, () => fresh(THEMES[name], avoid));
  }

  // Tire une question qui n'a pas été vue récemment (avoid : Set de prompts)
  function fresh(gen, avoid) {
    let q = gen();
    for (let t = 0; t < 30 && avoid && avoid.has(q.prompt); t++) q = gen();
    if (avoid) avoid.add(q.prompt);
    return q;
  }

  // Lecture d'une réponse tapée : "3/4", "-2", "0,5", "−1/3"
  function parseAnswer(str) {
    if (typeof str !== "string") return null;
    const s = str.trim().replace(/\s+/g, "").replace(/[%€]/g, "").replace(/[−–]/g, "-").replace(",", ".");
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

  // Jour k (1 à 6) du programme de la semaine
  const programme = (k) => PROGRAMME[k - 1]().map((q) => ({ ...q, source: `Jour ${k}` }));
  const NB_JOURS = PROGRAMME.length;
  // Le programme de la semaine du 6 au 11 novembre 2026 n'est plus proposé après cette semaine
  const programmeActif = () => Date.now() < new Date(2026, 10, 13).getTime();

  // Version enregistrable d'une question (sans les fonctions de test)
  const serialize = (q) => ({
    theme: q.theme, prompt: q.prompt, type: q.type, answer: q.answer, display: q.display, explain: q.explain,
    choices: q.choices ? q.choices.map(({ html, correct, why }) => ({ html, correct, why })) : undefined,
  });
  // Rejouer une question enregistrée : on remélange les propositions
  const revive = (q) => ({ ...q, choices: q.choices ? shuffle(q.choices) : undefined });

  const api = { THEMES, defiDuJour, serieTheme, programme, programmeActif, NB_JOURS, serialize, revive, parseAnswer, sameValue, isReduced, reduce, frac, _internals: { poly, lin, mono } };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Gen = api;
})(typeof window !== "undefined" ? window : globalThis);
