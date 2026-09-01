(() => {
  const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const weeklyLabels = ["Todos os domingos", "Todas as segundas-feiras", "Todas as terças-feiras", "Todas as quartas-feiras", "Todas as quintas-feiras", "Todas as sextas-feiras", "Todos os sábados"];
  const state = { comunidades: [], programacoes: [], editingId: null, loaded: false };
  const byId = (id) => document.getElementById(id);
  const el = {
    tabAvisos: byId("tab-avisos"), tabProgramacao: byId("tab-programacao"), avisosPanel: byId("avisos-panel"),
    panel: byId("programacao-panel"), sectionTitle: byId("admin-section-title"), adminCount: byId("admin-count"),
    newAviso: byId("new-aviso-button"), list: byId("programacao-list"), count: byId("programacao-count"),
    message: byId("programacao-message"), form: byId("programacao-form"), formTitle: byId("programacao-form-title"),
    id: byId("programacao-id"), comunidade: byId("programacao-comunidade"), atividade: byId("programacao-atividade"),
    recorrencia: byId("programacao-recorrencia"), dia: byId("programacao-dia"), semana: byId("programacao-semana"),
    data: byId("programacao-data"), recorrenciaTexto: byId("programacao-recorrencia-texto"), horario: byId("programacao-horario"),
    observacao: byId("programacao-observacao"), weekdayField: byId("weekday-field"), monthWeekField: byId("month-week-field"),
    dateField: byId("specific-date-field"), customField: byId("custom-recurrence-field"), cancel: byId("cancel-programacao-button"),
    save: byId("save-programacao-button"), newButton: byId("new-programacao-button"), previewAtividade: byId("programacao-preview-atividade"),
    previewRecorrencia: byId("programacao-preview-recorrencia"), previewHorario: byId("programacao-preview-horario"),
    previewObservacao: byId("programacao-preview-observacao"), dialog: byId("communities-dialog"),
    communitiesList: byId("communities-list"), communityForm: byId("community-form"), communityId: byId("community-id"),
    communityName: byId("community-name"), communityAddress: byId("community-address"), communityOrder: byId("community-order"),
    communityActive: byId("community-active"), communityTitle: byId("community-form-title"), communityCancel: byId("cancel-community-button")
  };

  function escapeHtml(value) { const node = document.createElement("div"); node.textContent = value == null ? "" : String(value); return node.innerHTML; }
  async function request(options = {}) {
    const response = await fetch("/api/admin/programacoes", { headers: { "Content-Type": "application/json" }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.error || "Erro ao processar solicitação."); error.status = response.status; throw error; }
    return data;
  }
  function setMessage(text, type = "success") {
    el.message.textContent = text; el.message.classList.toggle("hidden", !text);
    el.message.className = `mb-4 rounded-md px-4 py-3 text-sm font-semibold ${type === "error" ? "bg-red-50 text-red-900" : "bg-emerald-50 text-emerald-900"} ${text ? "" : "hidden"}`;
  }
  function recurrenceText(item) {
    if (item.recorrencia === "semanal") return weeklyLabels[item.dia_semana];
    if (item.recorrencia === "mensal") return `${[0, 6].includes(item.dia_semana) ? `${item.semana_mes}º` : `${item.semana_mes}ª`} ${days[item.dia_semana].toLowerCase()} do mês`;
    if (item.recorrencia === "data_especifica") return item.data_especifica ? new Date(`${item.data_especifica}T12:00:00`).toLocaleDateString("pt-BR") : "Data específica";
    return item.recorrencia_texto || "Recorrência personalizada";
  }
  function updateConditionalFields() {
    const type = el.recorrencia.value;
    el.weekdayField.classList.toggle("hidden", !["semanal", "mensal"].includes(type));
    el.monthWeekField.classList.toggle("hidden", type !== "mensal");
    el.dateField.classList.toggle("hidden", type !== "data_especifica");
    el.customField.classList.toggle("hidden", type !== "personalizada");
    updatePreview();
  }
  function currentFormItem() {
    return { recorrencia: el.recorrencia.value, dia_semana: Number(el.dia.value), semana_mes: Number(el.semana.value), data_especifica: el.data.value, recorrencia_texto: el.recorrenciaTexto.value };
  }
  function updatePreview() {
    el.previewAtividade.textContent = el.atividade.value.trim() || "Atividade";
    el.previewRecorrencia.textContent = recurrenceText(currentFormItem());
    el.previewHorario.textContent = el.horario.value ? el.horario.value.replace(":", "h") : "--h--";
    el.previewObservacao.textContent = el.observacao.value.trim(); el.previewObservacao.classList.toggle("hidden", !el.observacao.value.trim());
  }
  function render() {
    el.count.textContent = `${state.programacoes.length} ${state.programacoes.length === 1 ? "atividade" : "atividades"}`;
    el.comunidade.innerHTML = state.comunidades.filter((item) => item.ativo).map((item) => `<option value="${item.id}">${escapeHtml(item.nome)}</option>`).join("");
    const groups = state.comunidades.map((comunidade) => ({ comunidade, items: state.programacoes.filter((item) => item.comunidade_id === comunidade.id) })).filter((group) => group.items.length);
    el.list.innerHTML = groups.length ? groups.map(({ comunidade, items }) => `<section class="overflow-hidden rounded-lg border border-red-950/10 bg-white shadow-sm"><header class="flex items-center justify-between gap-3 bg-red-950 px-4 py-3 text-white"><div><h3 class="font-bold">${escapeHtml(comunidade.nome)}</h3><p class="mt-1 text-xs text-red-100">${items.length} ${items.length === 1 ? "atividade" : "atividades"}</p></div>${comunidade.ativo ? "" : '<span class="rounded bg-white/15 px-2 py-1 text-xs font-bold">Oculta</span>'}</header><div class="divide-y divide-stone-200">${items.map((item) => `<article class="p-4"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><h4 class="break-words font-bold text-red-900">${escapeHtml(item.atividade)}</h4><p class="mt-1 text-sm font-semibold text-stone-700">${escapeHtml(recurrenceText(item))} às ${escapeHtml(item.horario)}</p>${item.observacao ? `<p class="mt-1 break-words text-xs text-stone-500">${escapeHtml(item.observacao)}</p>` : ""}</div><div class="flex shrink-0 gap-2"><button type="button" data-edit="${item.id}" class="rounded-md border border-stone-300 px-3 py-2 text-xs font-bold text-stone-700">Editar</button><button type="button" data-delete="${item.id}" class="rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-900">Excluir</button></div></div></article>`).join("")}</div></section>`).join("") : '<div class="rounded-lg border border-dashed border-red-950/30 bg-white p-6 text-center"><h3 class="font-bold text-red-950">Nenhuma atividade cadastrada</h3></div>';
    renderCommunities();
  }
  function renderCommunities() {
    el.communitiesList.innerHTML = state.comunidades.map((item) => `<article class="rounded-md border border-stone-200 p-3"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><h3 class="break-words text-sm font-bold text-red-950">${escapeHtml(item.nome)}</h3><p class="mt-1 break-words text-xs text-stone-500">${escapeHtml(item.endereco)}</p></div><div class="flex shrink-0 gap-2"><button type="button" data-community-edit="${item.id}" class="rounded border border-stone-300 px-2 py-1 text-xs font-bold">Editar</button><button type="button" data-community-delete="${item.id}" class="rounded border border-red-200 px-2 py-1 text-xs font-bold text-red-900">Excluir</button></div></div></article>`).join("");
  }
  async function load() { const data = await request(); state.comunidades = data.comunidades; state.programacoes = data.programacoes; state.loaded = true; render(); resetForm(); }
  function resetForm() { state.editingId = null; el.form.reset(); el.id.value = ""; el.formTitle.textContent = "Nova atividade"; el.cancel.classList.add("hidden"); el.save.textContent = "Salvar atividade"; updateConditionalFields(); }
  function editItem(id) { const item = state.programacoes.find((entry) => entry.id === id); if (!item) return; state.editingId = id; el.id.value = id; el.comunidade.value = item.comunidade_id; el.atividade.value = item.atividade; el.recorrencia.value = item.recorrencia; el.dia.value = item.dia_semana ?? 0; el.semana.value = item.semana_mes ?? 1; el.data.value = item.data_especifica || ""; el.recorrenciaTexto.value = item.recorrencia_texto || ""; el.horario.value = item.horario; el.observacao.value = item.observacao || ""; el.formTitle.textContent = "Editar atividade"; el.cancel.classList.remove("hidden"); el.save.textContent = "Atualizar atividade"; updateConditionalFields(); el.form.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function resetCommunityForm() { el.communityForm.reset(); el.communityId.value = ""; el.communityOrder.value = "0"; el.communityActive.checked = true; el.communityTitle.textContent = "Nova comunidade"; el.communityCancel.classList.add("hidden"); }

  el.tabAvisos.addEventListener("click", () => { el.avisosPanel.classList.remove("hidden"); el.panel.classList.add("hidden"); el.newAviso.classList.remove("hidden"); el.sectionTitle.textContent = "Avisos Paroquiais"; el.adminCount.classList.remove("hidden"); el.tabAvisos.className = "border-b-2 border-red-950 px-4 py-3 text-sm font-bold text-red-950"; el.tabProgramacao.className = "border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-500 hover:text-red-950"; });
  el.tabProgramacao.addEventListener("click", async () => { el.avisosPanel.classList.add("hidden"); el.panel.classList.remove("hidden"); el.newAviso.classList.add("hidden"); el.sectionTitle.textContent = "Programação"; el.adminCount.classList.add("hidden"); el.tabProgramacao.className = "border-b-2 border-red-950 px-4 py-3 text-sm font-bold text-red-950"; el.tabAvisos.className = "border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-500 hover:text-red-950"; if (!state.loaded) await load().catch((error) => setMessage(error.message, "error")); });
  el.recorrencia.addEventListener("change", updateConditionalFields); [el.atividade, el.dia, el.semana, el.data, el.recorrenciaTexto, el.horario, el.observacao].forEach((input) => input.addEventListener("input", updatePreview));
  el.newButton.addEventListener("click", () => { resetForm(); el.form.scrollIntoView({ behavior: "smooth" }); }); el.cancel.addEventListener("click", resetForm);
  el.form.addEventListener("submit", async (event) => { event.preventDefault(); const body = { resource: "programacao", id: state.editingId, comunidade_id: Number(el.comunidade.value), atividade: el.atividade.value, recorrencia: el.recorrencia.value, dia_semana: Number(el.dia.value), semana_mes: Number(el.semana.value), data_especifica: el.data.value, recorrencia_texto: el.recorrenciaTexto.value, horario: el.horario.value, observacao: el.observacao.value }; el.save.disabled = true; try { await request({ method: state.editingId ? "PUT" : "POST", body: JSON.stringify(body) }); await load(); setMessage("Atividade salva."); } catch (error) { setMessage(error.message, "error"); } finally { el.save.disabled = false; } });
  el.list.addEventListener("click", async (event) => { const edit = event.target.closest("[data-edit]"); if (edit) return editItem(Number(edit.dataset.edit)); const remove = event.target.closest("[data-delete]"); if (!remove || !confirm("Excluir esta atividade?")) return; try { await request({ method: "DELETE", body: JSON.stringify({ resource: "programacao", id: Number(remove.dataset.delete) }) }); await load(); setMessage("Atividade excluída."); } catch (error) { setMessage(error.message, "error"); } });
  byId("manage-communities-button").addEventListener("click", () => { renderCommunities(); resetCommunityForm(); el.dialog.showModal(); }); byId("close-communities-button").addEventListener("click", () => el.dialog.close()); el.communityCancel.addEventListener("click", resetCommunityForm);
  el.communitiesList.addEventListener("click", async (event) => { const edit = event.target.closest("[data-community-edit]"); if (edit) { const item = state.comunidades.find((entry) => entry.id === Number(edit.dataset.communityEdit)); el.communityId.value = item.id; el.communityName.value = item.nome; el.communityAddress.value = item.endereco; el.communityOrder.value = item.ordem; el.communityActive.checked = item.ativo; el.communityTitle.textContent = "Editar comunidade"; el.communityCancel.classList.remove("hidden"); return; } const remove = event.target.closest("[data-community-delete]"); if (!remove || !confirm("Excluir esta comunidade?")) return; try { await request({ method: "DELETE", body: JSON.stringify({ resource: "comunidade", id: Number(remove.dataset.communityDelete) }) }); await load(); } catch (error) { alert(error.message); } });
  el.communityForm.addEventListener("submit", async (event) => { event.preventDefault(); const id = Number(el.communityId.value) || null; try { await request({ method: id ? "PUT" : "POST", body: JSON.stringify({ resource: "comunidade", id, nome: el.communityName.value, endereco: el.communityAddress.value, ordem: Number(el.communityOrder.value), ativo: el.communityActive.checked }) }); await load(); resetCommunityForm(); } catch (error) { alert(error.message); } });
})();
