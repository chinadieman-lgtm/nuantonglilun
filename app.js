/* ===== State ===== */
const state = {
  allQuestions: window.questions || [],
  filteredIndices: [],
  currentIdx: 0,
  wrongCounts: {},
  notes: {},
  typeFilter: "all",
  errorFilter: "all",
  answered: false,
  selectedOptions: [],
  lastResult: null,
  completedCount: 0
};

function loadFromStorage() {
  try {
    const wc = localStorage.getItem("quiz_wrongCounts");
    state.wrongCounts = wc ? JSON.parse(wc) : {};
    const n = localStorage.getItem("quiz_notes");
    state.notes = n ? JSON.parse(n) : {};
  } catch (e) {
    state.wrongCounts = {};
    state.notes = {};
  }
}

function saveWrongCounts() {
  localStorage.setItem("quiz_wrongCounts", JSON.stringify(state.wrongCounts));
}

function saveNotes() {
  localStorage.setItem("quiz_notes", JSON.stringify(state.notes));
}

function getFilteredIndices() {
  return state.allQuestions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => {
      if (state.typeFilter !== "all" && q.type !== state.typeFilter) return false;
      const wc = state.wrongCounts[q.id] || 0;
      if (state.errorFilter === "wrong-only") return wc > 0;
      if (state.errorFilter === "ge1") return wc >= 1;
      if (state.errorFilter === "ge2") return wc >= 2;
      if (state.errorFilter === "ge3") return wc >= 3;
      return true;
    })
    .map(({ i }) => i);
}

function applyFilters() {
  state.filteredIndices = getFilteredIndices();
  state.currentIdx = 0;
  state.answered = false;
  state.selectedOptions = [];
  state.lastResult = null;
  render();
}

function goNext() {
  if (state.currentIdx < state.filteredIndices.length - 1) {
    state.completedCount++;
    state.currentIdx++;
    state.answered = false;
    state.selectedOptions = [];
    state.lastResult = null;
    render();
  }
}

function goPrev() {
  if (state.currentIdx > 0) {
    state.currentIdx--;
    state.answered = false;
    state.selectedOptions = [];
    state.lastResult = null;
    render();
  }
}

function getWrongCount(qId) {
  return state.wrongCounts[qId] || 0;
}

function incrementWrong(qId) {
  state.wrongCounts[qId] = (state.wrongCounts[qId] || 0) + 1;
  saveWrongCounts();
  updateWrongCountDisplay(qId);
}

function decrementWrong(qId) {
  const cur = state.wrongCounts[qId] || 0;
  if (cur > 0) {
    state.wrongCounts[qId] = cur - 1;
    saveWrongCounts();
    updateWrongCountDisplay(qId);
  }
}

function updateWrongCountDisplay(qId) {
  const el = document.querySelector(".wrong-count .count-value");
  if (el) el.textContent = getWrongCount(qId);
}

function checkAnswer() {
  const q = getCurrentQuestion();
  if (!q) return;
  const userAnswer = state.selectedOptions.slice().sort().join("");
  const isCorrect = userAnswer === q.answer;
  state.answered = true;
  state.lastResult = { isCorrect, userAnswer };
  if (!isCorrect) {
    state.wrongCounts[q.id] = (state.wrongCounts[q.id] || 0) + 1;
    saveWrongCounts();
  }
  render();
}

