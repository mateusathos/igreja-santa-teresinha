import { upload } from "@vercel/blob/client";

const MAX_SOURCE_SIZE = 12 * 1024 * 1024;
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const state = {
  avisos: [],
  editingId: null,
  currentImageUrl: null,
  currentImagePathname: null,
  pendingImage: null,
  previewObjectUrl: null
};

const elements = {
  loadingView: document.getElementById("loading-view"),
  loginView: document.getElementById("login-view"),
  adminView: document.getElementById("admin-view"),
  loginForm: document.getElementById("login-form"),
  loginButton: document.getElementById("login-button"),
  loginError: document.getElementById("login-error"),
  password: document.getElementById("admin-password"),
  togglePasswordButton: document.getElementById("toggle-password-button"),
  passwordEyeIcon: document.getElementById("password-eye-icon"),
  passwordEyeOffIcon: document.getElementById("password-eye-off-icon"),
  newAvisoButton: document.getElementById("new-aviso-button"),
  logoutButton: document.getElementById("logout-button"),
  adminCount: document.getElementById("admin-count"),
  adminMessage: document.getElementById("admin-message"),
  emptyState: document.getElementById("empty-state"),
  avisosList: document.getElementById("avisos-list"),
  avisoForm: document.getElementById("aviso-form"),
  avisoId: document.getElementById("aviso-id"),
  avisoTitulo: document.getElementById("aviso-titulo"),
  avisoDescricao: document.getElementById("aviso-descricao"),
  avisoImagem: document.getElementById("aviso-imagem"),
  imageFileName: document.getElementById("image-file-name"),
  imageStatus: document.getElementById("image-status"),
  removeImageButton: document.getElementById("remove-image-button"),
  previewImageContainer: document.getElementById("preview-image-container"),
  previewImage: document.getElementById("preview-image"),
  previewAvisoTitle: document.getElementById("preview-aviso-title"),
  previewAvisoDescription: document.getElementById("preview-aviso-description"),
  formTitle: document.getElementById("form-title"),
  formSubtitle: document.getElementById("form-subtitle"),
  cancelEditButton: document.getElementById("cancel-edit-button"),
  saveAvisoButton: document.getElementById("save-aviso-button")
};

const noticeEditor = window.adminUI.editor('aviso-form', 'Aviso paroquial');
const noticeTools = document.createElement('div');
noticeTools.className = 'admin-tools';
noticeTools.innerHTML = '<label>Buscar aviso<input type="search" id="notice-search" placeholder="Título do aviso"></label><label>Exibição<select id="notice-status"><option value="">Todos</option><option value="published">Publicados</option><option value="hidden">Ocultos</option></select></label><a class="admin-public-link" href="/avisos" target="_blank" rel="noopener">Ver no site</a>';
elements.avisosList.before(noticeTools);
noticeTools.addEventListener('input', renderAvisos);
elements.newAvisoButton.textContent = 'Novo aviso';
elements.removeImageButton.addEventListener('click', () => noticeEditor.markDirty());
elements.cancelEditButton.textContent = 'Voltar à lista';

