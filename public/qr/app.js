// API base URL
const API_BASE = '/api';

// Load QR codes on page load
document.addEventListener('DOMContentLoaded', () => {
  loadQRCodes();
});

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

// Generate QR code URL
function getQRCodeUrl(shortCode) {
  const url = `${window.location.origin}/${shortCode}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
}

// Download QR code
function downloadQRCode(shortCode) {
  const url = `${window.location.origin}/${shortCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(url)}`;

  // Create temporary link and trigger download
  const link = document.createElement('a');
  link.href = qrUrl;
  link.download = `qr-${shortCode}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Load all QR codes
async function loadQRCodes() {
  const loadingEl = document.getElementById('loadingMessage');
  const errorEl = document.getElementById('errorMessage');
  const gridEl = document.getElementById('qrGrid');

  try {
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    gridEl.style.display = 'none';

    const response = await fetch(`${API_BASE}/urls`);

    if (!response.ok) {
      throw new Error('Failed to load URLs');
    }

    const urls = await response.json();

    if (urls.length === 0) {
      loadingEl.textContent = 'Zatím nejsou žádné QR kódy k zobrazení.';
      loadingEl.style.display = 'block';
      return;
    }

    // Render QR grid
    gridEl.innerHTML = urls.map(url => {
      const shortUrl = `${window.location.origin}/${url.short_code}`;
      const qrCodeUrl = getQRCodeUrl(url.short_code);
      const domain = extractDomain(url.target_url);

      return `
        <div class="qr-card">
          <div class="qr-code-wrapper">
            <img src="${qrCodeUrl}" alt="QR kód pro ${url.short_code}" loading="lazy">
          </div>

          <div class="qr-info">
            <div class="short-code">${escapeHtml(url.short_code)}</div>
            <div class="short-url">${escapeHtml(shortUrl)}</div>
            <div class="target-domain">→ ${escapeHtml(domain)}</div>
            <div class="description">${url.description ? escapeHtml(url.description) : '&nbsp;'}</div>

            <div class="stats">
              <div class="stat-item">
                <div class="stat-label">Kliknutí</div>
                <div class="stat-value">${url.click_count || 0}</div>
              </div>
            </div>

            <div class="actions">
              <button class="btn btn-download" onclick="downloadQRCode('${escapeHtml(url.short_code)}')">
                Stáhnout QR
              </button>
              <a href="/${url.short_code}" target="_blank" class="btn btn-open">
                Otevřít
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');

    loadingEl.style.display = 'none';
    gridEl.style.display = 'grid';

  } catch (error) {
    console.error('Load error:', error);
    loadingEl.style.display = 'none';
    errorEl.textContent = 'Chyba při načítání QR kódů. Zkuste stránku obnovit.';
    errorEl.style.display = 'block';
  }
}

// Utility: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