function renderResult(q, isCorrect, userAnswer) {
  const el = document.getElementById("result");
  if (!el) return;
  const st = isCorrect ? "\u56de\u7b54\u6b63\u786e\uff01" : "\u56de\u7b54\u9519\u8bef";
  const ic = isCorrect ? "&#10003;" : "&#10007;";
  const rc = isCorrect ? "correct" : "wrong";
  let ca = "\u6b63\u786e\u7b54\u6848\uff1a" + q.answer + ". " + (q.options[q.answer] || "");
  let wd = "";
  if (!isCorrect && userAnswer) {
    const u = userAnswer.split("").map(l => l + ". " + (q.options[l] || "")).join("\uff1b");
    wd = "<div class=\"your-answer\" style=\"font-size:13px;margin-top:4px;color:var(--text-secondary)\">\u4f60\u7684\u7b54\u6848\uff1a" + u + "</div>";
  }
  const ex = q.explanation ? "<div class=\"explanation\">" + escapeHtml(q.explanation) + "</div>" : "";
  el.className = "result " + rc;
  el.style.display = "flex";
  el.innerHTML = "<div class=\"result-icon\">" + ic + "</div><div class=\"result-text\"><div class=\"result-status\">" + st + "</div><div class=\"answer-display\">" + ca + "</div>" + wd + ex + "</div>";
  const letters = q.answer.split("");
  letters.forEach(l => {
    const x = document.querySelector("[data-opt=\"" + l + "\"]");
    if (x) x.classList.add("correct");
  });
  if (!isCorrect && userAnswer) {
    userAnswer.split("").forEach(l => {
      const x = document.querySelector("[data-opt=\"" + l + "\"]");
      if (x && letters.indexOf(l) === -1) x.classList.add("wrong");
    });
  }
}

function getCurrentQuestion() {
  const idx = state.filteredIndices[state.currentIdx];
  return idx === undefined ? null : state.allQuestions[idx];
}

function render() {
  const q = getCurrentQuestion();
  const c = document.getElementById("questionContainer");
  if (!q) {
    c.innerHTML = "<div class=\"empty-state\"><div class=\"empty-icon\">&#128269;</div><p>\u6ca1\u6709\u7b26\u5408\u6761\u4ef6\u7684\u9898\u76ee</p><p style=\"font-size:13px;margin-top:8px;color:var(--text-light)\">\u8bf7\u8c03\u6574\u7b5b\u9009\u6761\u4ef6</p></div>";
    document.getElementById("statsBar").innerHTML = "";
    document.getElementById("progressBar").innerHTML = "";
    document.getElementById("navBar").innerHTML = "";
    return;
  }
  updateStats(q);
  updateProgress();
  renderCard(q);
  renderNav();
}

function updateStats(q) {
  const total = state.filteredIndices.length;
  const cur = state.currentIdx + 1;
  const totalAll = state.allQuestions.length;
  const hf = total !== totalAll;
  const e = document.getElementById("statsBar");
  const extra = hf ? "<span style=\"color:var(--text-light);font-size:12px;margin-left:6px;\">(\u5171" + totalAll + "\u9898)</span>" : "";
  const completed = state.completedCount;
  e.innerHTML = "<span>\u7b2c " + cur + " / " + total + " \u9898" + extra + "</span><span style=\"font-size:12px;color:var(--text-light);\">" + getAccuracy() + "</span><span style=\"font-size:12px;color:var(--primary);margin-left:12px;\" title=\"\u672c\u6b21\u5237\u9898\u5df2\u5b8c\u6210\u6570\">\u5b8c\u6210 " + completed + " \u9898</span>";
}

function getAccuracy() {
  const k = Object.keys(state.wrongCounts);
  return k.length === 0 ? "--" : k.length + " \u9898\u5df2\u4f5c\u7b54";
}

function updateProgress() {
  const total = state.filteredIndices.length;
  const done = state.currentIdx + 1;
  const pct = total > 0 ? (done / total) * 100 : 0;
  document.getElementById("progressBar").innerHTML = "<div class=\"progress-fill\" style=\"width:" + pct + "%\"></div>";
}

