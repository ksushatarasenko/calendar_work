// ======================================================================
//  CALENDAR MODULE — OLD BEAUTIFUL UI RESTORED
// ======================================================================

import { getTaskRange, getWorkRange } from "../core/db.js";
import { getMonthData } from "../core/db.js";

// DOM
const calendarGrid = document.getElementById("calendar");
const weekdayGrid = document.querySelector(".weekday-grid");
const titleEl = document.getElementById("monthTitle");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

// PL month names
const monthsPL = [
    "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
    "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"
];

// Weekdays
const weekdaysPL = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

// State
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// ======================================================================
// INIT
// ======================================================================

export function initCalendar() {
    renderWeekdays();
    renderCalendar(currentYear, currentMonth);

    prevBtn.onclick = () => changeMonth(-1);
    nextBtn.onclick = () => changeMonth(+1);
}

// ======================================================================
// CHANGE MONTH
// ======================================================================

function changeMonth(delta) {
    currentMonth += delta;

    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }

    renderCalendar(currentYear, currentMonth);
}

// ======================================================================
// RENDER WEEKDAYS
// ======================================================================

function renderWeekdays() {
    weekdayGrid.innerHTML = "";
    weekdaysPL.forEach(w => {
        const div = document.createElement("div");
        div.textContent = w;
        weekdayGrid.appendChild(div);
    });
}

// ======================================================================
// MAIN RENDER - отрисовка календаря на главном экране
// ======================================================================

export async function renderCalendar(year, month) {
    calendarGrid.innerHTML = "";

    titleEl.textContent =
        `${monthsPL[month]} ${year}`.charAt(0).toUpperCase() +
        `${monthsPL[month]} ${year}`.slice(1);

    // --- FIRST DAY OFFSET ---
    const firstDay = new Date(year, month, 1).getDay();
    const offset = (firstDay === 0 ? 6 : firstDay - 1); // pon=0

    // --- DAYS IN MONTH ---
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // --- Load tasks & works for whole month ---
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const to = `${year}-${String(month + 1).padStart(2, "0")}-${daysInMonth}`;

    const tasks = await getTaskRange(from, to);
    const works = await getWorkRange(from, to);

    // convert to dictionary
    const taskMap = {};
    tasks.forEach(t => {
        if (!taskMap[t.date]) taskMap[t.date] = [];
        taskMap[t.date].push(t);
    });

    const workMap = {};
    works.forEach(w => {
        if (!workMap[w.date]) workMap[w.date] = [];
        workMap[w.date].push(w);
    });

    // --- CREATE 42 CELLS ---
    const totalCells = 42;
    const todayISO = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement("div");
        cell.classList.add("calendar-day");
        

        // outside month
        if (i < offset || i >= offset + daysInMonth) {
            cell.classList.add("empty");
            calendarGrid.appendChild(cell);
            continue;
        }

        const dayNumber = i - offset + 1;
        const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;

        // CHECK TODAY
const today = new Date();
const isToday =
    dayNumber === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

if (isToday) {
    cell.classList.add("today");
}

        // NUMBER
        const num = document.createElement("div");
        num.classList.add("day-number");
        num.textContent = dayNumber;
        cell.appendChild(num);
        


        // SHIFT META — СНАЧАЛА СМЕНА
        if (workMap[dateISO]) {
            // создаём контейнер для текста смены
            const meta = document.createElement("div");
            meta.classList.add("day-meta");

            const w = workMap[dateISO][0];
            // сначала пробуем взять из БД, если там null/пусто — считаем на клиенте
            const totalHours = (w.total_hours != null && w.total_hours !== "")
                ? Number(w.total_hours)
                : calcHours(w.start_time, w.end_time);

            meta.innerHTML = `
        <div class="shift-time">⏱ ${totalHours}h</div>
        <div class="shift-place">📍 ${w.place}</div>
    `;

            cell.appendChild(meta);
        }

        // TASK INDICATOR
        if (taskMap[dateISO]) {
            const indicator = document.createElement("div");
            indicator.classList.add("task-indicator");

            const hasUndone = taskMap[dateISO].some(t => !t.completed);

            if (hasUndone) indicator.classList.add("green");
            else indicator.classList.add("grey");

            cell.appendChild(indicator);
        }
        // SHIFT META
        //     if (workMap[dateISO]) {
        //         const meta = document.createElement("div");
        //         meta.classList.add("day-meta");

        //         const w = workMap[dateISO][0];
        //         const totalHours = calcHours(w.start_time, w.end_time);

        //         meta.innerHTML = `
        //     <div class="shift-time">⏱ ${totalHours}h</div>
        //     <div class="shift-place">📍 ${w.place}</div>
        // `;

        //         cell.appendChild(meta);
        //     }


        // CLICK → open modal
        cell.onclick = () => openDayDetails(dateISO);

        calendarGrid.appendChild(cell);
    }
    //
    // PODSUMOWANIE MIESIĄCA
    //


    const summaryBox = document.getElementById("monthSummary");

    if (summaryBox) {
        const data = await getMonthData(year, month);
        let total = 0;

        Object.values(data.works).forEach(arr => {
            arr.forEach(w => {
                total += w.total_hours || 0;
            });
        });

        summaryBox.textContent = `Razem godzin: ${total.toFixed(2)}`;
    }


}


// ======================================================================
// HELPER – hours - подсчет часов (end - start = часы)
// ======================================================================

function calcHours(start, end) {
    if (!start || !end) return "?";

    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;

    // после полуночи
    if (endMin < startMin) endMin += 24 * 60;

    const diff = (endMin - startMin) / 60;

    return diff.toFixed(1).replace(".0", "");
}


// ======================================================================
// OPEN MODAL (DAY)
// ======================================================================

function openDayModal(dateISO) {
    // modal-day.js handles everything
    document.getElementById("dayModal").showModal();
    window.renderDayModal(dateISO);
}
