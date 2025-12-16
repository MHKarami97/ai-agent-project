const form = document.getElementById("convert-form");
const resultBox = document.getElementById("conversion-result");
const ageForm = document.getElementById("age-form");
const ageResult = document.getElementById("age-result");
const saveBtn = document.getElementById("save-last");
const clearBtn = document.getElementById("clear-history");
const historyList = document.getElementById("history-list");

const STORAGE_KEY = "calendar-converter-history";
let lastResult = null;

const formatDate = (label, { yearKey = "y", monthKey = "m", dayKey = "d" } = {}) => (data) => {
  const y = data[label === "jalali" ? "jy" : label === "gregorian" ? "gy" : "hy"];
  const m = data[label === "jalali" ? "jm" : label === "gregorian" ? "gm" : "hm"];
  const d = data[label === "jalali" ? "jd" : label === "gregorian" ? "gd" : "hd"];
  return `${yearKey}: ${y} / ${monthKey}: ${m} / ${dayKey}: ${d}`;
};

const renderConversion = (conversion) => {
  const sections = [
    { name: "شمسی", key: "jalali" },
    { name: "میلادی", key: "gregorian" },
    { name: "قمری", key: "hijri" }
  ];
  resultBox.innerHTML = sections
    .map(({ name, key }) => `<div><strong>${name}:</strong> ${formatDate(key)(conversion[key])}</div>`)
    .join("");
};

const renderAge = (age) => {
  ageResult.innerHTML = `سن شما: <strong>${age.years}</strong> سال، <strong>${age.months}</strong> ماه، <strong>${age.days}</strong> روز`;
};

const showError = (target, message) => {
  target.innerHTML = `<span class="error">${message}</span>`;
};

const readHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {
    return [];
  }
};

const writeHistory = (records) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const renderHistory = () => {
  const records = readHistory();
  if (!records.length) {
    historyList.innerHTML = "<li>هنوز چیزی ذخیره نشده است.</li>";
    return;
  }
  historyList.innerHTML = records
    .map((record) => `<li><strong>${record.type}</strong> - ${record.text}<br/><small>${record.createdAt}</small></li>`)
    .join("");
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const calendar = document.getElementById("source-calendar").value;
  const year = document.getElementById("input-year").value;
  const month = document.getElementById("input-month").value;
  const day = document.getElementById("input-day").value;

  try {
    const conversion = converters.convert({ calendar, year, month, day });
    renderConversion(conversion);
    lastResult = { type: "تبدیل", text: resultBox.textContent };
  } catch (error) {
    showError(resultBox, error.message);
  }
});

ageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const calendar = document.getElementById("age-calendar").value;
  const year = document.getElementById("age-year").value;
  const month = document.getElementById("age-month").value;
  const day = document.getElementById("age-day").value;
  try {
    const age = converters.calcAge({ calendar, year, month, day });
    renderAge(age);
    lastResult = { type: "سن", text: ageResult.textContent };
  } catch (error) {
    showError(ageResult, error.message);
  }
});

saveBtn.addEventListener("click", () => {
  if (!lastResult) return alert("ابتدا یک نتیجه تولید کنید.");
  const records = readHistory();
  records.unshift({ ...lastResult, createdAt: new Date().toLocaleString("fa-IR") });
  writeHistory(records.slice(0, 20));
  renderHistory();
});

clearBtn.addEventListener("click", () => {
  if (!confirm("مطمئن هستید؟")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

renderHistory();