function showView(view) {
  elements.loadingView.classList.toggle("hidden", view !== "loading");
  elements.loginView.classList.toggle("hidden", view !== "login");
  elements.adminView.classList.toggle("hidden", view !== "admin");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Nao foi possivel concluir a acao.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function setLoginError(message) {
  elements.loginError.textContent = message;
  elements.loginError.classList.toggle("hidden", !message);
}

function setAdminMessage(message, type = "success") {
  elements.adminMessage.textContent = message;
  elements.adminMessage.className = "mb-4 rounded-md px-4 py-3 text-sm font-semibold";
  elements.adminMessage.classList.add(
    type === "error" ? "bg-red-50" : "bg-emerald-50",
    type === "error" ? "text-red-900" : "text-emerald-900"
  );
  elements.adminMessage.classList.toggle("hidden", !message);
  if (message && type !== "error") {
    window.setTimeout(() => elements.adminMessage.classList.add("hidden"), 3000);
  }
}

function setImageStatus(message, type = "neutral") {
  elements.imageStatus.textContent = message;
  elements.imageStatus.className = "mt-2 text-xs font-semibold";
  elements.imageStatus.classList.add(type === "error" ? "text-red-900" : "text-stone-600");
  elements.imageStatus.classList.toggle("hidden", !message);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function createNoticeImage(url, title, maxHeightClass = "max-h-80") {
  const container = document.createElement("div");
  container.className = `mt-4 flex w-full items-center justify-center overflow-hidden rounded-md bg-stone-100 ${maxHeightClass}`;
  const image = document.createElement("img");
  image.src = url;
  image.alt = `Imagem do aviso: ${title}`;
  image.loading = "lazy";
  image.className = `${maxHeightClass} h-auto w-auto max-w-full object-contain`;
  container.appendChild(image);
  return container;
}

function buildAvisoCard(aviso) {
  const article = document.createElement("article");
  article.className = "rounded-lg border border-red-950/10 bg-white p-4 shadow-sm";
  const header = document.createElement("div");
  header.className = "flex items-start justify-between gap-3";
  const content = document.createElement("div");
  content.className = "min-w-0";
  const title = document.createElement("h2");
  title.className = "break-words text-lg font-bold text-red-950";
  title.textContent = aviso.titulo;
  const date = document.createElement("p");
  date.className = "mt-1 text-xs font-semibold text-stone-500";
  date.textContent = aviso.atualizado_em ? `Atualizado em ${formatDate(aviso.atualizado_em)}` : "";
  date.textContent += aviso.ativo ? ' · Publicado' : ' · Oculto';
  content.append(title, date);

  const actions = document.createElement("div");
  actions.className = "flex shrink-0 gap-2";
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "rounded-md border border-stone-300 px-3 py-2 text-xs font-bold text-stone-800 transition hover:bg-stone-100";
  editButton.textContent = "Editar";
  editButton.addEventListener("click", () => startEditing(aviso));
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "rounded-md border border-red-900 px-3 py-2 text-xs font-bold text-red-900 transition hover:bg-red-900 hover:text-white";
  deleteButton.textContent = "Excluir";
  deleteButton.addEventListener("click", () => deleteAviso(aviso.id));
  actions.append(editButton, deleteButton);
  const visibility = document.createElement('button');
  visibility.type = 'button';
  visibility.className = editButton.className;
  visibility.textContent = aviso.ativo ? 'Ocultar' : 'Publicar';
  visibility.addEventListener('click', async () => {
    visibility.disabled = true;
    try {
      await requestJson('/api/admin/avisos', {method: 'PUT', body: JSON.stringify({...aviso, ativo: !aviso.ativo})});
      await loadAvisos();
      setAdminMessage(aviso.ativo ? 'Aviso ocultado.' : 'Aviso publicado.');
    } catch (error) { setAdminMessage(error.message, 'error'); }
    finally { visibility.disabled = false; }
  });
  actions.append(visibility);
  const duplicate = document.createElement('button');
  duplicate.type = 'button'; duplicate.className = editButton.className; duplicate.textContent = 'Duplicar';
  duplicate.addEventListener('click', async () => {
    duplicate.disabled = true;
    try {
      let image = null;
      if (aviso.imagem_url) {
        const response = await fetch(aviso.imagem_url);
        if (!response.ok) throw new Error('Não foi possível copiar a imagem. Tente novamente.');
        const blob = await response.blob();
        image = await prepareImage(new File([blob], 'copia.webp', {type: blob.type}));
      }
      resetForm();
      elements.avisoTitulo.value = aviso.titulo;
      elements.avisoDescricao.value = aviso.descricao;
      if (image) { state.pendingImage = image; state.previewObjectUrl = URL.createObjectURL(image); }
      updatePreview(); noticeEditor.open();
    } catch (error) { setAdminMessage(error.message, 'error'); }
    finally { duplicate.disabled = false; }
  });
  actions.append(duplicate);
  header.append(content, actions);

  const description = document.createElement("p");
  description.className = "mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-stone-700";
  description.textContent = aviso.descricao;
  article.append(header);
  if (aviso.imagem_url) article.appendChild(createNoticeImage(aviso.imagem_url, aviso.titulo));
  article.append(description);
  return article;
}

function renderAvisos() {
  elements.avisosList.replaceChildren();
  const count = state.avisos.length;
  elements.adminCount.textContent = `${count} ${count === 1 ? "aviso" : "avisos"}`;
  elements.emptyState.classList.toggle("hidden", count > 0);
  const search = document.getElementById('notice-search').value.trim().toLocaleLowerCase('pt-BR');
  const status = document.getElementById('notice-status').value;
  const visible = state.avisos.filter(aviso => aviso.titulo.toLocaleLowerCase('pt-BR').includes(search) && (!status || aviso.ativo === (status === 'published')));
  visible.forEach((aviso) => elements.avisosList.appendChild(buildAvisoCard(aviso)));
  if (count && !visible.length) elements.avisosList.textContent = 'Nenhum aviso encontrado para estes filtros.';
}

function revokePreviewObjectUrl() {
  if (state.previewObjectUrl) URL.revokeObjectURL(state.previewObjectUrl);
  state.previewObjectUrl = null;
}

function updatePreview() {
  elements.previewAvisoTitle.textContent = elements.avisoTitulo.value.trim() || "Título do aviso";
  elements.previewAvisoDescription.textContent = elements.avisoDescricao.value.trim() || "A descrição do aviso aparecerá aqui.";
  const imageUrl = state.previewObjectUrl || state.currentImageUrl;
  elements.previewImageContainer.classList.toggle("hidden", !imageUrl);
  elements.previewImageContainer.classList.toggle("flex", Boolean(imageUrl));
  if (imageUrl) elements.previewImage.src = imageUrl;
  else elements.previewImage.removeAttribute("src");
  elements.removeImageButton.classList.toggle("hidden", !imageUrl);
}

function resetImageState() {
  revokePreviewObjectUrl();
  state.currentImageUrl = null;
  state.currentImagePathname = null;
  state.pendingImage = null;
  elements.avisoImagem.value = "";
  elements.imageFileName.textContent = "JPEG, PNG ou WebP";
  setImageStatus("");
}

function resetForm() {
  state.editingId = null;
  elements.avisoId.value = "";
  elements.avisoTitulo.value = "";
  elements.avisoDescricao.value = "";
  resetImageState();
  elements.formTitle.textContent = "Novo aviso";
  elements.formSubtitle.textContent = "Título, descrição e imagem opcional aparecem no site.";
  elements.cancelEditButton.classList.add("hidden");
  elements.saveAvisoButton.textContent = "Salvar aviso";
  updatePreview();
}

function startEditing(aviso) {
  resetImageState();
  state.editingId = aviso.id;
  state.currentImageUrl = aviso.imagem_url;
  state.currentImagePathname = aviso.imagem_pathname;
  elements.avisoId.value = aviso.id;
  elements.avisoTitulo.value = aviso.titulo;
  elements.avisoDescricao.value = aviso.descricao;
  elements.imageFileName.textContent = aviso.imagem_url ? "Imagem atual do aviso" : "JPEG, PNG ou WebP";
  elements.formTitle.textContent = "Editar aviso";
  elements.formSubtitle.textContent = "Atualize o conteúdo exibido no site.";
  elements.cancelEditButton.classList.remove("hidden");
  elements.saveAvisoButton.textContent = "Atualizar aviso";
  updatePreview();
  noticeEditor.open();
  elements.avisoTitulo.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function prepareImage(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error("Selecione uma imagem JPEG, PNG ou WebP.");
  if (file.size > MAX_SOURCE_SIZE) throw new Error("A imagem original deve ter no máximo 12 MB.");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  if (!blob) throw new Error("Nao foi possivel processar a imagem.");
  if (blob.size > MAX_UPLOAD_SIZE) throw new Error("A imagem processada ficou acima de 5 MB.");
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").slice(0, 60) || "aviso";
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}

async function loadAvisos() {
  const data = await requestJson("/api/admin/avisos");
  state.avisos = data.avisos || [];
  renderAvisos();
}

async function checkSession() {
  showView("loading");
  try {
    const data = await requestJson("/api/admin/session");
    if (!data.authenticated) {
      showView("login");
      elements.password.focus();
      return;
    }
    await loadAvisos();
    showView("admin");
  } catch (error) {
    showView("login");
    setLoginError(error.message);
  }
}

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoginError("");
  elements.loginButton.disabled = true;
  elements.loginButton.textContent = "Entrando...";
  try {
    await requestJson("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password: elements.password.value })
    });
    elements.password.value = "";
    await loadAvisos();
    showView("admin");
  } catch (error) {
    setLoginError(error.message);
  } finally {
    elements.loginButton.disabled = false;
    elements.loginButton.textContent = "Entrar";
  }
});

