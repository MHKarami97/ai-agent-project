const loremFragments = [
  "خورشید بلند و طلایی در افق می‌درخشید، نوید صبحی تازه را می‌داد.",
  "کلمات نرم و روان روی صفحه می‌لغزیدند تا چیدمانی آرام ایجاد کنند.",
  "پرنده‌ها در باغچه آواز محبت می‌خواندند و نسیمی خنک می‌گذشت.",
  "دریاچه‌ی آبی در دل کوه‌ها، ذهن را به سفر در דنیای خیال می‌برد.",
  "گل‌های بهاری با رنگ‌های زنده، امید را در هوا پخش می‌کردند.",
  "شب‌های روشن، چراغ‌هایی هستند که خاطره‌ها را روشن نگاه می‌دارند.",
  "پرچم‌های کوچک بر فراز خانه‌ها موج می‌زدند و شادی را انتقال می‌دادند.",
  "کلمات نرم و لطیف شعر، فضای صفحه را گرم‌تر می‌کردند.",
  "صدای باران روی پنجره قلب را می‌لرزاند، ولی آرامش می‌آورد.",
  "مسیر پیاده‌رو، هر پیچش را با نور خفیف چراغ‌راه‌ها نشان می‌داد.",
  "نگاه مهربانان، قصه‌ای از درک مشترک را بازگو می‌کرد.",
  "کتاب‌های کهنه روی میز، طنین زمان‌های آرام را حفظ کرده بودند.",
  "قطره‌های شبنم، جواهرهایی روی برگ‌ها می‌ساختند.",
  "هوای صبحگاهی بوی چای و خاطرات کودکی را یادآور می‌شد.",
  "لبخند کوچک، مسیرهای دشوار را هموار می‌کرد.",
  "آفتاب غروب نارنجی، شهری پر از سکوت مطبوع را ترسیم می‌کرد.",
  "دست‌های کوچک کودکان در بازی، انرژی تازه‌ای به فضا می‌دادند.",
  "شمیم خاک نم‌دار، داستان باران‌های گذشته را روایت می‌کرد.",
  "سکوت کوچه‌ها پیش از طلوع، فرصتی برای نفس کشیدن می‌شد.",
  "نغمه‌های آشنا، روزهای دور را به امروز نزدیک می‌کردند.",
  "دوچرخه‌سواران در مسیر، حس پیشروی و زندگی را تعریف می‌کردند.",
];

const paragraphCountInput = document.getElementById("paragraphCount");
const sentencesRange = document.getElementById("sentencesPerParagraph");
const sentenceValue = document.getElementById("sentenceValue");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const resultEl = document.getElementById("result");
const statusMessage = document.getElementById("statusMessage");

const STORAGE_KEY = "persianLoremSettings";

function getRandomSentence() {
  return loremFragments[Math.floor(Math.random() * loremFragments.length)];
}

function buildParagraphs(paragraphs, sentences) {
  const paragraphList = [];
  for (let i = 0; i < paragraphs; i++) {
    const sentenceSet = [];
    for (let j = 0; j < sentences; j++) {
      sentenceSet.push(getRandomSentence());
    }
    paragraphList.push(sentenceSet.join(" "));
  }
  return paragraphList;
}

function renderOutput(paragraphs) {
  resultEl.innerHTML = "";
  paragraphs.forEach((paragraph) => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    resultEl.appendChild(p);
  });
}

function persistSettings() {
  const payload = {
    paragraphs: Number(paragraphCountInput.value),
    sentences: Number(sentencesRange.value),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function restoreSettings() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed.paragraphs === "number") {
      paragraphCountInput.value = parsed.paragraphs;
    }
    if (typeof parsed.sentences === "number") {
      sentencesRange.value = parsed.sentences;
      sentenceValue.textContent = parsed.sentences;
    }
  } catch (error) {
    console.warn("تنظیمات بازنویسی شدند:", error);
  }
}

function updateSentenceDisplay() {
  sentenceValue.textContent = sentencesRange.value;
}

function toggleCopy(enabled) {
  copyBtn.disabled = !enabled;
}

function showStatus(message) {
  statusMessage.textContent = message;
}

generateBtn.addEventListener("click", () => {
  const paragraphs = buildParagraphs(Number(paragraphCountInput.value), Number(sentencesRange.value));
  renderOutput(paragraphs);
  toggleCopy(true);
  persistSettings();
  showStatus("متن آماده است، برای ارسال یا بررسی استفاده کنید.");
});

copyBtn.addEventListener("click", async () => {
  const text = Array.from(resultEl.querySelectorAll("p"))
    .map((p) => p.textContent)
    .join("\n\n");
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showStatus("متن به کلیپ‌بورد کپی شد.");
  } catch (error) {
    showStatus("دسترسی به کلیپ‌بورد محدود است.");
  }
});

sentencesRange.addEventListener("input", () => {
  updateSentenceDisplay();
});

paragraphCountInput.addEventListener("input", () => {
  persistSettings();
});

window.addEventListener("DOMContentLoaded", () => {
  restoreSettings();
  updateSentenceDisplay();
  generateBtn.click();
});

