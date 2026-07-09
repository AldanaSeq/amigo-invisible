const state = {
  participants: [],
  restrictions: [],
  assignments: null
};

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
  downloadJson: document.querySelector("#download-json")
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

function clearDrawResult() {
  state.assignments = null;
  elements.resultsCard.hidden = true;
  elements.secretResult.hidden = true;
  elements.assignedName.textContent = "";
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
  elements.resultsCard.hidden = false;
  elements.secretResult.hidden = true;
  setStatus("Sorteo realizado con éxito. Cada participante puede ver únicamente su resultado.", "success");
  launchConfetti();
}

function renderViewerOptions() {
  elements.viewerName.innerHTML = '<option value="">Seleccionar participante</option>' + state.participants
    .map((participant) => `<option value="${escapeHtml(participant)}">${escapeHtml(participant)}</option>`)
    .join("");
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

  const text = `${participant}, tu amigo invisible es: ${receiver}`;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      copyWithFallback(text);
    }
    setStatus("Resultado copiado al portapapeles.", "success");
  } catch {
    const copied = copyWithFallback(text);
    setStatus(
      copied
        ? "Resultado copiado al portapapeles."
        : "No se pudo copiar automáticamente. Podés seleccionar el texto y copiarlo manualmente.",
      copied ? "success" : "error"
    );
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
    eventName: normalizeName(elements.eventName.value) || "Amigo Invisible",
    budget: elements.giftBudget.value || null,
    exchangeDate: elements.exchangeDate.value || null,
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

renderParticipants();
setStatus("Completá la lista de participantes para empezar.");
