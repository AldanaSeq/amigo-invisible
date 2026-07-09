const state = {
  participants: [],
  restrictions: [],
  assignments: null,
  isSharedView: false
};

const STORAGE_KEY = "amigoInvisibleState";

// Referencias centralizadas para mantener la lógica desacoplada del marcado.
const elements = {
  eventName: document.querySelector("#event-name"),
  giftBudget: document.querySelector("#gift-budget"),
  exchangeDate: document.querySelector("#exchange-date"),
  participantName: document.querySelector("#participant-name"),
  addParticipant: document.querySelector("#add-participant"),
  participantsList: document.querySelector("#participants-list"),
  participantsEmpty: document.querySelector("#participants-empty"),
  participantCount: document.querySelector("#participant-count"),
  restrictionA: document.querySelector("#restriction-a"),
  restrictionB: document.querySelector("#restriction-b"),
  addRestriction: document.querySelector("#add-restriction"),
  restrictionsList: document.querySelector("#restrictions-list"),
  restrictionsEmpty: document.querySelector("#restrictions-empty"),
  restrictionCount: document.querySelector("#restriction-count"),
  runDraw: document.querySelector("#run-draw"),
  resetDraw: document.querySelector("#reset-draw"),
  statusMessage: document.querySelector("#status-message"),
  resultsCard: document.querySelector("#results-card"),
  viewerName: document.querySelector("#viewer-name"),
  showResult: document.querySelector("#show-result"),
  secretResult: document.querySelector("#secret-result"),
  assignedName: document.querySelector("#assigned-name"),
  closeResult: document.querySelector("#close-result"),
  copyResult: document.querySelector("#copy-result"),
  downloadJson: document.querySelector("#download-json"),
  sharePanel: document.querySelector("#share-panel"),
  shareList: document.querySelector("#share-list")
};

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeForCompare(name) {
  return normalizeName(name).toLocaleLowerCase("es");
}

function setStatus(message, type = "info") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.toggle("is-error", type === "error");
  elements.statusMessage.classList.toggle("is-success", type === "success");
}

function getEventDetails() {
  return {
    eventName: normalizeName(elements.eventName.value) || "Amigo Invisible",
    budget: elements.giftBudget.value || null,
    exchangeDate: elements.exchangeDate.value || null
  };
}

