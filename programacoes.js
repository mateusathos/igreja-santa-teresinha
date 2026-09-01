const diasDaSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const recorrenciasSemanais = ["Todos os domingos", "Todas as segundas-feiras", "Todas as terças-feiras", "Todas as quartas-feiras", "Todas as quintas-feiras", "Todas as sextas-feiras", "Todos os sábados"];
let programacoesData = null;

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value == null ? "" : String(value);
  return element.innerHTML;
}

function formatarRecorrencia(item) {
  if (item.recorrencia === "semanal") return recorrenciasSemanais[item.dia_semana];
  if (item.recorrencia === "mensal") {
    const ordinal = [0, 6].includes(item.dia_semana) ? `${item.semana_mes}º` : `${item.semana_mes}ª`;
    return `${ordinal} ${diasDaSemana[item.dia_semana].toLowerCase()} do mês`;
  }
  if (item.recorrencia === "data_especifica") {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" })
      .format(new Date(`${item.data_especifica}T12:00:00Z`));
  }
  return item.recorrencia_texto;
}

function renderProgramacoes(data) {
  const list = document.querySelector("#programacoes-list");
  const communityFilter = document.querySelector("#filter-community").value;
  const activityFilter = document.querySelector("#filter-activity").value;
  const filteredItems = data.programacoes.filter((item) => (!communityFilter || String(item.comunidade_id) === communityFilter) && (!activityFilter || item.atividade === activityFilter));
  const visible = data.comunidades.filter((comunidade) => filteredItems.some((item) => item.comunidade_id === comunidade.id));
  if (!visible.length) {
    list.innerHTML = '<div class="rounded-lg border border-dashed border-red-950/30 bg-white p-8 text-center lg:col-span-2"><h2 class="text-lg font-bold text-red-950">Programação em atualização</h2><p class="mt-2 text-sm text-stone-600">Novos horários serão publicados em breve.</p></div>';
    return;
  }
  list.innerHTML = visible.map((comunidade) => {
    const items = filteredItems.filter((item) => item.comunidade_id === comunidade.id);
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(comunidade.endereco)}`;
    return `<section id="comunidade-${comunidade.slug}" class="fade-in overflow-hidden rounded-lg border border-red-950/10 bg-white shadow-sm">
      <header class="border-b border-red-950/10 bg-red-950 px-5 py-4 text-white">
        <h2 class="break-words text-lg font-bold">${escapeHtml(comunidade.nome)}</h2>
        <p class="mt-1 break-words text-xs leading-relaxed text-red-100">${escapeHtml(comunidade.endereco)}</p><a href="${mapUrl}" target="_blank" rel="noopener" class="mt-3 inline-flex min-h-11 items-center text-xs font-bold text-white underline">Abrir no mapa</a>
      </header>
      <div class="divide-y divide-stone-200">${items.map((item) => `<article class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
        <div class="min-w-0"><h3 class="break-words text-base font-bold text-red-900">${escapeHtml(item.atividade)}</h3><p class="mt-1 break-words text-sm font-semibold text-stone-700">${escapeHtml(formatarRecorrencia(item))}</p>${item.observacao ? `<p class="mt-1 break-words text-xs leading-relaxed text-stone-500">${escapeHtml(item.observacao)}</p>` : ""}</div>
        <time class="whitespace-nowrap rounded-md bg-amber-50 px-3 py-2 text-base font-bold text-amber-900" datetime="${escapeHtml(item.horario)}">${escapeHtml(item.horario.replace(":", "h"))}</time>
      </article>`).join("")}</div>
    </section>`;
  }).join("");
}

async function loadProgramacoes() {
  const loading = document.querySelector("#programacoes-loading");
  const error = document.querySelector("#programacoes-error");
  try {
    const response = await fetch("/api/programacoes");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível carregar a programação.");
    programacoesData = data;
    const communitySelect = document.querySelector("#filter-community");
    const activitySelect = document.querySelector("#filter-activity");
    communitySelect.insertAdjacentHTML("beforeend", data.comunidades.map((item) => `<option value="${item.id}">${escapeHtml(item.nome)}</option>`).join(""));
    const activities = [...new Set(data.programacoes.map((item) => item.atividade))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    activitySelect.insertAdjacentHTML("beforeend", activities.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join(""));
    document.querySelector("#programacoes-filters").classList.remove("hidden");
    renderProgramacoes(data);
  } catch (requestError) {
    error.textContent = requestError.message;
    error.classList.remove("hidden");
  } finally {
    loading.classList.add("hidden");
  }
}

loadProgramacoes();
document.querySelector("#filter-community").addEventListener("change", () => programacoesData && renderProgramacoes(programacoesData));
document.querySelector("#filter-activity").addEventListener("change", () => programacoesData && renderProgramacoes(programacoesData));
