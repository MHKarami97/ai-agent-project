// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
    }

    getTheme() {
        return this.currentTheme;
    }
}

const themeManager = new ThemeManager();

// Listen to tool-wrapper theme changes
window.addEventListener('themeChanged', (e) => {
    themeManager.currentTheme = e.detail;
    themeManager.applyTheme();
});

// Listen to tool-wrapper language changes
window.addEventListener('languageChanged', (e) => {
    const newLang = e.detail;
    localStorage.setItem('lang', newLang);
    // Reload page to apply language changes
    location.reload();
});


const STORAGE_KEY = 'smart-notes-board';
const noteForm = document.getElementById('note-form');
const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const previewBody = document.getElementById('markdown-preview');
const notesBoard = document.getElementById('notes-board');
const noteCount = document.getElementById('note-count');
const clearAllButton = document.getElementById('clear-all');
const cancelButton = document.getElementById('note-cancel');
const submitButton = document.getElementById('note-submit');

let notes = loadNotes();
let editingId = null;

noteForm.addEventListener('submit', handleFormSubmit);
cancelButton.addEventListener('click', () => resetForm());
contentInput.addEventListener('input', () => updatePreview(contentInput.value));
notesBoard.addEventListener('click', handleCardActions);
notesBoard.addEventListener('dragstart', handleDragStart);
notesBoard.addEventListener('dragend', handleDragEnd);
notesBoard.addEventListener('dragover', handleDragOver);
notesBoard.addEventListener('drop', (event) => event.preventDefault());
clearAllButton.addEventListener('click', clearAllNotes);

renderNotes();
updatePreview('');

function loadNotes() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('خطا در بارگذاری یادداشت‌ها:', error);
    return [];
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function handleFormSubmit(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title && !content) {
    return;
  }

  if (editingId) {
    notes = notes.map((note) =>
      note.id === editingId
        ? { ...note, title: title || 'بدون عنوان', content, updatedAt: Date.now() }
        : note
    );
    editingId = null;
    submitButton.textContent = 'ذخیره یادداشت';
  } else {
    notes.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : `note-${Date.now()}-${Math.random()}`,
      title: title || 'بدون عنوان',
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  saveAndRender();
  noteForm.reset();
  updatePreview('');
}

function handleCardActions(event) {
  const card = event.target.closest('.note-card');
  if (!card) {
    return;
  }
  const noteId = card.dataset.id;

  if (event.target.matches('button.edit')) {
    const note = notes.find((entry) => entry.id === noteId);
    if (!note) {
      return;
    }
    editingId = noteId;
    titleInput.value = note.title;
    contentInput.value = note.content;
    submitButton.textContent = 'به‌روزرسانی یادداشت';
    updatePreview(note.content);
    titleInput.focus();
  }

  if (event.target.matches('button.delete')) {
    notes = notes.filter((entry) => entry.id !== noteId);
    saveAndRender();
    if (editingId === noteId) {
      editingId = null;
      resetForm();
    }
  }
}

function handleDragStart(event) {
  const card = event.target.closest('.note-card');
  if (!card) {
    return;
  }
  card.classList.add('dragging');
  event.dataTransfer?.setData('text/plain', card.dataset.id);
  event.dataTransfer?.setDragImage(card, 0, 0);
}

function handleDragEnd() {
  const draggingCard = notesBoard.querySelector('.note-card.dragging');
  if (draggingCard) {
    draggingCard.classList.remove('dragging');
  }
  persistOrder();
}

function handleDragOver(event) {
  event.preventDefault();
  const draggingCard = notesBoard.querySelector('.note-card.dragging');
  if (!draggingCard) {
    return;
  }
  const afterElement = getDragAfterElement(notesBoard, event.clientY);
  if (afterElement == null) {
    notesBoard.appendChild(draggingCard);
  } else {
    notesBoard.insertBefore(draggingCard, afterElement);
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.note-card:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset > 0 && offset < closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.POSITIVE_INFINITY, element: null }).element;
}

function persistOrder() {
  const order = Array.from(notesBoard.children).map((card) => card.dataset.id);
  notes.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  saveNotes();
}

function clearAllNotes() {
  if (!notes.length) {
    return;
  }
  const confirmed = confirm('آیا مطمئن هستید که همه یادداشت‌ها حذف شوند؟');
  if (!confirmed) {
    return;
  }
  notes = [];
  saveAndRender();
  resetForm();
}

function resetForm() {
  editingId = null;
  noteForm.reset();
  submitButton.textContent = 'ذخیره یادداشت';
  updatePreview('');
}

function saveAndRender() {
  saveNotes();
  renderNotes();
}

function renderNotes() {
  notesBoard.innerHTML = '';
  notes.forEach((note) => {
    const article = document.createElement('article');
    article.className = 'note-card';
    article.dataset.id = note.id;
    article.draggable = true;
    article.innerHTML = `
      <header>
        <div>
          <h3>${note.title}</h3>
          <time>${new Date(note.updatedAt || note.createdAt).toLocaleString('fa-IR')}</time>
        </div>
        <div class="card-actions">
          <button type="button" class="edit">ویرایش</button>
          <button type="button" class="delete">حذف</button>
        </div>
      </header>
      <div class="card-body">${note.content ? renderMarkdown(note.content) : '<p class="empty-note">یادداشتی وجود ندارد.</p>'}</div>
    `;
    notesBoard.appendChild(article);
  });
  noteCount.textContent = notes.length;
}

function updatePreview(value) {
  const trimmed = value.trim();
  previewBody.innerHTML = trimmed
    ? renderMarkdown(trimmed)
    : '<p>متن خود را تایپ کنید تا پیش‌نمایش Markdown را ببینید.</p>';
}

function renderMarkdown(value) {
  const escaped = escapeHtml(value);
  const lines = escaped.split(/\r?\n/);
  const htmlLines = [];
  let isListOpen = false;

  lines.forEach((rawLine) => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (isListOpen) {
        htmlLines.push('</ul>');
        isListOpen = false;
      }
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      if (isListOpen) {
        htmlLines.push('</ul>');
        isListOpen = false;
      }
      const level = Math.min(6, headingMatch[1].length);
      htmlLines.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
      return;
    }

    const listMatch = trimmed.match(/^([-*])\s+(.*)/);
    if (listMatch) {
      if (!isListOpen) {
        htmlLines.push('<ul>');
        isListOpen = true;
      }
      htmlLines.push(`<li>${formatInlineMarkdown(listMatch[2])}</li>`);
      return;
    }

    if (isListOpen) {
      htmlLines.push('</ul>');
      isListOpen = false;
    }

    htmlLines.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
  });

  if (isListOpen) {
    htmlLines.push('</ul>');
  }

  return htmlLines.join('');
}

function formatInlineMarkdown(value) {
  return value
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char] || char;
  });
}
