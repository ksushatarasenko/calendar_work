/* =========================================================
   MODALS-ADD.JS — улучшенные модалки задач и смен
   ========================================================= */

import {
    insertTask,
    updateTask,
    insertWork,
    updateWork,
    getWorkByDate,
    calcTotalHours
} from "../core/db.js";


// ----------------------------
// DOM элементы
// ----------------------------

// TASK MODAL
const taskModal = document.getElementById("taskModal");
const taskDate = document.getElementById("taskDate");
const taskTime = document.getElementById("taskTime");
const taskTitle = document.getElementById("taskTitle");
const taskDesc = document.getElementById("taskDesc");
const taskDone = document.getElementById("taskDone");
const saveTaskBtn = document.getElementById("saveTaskBtn");
console.log("zadacza:", taskModal);

// WORK MODAL
const workModal = document.getElementById("workModal");
const workDate = document.getElementById("workDate");
const workStart = document.getElementById("workStart");
const workEnd = document.getElementById("workEnd");
const workPlace = document.getElementById("workPlace");
const workPartner = document.getElementById("workPartner");
const saveWorkBtn = document.getElementById("saveWorkBtn");

// =============================================
// HELPER: маска времени
// =============================================
function applyTimeMask(input) {
    if (!input) return;

    input.addEventListener("input", () => {
        let v = input.value.replace(/\D/g, "");

        if (v.length >= 3) {
            input.value = v.slice(0, 2) + ":" + v.slice(2, 4);
        } else {
            input.value = v;
        }
    });
}

// Применяем маску
applyTimeMask(taskTime);
applyTimeMask(workStart);
applyTimeMask(workEnd);

