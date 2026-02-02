import {
  getUsers,
  createUser,
  checkUserPIN
} from "../core/users.js";

import { setCurrentUser } from "../core/session.js";
// import { initCalendar } from "./calendar.js";
import { startCalendarApp } from "../app.js";

const pinScreen = document.getElementById("pinScreen");
const calendarScreen = document.getElementById("calendarScreen");

const userSelect = document.getElementById("userSelect");
const newUserName = document.getElementById("newUserName");
const pinInput = document.getElementById("pinInput");
const pinError = document.getElementById("pinError");

const pinSubmit = document.getElementById("pinSubmit");
const addUserBtn = document.getElementById("addUserBtn");

let creatingUser = false;

// ===== INIT =====
export async function initPinScreen() {
  const users = await getUsers();

  pinScreen.classList.remove("hidden");
  calendarScreen.classList.add("hidden");

  if (users.length === 0) {
    // первый пользователь
    creatingUser = true;
    userSelect.classList.add("hidden");
    addUserBtn.classList.add("hidden");
    newUserName.classList.remove("hidden");
    document.getElementById("pinTitle").textContent =
      "Создать пользователя";
  } else {
    fillUserSelect(users);
  }
}

function fillUserSelect(users) {
  userSelect.innerHTML = "";
  users.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = u.name;
    userSelect.appendChild(opt);
  });
}

// ===== EVENTS =====
pinSubmit.addEventListener("click", async () => {
  pinError.classList.add("hidden");
  const pin = pinInput.value.trim();

  if (!pin) return;

  if (creatingUser) {
    const name = newUserName.value.trim();
    if (!name) return;

    const user = await createUser(name, pin);
    loginSuccess(user.id);
  } else {
    const userId = userSelect.value;
    const ok = await checkUserPIN(userId, pin);
    if (!ok) {
      pinError.classList.remove("hidden");
      return;
    }
    loginSuccess(userId);
  }
});

addUserBtn.addEventListener("click", () => {
  creatingUser = true;
  newUserName.classList.remove("hidden");
  userSelect.classList.add("hidden");
  addUserBtn.classList.add("hidden");
  document.getElementById("pinTitle").textContent =
    "Новый пользователь";
});

function loginSuccess(userId) {
  setCurrentUser(userId);

  pinScreen.classList.add("hidden");
  calendarScreen.classList.remove("hidden");

  startCalendarApp(); // ✅ ЕДИНСТВЕННЫЙ запуск календаря
}
