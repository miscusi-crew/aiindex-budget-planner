"use strict";
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: works until reload */ }
}

const money = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (s) => { const n = Number(String(s).replace(/[\s,]/g, "")); return Number.isFinite(n) && n >= 0 ? n : 0; };

const $ = (id) => document.getElementById(id);
let data = load("budget", null) ?? {
  income: [{ name: "Salary", amt: 3200 }, { name: "Side work", amt: 300 }],
  expenses: [{ name: "Rent", amt: 1250 }, { name: "Groceries", amt: 420 }, { name: "Transport", amt: 140 }, { name: "Phone & internet", amt: 75 }, { name: "Eating out", amt: 180 }, { name: "Savings", amt: 500 }],
};
const sum = (list) => list.reduce((s, x) => s + num(x.amt), 0);

function list(kind) {
  $(kind).replaceChildren(...data[kind].map((x, i) => {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `<input aria-label="Name" maxlength="40"><input class="amt" inputmode="decimal" aria-label="Amount"><button class="del" aria-label="Remove">✕</button>`;
    const [name, amt, del] = row.children;
    name.value = x.name;
    amt.value = x.amt;
    name.addEventListener("input", () => { x.name = name.value; totals(); });
    amt.addEventListener("input", () => { x.amt = amt.value; totals(); });
    del.addEventListener("click", () => { data[kind].splice(i, 1); render(); });
    return row;
  }));
}

function totals() {
  save("budget", data);
  const inc = sum(data.income), exp = sum(data.expenses), left = inc - exp;
  $("inc-total").textContent = money.format(inc);
  $("exp-total").textContent = money.format(exp);
  $("left").textContent = money.format(left);
  $("left").className = `left ${left < 0 ? "neg" : "pos"}`;
  $("left-label").textContent = left < 0 ? "Over budget each month." : "Left over each month.";
  const sorted = [...data.expenses].filter((x) => num(x.amt) > 0).sort((a, b) => num(b.amt) - num(a.amt));
  $("bars").innerHTML = sorted.map((x) => {
    const pct = exp ? (num(x.amt) / exp) * 100 : 0;
    return `<div class="bar"><span></span><span class="track"><span class="fill" style="width:${pct}%;display:block"></span></span><span class="pct">${Math.round(pct)}%</span></div>`;
  }).join("");
  $("bars").querySelectorAll(".bar > span:first-child").forEach((s, i) => { s.textContent = sorted[i].name || "Unnamed"; });
}

function render() { list("income"); list("expenses"); totals(); }
document.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
  data[b.dataset.add].push({ name: "", amt: "" });
  render();
  $(b.dataset.add).lastElementChild.querySelector("input").focus();
}));
render();