function renderCard(q) {
  const c = document.getElementById("questionContainer");
  const wc = getWrongCount(q.id);
  const notes = state.notes[q.id] || "";
  let bc = "badge-single";
  if (q.type === "多选题") bc = "badge-multi";
  else if (q.type === "判断题") bc = "badge-judge";
  let oh = "", jh = "";
  if (q.type === "判断题") {
    jh = "<div class=\"judge-options\" id=\"optionsArea\">" + renderJudgeOptions(q) + "</div>";
  } else {
    oh = "<div class=\"options\" id=\"optionsArea\">" + renderOptions(q) + "</div>";
  }
  c.innerHTML = "<div class=\"card\" id=\"questionCard\"><div class=\"card-header\"><div class=\"question-meta\"><span class=\"question-number\">第 " + q.id + " 题</span><span class=\"badge " + bc + "\">" + q.type + "</span></div><div class=\"wrong-count\"><span><span class=\"count-value\" style=\"font-weight:600;color:var(--wrong)\">" + wc + "</span> 次错误</span><button class=\"btn-icon\" onclick=\"window.decrementWrong(" + q.id + ")\" title=\"减少错误次数\">-</button><button class=\"btn-icon\" onclick=\"window.incrementWrong(" + q.id + ")\" title=\"增加错误次数\">+</button></div></div><div class=\"question-body\"><p class=\"question-text\">" + escapeHtml(q.question) + "</p></div>" + oh + jh + "<div class=\"submit-area\"><button class=\"btn-primary\" id=\"submitBtn\">提交答案</button></div><div class=\"result\" id=\"result\" style=\"display:none\"></div><div class=\"notes-section\"><button class=\"notes-toggle\" onclick=\"window.toggleNotes()\"><div class=\"notes-toggle-left\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/></svg><span>备注</span></div></button><div class=\"notes-content\" id=\"notesContent\" style=\"display:none\"><textarea id=\"notesTextarea\" placeholder=\"在此写下备注...\" oninput=\"window.saveCurrentNote()\">" + escapeHtml(notes) + "</textarea></div></div></div>";

  // Restore selected visual states
  state.selectedOptions.forEach(function(val) {
    if (q.type === "判断题") {
      const el = document.querySelector(".judge-btn[data-value=\"" + val + "\"]");
      if (el) el.classList.add("selected");
    } else {
      const inp = document.querySelector("input[value=\"" + val + "\"]");
      if (inp) {
        inp.checked = true;
        const p = inp.closest(".option");
        if (p) p.classList.add("selected");
      }
    }
  });

  const sb = document.getElementById("submitBtn");
  if (sb) sb.disabled = state.selectedOptions.length === 0;

  if (state.answered && state.lastResult) {
    document.querySelectorAll(".option, .judge-btn").forEach(function(el) {
      el.classList.add("disabled");
    });
    if (sb) sb.disabled = true;
    renderResult(state.lastResult.q || q, state.lastResult.isCorrect, state.lastResult.userAnswer);
  }
}

function renderOptions(q) {
  const k = Object.keys(q.options);
  const isMulti = q.type === "多选题";
  const it = isMulti ? "checkbox" : "radio";
  const nm = "q" + q.id;
  let html = "";
  for (let i = 0; i < k.length; i++) {
    const l = k[i];
    const t = q.options[l];
    const mc = isMulti ? "square" : "";
    html += "<label class=\"option\" data-opt=\"" + l + "\"><input type=\"" + it + "\" name=\"" + nm + "\" value=\"" + l + "\"><span class=\"option-marker " + mc + "\">" + l + "</span><span class=\"option-text\">" + escapeHtml(t) + "</span></label>";
  }
  return html;
}

function renderJudgeOptions(q) {
  const k = Object.keys(q.options);
  let html = "";
  for (let i = 0; i < k.length; i++) {
    const l = k[i];
    const t = q.options[l];
    html += "<button class=\"judge-btn\" data-value=\"" + l + "\">" + escapeHtml(t) + "</button>";
  }
  return html;
}

function selectOption(letter, isMulti) {
  if (state.answered) return;
  if (isMulti) {
    const idx = state.selectedOptions.indexOf(letter);
    if (idx >= 0) state.selectedOptions.splice(idx, 1);
    else state.selectedOptions.push(letter);
  } else {
    state.selectedOptions = [letter];
  }
  updateOptionUI();
}

function updateOptionUI() {
  document.querySelectorAll(".option").forEach(function(el) {
    el.classList.remove("selected");
    const inp = el.querySelector("input");
    if (inp && state.selectedOptions.indexOf(inp.value) >= 0) {
      el.classList.add("selected");
      inp.checked = true;
    } else if (inp) {
      inp.checked = false;
    }
  });
  const sb = document.getElementById("submitBtn");
  if (sb) sb.disabled = state.selectedOptions.length === 0;
}

function selectJudgeOption(letter) {
  if (state.answered) return;
  state.selectedOptions = [letter];
  document.querySelectorAll(".judge-btn").forEach(function(el) {
    el.classList.toggle("selected", el.dataset.value === letter);
  });
  const sb = document.getElementById("submitBtn");
  if (sb) sb.disabled = false;
}

