// =========================================================
// APP.JS — главный контроллер
// =========================================================

import {
    supabase,
    getSessionUser,
    authLogin,
    authRegister,
    authLogout
} from "./core/auth.js";

import { initCalendar, renderCalendar } from "./ui/calendar.js";
import { initTheme } from "./ui/theme.js";

import { openWorkModal, openTaskModal } from "./ui/modals-add.js";
import { openDayDetails } from "./ui/modal-day.js";

import { initReports } from "./ui/reports.js";
import { openExportModal } from "./ui/export.js";
// 
// =========================================
// LOGOUT BUTTON
// =========================================
const logoutBtn = document.getElementById("logoutBtn");
console.log("[INIT] logoutBtn =", logoutBtn);

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        console.log("[LOGOUT BTN] CLICKED!");

        try {
            await authLogout();
            console.log("[LOGOUT BTN] authLogout() finished");

            location.reload();
        } catch (err) {
            console.error("[LOGOUT BTN] ERROR:", err);
        }
    });
} else {
    console.warn("[INIT] logoutBtn NOT FOUND!");
}


// =========================================
// LOGIN BUTTON
// =========================================
const loginBtn = document.getElementById("loginBtn");
console.log("[INIT] loginBtn =", loginBtn);

if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        console.log("[LOGIN BTN] CLICKED!");

        const email = document.getElementById("loginEmail")?.value.trim();
        const password = document.getElementById("loginPassword")?.value.trim();
        console.log("[LOGIN] Email entered:", email);
        console.log("[LOGIN] Password entered:", password ? "(hidden)" : "EMPTY");
        console.log("=== LOGIN START ===");
        if (!email || !password) {
            console.warn("[LOGIN] Missing email or password!");
            alert("Wprowadź email i hasło.");
            return;
        }

        try {
            const error = await authLogin(email, password);

            if (error) {
                console.error("[LOGIN BTN] LOGIN ERROR:", error);
                alert(error);
                return;
            }

            console.log("[LOGIN BTN] LOGIN SUCCESS!");

            location.reload();
        } catch (err) {
            console.error("[LOGIN BTN] Exception:", err);
        }
    });
} else {
    console.warn("[INIT] loginBtn NOT FOUND!");
}


// Делаю глобальными, чтобы другие части могли вызывать
window.openDayDetails = openDayDetails;
window.openWorkModal = openWorkModal;
window.openTaskModal = openTaskModal;
window.openExportModal = openExportModal;


// =========================================================
// ГЛОБАЛЬНЫЕ СОБЫТИЯ task-updated / work-updated
// =========================================================

function handleDataUpdated(e) {
    const dateISO = e.detail;
    if (!dateISO) return;

    const [y, m] = dateISO.split("-");
    const year = Number(y);
    const month = Number(m) - 1; // JS-месяц 0–11

    if (Number.isNaN(year) || Number.isNaN(month)) return;

    // 1) Перерисовать календарь на нужный месяц
    renderCalendar(year, month);

    // 2) Если модалка дня открыта – обновить её содержимое
    const dayModal = document.getElementById("dayModal");
    if (dayModal && dayModal.open) {
        openDayDetails(dateISO);
    }
}

// слушатели на глобальные события
window.addEventListener("task-updated", handleDataUpdated);
window.addEventListener("work-updated", handleDataUpdated);


// =========================================================
// START APP
// =========================================================

window.onload = async () => {

    console.log("== APP START ==");

    const splash = document.getElementById("splashScreen");
    const authScreen = document.getElementById("authScreen");
    const calendarScreen = document.getElementById("calendarScreen");

    // ТЕМА
    initTheme();

    // Проверяем сессию
    const session = await getSessionUser();

    if (!session) {
        splash.style.display = "none";
        authScreen.classList.remove("hidden");
        return;
    }

    // пользователь есть → показываем календарь
    authScreen.classList.add("hidden");
    calendarScreen.classList.remove("hidden");
    splash.style.display = "none";

    console.log("[app] User logged email:", session.email);
    console.log("[app] User logged id:", session.id);
    console.log("[app] User logged role:", session.role);

    // ИНИЦИАЛИЗАЦИЯ UI
    initReports();
    initCalendar();
};
