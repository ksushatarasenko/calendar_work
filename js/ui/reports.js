/* =========================================================
   REPORTS.JS — модуль отчётов
========================================================= */

import { getMonthData } from "../core/db.js";
import { currentYear, currentMonth } from "./calendar.js";

/* -----------------------------
   DOM элементы
----------------------------- */
const reportModal = document.getElementById("reportModal");
const reportsBtn = document.getElementById("reportsBtn");

const reportWorkBtn = document.getElementById("reportWorkBtn");
const reportTaskBtn = document.getElementById("reportTaskBtn");

/* =========================================================
   Получить текущий год и месяц из заголовка календаря
========================================================= */
function getCurrentYearMonth() {
    console.log("[REPORT] Читаем месяц из заголовка...");

    const title = document.getElementById("monthTitle")?.textContent.trim();
    console.log("[REPORT] Заголовок календаря:", title);

    if (!title) {
        console.error("❌ monthTitle пустой!");
        return { year: null, month: null };
    }

    const [monthName, year] = title.split(" ");
    console.log("[REPORT] Заголовок календаря после сплита:", monthName, year);
    const monthsPL = {
    "Styczeń": 0, "Luty": 1, "Marzec": 2, "Kwiecień": 3,
    "Maj": 4, "Czerwiec": 5, "Lipiec": 6, "Sierpień": 7,
    "Wrzesień": 8, "Październik": 9,  "Listopad": 10,   "Grudzień": 11
};

    const month = monthsPL[monthName];

    console.log("[REPORT] Разобрали месяц:", { year, month });

    return { year: Number(year), month };
}

/* =========================================================
   ИНИЦИАЛИЗАЦИЯ МОДУЛЯ — точка входа
========================================================= */
export function initReports() {
    console.log("=== initReports() запущен ===");

    /* -----------------------------
       Открытие модалки
    ----------------------------- */
    reportsBtn.onclick = () => {
        console.log("[REPORT] Модалка отчётов открыта");
        reportModal.showModal();
    };

    /* -----------------------------
       КНОПКА ОТЧЁТА О СМЕНАХ
    ----------------------------- */
    reportWorkBtn.onclick = () => {
        console.log("---- НАЖАТА кнопка: Raport zmian ----");

        const { year, month } = getCurrentYearMonth();

        // Проверяем правильность данных
        if (year == null || month == null) {
            console.error("❌ Неверный год или месяц! Отчёт не может быть создан");
            return;
        }

        console.log("[REPORT] Полученный месяц:", { year, month });

        const lastDay = new Date(year, month + 1, 0).getDate();
        console.log("[REPORT] Последний день месяца:", lastDay);

        const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const to   = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

        console.log("[REPORT] Диапазон дат:", { from, to });

        const url = `reports/work.html?from=${from}&to=${to}`;
        console.log("[REPORT] URL отчёта:", url);

        window.open(url, "_blank");
    };

    /* -----------------------------
       КНОПКА ОТЧЁТА О ЗАДАЧАХ
    ----------------------------- */
    reportTaskBtn.onclick = () => {
        console.log("---- НАЖАТА кнопка: Raport zadań ----");

        const { year, month } = getCurrentYearMonth();
        if (year == null || month == null) return;

        const lastDay = new Date(year, month + 1, 0).getDate();

        const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const to   = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

        const url = `reports/tasks.html?from=${from}&to=${to}`;
        console.log("[REPORT] URL отчёта задач:", url);

        window.open(url, "_blank");
    };

    console.log("=== initReports(): обработчики установлены ===");
}