elements.logoutButton.addEventListener("click", async () => {
  await requestJson("/api/admin/logout", { method: "POST", body: "{}" }).catch(() => null);
  resetForm();
  state.avisos = [];
  showView("login");
  elements.password.focus();
});

elements.togglePasswordButton.addEventListener("click", () => {
  const shouldShowPassword = elements.password.type === "password";
  elements.password.type = shouldShowPassword ? "text" : "password";
  elements.passwordEyeIcon.classList.toggle("hidden", shouldShowPassword);
  elements.passwordEyeOffIcon.classList.toggle("hidden", !shouldShowPassword);
  elements.togglePasswordButton.setAttribute("aria-label", shouldShowPassword ? "Ocultar senha" : "Mostrar senha");
  elements.togglePasswordButton.setAttribute("aria-pressed", String(shouldShowPassword));
  elements.password.focus();
});

elements.newAvisoButton.addEventListener("click", () => {
  resetForm();
  noticeEditor.open();
  elements.avisoTitulo.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

elements.cancelEditButton.addEventListener("click", () => noticeEditor.close());
elements.avisoTitulo.addEventListener("input", updatePreview);
elements.avisoDescricao.addEventListener("input", updatePreview);

elements.avisoImagem.addEventListener("change", async () => {
  const file = elements.avisoImagem.files[0];
  if (!file) return;
  revokePreviewObjectUrl();
  state.pendingImage = null;
  updatePreview();
  setImageStatus("Preparando imagem...");
  try {
    const preparedImage = await prepareImage(file);
    state.pendingImage = preparedImage;
    state.previewObjectUrl = URL.createObjectURL(preparedImage);
    elements.imageFileName.textContent = preparedImage.name;
    setImageStatus(`Imagem pronta (${(preparedImage.size / 1024).toFixed(0)} KB).`);
    updatePreview();
  } catch (error) {
    elements.avisoImagem.value = "";
    state.pendingImage = null;
    setImageStatus(error.message, "error");
    updatePreview();
  }
});

elements.removeImageButton.addEventListener("click", () => {
  const hadPersistedImage = Boolean(state.currentImagePathname);
  revokePreviewObjectUrl();
  state.pendingImage = null;
  state.currentImageUrl = null;
  state.currentImagePathname = null;
  elements.avisoImagem.value = "";
  elements.imageFileName.textContent = "JPEG, PNG ou WebP";
  setImageStatus(hadPersistedImage ? "A imagem será removida ao salvar." : "Imagem removida da prévia.");
  updatePreview();
});

elements.avisoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setAdminMessage("");
  const editing = Boolean(state.editingId);
  noticeEditor.busy(true);
  noticeEditor.message('');
  elements.saveAvisoButton.disabled = true;
  elements.avisoImagem.disabled = true;
  elements.saveAvisoButton.textContent = state.pendingImage ? "Enviando imagem..." : editing ? "Atualizando..." : "Salvando...";

  try {
    let imagemUrl = state.currentImageUrl;
    let imagemPathname = state.currentImagePathname;

    if (state.pendingImage) {
      const uploadedBlob = await upload(`avisos/${Date.now()}-${state.pendingImage.name}`, state.pendingImage, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        onUploadProgress: ({ percentage }) => {
          elements.saveAvisoButton.textContent = `Enviando imagem (${Math.round(percentage)}%)`;
        }
      });
      imagemUrl = uploadedBlob.url;
      imagemPathname = uploadedBlob.pathname;
      state.currentImageUrl = imagemUrl;
      state.currentImagePathname = imagemPathname;
      state.pendingImage = null;
    }

    const payload = {
      titulo: elements.avisoTitulo.value,
      descricao: elements.avisoDescricao.value,
      imagem_url: imagemUrl,
      imagem_pathname: imagemPathname
    };
    if (state.editingId) payload.ativo = state.avisos.find(item => item.id === state.editingId)?.ativo ?? true;
    if (state.editingId) payload.id = state.editingId;

    await requestJson("/api/admin/avisos", {
      method: state.editingId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    resetForm();
    noticeEditor.busy(false);
    noticeEditor.close(true);
    await loadAvisos();
    setAdminMessage("Alterações salvas. A página pública está atualizada.");
  } catch (error) {
    noticeEditor.message(error.status === 401 ? 'Sessão expirada. Abra /admin em outra aba para entrar novamente e depois tente salvar aqui.' : error.message);
  } finally {
    noticeEditor.busy(false);
    elements.saveAvisoButton.disabled = false;
    elements.avisoImagem.disabled = false;
    elements.saveAvisoButton.textContent = state.editingId ? "Atualizar aviso" : "Salvar aviso";
  }
});

async function deleteAviso(id) {
  const aviso = state.avisos.find(item => item.id === id);
  if (!window.confirm(`Excluir "${aviso?.titulo}"? Para suspender temporariamente, use Ocultar.`)) return;
  try {
    await requestJson("/api/admin/avisos", {
      method: "DELETE",
      body: JSON.stringify({ id })
    });
    if (state.editingId === id) resetForm();
    await loadAvisos();
    setAdminMessage("Aviso excluido.");
  } catch (error) {
    if (error.status === 401) showView("login");
    else setAdminMessage(error.message, "error");
  }
}

updatePreview();
checkSession();