function saveState() {
  if (state.isSharedView) {
    return;
  }

  const payload = {
    ...getEventDetails(),
    participants: state.participants,
    restrictions: state.restrictions,
    assignments: state.assignments
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadSavedState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return false;
  }

  try {
    const payload = JSON.parse(saved);
    elements.eventName.value = payload.eventName || "";
    elements.giftBudget.value = payload.budget || "";
    elements.exchangeDate.value = payload.exchangeDate || "";
    state.participants = Array.isArray(payload.participants) ? payload.participants : [];
    state.restrictions = Array.isArray(payload.restrictions) ? payload.restrictions : [];
    state.assignments = payload.assignments || null;
    return true;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
}

function clearDrawResult() {
  state.assignments = null;
  elements.resultsCard.hidden = true;
  elements.secretResult.hidden = true;
  elements.assignedName.textContent = "";
  elements.sharePanel.hidden = true;
  elements.shareList.innerHTML = "";
}

// Redibuja participantes, contadores y opciones dependientes.
function renderParticipants() {
  elements.participantsList.innerHTML = "";
  elements.participantCount.textContent = state.participants.length;
  elements.participantsEmpty.hidden = state.participants.length > 0;

  state.participants.forEach((participant, index) => {
    const item = document.createElement("li");
    item.className = "list-item";

    const input = document.createElement("input");
    input.value = participant;
    input.setAttribute("aria-label", `Editar participante ${participant}`);
    input.maxLength = 40;
    input.addEventListener("change", () => updateParticipant(index, input.value));

    const removeButton = document.createElement("button");
    removeButton.className = "icon-button";
    removeButton.type = "button";
    removeButton.innerHTML = "×";
    removeButton.setAttribute("aria-label", `Eliminar ${participant}`);
    removeButton.addEventListener("click", () => removeParticipant(index));

    item.append(input, removeButton);
    elements.participantsList.appendChild(item);
  });

  renderRestrictionOptions();
  renderRestrictions();
}

function renderRestrictionOptions() {
  const options = state.participants
    .map((participant) => `<option value="${escapeHtml(participant)}">${escapeHtml(participant)}</option>`)
    .join("");
  const placeholder = '<option value="">Seleccionar</option>';
  elements.restrictionA.innerHTML = placeholder + options;
  elements.restrictionB.innerHTML = placeholder + options;
  elements.addRestriction.disabled = state.participants.length < 2;
}

function renderRestrictions() {
  elements.restrictionsList.innerHTML = "";
  elements.restrictionCount.textContent = state.restrictions.length;
  elements.restrictionsEmpty.hidden = state.restrictions.length > 0;

  state.restrictions.forEach((restriction, index) => {
    const item = document.createElement("li");
    item.className = "list-item";

    const text = document.createElement("span");
    text.className = "list-item__text";
    text.textContent = `${restriction.a} ↔ ${restriction.b}`;

    const removeButton = document.createElement("button");
    removeButton.className = "icon-button";
    removeButton.type = "button";
    removeButton.innerHTML = "×";
    removeButton.setAttribute("aria-label", `Eliminar restricción ${restriction.a} y ${restriction.b}`);
    removeButton.addEventListener("click", () => {
      state.restrictions.splice(index, 1);
      clearDrawResult();
      renderRestrictions();
      saveState();
      setStatus("Restricción eliminada. Realizá el sorteo nuevamente cuando quieras.");
    });

    item.append(text, removeButton);
    elements.restrictionsList.appendChild(item);
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function addParticipant() {
  const name = normalizeName(elements.participantName.value);

  if (!name) {
    setStatus("Ingresá un nombre para agregar a la lista.", "error");
    return;
  }

  if (state.participants.some((participant) => normalizeForCompare(participant) === normalizeForCompare(name))) {
    setStatus("Ese participante ya existe. Usá nombres únicos para evitar confusiones.", "error");
    return;
  }

  state.participants.push(name);
  elements.participantName.value = "";
  clearDrawResult();
  renderParticipants();
  saveState();
  setStatus(`${name} fue agregado al sorteo.`);
}

function updateParticipant(index, value) {
  const nextName = normalizeName(value);
  const previousName = state.participants[index];

  if (!nextName) {
    setStatus("El nombre no puede quedar vacío.", "error");
    renderParticipants();
    return;
  }

  const duplicated = state.participants.some((participant, participantIndex) => {
    return participantIndex !== index && normalizeForCompare(participant) === normalizeForCompare(nextName);
  });

  if (duplicated) {
    setStatus("No puede haber nombres repetidos en la lista.", "error");
    renderParticipants();
    return;
  }

  state.participants[index] = nextName;
  state.restrictions = state.restrictions.map((restriction) => ({
    a: restriction.a === previousName ? nextName : restriction.a,
    b: restriction.b === previousName ? nextName : restriction.b
  }));
  clearDrawResult();
  renderParticipants();
  saveState();
  setStatus("Participante actualizado. El sorteo anterior, si existía, fue limpiado.");
}

function removeParticipant(index) {
  const removed = state.participants[index];
  state.participants.splice(index, 1);
  state.restrictions = state.restrictions.filter((restriction) => {
    return restriction.a !== removed && restriction.b !== removed;
  });
  clearDrawResult();
  renderParticipants();
  saveState();
  setStatus(`${removed} fue eliminado de la lista.`);
}

function addRestriction() {
  const a = elements.restrictionA.value;
  const b = elements.restrictionB.value;

  if (!a || !b) {
    setStatus("Seleccioná dos participantes para crear una restricción.", "error");
    return;
  }

  if (a === b) {
    setStatus("La restricción debe ser entre dos personas distintas.", "error");
    return;
  }

  const exists = state.restrictions.some((restriction) => {
    return (restriction.a === a && restriction.b === b) || (restriction.a === b && restriction.b === a);
  });

  if (exists) {
    setStatus("Esa restricción ya está cargada.", "error");
    return;
  }

  state.restrictions.push({ a, b });
  elements.restrictionA.value = "";
  elements.restrictionB.value = "";
  clearDrawResult();
  renderRestrictions();
  saveState();
  setStatus(`Restricción agregada: ${a} y ${b} no podrán tocarse.`);
}

function validateDraw() {
  if (state.participants.length < 3) {
    return "Agregá al menos 3 participantes para realizar el sorteo.";
  }

  const uniqueNames = new Set(state.participants.map(normalizeForCompare));
  if (uniqueNames.size !== state.participants.length) {
    return "Hay nombres repetidos. Editá la lista antes de sortear.";
  }

  return "";
}

// Una restricción es bidireccional: A no puede tocarle a B ni B a A.
function isRestricted(giver, receiver) {
  return state.restrictions.some((restriction) => {
    return (restriction.a === giver && restriction.b === receiver) || (restriction.a === receiver && restriction.b === giver);
  });
}

// Fisher-Yates: mezcla justa sin depender de ordenar con valores aleatorios.
function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

// Intenta generar una asignación válida varias veces para resolver restricciones complejas.
function createAssignments() {
  const participants = [...state.participants];
  const maxAttempts = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const receivers = shuffle(participants);
    const assignments = {};
    let valid = true;

    for (let index = 0; index < participants.length; index += 1) {
      const giver = participants[index];
      const receiver = receivers[index];

      if (giver === receiver || isRestricted(giver, receiver)) {
        valid = false;
        break;
      }

      assignments[giver] = receiver;
    }

    if (valid) {
      return assignments;
    }
  }

  return null;
}

function runDraw() {
  const validationError = validateDraw();

  if (validationError) {
    setStatus(validationError, "error");
    return;
  }

  const assignments = createAssignments();

  if (!assignments) {
    setStatus("No se encontró una combinación válida con esas restricciones. Probá quitar alguna restricción.", "error");
    return;
  }

  state.assignments = assignments;
  renderViewerOptions();
  renderShareLinks();
  elements.resultsCard.hidden = false;
  elements.secretResult.hidden = true;
  saveState();
  setStatus("Sorteo realizado con éxito. Ahora podés copiar un link privado para cada participante.", "success");
  launchConfetti();
}

function renderViewerOptions() {
  elements.viewerName.innerHTML = '<option value="">Seleccionar participante</option>' + state.participants
    .map((participant) => `<option value="${escapeHtml(participant)}">${escapeHtml(participant)}</option>`)
    .join("");
}

function renderShareLinks() {
  elements.shareList.innerHTML = "";
  elements.sharePanel.hidden = !state.assignments || state.isSharedView;

  if (!state.assignments || state.isSharedView) {
    return;
  }

  state.participants.forEach((participant) => {
    const item = document.createElement("li");
    item.className = "share-item";

    const name = document.createElement("strong");
    name.textContent = participant;

    const button = document.createElement("button");
    button.className = "button button--secondary";
    button.type = "button";
    button.textContent = "Copiar link";
    button.addEventListener("click", () => copyPrivateLink(participant));

    item.append(name, button);
    elements.shareList.appendChild(item);
  });
}

function createPrivateLink(participant) {
  const payload = {
    ...getEventDetails(),
    participant,
    receiver: state.assignments?.[participant]
  };

  const baseUrl = window.location.href.split("#")[0];
  return `${baseUrl}#resultado=${encodeURIComponent(encodePayload(payload))}`;
}

async function copyPrivateLink(participant) {
  const copied = await copyText(createPrivateLink(participant));

  setStatus(
    copied
      ? `Link privado de ${participant} copiado. Mandáselo solo a esa persona.`
      : "No se pudo copiar el link automáticamente. Probá copiarlo manualmente desde el navegador.",
    copied ? "success" : "error"
  );
}

function showResult() {
  const participant = elements.viewerName.value;

  if (!state.assignments) {
    setStatus("Primero realizá el sorteo.", "error");
    return;
  }

  if (!participant) {
    setStatus("Seleccioná tu nombre para ver el resultado.", "error");
    return;
  }

  elements.assignedName.textContent = state.assignments[participant];
  elements.secretResult.hidden = false;
}

async function copyResult() {
  const participant = elements.viewerName.value;
  const receiver = state.assignments?.[participant];

  if (!participant || !receiver) {
    setStatus("No hay un resultado visible para copiar.", "error");
    return;
  }

  const copied = await copyText(`${participant}, tu amigo invisible es: ${receiver}`);

  setStatus(
    copied
      ? "Resultado copiado al portapapeles."
      : "No se pudo copiar automáticamente. Podés seleccionar el texto y copiarlo manualmente.",
    copied ? "success" : "error"
  );
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return copyWithFallback(text);
  } catch {
    return copyWithFallback(text);
  }
}

function copyWithFallback(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

function downloadJson() {
  if (!state.assignments) {
    setStatus("Primero realizá el sorteo para descargar los resultados.", "error");
    return;
  }

  const payload = {
    ...getEventDetails(),
    restrictions: state.restrictions,
    assignments: state.assignments,
    createdAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "resultados-amigo-invisible.json";
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Archivo JSON descargado.", "success");
}

function resetDraw() {
  clearDrawResult();
  saveState();
  setStatus("Sorteo reiniciado. Los participantes y restricciones se mantienen.");
}

function launchConfetti() {
  if (typeof confetti !== "function") {
    return;
  }

  confetti({
    particleCount: 140,
    spread: 80,
    origin: { y: 0.62 },
    colors: ["#3b82f6", "#8b5cf6", "#f7c948", "#ffffff"]
  });
}

function encodePayload(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodePayload(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

function getSharedPayload() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("resultado");

  if (!token) {
    return null;
  }

  try {
    return decodePayload(token);
  } catch {
    return null;
  }
}

function loadSharedResult(payload) {
  state.isSharedView = true;
  document.body.classList.add("shared-view");
  elements.eventName.value = payload.eventName || "";
  elements.giftBudget.value = payload.budget || "";
  elements.exchangeDate.value = payload.exchangeDate || "";
  state.participants = [payload.participant];
  state.restrictions = [];
  state.assignments = { [payload.participant]: payload.receiver };
  renderParticipants();
  renderViewerOptions();
  elements.viewerName.value = payload.participant;
  elements.resultsCard.hidden = false;
  elements.secretResult.hidden = false;
  elements.assignedName.textContent = payload.receiver;
  setStatus("¡Sorpresa! Este es tu resultado privado. Guardá este link si necesitás volver a verlo.", "success");
}

function initializeApp() {
  const sharedPayload = getSharedPayload();

  if (sharedPayload?.participant && sharedPayload?.receiver) {
    loadSharedResult(sharedPayload);
    return;
  }

  const hasSavedState = loadSavedState();
  renderParticipants();

  if (state.assignments) {
    renderViewerOptions();
    renderShareLinks();
    elements.resultsCard.hidden = false;
    setStatus("Recuperé el sorteo guardado en este navegador.", "success");
  } else {
    setStatus(hasSavedState ? "Recuperé tu lista guardada. Podés continuar el sorteo." : "Completá la lista de participantes para empezar.");
  }
}

elements.addParticipant.addEventListener("click", addParticipant);
elements.participantName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addParticipant();
  }
});
elements.addRestriction.addEventListener("click", addRestriction);
elements.runDraw.addEventListener("click", runDraw);
elements.resetDraw.addEventListener("click", resetDraw);
elements.showResult.addEventListener("click", showResult);
elements.closeResult.addEventListener("click", () => {
  elements.secretResult.hidden = true;
});
elements.copyResult.addEventListener("click", copyResult);
elements.downloadJson.addEventListener("click", downloadJson);
elements.eventName.addEventListener("input", saveState);
elements.giftBudget.addEventListener("input", saveState);
elements.exchangeDate.addEventListener("input", saveState);
window.addEventListener("hashchange", () => {
  const sharedPayload = getSharedPayload();

  if (sharedPayload?.participant && sharedPayload?.receiver) {
    loadSharedResult(sharedPayload);
  }
});

initializeApp();
