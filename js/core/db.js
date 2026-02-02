import { openDB } from "./idb.js";
import { getCurrentUser } from "./session.js";

// export async function insertTask(task) {
//   const db = await openDB();
//   task.id = crypto.randomUUID();
//   task.userId = getCurrentUser(); // 👈 ВАЖНО

//   const tx = db.transaction("tasks", "readwrite");
//   tx.objectStore("tasks").put(task);
// }

// export async function getTasksByDate(date) {
//   const db = await openDB();
//   const userId = getCurrentUser();
//   const tx = db.transaction("tasks", "readonly");
//   const req = tx.objectStore("tasks").getAll();

//   return new Promise(res => {
//     req.onsuccess = () =>
//       res(req.result.filter(
//         t => t.date === date && t.userId === userId
//       ));
//   });
// }

// =====================
// helpers
// =====================
function uid() {
  return crypto.randomUUID();
}

function hoursBetween(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let s = sh * 60 + sm;
  let e = eh * 60 + em;
  if (e < s) e += 1440;
  return +( (e - s) / 60 ).toFixed(2);
}

// =====================
// TASKS
// =====================
export async function insertTask(task) {
  const db = await openDB();

  task.id = uid();
  task.userId = getCurrentUser(); // 👈 обязательно

  const tx = db.transaction("tasks", "readwrite");
  tx.objectStore("tasks").put(task);

  return { data: task, error: null };
}


export async function updateTask(id, payload) {
  const db = await openDB();
  const tx = db.transaction("tasks", "readwrite");
  const store = tx.objectStore("tasks");

  const req = store.get(id);
  req.onsuccess = () => {
    store.put({ ...req.result, ...payload });
  };

  return { error: null };
}

export async function deleteTask(id) {
  const db = await openDB();
  const tx = db.transaction("tasks", "readwrite");
  tx.objectStore("tasks").delete(id);
}

export async function getTaskRange(from, to) {
  const db = await openDB();
  const tx = db.transaction("tasks", "readonly");
  const req = tx.objectStore("tasks").getAll();
  const userId = getCurrentUser();

  return new Promise(res => {
    req.onsuccess = () =>
      

res(req.result.filter(
  t =>
    t.date >= from &&
    t.date <= to &&
    t.userId === userId
));

  });
}

// =====================
// WORKS
// =====================
export async function insertWork(work) {
  const db = await openDB();
  work.id = uid();
  work.total_hours =
    work.total_hours ??
    hoursBetween(work.start_time, work.end_time);

  const tx = db.transaction("works", "readwrite");
  tx.objectStore("works").put(work);

  return { data: work, error: null };
}

export async function updateWork(id, payload) {
  const db = await openDB();
  const tx = db.transaction("works", "readwrite");
  const store = tx.objectStore("works");

  const req = store.get(id);
  req.onsuccess = () => {
    const updated = {
      ...req.result,
      ...payload
    };
    updated.total_hours =
      updated.total_hours ??
      hoursBetween(updated.start_time, updated.end_time);

    store.put(updated);
  };

  return { error: null };
}

export async function getWorkByDate(date) {
  const db = await openDB();
  const tx = db.transaction("works", "readonly");
  const req = tx.objectStore("works").getAll();

  return new Promise(res => {
    req.onsuccess = () =>
      res(req.result.filter(w => w.date === date));
  });
}

export async function getWorkRange(from, to) {
  const db = await openDB();
  const tx = db.transaction("works", "readonly");
  const req = tx.objectStore("works").getAll();

  return new Promise(res => {
    req.onsuccess = () =>
      res(req.result.filter(w => w.date >= from && w.date <= to));
  });
}

// =====================
// MONTH DATA (for calendar + reports)
// =====================
export async function getMonthData(year, month) {
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

  const tasks = await getTaskRange(from, to);
  const works = await getWorkRange(from, to);

  const groupedTasks = {};
  const groupedWorks = {};

  tasks.forEach(t => {
    (groupedTasks[t.date] ||= []).push(t);
  });

  works.forEach(w => {
    (groupedWorks[w.date] ||= []).push(w);
  });

  return {
    tasks: groupedTasks,
    works: groupedWorks
  };
}

// =====================
// CALC (expected by modals-add.js)
// =====================
export function calcTotalHours(start, end) {
  return hoursBetween(start, end);
}
export function calcEarnings(totalHours, rate) {
  return +(totalHours * rate).toFixed(2);
}

// =====================
// DELETE WORK (for modal-day.js)
// =====================
export async function deleteWork(id) {
  const db = await openDB();
  const tx = db.transaction("works", "readwrite");
  tx.objectStore("works").delete(id);
}

// =====================
// GET TASKS BY DATE (for modal-day.js)
// =====================
export async function getTasksByDate(dateISO) {
  const db = await openDB();
  const userId = getCurrentUser();

  const tx = db.transaction("tasks", "readonly");
  const req = tx.objectStore("tasks").getAll();

  return new Promise(res => {
    req.onsuccess = () =>
      res(req.result.filter(
        t => t.date === dateISO && t.userId === userId
      ));
  });
}

