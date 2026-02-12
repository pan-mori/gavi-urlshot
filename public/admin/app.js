// API base URL
const API_BASE = '/api';

// Load URLs on page load
document.addEventListener('DOMContentLoaded', () => {
  loadUrls();

  // Setup form handlers
  document.getElementById('addUrlForm').addEventListener('submit', handleAddUrl);
  document.getElementById('editUrlForm').addEventListener('submit', handleEditUrl);
});

// Load all URLs
async function loadUrls() {
  const loadingEl = document.getElementById('loadingMessage');
  const errorEl = document.getElementById('errorMessage');
  const tableEl = document.getElementById('urlsTable');
  const tbodyEl = document.getElementById('urlsTableBody');

  try {
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    tableEl.style.display = 'none';

    const response = await fetch(`${API_BASE}/urls`);

    if (!response.ok) {
      throw new Error('Failed to load URLs');
    }

    const urls = await response.json();

    if (urls.length === 0) {
      loadingEl.textContent = 'Zatím nejsou žádné URL mappingy. Vytvořte první pomocí formuláře výše.';
      loadingEl.style.display = 'block';
      return;
    }

    // Render table
    tbodyEl.innerHTML = urls.map(url => `
      <tr>
        <td>
          <span class="short-code">${escapeHtml(url.short_code)}</span>
          <br>
          <a href="/${url.short_code}" target="_blank" style="font-size: 0.85rem; color: #3498db;">
            ${window.location.origin}/${url.short_code}
          </a>
        </td>
        <td>
          <a href="${escapeHtml(url.target_url)}" target="_blank" class="target-url" title="${escapeHtml(url.target_url)}">
            ${escapeHtml(url.target_url)}
          </a>
        </td>
        <td>${url.description ? escapeHtml(url.description) : '<span style="color: #bdc3c7;">—</span>'}</td>
        <td class="click-count">${url.click_count || 0}</td>
        <td class="date">${formatDate(url.created_at)}</td>
        <td>
          <button class="btn btn-small btn-edit" onclick="openEditModal(${url.id}, '${escapeHtml(url.short_code)}', '${escapeHtml(url.target_url)}', '${escapeHtml(url.description || '')}')">
            Upravit
          </button>
          <button class="btn btn-small btn-stats" onclick="openStatsModal(${url.id}, '${escapeHtml(url.short_code)}')">
            Stats
          </button>
          <button class="btn btn-small btn-delete" onclick="handleDeleteUrl(${url.id}, '${escapeHtml(url.short_code)}')">
            Smazat
          </button>
        </td>
      </tr>
    `).join('');

    loadingEl.style.display = 'none';
    tableEl.style.display = 'table';

  } catch (error) {
    console.error('Load error:', error);
    loadingEl.style.display = 'none';
    errorEl.textContent = 'Chyba při načítání URL. Zkuste stránku obnovit.';
    errorEl.style.display = 'block';
  }
}

// Add new URL
async function handleAddUrl(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = {
    short_code: formData.get('short_code'),
    target_url: formData.get('target_url'),
    description: formData.get('description') || null
  };

  try {
    const response = await fetch(`${API_BASE}/urls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      alert(`Chyba: ${error.error}`);
      return;
    }

    // Success
    e.target.reset();
    await loadUrls();
    alert('URL mapping úspěšně vytvořen!');

  } catch (error) {
    console.error('Create error:', error);
    alert('Chyba při vytváření URL mappingu. Zkuste to znovu.');
  }
}

// Open edit modal
function openEditModal(id, shortCode, targetUrl, description) {
  document.getElementById('editUrlId').value = id;
  document.getElementById('editShortCode').value = shortCode;
  document.getElementById('editTargetUrl').value = targetUrl;
  document.getElementById('editDescription').value = description;
  document.getElementById('editModal').style.display = 'flex';
}

// Close edit modal
function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

// Handle edit URL
async function handleEditUrl(e) {
  e.preventDefault();

  const id = document.getElementById('editUrlId').value;
  const data = {
    target_url: document.getElementById('editTargetUrl').value,
    description: document.getElementById('editDescription').value || null
  };

  try {
    const response = await fetch(`${API_BASE}/urls/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      alert(`Chyba: ${error.error}`);
      return;
    }

    // Success
    closeEditModal();
    await loadUrls();
    alert('URL mapping úspěšně upraven!');

  } catch (error) {
    console.error('Update error:', error);
    alert('Chyba při úpravě URL mappingu. Zkuste to znovu.');
  }
}

// Delete URL
async function handleDeleteUrl(id, shortCode) {
  if (!confirm(`Opravdu chcete smazat mapping "${shortCode}"?\n\nTato akce je nevratná a smaže i všechna data o proklinutích.`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/urls/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      alert(`Chyba: ${error.error}`);
      return;
    }

    // Success
    await loadUrls();
    alert('URL mapping smazán.');

  } catch (error) {
    console.error('Delete error:', error);
    alert('Chyba při mazání URL mappingu. Zkuste to znovu.');
  }
}

// Open stats modal
async function openStatsModal(id, shortCode) {
  const modal = document.getElementById('statsModal');
  const content = document.getElementById('statsContent');

  modal.style.display = 'flex';
  content.innerHTML = '<p class="loading">Načítám statistiky...</p>';

  try {
    const response = await fetch(`${API_BASE}/urls/${id}/stats`);

    if (!response.ok) {
      throw new Error('Failed to load stats');
    }

    const stats = await response.json();

    content.innerHTML = `
      <div class="stats-summary">
        <h3>Krátký kód: <span class="short-code">${escapeHtml(shortCode)}</span></h3>
        <div class="stats-total">${stats.total}</div>
        <p>celkový počet prokliků</p>
      </div>

      ${stats.byDay.length > 0 ? `
        <div class="stats-chart">
          <h3>Prokliky podle dní (posledních 30 dní)</h3>
          ${stats.byDay.map(day => `
            <div class="stats-row">
              <span>${formatDate(day.date)}</span>
              <span><strong>${day.count}</strong> prokliků</span>
            </div>
          `).join('')}
        </div>
      ` : '<p style="color: #7f8c8d; text-align: center;">Zatím žádné prokliky.</p>'}
    `;

  } catch (error) {
    console.error('Stats error:', error);
    content.innerHTML = '<p class="error">Chyba při načítání statistik.</p>';
  }
}

// Close stats modal
function closeStatsModal() {
  document.getElementById('statsModal').style.display = 'none';
}

// Utility: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Utility: Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
