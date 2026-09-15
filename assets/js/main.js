document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var status = form.querySelector('.form-status');
      var original = btn.textContent;
      var data = new FormData(form);
      var pageUrl = new URL(window.location.href);
      var utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      var submissionId = window.crypto && typeof window.crypto.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2);

      data.set('source_url', pageUrl.href);
      data.set('submitted_at', new Date().toISOString());
      utmFields.forEach(function (field) {
        var value = pageUrl.searchParams.get(field);
        if (value) data.set(field, value);
      });

      btn.disabled = true;
      btn.textContent = form.dataset.sending || original;
      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json',
          'Idempotency-Key': submissionId
        }
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            if (res.ok && body.success !== false) {
              status.textContent = form.dataset.success;
              status.className = 'form-status is-ok';
              form.reset();
            } else {
              status.textContent = form.dataset.error;
              status.className = 'form-status is-error';
            }
          });
        })
        .catch(function () {
          status.textContent = form.dataset.error;
          status.className = 'form-status is-error';
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = original;
        });
    });
  });

  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var buttons = group.querySelectorAll('[data-tab-button]');
    var panels = group.querySelectorAll('[data-tab-panel]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-tab-button');
        buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        panels.forEach(function (p) { p.hidden = p.getAttribute('data-tab-panel') !== target; });
      });
    });
  });
});