// =============================================
// HELPER: проверка корректного времени
// =============================================
function isValidTime(value) {
    if (!value || value.length !== 5) return false;
    const [h, m] = value.split(":").map(Number);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function markError(input, message) {
    if (!input) return;
    input.style.border = "2px solid #ff4d4d";
    input.setCustomValidity(message);
}

function clearError(input) {
    if (!input) return;
    input.style.border = "";
    input.setCustomValidity("");
}

// =============================================
// Открыть TASK MODAL (создание / редактирование)
// =============================================
export async function openTaskModal(task = null, dateFromCalendar = null) {

    taskModal.showModal();

    if (task) {
        // Режим редактирования
        taskDate.value = task.date;
        taskTime.value = task.time || "";
        taskTitle.value = task.title || "";
        taskDesc.value = task.description || "";
        taskDone.checked = !!task.completed;

        clearError(taskTime);
        clearError(taskTitle);

        saveTaskBtn.onclick = async () => {
            if (!isValidTime(taskTime.value)) {
                markError(taskTime, "Zły format czasu");
                return;
            }
            clearError(taskTime);

            if (!taskTitle.value.trim()) {
                markError(taskTitle, "Wpisz tytuł");
                return;
            }
            clearError(taskTitle);

            const payload = {
                date: taskDate.value,
                time: taskTime.value,
                title: taskTitle.value,
                description: taskDesc.value,
                completed: taskDone.checked
            };

            const { error } = await updateTask(task.id, payload);

            if (error) {
                console.error("[TASK] updateTask ERROR:", error);
                alert("Błąd przy zapisie zadania");
                return;
            }

            taskModal.close();

            // Глобальное событие → обновить календарь и модалку дня
            window.dispatchEvent(
                new CustomEvent("task-updated", { detail: taskDate.value })
            );
        };

    } else {
        // Новый task
        taskDate.value = dateFromCalendar || "";
        taskTime.value = "";
        taskTitle.value = "";
        taskDesc.value = "";
        taskDone.checked = false;

        clearError(taskTime);
        clearError(taskTitle);

        saveTaskBtn.onclick = async () => {

            if (!isValidTime(taskTime.value)) {
                markError(taskTime, "Zły format czasu");
                return;
            }
            clearError(taskTime);

            if (!taskTitle.value.trim()) {
                markError(taskTitle, "Wpisz tytuł");
                return;
            }
            clearError(taskTitle);

            const payload = {
                date: taskDate.value,
                time: taskTime.value,
                title: taskTitle.value,
                description: taskDesc.value,
                completed: taskDone.checked
            };

            const { error } = await insertTask(payload);

            if (error) {
                console.error("[TASK] insertTask ERROR:", error);
                alert("Błąd przy zapisie zadania");
                return;
            }

            taskModal.close();

            window.dispatchEvent(
                new CustomEvent("task-updated", { detail: taskDate.value })
            );
        };
    }
}

// =============================================
// Открыть WORK MODAL (создание / редактирование)
// =============================================
export async function openWorkModal(dateISO, existingWork = null) {

    const dateForForm =
        dateISO || new Date().toISOString().slice(0, 10);

    workModal.showModal();
    workDate.value = dateForForm;

    clearError(workStart);
    clearError(workEnd);

    if (existingWork) {
        console.log("[WORK MODAL] EDIT MODE");

        saveWorkBtn.disabled = false;
        saveWorkBtn.textContent = "Zapisz";

        workStart.value = existingWork.start_time
            ? existingWork.start_time.slice(0, 5)
            : "";
        workEnd.value = existingWork.end_time
            ? existingWork.end_time.slice(0, 5)
            : "";
        workPlace.value = existingWork.place || "";
        workPartner.value = existingWork.partner || "";

        saveWorkBtn.onclick = async () => {
            console.log("[WORK MODAL] EDIT → CLICK");

            if (!isValidTime(workStart.value)) {
                markError(workStart, "Zły format");
                return;
            }
            if (!isValidTime(workEnd.value)) {
                markError(workEnd, "Zły format");
                return;
            }

            clearError(workStart);
            clearError(workEnd);

            const total = calcTotalHours(workStart.value, workEnd.value);

            const payload = {
                date: workDate.value,
                start_time: workStart.value,
                end_time: workEnd.value,
                place: workPlace.value.trim(),
                partner: workPartner.value.trim(),
                total_hours: total
            };

            const { error } = await updateWork(existingWork.id, payload);

            if (error) {
                console.error("[WORK] updateWork ERROR:", error);
                alert("Błąd przy zapisie zmiany");
                return;
            }

            workModal.close();

            window.dispatchEvent(
                new CustomEvent("work-updated", { detail: workDate.value })
            );
        };

    } else {
        console.log("[WORK MODAL] ADD MODE");

        const existing = await getWorkByDate(dateForForm);
        console.log("[WORK MODAL] existing shift on this day →", existing);

        if (existing && existing.length > 0) {
            // смена уже есть
            saveWorkBtn.disabled = true;
            saveWorkBtn.textContent = "Zmiana już istnieje!";
            return;
        }

        saveWorkBtn.disabled = false;
        saveWorkBtn.textContent = "Zapisz";

        workStart.value = "";
        workEnd.value = "";
        workPlace.value = "";
        workPartner.value = "";

        saveWorkBtn.onclick = async () => {
            console.log("[WORK MODAL] ADD → CLICK");

            if (!isValidTime(workStart.value)) {
                markError(workStart, "Zły format");
                return;
            }
            if (!isValidTime(workEnd.value)) {
                markError(workEnd, "Zły формат");
                return;
            }

            clearError(workStart);
            clearError(workEnd);

            const total = calcTotalHours(workStart.value, workEnd.value);

            const payload = {
                date: workDate.value,
                start_time: workStart.value,
                end_time: workEnd.value,
                place: workPlace.value.trim(),
                partner: workPartner.value.trim(),
                total_hours: total
            };

            const { error } = await insertWork(payload);

            if (error) {
                console.error("[WORK] insertWork ERROR:", error);
                alert("Błąd przy zapisie zmiany");
                return;
            }

            workModal.close();

            window.dispatchEvent(
                new CustomEvent("work-updated", { detail: workDate.value })
            );
        };
    }
}
