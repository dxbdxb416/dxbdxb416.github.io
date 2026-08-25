document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('form[data-web3forms]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var status = form.querySelector('.form-status');
      var original = btn.textContent;
      btn.disabled = true;
      btn.textContent = form.dataset.sending || original;
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
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
