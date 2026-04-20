/**
 * html-generator.mjs — HTML template generation for the review/approval UI.
 *
 * Exports:
 *   esc(s)                              — HTML-escape a string
 *   generateHtml(title, groupsOrResults) — interactive HTML report
 */

// ── Helpers ─────────────────────────────────────────────────────

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Generate an interactive HTML report for one or more theatres.
 *
 * @param {string} title          — page title
 * @param {Array}  groupsOrResults — either a plain results array or array of { theatreName, results } groups
 */
export function generateHtml(title, groupsOrResults) {
  // Backward compat: plain results array → wrap in single group
  const groups =
    Array.isArray(groupsOrResults) &&
    groupsOrResults.length > 0 &&
    Array.isArray(groupsOrResults[0]?.results)
      ? groupsOrResults
      : [{ theatreName: title, results: groupsOrResults || [] }];

  const now = new Date().toLocaleString("he-IL", {
    dateStyle: "long",
    timeStyle: "short",
  });

  // Build flat results array and card HTML with global indices
  let globalIndex = 0;
  const allResults = [];

  const cardSections = groups
    .map((group) => {
      const groupTotal = group.results.length;
      const groupErrors = group.results.filter((r) => r.error).length;
      const groupValid = groupTotal - groupErrors;

      const groupCards = group.results
        .map((r) => {
          const i = globalIndex++;
          allResults.push(r);
          const hasError = !!r.error;
          const genres = (r.genre || []).join(", ");
          return `
      <div class="card${hasError ? " error-card" : ""}" data-index="${i}">
        <div class="card-header">
          ${!hasError ? `<input type="checkbox" class="card-checkbox" checked data-index="${i}">` : ""}
          <span class="card-number">${i + 1}</span>
          <input type="text" class="title-input" value="${esc(r.title)}" data-index="${i}">
        </div>
        <div class="card-body">
          <div class="image-section">
            ${
              r.imageUrl
                ? `<img class="show-image" src="${esc(r.imageUrl)}" alt="${esc(r.title)}">`
                : `<div class="image-placeholder">🎭</div>`
            }
          </div>
          <table class="fields-table">
            <tr>
              <td class="label">slug</td>
              <td><input type="text" class="field-input slug-input" dir="ltr" value="${esc(r.slug)}" data-index="${i}"></td>
            </tr>
            <tr>
              <td class="label">תיאטרון</td>
              <td><input type="text" class="field-input theatre-input" value="${esc(r.theatre)}" data-index="${i}"></td>
            </tr>
            <tr>
              <td class="label">משך (דקות)</td>
              <td><input type="number" class="field-input duration-input" min="1" value="${r.durationMinutes != null ? r.durationMinutes : ""}" data-index="${i}"></td>
            </tr>
            <tr>
              <td class="label">ז'אנרים</td>
              <td><input type="text" class="field-input genres-input" value="${esc(genres)}" data-index="${i}"></td>
            </tr>
            <tr>
              <td class="label">תקציר</td>
              <td><textarea class="field-textarea summary-input" rows="3" data-index="${i}">${esc(r.summary || "")}</textarea></td>
            </tr>
            <tr>
              <td class="label">תיאור</td>
              <td><textarea class="field-textarea description-input" rows="5" data-index="${i}">${esc(r.description || "")}</textarea></td>
            </tr>
            <tr>
              <td class="label">שחקנים</td>
              <td><textarea class="field-textarea cast-input" rows="3" data-index="${i}">${esc(r.cast || "")}</textarea></td>
            </tr>
            <tr>
              <td class="label">URL</td>
              <td><a href="${esc(r.url)}" target="_blank" class="url-link" dir="ltr">${esc(r.url)}</a></td>
            </tr>
            ${hasError ? `<tr><td class="label">שגיאה</td><td class="error-text">${esc(r.error)}</td></tr>` : ""}
          </table>
          <div class="card-status" data-index="${i}"></div>
        </div>
      </div>`;
        })
        .join("\n");

      if (groups.length > 1) {
        return `
      <div class="theatre-group-header">
        <h2>${esc(group.theatreName)}</h2>
        <span class="theatre-group-meta">${groupValid} תקינות מתוך ${groupTotal}</span>
      </div>
${groupCards}`;
      }
      return groupCards;
    })
    .join("\n");

  const total = allResults.length;
  const errorCount = allResults.filter((r) => r.error).length;
  const validCount = total - errorCount;

  let metaHtml = `${esc(now)} · ${total} הצגות (${validCount} תקינות)`;
  if (groups.length > 1) {
    const parts = groups.map((g) => {
      const gv = g.results.filter((r) => !r.error).length;
      return `${esc(g.theatreName)}: ${gv}`;
    });
    metaHtml += ` | ${parts.join(", ")}`;
  }

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>הצגות חסרות - ${esc(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      direction: rtl;
      padding-top: 80px;
    }

    /* ── Top bar ────────────────────────────── */
    .top-bar {
      position: fixed; top: 0; right: 0; left: 0; z-index: 100;
      background: #1e293b; border-bottom: 1px solid #334155;
      padding: 0.6rem 1.5rem;
      display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
    }
    .top-bar h1 { font-size: 1.15rem; color: #38bdf8; white-space: nowrap; margin: 0; }
    .top-bar .meta { color: #94a3b8; font-size: 0.8rem; white-space: nowrap; }
    .top-bar .spacer { flex: 1; }
    .toggle-link {
      color: #38bdf8; cursor: pointer; text-decoration: underline;
      font-size: 0.85rem; background: none; border: none; font-family: inherit; padding: 0;
    }
    .toggle-link:hover { color: #7dd3fc; }
    .bulk-btn {
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      color: #fff; border: none; border-radius: 8px;
      padding: 0.65rem 1.6rem; font-size: 1rem; font-weight: 700;
      cursor: pointer; font-family: inherit; white-space: nowrap;
    }
    .bulk-btn:hover { filter: brightness(1.15); }
    .bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #475569; filter: none; }
    .save-exclusions-btn {
      background: none; color: #f59e0b; border: 2px solid #f59e0b; border-radius: 8px;
      padding: 0.55rem 1.4rem; font-size: 0.95rem; font-weight: 700;
      cursor: pointer; font-family: inherit; white-space: nowrap; display: none;
    }
    .save-exclusions-btn:hover { background: rgba(245, 158, 11, 0.15); }
    .save-exclusions-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .bulk-status { font-size: 0.85rem; min-height: 1em; }

    /* ── Cards container ────────────────────── */
    .cards-container {
      max-width: 850px; margin: 1.5rem auto; padding: 0 1rem;
      display: flex; flex-direction: column; gap: 1.5rem;
    }

    /* ── Theatre group header (multi-theatre) ── */
    .theatre-group-header {
      background: linear-gradient(135deg, #1e3a5f, #2d1b69);
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      display: flex; align-items: center; gap: 1rem;
      border: 1px solid #334155;
    }
    .theatre-group-header h2 {
      color: #38bdf8; font-size: 1.1rem; margin: 0;
    }
    .theatre-group-meta {
      color: #94a3b8; font-size: 0.85rem;
    }

    /* ── Card ────────────────────────────────── */
    .card {
      background: #1e293b; border: 1px solid #334155;
      border-radius: 12px; overflow: hidden; transition: opacity 0.3s;
    }
    .card.inserted { opacity: 0.6; }
    .card.error-card { opacity: 0.7; }
    .card-header {
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      padding: 0.75rem 1rem;
      display: flex; align-items: center; gap: 0.75rem;
    }
    .card-checkbox {
      width: 18px; height: 18px; cursor: pointer;
      accent-color: #38bdf8; flex-shrink: 0;
    }
    .card-number {
      background: rgba(0,0,0,0.3); color: #fff; font-weight: 700;
      padding: 0.15rem 0.55rem; border-radius: 6px; font-size: 0.85rem; flex-shrink: 0;
    }
    .title-input {
      background: transparent; border: 1px solid transparent;
      color: #fff; font-size: 1.15rem; font-weight: 700;
      font-family: inherit; padding: 0.2rem 0.5rem;
      border-radius: 6px; flex: 1; min-width: 0;
    }
    .title-input:hover { border-color: rgba(255,255,255,0.3); }
    .title-input:focus { border-color: rgba(255,255,255,0.6); outline: none; background: rgba(0,0,0,0.2); }
    .success-badge {
      background: #22c55e; color: #fff; font-size: 0.75rem;
      padding: 0.2rem 0.6rem; border-radius: 12px; font-weight: 700;
      flex-shrink: 0; white-space: nowrap;
    }

    /* ── Card body ───────────────────────────── */
    .card-body { padding: 1rem 1.25rem; }
    .image-section { text-align: center; margin-bottom: 1rem; }
    .show-image {
      max-width: 100%; max-height: 220px; object-fit: cover;
      display: block; border-radius: 8px; margin: 0 auto;
    }
    .image-placeholder { font-size: 4rem; opacity: 0.3; }

    /* ── Fields table ────────────────────────── */
    .fields-table { width: 100%; border-collapse: collapse; }
    .fields-table tr { border-bottom: 1px solid rgba(51,65,85,0.5); }
    .fields-table tr:last-child { border-bottom: none; }
    .fields-table td { padding: 0.45rem 0.6rem; vertical-align: top; }
    .fields-table .label {
      color: #94a3b8; font-weight: 600; white-space: nowrap;
      width: 90px; padding-top: 0.7rem; font-size: 0.85rem;
    }

    /* ── Inputs ──────────────────────────────── */
    .field-input, .field-textarea {
      background: #0f172a; border: 1px solid #334155; color: #e2e8f0;
      border-radius: 6px; padding: 0.5rem; font-family: inherit; font-size: 0.9rem;
    }
    .field-input { width: 100%; }
    .field-textarea { width: 100%; resize: vertical; }
    .field-input:focus, .field-textarea:focus {
      border-color: #38bdf8; outline: none;
      box-shadow: 0 0 0 2px rgba(56,189,248,0.2);
    }

    /* ── Buttons ─────────────────────────────── */
    /* ── Status & misc ───────────────────────── */
    .card-status { text-align: center; margin-top: 0.5rem; font-size: 0.9rem; min-height: 1.2em; }
    .status-success { color: #4ade80; font-weight: 600; }
    .status-skipped { color: #fbbf24; font-weight: 600; }
    .status-error { color: #f87171; font-weight: 600; }
    .url-link { color: #38bdf8; text-decoration: none; word-break: break-all; font-size: 0.85rem; }
    .url-link:hover { text-decoration: underline; }
    .error-text { color: #f87171; font-size: 0.85rem; }
    .field-invalid {
      border-color: #f87171 !important;
      box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.3) !important;
    }
    .validation-errors {
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid #f87171;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem auto;
      max-width: 850px;
      direction: rtl;
    }
    .validation-errors h3 { color: #f87171; margin-bottom: 0.5rem; font-size: 1rem; }
    .validation-errors ul { list-style: none; padding: 0; }
    .validation-errors li { color: #fca5a5; font-size: 0.85rem; padding: 0.15rem 0; }
    .tag {
      display: inline-block; background: #334155; color: #38bdf8;
      padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.85rem; margin: 0.1rem;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <h1>🎭 הצגות חסרות - ${esc(title)}</h1>
    <span class="meta">${metaHtml}</span>
    <span class="spacer"></span>
    <button class="toggle-link" onclick="selectAll()">בחר הכל</button>
    <button class="toggle-link" onclick="deselectAll()">בטל הכל</button>
    <button class="bulk-btn" id="bulk-btn" onclick="generateMigration()">צור מיגרציה (${validCount})</button>
    <button class="save-exclusions-btn" id="save-exclusions-btn" onclick="saveExclusions()">שמור דילוגים</button>
    <span class="bulk-status" id="bulk-status"></span>
  </div>

  <div class="cards-container">
    ${cardSections}
  </div>

  <script>
    var SHOWS = ${JSON.stringify(allResults).replace(/<\//g, "<\\/")};

    function slugify(title) {
      return title.trim().replace(/\\s+/g, "-");
    }

    function getCardData(idx) {
      var card = document.querySelector(".card[data-index='" + idx + "']");
      var title = card.querySelector(".title-input").value;
      var slug = card.querySelector(".slug-input").value;
      var theatre = card.querySelector(".theatre-input").value;
      var durVal = card.querySelector(".duration-input").value;
      var duration = durVal ? parseInt(durVal, 10) : null;
      var genresStr = card.querySelector(".genres-input").value;
      var genres = genresStr
        ? genresStr.split(",").map(function(g) { return g.trim(); }).filter(Boolean)
        : [];
      var summary = card.querySelector(".summary-input").value;
      var descEl = card.querySelector(".description-input");
      var description = descEl ? descEl.value || null : null;
      var castEl = card.querySelector(".cast-input");
      var cast = castEl ? castEl.value || null : null;
      return {
        title: title,
        slug: slug,
        theatre: theatre,
        durationMinutes: duration,
        genre: genres,
        summary: summary,
        description: description,
        cast: cast,
        url: SHOWS[idx].url,
        imageUrl: SHOWS[idx].imageUrl
      };
    }

    function getCheckedIndices() {
      var indices = [];
      document.querySelectorAll(".card-checkbox:checked").forEach(function(cb) {
        var card = cb.closest(".card");
        if (card && !card.classList.contains("inserted")) {
          indices.push(parseInt(card.getAttribute("data-index"), 10));
        }
      });
      return indices;
    }

    function getExcludableCount() {
      var count = 0;
      document.querySelectorAll(".card").forEach(function(card) {
        if (card.classList.contains("error-card")) return;
        if (card.classList.contains("inserted")) return;
        var cb = card.querySelector(".card-checkbox");
        if (cb && !cb.checked) count++;
      });
      return count;
    }

    function updateBulkCount() {
      var indices = getCheckedIndices();
      var btn = document.getElementById("bulk-btn");
      var exclBtn = document.getElementById("save-exclusions-btn");
      btn.textContent = "צור מיגרציה (" + indices.length + ")";
      btn.disabled = indices.length === 0;
      var excludable = getExcludableCount();
      exclBtn.style.display = (indices.length === 0 && excludable > 0) ? "inline-block" : "none";
      exclBtn.textContent = "שמור דילוגים (" + excludable + ")";
    }

    function validateShows(indices) {
      // Clear previous validation state
      document.querySelectorAll(".field-invalid").forEach(function(el) {
        el.classList.remove("field-invalid");
      });
      var prev = document.querySelector(".validation-errors");
      if (prev) prev.remove();

      var errors = [];
      var slugs = {};

      for (var i = 0; i < indices.length; i++) {
        var idx = indices[i];
        var card = document.querySelector(".card[data-index='" + idx + "']");
        var cardNumber = idx + 1;

        // Title
        var titleEl = card.querySelector(".title-input");
        if (!titleEl.value.trim()) {
          titleEl.classList.add("field-invalid");
          errors.push({ index: idx, cardNumber: cardNumber, field: "title", message: "שם ההצגה חסר" });
        }

        // Slug
        var slugEl = card.querySelector(".slug-input");
        var slugVal = slugEl.value;
        if (!slugVal.trim()) {
          slugEl.classList.add("field-invalid");
          errors.push({ index: idx, cardNumber: cardNumber, field: "slug", message: "slug חסר" });
        } else if (/\\s/.test(slugVal)) {
          slugEl.classList.add("field-invalid");
          errors.push({ index: idx, cardNumber: cardNumber, field: "slug", message: "slug מכיל רווחים" });
        } else if (slugs[slugVal]) {
          slugEl.classList.add("field-invalid");
          var firstCard = document.querySelector(".card[data-index='" + slugs[slugVal].index + "']");
          if (firstCard) firstCard.querySelector(".slug-input").classList.add("field-invalid");
          errors.push({ index: idx, cardNumber: cardNumber, field: "slug", message: "slug כפול בקבוצה" });
        } else {
          slugs[slugVal] = { index: idx, cardNumber: cardNumber };
        }

        // Theatre
        var theatreEl = card.querySelector(".theatre-input");
        if (!theatreEl.value.trim()) {
          theatreEl.classList.add("field-invalid");
          errors.push({ index: idx, cardNumber: cardNumber, field: "theatre", message: "תיאטרון חסר" });
        }

        // Duration
        var durationEl = card.querySelector(".duration-input");
        var durVal = durationEl.value;
        if (!durVal || parseInt(durVal, 10) <= 0 || isNaN(parseInt(durVal, 10))) {
          durationEl.classList.add("field-invalid");
          errors.push({ index: idx, cardNumber: cardNumber, field: "duration", message: "משך חסר או לא תקין (חייב להיות מספר חיובי)" });
        }

        // Summary
        var summaryEl = card.querySelector(".summary-input");
        if (!summaryEl.value.trim()) {
          summaryEl.classList.add("field-invalid");
          errors.push({ index: idx, cardNumber: cardNumber, field: "summary", message: "תקציר חסר" });
        }

        // Genres — check for empty items in comma-separated list
        var genresEl = card.querySelector(".genres-input");
        var genresVal = genresEl.value;
        if (genresVal) {
          var parts = genresVal.split(",");
          for (var g = 0; g < parts.length; g++) {
            if (!parts[g].trim()) {
              genresEl.classList.add("field-invalid");
              errors.push({ index: idx, cardNumber: cardNumber, field: "genres", message: "ז'אנר ריק ברשימה" });
              break;
            }
          }
        }
      }

      return { valid: errors.length === 0, errors: errors };
    }

    function showValidationErrors(errors) {
      var container = document.querySelector(".cards-container");
      var div = document.createElement("div");
      div.className = "validation-errors";

      var grouped = {};
      for (var i = 0; i < errors.length; i++) {
        var err = errors[i];
        if (!grouped[err.cardNumber]) grouped[err.cardNumber] = [];
        grouped[err.cardNumber].push(err.message);
      }

      var html = "<h3>\u26a0\ufe0f שגיאות אימות — יש לתקן לפני יצירת מיגרציה</h3><ul>";
      var cardNumbers = Object.keys(grouped);
      for (var j = 0; j < cardNumbers.length; j++) {
        var num = cardNumbers[j];
        var msgs = grouped[num];
        for (var k = 0; k < msgs.length; k++) {
          html += "<li>הצגה #" + num + ": " + msgs[k] + "</li>";
        }
      }
      html += "</ul>";
      div.innerHTML = html;
      container.insertBefore(div, container.firstChild);

      // Scroll to first invalid field
      var firstInvalid = document.querySelector(".field-invalid");
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    function generateMigration() {
      var indices = getCheckedIndices();
      if (indices.length === 0) return;

      var validation = validateShows(indices);
      if (!validation.valid) {
        showValidationErrors(validation.errors);
        return;
      }

      var bulkBtn = document.getElementById("bulk-btn");
      var bulkStatus = document.getElementById("bulk-status");
      bulkBtn.disabled = true;
      bulkBtn.textContent = "יוצר מיגרציה...";
      bulkStatus.innerHTML = "";

      var shows = indices.map(function(idx) { return getCardData(idx); });

      fetch("/api/generate-migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shows: shows })
      })
      .then(function(res) {
        return res.json().then(function(body) { return { ok: res.ok, body: body }; });
      })
      .then(function(result) {
        if (!result.ok) {
          bulkStatus.innerHTML = '<span class="status-error">\\u274c ' + (result.body.error || "שגיאה ביצירת מיגרציה") + "</span>";
          bulkBtn.disabled = false;
          updateBulkCount();
          return;
        }
        // Mark all selected cards as done
        indices.forEach(function(idx) {
          var card = document.querySelector(".card[data-index='" + idx + "']");
          card.classList.add("inserted");
          var cb = card.querySelector(".card-checkbox");
          if (cb) { cb.checked = false; cb.disabled = true; }
          var header = card.querySelector(".card-header");
          if (!header.querySelector(".success-badge")) {
            var badge = document.createElement("span");
            badge.className = "success-badge";
            badge.textContent = "\\u2713 במיגרציה";
            header.appendChild(badge);
          }
        });
        bulkStatus.innerHTML = '<span class="status-success">\\u2705 מיגרציה נוצרה: ' + result.body.filePath + ' (' + result.body.showCount + ' הצגות)</span>';
        bulkBtn.disabled = true;
        bulkBtn.textContent = "מיגרציה נוצרה \\u2713";
        updateBulkCount();
      })
      .catch(function(err) {
        bulkStatus.innerHTML = '<span class="status-error">\\u274c ' + err.message + "</span>";
        bulkBtn.disabled = false;
        updateBulkCount();
      });
    }

    function selectAll() {
      document.querySelectorAll(".card-checkbox").forEach(function(cb) {
        if (!cb.disabled) cb.checked = true;
      });
      updateBulkCount();
    }

    function deselectAll() {
      document.querySelectorAll(".card-checkbox").forEach(function(cb) {
        if (!cb.disabled) cb.checked = false;
      });
      updateBulkCount();
    }

    function saveExclusions() {
      var excludedShows = [];
      document.querySelectorAll(".card").forEach(function(card) {
        if (card.classList.contains("error-card")) return;
        if (card.classList.contains("inserted")) return;
        var cb = card.querySelector(".card-checkbox");
        if (cb && !cb.checked) {
          excludedShows.push({
            title: card.querySelector(".title-input").value,
            theatre: card.querySelector(".theatre-input").value
          });
        }
      });
      if (excludedShows.length === 0) return;

      var exclBtn = document.getElementById("save-exclusions-btn");
      var bulkStatus = document.getElementById("bulk-status");
      exclBtn.disabled = true;
      exclBtn.textContent = "שומר דילוגים...";
      bulkStatus.innerHTML = "";

      fetch("/api/save-exclusions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludedShows: excludedShows })
      })
      .then(function(res) {
        return res.json().then(function(body) { return { ok: res.ok, body: body }; });
      })
      .then(function(result) {
        if (!result.ok) {
          bulkStatus.innerHTML = '<span class="status-error">\\u274c ' + (result.body.error || "שגיאה בשמירת דילוגים") + "</span>";
          exclBtn.disabled = false;
          return;
        }
        bulkStatus.innerHTML = '<span class="status-success">\\u2705 ' + result.body.count + ' הצגות נשמרו ברשימת הדילוגים</span>';
        exclBtn.disabled = true;
        exclBtn.textContent = "דילוגים נשמרו \\u2713";
      })
      .catch(function(err) {
        bulkStatus.innerHTML = '<span class="status-error">\\u274c ' + err.message + "</span>";
        exclBtn.disabled = false;
      });
    }

    // Clear validation styling on input
    document.addEventListener("input", function(e) {
      if (e.target.classList.contains("field-invalid")) {
        e.target.classList.remove("field-invalid");
      }
    });

    // Update bulk count when checkbox changes
    document.addEventListener("change", function(e) {
      if (e.target.classList.contains("card-checkbox")) {
        updateBulkCount();
      }
    });

    // Initial count
    updateBulkCount();
  </script>
</body>
</html>`;
}
