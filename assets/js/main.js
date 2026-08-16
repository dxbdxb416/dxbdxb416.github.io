document.addEventListener('DOMContentLoaded', function () {
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
