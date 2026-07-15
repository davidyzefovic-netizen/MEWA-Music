const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('window.onerror')) {
  html = html.replace('<head>', `<head><script>
    window.onerror = function(msg, src, line, col, err) {
      fetch('/api/db/client-error', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ msg, line, col, stack: err?.stack }) });
    };
    window.onunhandledrejection = function(e) {
      fetch('/api/db/client-promise-error', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ msg: e.reason?.message, stack: e.reason?.stack }) });
    };
  </script>`);
  fs.writeFileSync('index.html', html);
  console.log('injected error handler');
}
