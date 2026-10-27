const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
async function loadReport() {
  $('refresh').disabled = true;
  $('refresh').textContent = 'Loading…';
  try {
    const response = await fetch('/api/report', { cache: 'no-store' });
    const report = await response.json();
    $('total').textContent = report.total ?? 0;
    $('passed').textContent = report.passed ?? 0;
    $('failed').textContent = report.failed ?? 0;
    $('lastRun').textContent = report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'Not run';
    $('target').textContent = report.baseUrl || 'Local demo API';
    const status = $('status');
    status.className = 'status ' + (report.failed > 0 ? 'failure' : report.total > 0 ? 'success' : 'neutral');
    status.textContent = report.failed > 0 ? 'Breaking change detected' : report.total > 0 ? 'All checks passed' : 'Waiting for report';
    const results = report.results || [];
    $('results').innerHTML = results.length ? results.map((item) => `
      <article class="result"><div class="result-main"><div class="check-icon ${item.passed ? '' : 'fail'}">${item.passed ? '✓' : '!'}</div><div><div class="result-title">${esc(item.name)}</div><div class="result-path">${esc(item.clientVersion)} · ${esc(item.method)} ${esc(item.path)} · ${item.durationMs ?? 0} ms</div></div><span class="result-tag ${item.passed ? 'pass-text' : 'fail-text'}">${item.passed ? 'PASS' : 'FAIL'}</span></div>${(item.issues || []).map(issue => `<div class="issue"><b>${esc(issue.message)}</b>${esc(issue.explanation)}</div>`).join('')}</article>`).join('') : `<div class="empty">${esc(report.message || 'No checks found. Add JSON fixtures to the fixtures folder.')}</div>`;
  } catch (error) {
    $('results').innerHTML = `<div class="empty">Could not load the report. Make sure the dashboard server is running. ${esc(error.message)}</div>`;
  } finally {
    $('refresh').disabled = false;
    $('refresh').textContent = 'Refresh report ↻';
  }
}
$('refresh').addEventListener('click', loadReport);
loadReport();
