const avisosContainer = document.getElementById("avisos");
const semAvisos = document.getElementById("sem-avisos");
const ultimaAtualizacao = document.getElementById("ultima-atualizacao");

function formatPublicDate(value) {
  if (!value) return "";

  const date = new Date(value.replace(" ", "T") + "Z");

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function createAvisoElement(aviso) {
  const card = document.createElement("div");
  card.className = "overflow-hidden bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-lg hover:shadow-2xl border-l-4 border-red-900 transform transition-all duration-300 hover:translate-x-2";

  const content = document.createElement("div");
  content.className = "p-6";

  const title = document.createElement("h2");
  title.className = "text-xl font-bold text-red-900 mb-2";
  title.textContent = aviso.titulo;

  const description = document.createElement("p");
  description.className = "text-base mt-2 leading-relaxed text-gray-700 whitespace-pre-line";
  description.textContent = aviso.descricao;

  if (aviso.imagem_url) {
    const imageContainer = document.createElement("div");
    imageContainer.className = "flex max-h-[720px] w-full items-center justify-center overflow-hidden bg-stone-100";

    const image = document.createElement("img");
    image.src = aviso.imagem_url;
    image.alt = "Imagem do aviso: " + aviso.titulo;
    image.loading = "lazy";
    image.decoding = "async";
    image.className = "max-h-[720px] h-auto w-auto max-w-full object-contain";

    imageContainer.appendChild(image);
    card.appendChild(imageContainer);
  }

  content.append(title, description);
  card.appendChild(content);

  return card;
}

async function loadPublicAvisos() {
  try {
    const response = await fetch("/api/avisos");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Nao foi possivel carregar os avisos.");
    }

    const avisos = data.avisos || [];
    avisosContainer.replaceChildren();

    semAvisos.classList.toggle("hidden", avisos.length > 0);

    avisos.forEach((aviso) => {
      avisosContainer.appendChild(createAvisoElement(aviso));
    });

    const dataAtualizacao = formatPublicDate(data.ultimaAtualizacao);
    ultimaAtualizacao.textContent = dataAtualizacao
      ? `Última Atualização: ${dataAtualizacao}`
      : "Avisos Paroquiais";
  } catch (error) {
    avisosContainer.replaceChildren();
    semAvisos.classList.remove("hidden");
    semAvisos.textContent = "Não foi possível carregar os avisos no momento.";
    ultimaAtualizacao.textContent = "Avisos Paroquiais";
  }
}

loadPublicAvisos();
