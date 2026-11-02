const STORAGE_KEY = "collegeAssignmentTracker";
const form = document.getElementById("assignmentForm");
const titleInput = document.getElementById("title");
const subjectInput = document.getElementById("subject");
const dueDateInput = document.getElementById("dueDate");
const priorityInput = document.getElementById("priority");
const editIdInput = document.getElementById("editId");
const list = document.getElementById("assignmentList");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("statusFilter");

let assignments = loadAssignments();

function loadAssignments() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveAssignments() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric"
  });
}

function updateStats() {
  const completed = assignments.filter(item => item.completed).length;
  document.getElementById("totalCount").textContent = assignments.length;
  document.getElementById("pendingCount").textContent = assignments.length - completed;
  document.getElementById("completedCount").textContent = completed;
}

function renderAssignments() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const filtered = assignments.filter(item => {
    const matchesText = `${item.title} ${item.subject}`.toLowerCase().includes(query);
    const matchesStatus = status === "All" ||
      (status === "Completed" ? item.completed : !item.completed);
    return matchesText && matchesStatus;
  });

  list.replaceChildren();
  emptyMessage.classList.toggle("hidden", filtered.length !== 0);

  filtered.forEach(item => {
    const card = document.createElement("article");
    card.className = `assignment${item.completed ? " done" : ""}`;

    const info = document.createElement("div");
    info.className = "task-info";

    const heading = document.createElement("p");
    heading.className = "task-title";
    heading.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = `${item.subject} · Due ${formatDate(item.dueDate)}`;

    const pills = document.createElement("div");
    pills.className = "pills";
    const priority = document.createElement("span");
    priority.className = `pill ${item.priority.toLowerCase()}`;
    priority.textContent = `${item.priority} priority`;
    const state = document.createElement("span");
    state.className = `pill${item.completed ? " completed" : ""}`;
    state.textContent = item.completed ? "Completed" : "Pending";
    pills.append(priority, state);
    info.append(heading, meta, pills);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(
      makeButton(item.completed ? "Mark pending" : "Complete", () => toggleComplete(item.id)),
      makeButton("Edit", () => editAssignment(item.id)),
      makeButton("Delete", () => deleteAssignment(item.id), "delete")
    );
    card.append(info, actions);
    list.append(card);
  });
  updateStats();
}

function makeButton(label, action, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (extraClass) button.className = extraClass;
  button.addEventListener("click", action);
  return button;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const subject = subjectInput.value.trim();
  if (!title || !subject || !dueDateInput.value) return;

  const existingId = editIdInput.value;
  if (existingId) {
    assignments = assignments.map(item => item.id === existingId
      ? { ...item, title, subject, dueDate: dueDateInput.value, priority: priorityInput.value }
      : item);
  } else {
    assignments.push({
      id: makeId(), title, subject, dueDate: dueDateInput.value,
      priority: priorityInput.value, completed: false
    });
  }

  saveAssignments();
  resetForm();
  renderAssignments();
});

function editAssignment(id) {
  const item = assignments.find(assignment => assignment.id === id);
  if (!item) return;
  titleInput.value = item.title;
  subjectInput.value = item.subject;
  dueDateInput.value = item.dueDate;
  priorityInput.value = item.priority;
  editIdInput.value = item.id;
  document.getElementById("formHeading").textContent = "Edit assignment";
  document.getElementById("submitButton").textContent = "Save changes";
  document.getElementById("cancelEdit").classList.remove("hidden");
  titleInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  form.reset();
  editIdInput.value = "";
  priorityInput.value = "Medium";
  document.getElementById("formHeading").textContent = "Add an assignment";
  document.getElementById("submitButton").textContent = "Add assignment";
  document.getElementById("cancelEdit").classList.add("hidden");
}

function toggleComplete(id) {
  assignments = assignments.map(item => item.id === id
    ? { ...item, completed: !item.completed } : item);
  saveAssignments();
  renderAssignments();
}

function deleteAssignment(id) {
  const item = assignments.find(assignment => assignment.id === id);
  if (!item || !window.confirm(`Delete "${item.title}"?`)) return;
  assignments = assignments.filter(assignment => assignment.id !== id);
  if (editIdInput.value === id) resetForm();
  saveAssignments();
  renderAssignments();
}

document.getElementById("cancelEdit").addEventListener("click", resetForm);
searchInput.addEventListener("input", renderAssignments);
statusFilter.addEventListener("change", renderAssignments);

renderAssignments();
