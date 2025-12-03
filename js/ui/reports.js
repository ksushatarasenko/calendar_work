/* =========================================================
   REPORTS.JS — модуль отчётов
   ========================================================= */

import { getMonthData } from "../core/db.js";

/* -----------------------------
   DOM элементы
----------------------------- */
const reportModal = document.getElementById("reportModal");
const reportsContent = document.getElementById("reportsContent");

const reportWorkBtn = document.getElementById("reportWorkBtn");
const reportTaskBtn = document.getElementById("reportTaskBtn");
const reportsBtn = document.getElementById("reportsBtn");

/* =========================================================
   Получить текущий год и месяц из заголовка
========================================================= */
function getCurrentYearMonth() {
    const title = document.getElementById("monthTitle").textContent.trim();
    const [monthName, year] = title.split(" ");

    const monthsPL = {
        "Styczeń": 0, "Luty": 1, "Marzec": 2, "Kwiecień": 3,
        "Maj": 4, "Czerwiec": 5, "Lipiec": 6, "Sierpień": 7,
        "Wrzesień": 8, "Październik": 9, "Listopad": 10, "Grudzień": 11
    };

    return { month: monthsPL[monthName], year: Number(year) };
}

/* =========================================================
   РЕНДЕР 1: Raport zmian
========================================================= */
function renderWorkReport(data) {
    const works = data.works;
    let totalHours = 0;
    let places = {};

    Object.values(works).forEach(arr => {
        arr.forEach(w => {
            totalHours += w.total_hours || 0;

            const p = (w.place || "Brak").split(" ")[0];
            if (!places[p]) places[p] = 0;
            places[p]++;
        });
    });

    const totalDays = Object.keys(works).length;

    reportsContent.innerHTML = `
        <div class="report-block">
            <div class="report-title">Podsumowanie zmian</div>
            <div class="report-row"><span>Liczba zmian:</span><span class="report-number">${totalDays}</span></div>
            <div class="report-row"><span>Suma godzin:</span><span class="report-number">${totalHours}h</span></div>
            <div class="report-row"><span>Średnio dziennie:</span><span class="report-number">${(totalHours / totalDays || 0).toFixed(1)}h</span></div>
        </div>

        <div class="report-block">
            <div class="report-title">Miejsca pracy (TOP)</div>
            ${Object.entries(places)
            .map(([p, n]) => `
                    <div class="report-row">
                        <span>${p}</span><span>${n}</span>
                    </div>
                `).join("")
        }
        </div>
    `;
}

/* =========================================================
   РЕНДЕР 2: Raport zadań
========================================================= */
function renderTaskReport(data) {
    const tasks = data.tasks;

    let total = 0, done = 0, undone = 0;

    Object.values(tasks).forEach(arr => {
        arr.forEach(t => {
            total++;
            t.completed ? done++ : undone++;
        });
    });

    reportsContent.innerHTML = `
        <div class="report-block">
            <div class="report-title">Podsumowanie zadań</div>
            <div class="report-row"><span>Wszystkie zadania:</span><span class="report-number">${total}</span></div>
            <div class="report-row"><span>Wykonane:</span><span class="report-number">${done}</span></div>
            <div class="report-row"><span>Niewykonane:</span><span class="report-number">${undone}</span></div>
        </div>
    `;
}

/* =========================================================
   ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
========================================================= */
export function initReports() {
    // Кнопка открыть модалку "Raporty"
    reportsBtn.onclick = () => reportModal.showModal();

    // Кнопка "Raport zmian"
    reportWorkBtn.onclick = () => {
    const { year, month } = getCurrentYearMonth();

    const lastDay = new Date(year, month + 1, 0).getDate();

    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const to   = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2,"0")}`;

    window.open(`reports/work.html?from=${from}&to=${to}`, "_blank");
};


    // Кнопка "Raport zadań"
    reportTaskBtn.onclick = () => {
    const { year, month } = getCurrentYearMonth();

    const lastDay = new Date(year, month + 1, 0).getDate();

    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const to   = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2,"0")}`;

    window.open(`reports/tasks.html?from=${from}&to=${to}`, "_blank");
};


}
