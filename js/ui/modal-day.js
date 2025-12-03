/* =========================================================
   MODAL-DAY.JS — улучшенная модалка дня
   ========================================================= */

import {
    getTasksByDate,
    getWorkByDate,
    deleteTask,
    deleteWork,
    updateTask
} from "../core/db.js";

import { openTaskModal, openWorkModal } from "./modals-add.js";

const modal = document.getElementById("dayModal");
const titleEl = document.getElementById("dayTitle");

const tasksBox = document.getElementById("dayTasksContainer");

const shiftNone = document.getElementById("shiftNone");
const shiftTime = document.getElementById("shiftTime");
const shiftPlace = document.getElementById("shiftPlace");
const shiftPartner = document.getElementById("shiftPartner");

const dayEditWork = document.getElementById("dayEditWork");
const dayDeleteWork = document.getElementById("dayDeleteWork");

const btnAddTask = document.getElementById("dayAddTask");
const btnAddWork = document.getElementById("dayAddWork"); // может быть null — ок

// ===============================
// FAB OPEN/CLOSE
// ===============================
const fabMenu = document.getElementById("fabMenu");
const fabOptions = document.getElementById("fabOptions");

if (fabMenu && fabOptions) {
    fabMenu.onclick = () => {
        fabOptions.classList.toggle("hidden");
    };

    // ===============================
    // FAB MENU ACTIONS
    // ===============================

    const fabAddWork = document.getElementById("fabAddWork");
    const fabAddTask = document.getElementById("fabAddTask");
    const fabReports = document.getElementById("fabReports");

    if (fabAddWork) {
        fabAddWork.onclick = () => {
            const todayISO = new Date().toISOString().slice(0, 10);
            openWorkModal(todayISO);
            fabOptions.classList.add("hidden");
        };
    }

    if (fabAddTask) {
        fabAddTask.onclick = () => {
            const todayISO = new Date().toISOString().slice(0, 10);
            openTaskModal(null, todayISO);
            fabOptions.classList.add("hidden");
        };
    }

    if (fabReports) {
        fabReports.onclick = () => {
            document.getElementById("reportModal").showModal();
            fabOptions.classList.add("hidden");
        };
    }
}


/* =========================================================
   Открытие модалки
   ========================================================= */
export async function openDayDetails(dateISO) {

    titleEl.textContent = dateISO;

    const tasks = await getTasksByDate(dateISO);
    const works = await getWorkByDate(dateISO);

    renderTasks(tasks, dateISO);
    renderWork(works, dateISO);

    modal.showModal();
}

/* =========================================================
   РЕНДЕР ЗАДАЧ
   ========================================================= */
function renderTasks(list, dateISO) {

    tasksBox.innerHTML = "";

    if (!list || list.length === 0) {
        tasksBox.innerHTML = `<div class="empty">Brak zadań</div>`;
        return;
    }

    list.forEach(task => {

        const row = document.createElement("div");
        row.className = "task-row";

        // Чекбокс
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-done-checkbox";
        checkbox.checked = task.completed === true;
        checkbox.onchange = async () => {
            await updateTask(task.id, {
                completed: checkbox.checked
            });

            // Глобальное событие → обновить календарь и модалку
            window.dispatchEvent(
                new CustomEvent("task-updated", { detail: task.date })
            );
        };

        // Время
        const time = document.createElement("span");
        time.className = "task-time";
        time.textContent = task.time ? task.time.slice(0, 5) : "";

        // Название
        const title = document.createElement("span");
        title.className = "task-title";
        title.textContent = task.title;

        // Кнопка редактирования
        const editBtn = document.createElement("button");
        editBtn.className = "miniBtn edit";
        editBtn.textContent = "✎";
        editBtn.onclick = () => openTaskModal(task);

        // Кнопка удаления
        const delBtn = document.createElement("button");
        delBtn.className = "miniBtn delete";
        delBtn.textContent = "🗑";
        delBtn.onclick = async () => {
            await deleteTask(task.id);

            window.dispatchEvent(
                new CustomEvent("task-updated", { detail: task.date })
            );
        };

        row.appendChild(time);
        row.appendChild(title);
        row.appendChild(editBtn);
        row.appendChild(delBtn);

        // Чекбокс добавляем в строку слева визуально
        row.prepend(checkbox);

        tasksBox.appendChild(row);
    });
}

/* =========================================================
   РЕНДЕР СМЕНЫ
   ========================================================= */
function renderWork(list, dateISO) {

    if (!list || list.length === 0) {
        shiftNone.classList.remove("hidden");
        shiftTime.classList.add("hidden");
        shiftPlace.classList.add("hidden");
        shiftPartner.classList.add("hidden");
        dayEditWork.classList.add("hidden");
        dayDeleteWork.classList.add("hidden");
        return;
    }

    const work = list[0];

    const hours = work.total_hours ? `${work.total_hours}h` : "";
    const place = work.place || "";
    const partner = work.partner || "";

    shiftNone.classList.add("hidden");

    shiftTime.textContent = `⏱ ${hours}`;
    shiftPlace.textContent = `📍 ${place}`;
    shiftPartner.textContent = partner ? `👤 ${partner}` : "";

    shiftTime.classList.remove("hidden");
    shiftPlace.classList.remove("hidden");
    shiftPartner.classList.remove("hidden");

    dayEditWork.classList.remove("hidden");
    dayDeleteWork.classList.remove("hidden");

    dayEditWork.onclick = () => openWorkModal(work.date, work);

    dayDeleteWork.onclick = async () => {
        const res = await deleteWork(work.id);

        if (res && res.error) {
            alert("Ошибка при удалении смены");
            return;
        }

        modal.close();

        const dateToUpdate = res && res.date ? res.date : dateISO;

        window.dispatchEvent(
            new CustomEvent("work-updated", { detail: dateToUpdate })
        );
    };

}

/* =========================================================
   КНОПКИ
   ========================================================= */

if (btnAddTask) {
    btnAddTask.onclick = () => openTaskModal(null, titleEl.textContent);
}

// btnAddWork у тебя в HTML сейчас нет, но оставляю проверку
if (btnAddWork) {
    btnAddWork.onclick = () => openWorkModal(titleEl.textContent);
}
