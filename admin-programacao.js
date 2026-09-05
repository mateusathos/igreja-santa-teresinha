(() => {
  const $ = id => document.getElementById(id);
  const state = { comunidades: [], programacoes: [], editing: null };
  const form = $('programacao-form');
  const editor = window.adminUI.editor('programacao-form', 'Celebração ou atividade');
  const communityEditor = window.adminUI.editor('community-form', 'Comunidade');
  const fields = { comunidade_id: 'comunidade', atividade: 'atividade', recorrencia: 'recorrencia', dia_semana: 'dia', semana_mes: 'semana', data_especifica: 'data', recorrencia_texto: 'recorrencia-texto', horario: 'horario', observacao: 'observacao' };
  const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const tools = document.createElement('div');
  tools.className = 'admin-tools';
  tools.innerHTML = '<label>Comunidade<select id="schedule-community"><option value="">Todas</option></select></label><label>Buscar atividade<input type="search" id="schedule-search" placeholder="Missa, adoração..."></label><label>Exibição<select id="schedule-status"><option value="">Todas</option><option value="published">Publicadas</option><option value="hidden">Ocultas</option></select></label><a class="admin-public-link" href="/celebracoes" target="_blank" rel="noopener">Ver no site</a>';
  $('programacao-list').before(tools);
  tools.addEventListener('input', render);
  document.querySelector('label[for="programacao-recorrencia"]').textContent = 'Quando acontece?';
  $('programacao-recorrencia').options[1].textContent = 'Todo mês';
  $('programacao-recorrencia').options[2].textContent = 'Em uma data';
  const visibilityLabel = document.createElement('label');
  visibilityLabel.className = 'admin-tools';
  visibilityLabel.innerHTML = '<span><input id="schedule-active" type="checkbox" checked> Publicar no site</span>';
  $('save-programacao-button').before(visibilityLabel);
  const previewCommunity = document.createElement('p');
  previewCommunity.className = 'admin-state';
  $('programacao-preview-atividade').before(previewCommunity);
  async function request(method = 'GET', body) {
    const response = await fetch('/api/admin/programacoes', {method, headers: {'Content-Type': 'application/json'}, ...(body ? {body: JSON.stringify(body)} : {})});
    const data = await response.json();
    if (!response.ok) throw new Error(response.status === 401 ? 'Sessão expirada. Entre novamente em outra aba e tente salvar aqui.' : data.error || 'Não foi possível concluir a ação.');
    return data;
  }
  function message(text) { $('programacao-message').textContent = text; $('programacao-message').classList.remove('hidden'); $('programacao-message').setAttribute('role', 'status'); }
  function recurrence(item) {
    if (item.recorrencia === 'semanal') return `${[0,6].includes(Number(item.dia_semana)) ? 'Todo' : 'Toda'} ${days[item.dia_semana]}`;
    if (item.recorrencia === 'mensal') return `${item.semana_mes}${[0,6].includes(Number(item.dia_semana)) ? 'º' : 'ª'} ${days[item.dia_semana]} de cada mês`;
    if (item.recorrencia === 'data_especifica') return item.data_especifica ? item.data_especifica.split('-').reverse().join('/') : 'Escolha a data';
    return item.recorrencia_texto || 'Defina quando acontece';
  }
  function values() { return Object.fromEntries(Object.entries(fields).map(([key, id]) => [key, $('programacao-' + id).value])); }
  function preview() {
    const item = values();
    const weekly = ['semanal','mensal'].includes(item.recorrencia);
    $('weekday-field').classList.toggle('hidden', !weekly);
    $('month-week-field').classList.toggle('hidden', item.recorrencia !== 'mensal');
    $('specific-date-field').classList.toggle('hidden', item.recorrencia !== 'data_especifica');
    $('custom-recurrence-field').classList.toggle('hidden', item.recorrencia !== 'personalizada');
    $('programacao-data').required = item.recorrencia === 'data_especifica';
    $('programacao-recorrencia-texto').required = item.recorrencia === 'personalizada';
    previewCommunity.textContent = state.comunidades.find(c => c.id === Number(item.comunidade_id))?.nome || '';
    $('programacao-preview-atividade').textContent = item.atividade || 'Atividade';
    $('programacao-preview-recorrencia').textContent = recurrence(item);
    $('programacao-preview-horario').textContent = item.horario || '--:--';
    $('programacao-preview-observacao').textContent = item.observacao;
    $('programacao-preview-observacao').classList.toggle('hidden', !item.observacao);
  }
  function open(item = null, communityId = null, duplicate = false) {
    state.editing = duplicate ? null : item;
    form.reset();
    for (const [key, id] of Object.entries(fields)) if (item) $('programacao-' + id).value = item[key] ?? '';
    if (communityId) $('programacao-comunidade').value = communityId;
    $('schedule-active').checked = duplicate ? false : item?.ativo ?? true;
    $('programacao-form-title').textContent = duplicate ? 'Duplicar atividade' : item ? 'Editar atividade' : 'Nova atividade';
    $('cancel-programacao-button').classList.add('hidden');
    preview(); editor.open();
  }
  function render() {
    const community = $('schedule-community').value;
    const query = $('schedule-search').value.trim().toLocaleLowerCase('pt-BR');
    const status = $('schedule-status').value;
    const groups = state.comunidades.filter(c => !community || String(c.id) === community);
    $('programacao-count').textContent = `${state.programacoes.length} atividades`;
    $('programacao-list').innerHTML = groups.map(c => {
      const items = state.programacoes.filter(item => item.comunidade_id === c.id && item.atividade.toLocaleLowerCase('pt-BR').includes(query) && (!status || Boolean(item.ativo && c.ativo) === (status === 'published')));
      return `<section class="py-4 border-b border-stone-200"><div class="flex flex-wrap items-center justify-between gap-3"><h3 class="font-bold text-red-950">${escape(c.nome)}${c.ativo ? '' : ' (oculta)'}</h3><button type="button" data-create="${c.id}" class="text-sm font-bold text-red-900">Adicionar atividade</button></div>${items.map(item => `<article class="py-4"><h4 class="font-bold">${escape(item.atividade)}</h4><p>${escape(recurrence(item))} às ${escape(item.horario)}</p><span class="admin-state">${item.ativo && c.ativo ? 'Publicada' : 'Oculta'}${!c.ativo ? ' · Comunidade oculta' : ''}</span><div class="flex flex-wrap gap-3">${[['edit','Editar'],['duplicate','Duplicar'],['toggle',item.ativo ? 'Ocultar' : 'Publicar'],['delete','Excluir']].map(([action,label]) => `<button type="button" data-action="${action}" data-id="${item.id}" class="text-sm font-bold text-red-900">${label}</button>`).join('')}</div></article>`).join('') || '<p class="py-4 text-sm text-stone-500">Nenhuma atividade para estes filtros.</p>'}</section>`;
    }).join('');
  }
  async function load() {
    const data = await request(); Object.assign(state, data);
    const selected = $('schedule-community').value;
    const options = state.comunidades.map(c => `<option value="${c.id}">${escape(c.nome)}${c.ativo ? '' : ' (oculta)'}</option>`).join('');
    $('programacao-comunidade').innerHTML = options;
    $('schedule-community').innerHTML = '<option value="">Todas</option>' + options;
    $('schedule-community').value = selected;
    render(); renderCommunities();
  }
  function tab(program) {
    $('avisos-panel').classList.toggle('hidden', program);
    $('programacao-panel').classList.toggle('hidden', !program);
    $('new-aviso-button').classList.toggle('hidden', program);
    $('admin-count').classList.toggle('hidden', program);
    $('admin-section-title').textContent = program ? 'Programação' : 'Avisos paroquiais';
    for (const [id, selected] of [['tab-avisos',!program],['tab-programacao',program]]) {
      $(id).setAttribute('aria-pressed', String(selected));
      $(id).className = `border-b-2 px-4 py-3 text-sm font-bold ${selected ? 'border-red-950 text-red-950' : 'border-transparent text-stone-500'}`;
    }
    if (program) load().catch(error => message(error.message));
  }
  $('tab-avisos').addEventListener('click', () => tab(false));
  $('tab-programacao').addEventListener('click', () => tab(true));
  $('new-programacao-button').addEventListener('click', () => open());
  form.addEventListener('input', preview);
  form.addEventListener('change', preview);
  form.addEventListener('submit', async event => {
    event.preventDefault(); editor.busy(true); editor.message('Salvando...');
    const button = $('save-programacao-button'); button.disabled = true;
    try {
      await request(state.editing ? 'PUT' : 'POST', {...values(), resource: 'programacao', id: state.editing?.id, ordem: state.editing?.ordem ?? 0, ativo: $('schedule-active').checked});
      editor.busy(false); editor.close(true); message('Alterações salvas. A página pública está atualizada.'); await load();
    } catch (error) { editor.message(error.message); }
    finally { editor.busy(false); button.disabled = false; }
  });
  $('programacao-list').addEventListener('click', async event => {
    const create = event.target.closest('[data-create]'); if (create) return open(null, create.dataset.create);
    const button = event.target.closest('[data-action]'); if (!button) return;
    const item = state.programacoes.find(i => i.id === Number(button.dataset.id));
    const action = button.dataset.action;
    if (action === 'edit' || action === 'duplicate') return open(item, null, action === 'duplicate');
    const community = state.comunidades.find(c => c.id === item.comunidade_id);
    if (action === 'delete' && !confirm(`Excluir "${item.atividade}" (${recurrence(item)}, ${item.horario}) de ${community.nome}? Para suspender temporariamente, use Ocultar.`)) return;
    button.disabled = true;
    try { await request(action === 'delete' ? 'DELETE' : 'PUT', {...item, resource: 'programacao', ativo: !item.ativo}); await load(); message(action === 'delete' ? 'Atividade excluída.' : 'Visibilidade atualizada.'); }
    catch (error) { message(error.message); } finally { button.disabled = false; }
  });
  function renderCommunities() {
    $('communities-list').innerHTML = state.comunidades.map(c => `<article class="py-3 border-b border-stone-200"><h3 class="font-bold">${escape(c.nome)}</h3><p class="text-sm">${escape(c.endereco)}</p><div class="flex gap-4"><button data-community-edit="${c.id}" type="button">Editar</button><button data-community-delete="${c.id}" type="button">Excluir</button></div></article>`).join('');
  }
  function openCommunity(item) {
    $('community-form').reset(); $('community-id').value = item?.id || '';
    $('community-name').value = item?.nome || ''; $('community-address').value = item?.endereco || '';
    $('community-order').value = item?.ordem ?? 0; $('community-active').checked = item?.ativo ?? true;
    $('community-form-title').textContent = item ? 'Editar comunidade' : 'Nova comunidade';
    communityEditor.open();
  }
  const newCommunity = document.createElement('button'); newCommunity.type = 'button'; newCommunity.className = 'admin-back'; newCommunity.textContent = 'Nova comunidade';
  $('communities-list').before(newCommunity); newCommunity.addEventListener('click', () => openCommunity());
  $('manage-communities-button').addEventListener('click', () => $('communities-dialog').showModal());
  $('close-communities-button').addEventListener('click', () => $('communities-dialog').close());
  $('cancel-community-button').addEventListener('click', () => communityEditor.close());
  $('communities-list').addEventListener('click', async event => {
    const edit = event.target.closest('[data-community-edit]'); if (edit) return openCommunity(state.comunidades.find(c => c.id === Number(edit.dataset.communityEdit)));
    const button = event.target.closest('[data-community-delete]'); if (!button) return;
    const id = Number(button.dataset.communityDelete), item = state.comunidades.find(c => c.id === id);
    if (!confirm(`Excluir a comunidade "${item.nome}"?`)) return;
    try { await request('DELETE', {resource: 'comunidade', id}); await load(); }
    catch (error) { alert(error.message); }
  });
  $('community-form').addEventListener('submit', async event => {
    event.preventDefault(); const id = Number($('community-id').value) || null;
    communityEditor.busy(true); $('save-community-button').disabled = true; communityEditor.message('Salvando...');
    try { await request(id ? 'PUT' : 'POST', {resource: 'comunidade', id, nome: $('community-name').value, endereco: $('community-address').value, ordem: Number($('community-order').value), ativo: $('community-active').checked}); communityEditor.busy(false); communityEditor.close(true); await load(); }
    catch (error) { communityEditor.message(error.message); }
    finally { communityEditor.busy(false); $('save-community-button').disabled = false; }
  });
})();
