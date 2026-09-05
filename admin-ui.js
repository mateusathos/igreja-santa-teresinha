(() => {
  const editors = new Map();
  function snapshot(form) {
    return JSON.stringify([...form.elements].map(input => [input.id, input.type === 'checkbox' ? input.checked : input.value]));
  }
  function editor(formId, title) {
    const form = document.getElementById(formId);
    const dialog = document.createElement('dialog');
    dialog.className = 'admin-editor';
    dialog.setAttribute('aria-label', title);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'admin-back';
    close.textContent = 'Voltar à lista';
    const status = document.createElement('p');
    status.className = 'admin-editor-status';
    status.setAttribute('role', 'status');
    if (form.parentElement.tagName === 'ASIDE') form.parentElement.hidden = true;
    dialog.append(close, status, form);
    document.body.append(dialog);
    let baseline = snapshot(form), busy = false, extraDirty = false;
    const api = {
      open() { baseline = snapshot(form); extraDirty = false; status.textContent = ''; if (!dialog.open) dialog.showModal(); dialog.scrollTop = 0; form.querySelector('input:not([type=hidden]),select,textarea')?.focus(); },
      dirty() { return dialog.open && (extraDirty || baseline !== snapshot(form)); },
      markDirty() { extraDirty = true; },
      close(force = false) { if (busy) return false; if (!force && api.dirty() && !confirm('Descartar as alterações não salvas?')) return false; dialog.close(); extraDirty = false; return true; },
      busy(value) { busy = value; close.disabled = value; },
      message(message) { status.textContent = message; if (message) status.scrollIntoView({block: 'nearest'}); }
    };
    close.addEventListener('click', () => api.close());
    dialog.addEventListener('cancel', event => { event.preventDefault(); api.close(); });
    editors.set(formId, api);
    return api;
  }
  window.adminUI = { editor };
  window.addEventListener('beforeunload', event => {
    if ([...editors.values()].some(item => item.dirty())) { event.preventDefault(); event.returnValue = ''; }
  });
})();
