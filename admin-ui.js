import { createElement, Plus, Pencil, Copy, Eye, EyeOff, Trash2, ArrowLeft, Save, Send, EllipsisVertical, X, LogOut, LoaderCircle } from 'lucide';

(() => {
  function icon(node) { return createElement(node, {width: 18, height: 18, 'aria-hidden': 'true', focusable: 'false'}); }
  const symbols = { 'Novo aviso': Plus, 'Nova atividade': Plus, 'Nova comunidade': Plus, 'Adicionar atividade': Plus, 'Editar': Pencil, 'Duplicar': Copy, 'Ocultar': EyeOff, 'Publicar': Eye, 'Excluir': Trash2, 'Voltar à lista': ArrowLeft, 'Fechar': X, 'Sair': LogOut };
  function decorate() {
    document.querySelectorAll('button').forEach(button => {
      let text = button.textContent.trim();
      if (button.id === 'save-aviso-button' && !button.disabled) text = document.getElementById('aviso-id').value ? 'Salvar alterações' : 'Publicar aviso';
      if (button.id === 'save-programacao-button' && !button.disabled) text = document.getElementById('programacao-form-title').textContent === 'Editar atividade' ? 'Salvar alterações' : document.getElementById('schedule-active')?.checked ? 'Publicar atividade' : 'Salvar atividade oculta';
      const saving = /Salvando|Atualizando|Enviando|Entrando/.test(text);
      const symbol = symbols[text] || (text.startsWith('Salvar') ? Save : text.startsWith('Publicar') ? Send : saving ? LoaderCircle : null);
      if (!symbol || (button.dataset.iconLabel === text && button.querySelector('svg'))) return;
      button.dataset.iconLabel = text;
      const label = document.createElement('span'); label.textContent = text;
      button.replaceChildren(icon(symbol), label);
      button.classList.add('admin-icon-button');
      if (text === 'Excluir') button.classList.add('admin-danger');
    });
    document.querySelectorAll('#avisos-list article, #programacao-list article, #communities-list article').forEach(article => {
      if (article.querySelector('.admin-more')) return;
      const secondary = [...article.querySelectorAll('button')].filter(button => ['Duplicar','Ocultar','Publicar','Excluir'].includes(button.textContent.trim()));
      if (!secondary.length) return;
      const details = document.createElement('details'); details.className = 'admin-more';
      const summary = document.createElement('summary'); summary.append(icon(EllipsisVertical)); summary.title = 'Mais opções'; summary.setAttribute('aria-label', 'Mais opções');
      const menu = document.createElement('div'); menu.className = 'admin-more-items';
      secondary[0].parentElement.append(details); details.append(summary, menu); secondary.forEach(button => menu.append(button));
      details.addEventListener('toggle', () => { if (details.open) document.querySelectorAll('.admin-more[open]').forEach(other => {if (other !== details) other.open = false;}); });
      menu.addEventListener('click', () => { details.open = false; });
      details.addEventListener('keydown', event => { if (event.key === 'Escape') {details.open = false; summary.focus(); event.stopPropagation();} });
    });
  }
  document.addEventListener('click', event => document.querySelectorAll('.admin-more[open]').forEach(details => {if (!details.contains(event.target)) details.open = false;}));
  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => { observer.disconnect(); decorate(); observer.observe(document.body, {childList:true,subtree:true,attributes:true,attributeFilter:['disabled']}); });
    decorate(); observer.observe(document.body, {childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
    document.addEventListener('change', decorate);
  });
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
    const submit = form.querySelector('button[type="submit"]');
    if (submit) { const bar = document.createElement('div'); bar.className = 'admin-save-bar'; submit.before(bar); bar.append(submit); }
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