var notesOpen = false;
function toggleNotes() {
  notesOpen = !notesOpen;
  const content = document.getElementById("notesContent");
  const chevron = document.querySelector(".notes-toggle .chevron");
  if (content) content.style.display = notesOpen ? "block" : "none";
  if (chevron) chevron.classList.toggle("open", notesOpen);
}

function saveCurrentNote() {
  const q = getCurrentQuestion();
  if (!q) return;
  const ta = document.getElementById("notesTextarea");
  if (!ta) return;
  const text = ta.value.trim();
  if (text) state.notes[q.id] = text;
  else delete state.notes[q.id];
  saveNotes();
  const ind = document.querySelector(".notes-indicator");
  if (ind) ind.className = "notes-indicator " + (text ? "has-notes" : "no-notes");
}

function setTypeFilter(type) {
  state.typeFilter = type;
  document.querySelectorAll(".seg-btn[data-type]").forEach(function(el) {
    el.classList.toggle("active", el.dataset.type === type);
  });
  applyFilters();
}

function setErrorFilter(val) {
  state.errorFilter = val;
  applyFilters();
}

function escapeHtml(text) {
  if (!text) return "";
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

function renderNav() {
  const total = state.filteredIndices.length;
  const cur = state.currentIdx;
  document.getElementById("navBar").innerHTML = "" +
    "<button class=\"btn-nav\" data-nav=\"prev\" " + (cur === 0 ? "disabled" : "") + ">" +
      "<svg class=\"nav-icon\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m15 18-6-6 6-6\"/></svg>上一题" +
    "</button>" +
    "<button class=\"btn-nav\" data-nav=\"next\" " + (cur >= total - 1 ? "disabled" : "") + ">" +
      "下一题<svg class=\"nav-icon\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m9 18 6-6-6-6\"/></svg>" +
    "</button>";
}

function init() {
  loadFromStorage();
  if (state.allQuestions.length === 0) {
    document.getElementById("questionContainer").innerHTML = "<div class=\"empty-state\"><div class=\"empty-icon\">&#128196;</div><p>暂无题目数据</p><p style=\"font-size:13px;margin-top:8px;color:var(--text-light)\">请先运行 convert.py 生成 data.js</p></div>";
    return;
  }
  applyFilters();
}

// Event delegation for all clicks (including submit)
document.addEventListener("click", function(e) {
  var t = e.target;
  if (t.closest) {
    // Handle submit button
    if (t.closest("#submitBtn") || t.id === "submitBtn") {
      checkAnswer();
      return;
    }
    var opt = t.closest(".option");
    if (opt) {
      var letter = opt.getAttribute("data-opt");
      if (letter && !state.answered) {
        if (t.tagName === "INPUT") return;
        var isMulti = document.querySelector(".badge-multi") !== null;
        if (isMulti) {
          var idx = state.selectedOptions.indexOf(letter);
          if (idx >= 0) state.selectedOptions.splice(idx, 1);
          else state.selectedOptions.push(letter);
        } else {
          state.selectedOptions = [letter];
        }
        updateOptionUI();
      }
      return;
    }
    var jbtn = t.closest(".judge-btn");
    if (jbtn) {
      var val = jbtn.getAttribute("data-value");
      if (val && !state.answered) selectJudgeOption(val);
      return;
    }
    var nav = t.closest("[data-nav]");
    if (nav) {
      if (nav.getAttribute("data-nav") === "prev") goPrev();
      else goNext();
      return;
    }
  }
});

// Submit button handler


// Expose to window
window.selectOption = selectOption;
window.checkAnswer = checkAnswer;
window.selectJudgeOption = selectJudgeOption;
window.goNext = goNext;
window.goPrev = goPrev;
window.setTypeFilter = setTypeFilter;
window.setErrorFilter = setErrorFilter;
window.incrementWrong = incrementWrong;
window.decrementWrong = decrementWrong;
window.toggleNotes = toggleNotes;
window.saveCurrentNote = saveCurrentNote;

document.addEventListener("DOMContentLoaded", init);
