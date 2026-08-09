/**
 * QuickLink - Client App Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const shortenForm = document.getElementById('shorten-form');
  const urlInput = document.getElementById('url-input');
  const pasteBtn = document.getElementById('paste-btn');
  const shortenBtn = document.getElementById('shorten-btn');
  const btnText = shortenBtn ? shortenBtn.querySelector('.btn-text') : null;
  const btnSpinner = shortenBtn ? shortenBtn.querySelector('.btn-spinner') : null;

  // Custom Alias Elements
  const toggleAliasBtn = document.getElementById('toggle-alias-btn');
  const aliasWrapper = document.getElementById('alias-input-wrapper');
  const aliasInput = document.getElementById('custom-alias-input');
  const aliasToggleText = document.getElementById('alias-toggle-text');

  // Result Elements
  const resultBox = document.getElementById('result-box');
  const resultShortUrl = document.getElementById('result-short-url');
  const resultCopyBtn = document.getElementById('result-copy-btn');
  const resultVisitBtn = document.getElementById('result-visit-btn');
  const resultQrBtn = document.getElementById('result-qr-btn');
  const resultTag = document.getElementById('result-tag');

  // Dashboard & Table Elements
  const tableSearch = document.getElementById('table-search');
  const refreshTableBtn = document.getElementById('refresh-table-btn');
  const urlTableBody = document.getElementById('url-table-body');
  const statTotalLinks = document.getElementById('stat-total-links');
  const statTotalClicks = document.getElementById('stat-total-clicks');

  // QR Modal Elements
  const qrModal = document.getElementById('qr-modal');
  const closeQrModal = document.getElementById('close-qr-modal');
  const closeQrBtn = document.getElementById('close-qr-btn');
  const qrcodeContainer = document.getElementById('qrcode-container');
  const qrTargetUrl = document.getElementById('qr-target-url');
  const downloadQrBtn = document.getElementById('download-qr-btn');

  /* ===================================================================
     Toast Notifications
     =================================================================== */
  function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-solid fa-circle-info';
    if (type === 'success') icon = 'fa-solid fa-circle-check';
    if (type === 'error') icon = 'fa-solid fa-circle-exclamation';

    toast.innerHTML = `<i class="${icon}"></i><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastSlideOut 0.2s ease forwards';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  /* ===================================================================
     Clipboard Copy Helper
     =================================================================== */
  async function copyToClipboard(text, triggerBtn = null) {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }

      showToast('Copied to clipboard!', 'success');

      if (triggerBtn) {
        const originalHtml = triggerBtn.innerHTML;
        triggerBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
          triggerBtn.innerHTML = originalHtml;
        }, 2000);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      showToast('Please copy the link manually.', 'error');
    }
  }

  /* ===================================================================
     Paste from Clipboard
     =================================================================== */
  if (pasteBtn && urlInput) {
    pasteBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard) {
          const clipText = await navigator.clipboard.readText();
          if (clipText) {
            urlInput.value = clipText.trim();
            urlInput.focus();
            showToast('Pasted link from clipboard', 'info', 2000);
          }
        }
      } catch (err) {
        showToast('Clipboard access unavailable. Please paste manually.', 'error');
      }
    });
  }

  /* ===================================================================
     Toggle Custom Alias Input
     =================================================================== */
  if (toggleAliasBtn && aliasWrapper) {
    toggleAliasBtn.addEventListener('click', () => {
      const isHidden = aliasWrapper.classList.contains('hidden');
      if (isHidden) {
        aliasWrapper.classList.remove('hidden');
        aliasInput.focus();
        aliasToggleText.textContent = 'Remove custom alias';
      } else {
        aliasWrapper.classList.add('hidden');
        aliasInput.value = '';
        aliasToggleText.textContent = 'Add custom alias (optional)';
      }
    });
  }

  /* ===================================================================
     URL Shorten Submit (AJAX)
     =================================================================== */
  if (shortenForm) {
    shortenForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawUrl = urlInput.value.trim();
      const customAlias = aliasInput ? aliasInput.value.trim() : '';

      if (!rawUrl) {
        showToast('Please enter a URL to shorten', 'error');
        urlInput.focus();
        return;
      }

      // Show Loading State
      shortenBtn.disabled = true;
      if (btnText) btnText.classList.add('hidden');
      if (btnSpinner) btnSpinner.classList.remove('hidden');

      try {
        const response = await fetch('/url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ url: rawUrl, customAlias }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to shorten URL.');
        }

        // Populate Result Card
        if (resultBox) {
          resultBox.classList.remove('hidden');
          resultShortUrl.value = data.shortUrl;
          resultVisitBtn.href = data.shortUrl;
          resultQrBtn.setAttribute('data-url', data.shortUrl);
          resultQrBtn.setAttribute('data-id', data.shortId);
          if (resultTag) resultTag.textContent = data.message || 'Short URL ready';
        }

        showToast(data.message || 'Short URL generated successfully!', 'success');

        // Refresh dashboard table
        await refreshDashboardUrls();

      } catch (err) {
        console.error('Shorten error:', err);
        showToast(err.message, 'error');
      } finally {
        shortenBtn.disabled = false;
        if (btnText) btnText.classList.remove('hidden');
        if (btnSpinner) btnSpinner.classList.add('hidden');
      }
    });
  }

  // Result Copy Button
  if (resultCopyBtn && resultShortUrl) {
    resultCopyBtn.addEventListener('click', () => {
      copyToClipboard(resultShortUrl.value, resultCopyBtn);
    });
  }

  // Result QR Button
  if (resultQrBtn) {
    resultQrBtn.addEventListener('click', () => {
      const url = resultQrBtn.getAttribute('data-url') || resultShortUrl.value;
      const id = resultQrBtn.getAttribute('data-id') || '';
      openQrModal(url, id);
    });
  }

  /* ===================================================================
     QR Code Modal
     =================================================================== */
  function openQrModal(url, shortId = '') {
    if (!url || !qrModal || !qrcodeContainer) return;
    qrcodeContainer.innerHTML = '';
    if (qrTargetUrl) qrTargetUrl.textContent = url;

    try {
      new QRCode(qrcodeContainer, {
        text: url,
        width: 160,
        height: 160,
        colorDark: '#080c14',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H,
      });

      qrModal.classList.remove('hidden');
    } catch (err) {
      console.error('QR generation error:', err);
      showToast('Could not generate QR code.', 'error');
    }
  }

  function hideQrModal() {
    if (qrModal) qrModal.classList.add('hidden');
  }

  if (closeQrModal) closeQrModal.addEventListener('click', hideQrModal);
  if (closeQrBtn) closeQrBtn.addEventListener('click', hideQrModal);
  if (qrModal) {
    qrModal.addEventListener('click', (e) => {
      if (e.target === qrModal) hideQrModal();
    });
  }

  if (downloadQrBtn && qrcodeContainer) {
    downloadQrBtn.addEventListener('click', () => {
      const img = qrcodeContainer.querySelector('img');
      const canvas = qrcodeContainer.querySelector('canvas');
      let dataUrl = null;

      if (img && img.src) dataUrl = img.src;
      else if (canvas) dataUrl = canvas.toDataURL('image/png');

      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `quicklink-qr-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('QR code downloaded!', 'success');
      } else {
        showToast('QR Image is still rendering.', 'error');
      }
    });
  }

  /* ===================================================================
     Dashboard Table Actions (Event Delegation)
     =================================================================== */
  if (urlTableBody) {
    urlTableBody.addEventListener('click', async (e) => {
      const copyBtn = e.target.closest('.copy-row-btn');
      if (copyBtn) {
        const text = copyBtn.getAttribute('data-clipboard');
        copyToClipboard(text, copyBtn);
        return;
      }

      const qrBtn = e.target.closest('.qr-row-btn');
      if (qrBtn) {
        const url = qrBtn.getAttribute('data-url');
        const id = qrBtn.getAttribute('data-id');
        openQrModal(url, id);
        return;
      }

      const deleteBtn = e.target.closest('.delete-row-btn');
      if (deleteBtn) {
        const shortId = deleteBtn.getAttribute('data-shortid');
        if (!confirm(`Are you sure you want to delete /${shortId}?`)) return;

        try {
          const res = await fetch(`/url/${shortId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast('Link deleted successfully', 'success');
            await refreshDashboardUrls();
          } else {
            showToast(data.error || 'Failed to delete link', 'error');
          }
        } catch (err) {
          showToast('Failed to delete URL', 'error');
        }
      }
    });
  }

  /* ===================================================================
     Search / Filter Dashboard
     =================================================================== */
  if (tableSearch && urlTableBody) {
    tableSearch.addEventListener('input', () => {
      const query = tableSearch.value.toLowerCase().trim();
      const rows = urlTableBody.querySelectorAll('tr[data-shortid]');

      rows.forEach((row) => {
        const shortId = (row.getAttribute('data-shortid') || '').toLowerCase();
        const longUrl = (row.getAttribute('data-longurl') || '').toLowerCase();

        if (shortId.includes(query) || longUrl.includes(query)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  /* ===================================================================
     Refresh Table Data
     =================================================================== */
  async function refreshDashboardUrls() {
    if (!urlTableBody) return;
    try {
      const response = await fetch('/url/all');
      if (!response.ok) return;
      const data = await response.json();
      if (!data.success) return;

      const { urls, baseUrl } = data;

      if (statTotalLinks) statTotalLinks.textContent = urls.length;
      const totalClicks = urls.reduce((sum, u) => sum + (u.clicks || 0), 0);
      if (statTotalClicks) statTotalClicks.textContent = totalClicks;

      if (urls.length === 0) {
        urlTableBody.innerHTML = `
          <tr id="empty-state-row">
            <td colspan="6" class="empty-state-cell">
              <div class="empty-state-wrap">
                <i class="fa-solid fa-link-slash"></i>
                <p class="empty-title">No shortened links yet</p>
                <p class="empty-subtitle">Paste a URL in the box above to generate your first link.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      urlTableBody.innerHTML = urls
        .map((urlItem, index) => {
          const fullShortUrl = `${baseUrl}/${urlItem.shortId}`;
          const longUrl = urlItem.originalUrl || '';
          const clickCount = urlItem.clicks || 0;
          const formattedDate = urlItem.createdAt
            ? new Date(urlItem.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Recent';

          return `
            <tr data-shortid="${urlItem.shortId}" data-longurl="${escapeHtml(longUrl.toLowerCase())}">
              <td class="cell-index">${index + 1}</td>
              <td class="cell-destination">
                <div class="destination-wrapper">
                  <a href="${escapeHtml(longUrl)}" target="_blank" rel="noopener noreferrer" class="destination-link" title="${escapeHtml(longUrl)}">
                    ${escapeHtml(longUrl)}
                  </a>
                </div>
              </td>
              <td class="cell-short">
                <div class="short-pill">
                  <a href="/${urlItem.shortId}" target="_blank" class="short-href">
                    /${urlItem.shortId}
                  </a>
                  <button 
                    class="btn-cell-copy copy-row-btn" 
                    data-clipboard="${fullShortUrl}" 
                    title="Copy to clipboard"
                  >
                    <i class="fa-regular fa-copy"></i>
                  </button>
                </div>
              </td>
              <td class="cell-clicks">
                <span class="click-chip">
                  <i class="fa-solid fa-arrow-trend-up"></i> ${clickCount}
                </span>
              </td>
              <td class="cell-date">${formattedDate}</td>
              <td class="cell-actions">
                <button 
                  class="btn-action qr-row-btn" 
                  data-url="${fullShortUrl}" 
                  data-id="${urlItem.shortId}" 
                  title="Show QR code"
                >
                  <i class="fa-solid fa-qrcode"></i>
                </button>
                <a 
                  href="/${urlItem.shortId}" 
                  target="_blank" 
                  class="btn-action" 
                  title="Open destination"
                >
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <button 
                  class="btn-action btn-action-delete delete-row-btn" 
                  data-shortid="${urlItem.shortId}" 
                  title="Delete link"
                >
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `;
        })
        .join('');

      if (tableSearch && tableSearch.value.trim()) {
        tableSearch.dispatchEvent(new Event('input'));
      }
    } catch (err) {
      console.error('Refresh dashboard error:', err);
    }
  }

  if (refreshTableBtn) {
    refreshTableBtn.addEventListener('click', async () => {
      await refreshDashboardUrls();
      showToast('Dashboard updated', 'info', 1500);
    });
  }
});
