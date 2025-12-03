/* =========================================================
   DB.JS — оптимизированная версия
   =========================================================
   ✔ Единый метод getMonthData()
   ✔ Кэширование месяца
   ✔ Быстрые выборки
   ✔ Меньше запросов = быстрее календарь
   ✔ Безопасно под RLS
   ========================================================= */

import { supabase } from "./auth.js";

let monthCache = {};
// monthCache["2025-05"] = {...data}

/* =========================================================
   HELPER: key для кэша
   ========================================================= */
function getKey(year, month) {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/* =========================================================
   GET MONTH DATA — единый быстрый запрос месяца
   ========================================================= */
export async function getMonthData(year, month) {
    const key = getKey(year, month);

    // Если в кэше — отдаём
    if (monthCache[key]) {
        return monthCache[key];
    }

    const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;

    // находим реальное число дней в месяце
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;



    /* -----------------------------------------------
       TASKS (1 запрос)
       ----------------------------------------------- */
    const { data: tasks, error: errTasks } = await supabase
        .from("tasks")
        .select("*")
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("time", { ascending: true });

    if (errTasks) console.error("TASKS ERROR:", errTasks);

    /* -----------------------------------------------
       WORK ENTRIES (1 запрос)
       ----------------------------------------------- */
    const { data: works, error: errWorks } = await supabase
        .from("work_entries")
        .select("*")
        .gte("date", monthStart)
        .lte("date", monthEnd);

    if (errWorks) console.error("WORK ERROR:", errWorks);

    /* -----------------------------------------------
       Финальная структура данных
       ----------------------------------------------- */
    const groupedTasks = {};
    const groupedWorks = {};

    tasks?.forEach(t => {
        if (!groupedTasks[t.date]) groupedTasks[t.date] = [];
        groupedTasks[t.date].push(t);
    });

    works?.forEach(w => {
        if (!groupedWorks[w.date]) groupedWorks[w.date] = [];
        groupedWorks[w.date].push(w);
    });

    const result = {
        tasks: groupedTasks,
        works: groupedWorks
    };

    // Кэшируем
    monthCache[key] = result;

    return result;
}

/* =========================================================
   GET DAY DATA
   ========================================================= */
export async function getDayData(dateISO) {
    const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("date", dateISO)
        .order("time", { ascending: true });

    const { data: works } = await supabase
        .from("work_entries")
        .select("*")
        .eq("date", dateISO);

    return { tasks, works };
}

/* =========================================================
   TASKS — CRUD
   ========================================================= */

export async function getTasksByDate(dateISO) {
    const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("date", dateISO)
        .order("time", { ascending: true });

    return data || [];
}

export async function insertTask(obj) {
    // достаём текущего пользователя
    const { data: session } = await supabase.auth.getUser();

    const payload = {
        ...obj,
        user_id: session.user.id   // 🔥 обязательно
    };

    const { data, error } = await supabase.from("tasks").insert([payload]);

    if (!error) {
        invalidateCache(obj.date);
    }

    return { data, error };
}


export async function updateTask(id, obj) {
    const { data, error } = await supabase
        .from("tasks")
        .update(obj)
        .eq("id", id);

    invalidateCache(obj.date);
    return { data, error };
}

export async function deleteTask(id) {
    const { data: deleted } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

    if (deleted && deleted.length > 0) invalidateCache(deleted[0].date);
}


/* =========================================================
   WORK — CRUD
   ========================================================= */



export async function getWorkByDate(dateISO) {
    const { data } = await supabase
        .from("work_entries")
        .select("*")
        .eq("date", dateISO);

    return data || [];
}
// HELPER: расчёт часов смены
export function calcTotalHours(start_time, end_time) {
    if (!start_time || !end_time) return null;

    const [sh, sm] = start_time.split(":").map(Number);
    const [eh, em] = end_time.split(":").map(Number);

    const start = sh + (sm || 0) / 60;
    const end = eh + (em || 0) / 60;

    const diff = end - start;
    if (!isFinite(diff) || diff < 0) return null;   // на всякий случай

    return Number(diff.toFixed(2)); // число, а не строка
}
// helper – посчитать часы для БД
function calcWorkHours(start, end) {
    if (!start || !end) return null;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diff = (eh + em / 60) - (sh + sm / 60);
    return Number(diff.toFixed(2)); // число, типа 9 или 9.5
}
// WORK – INSERT
export async function insertWork(obj) {
    // 1) Берём текущего пользователя
    const { data: session } = await supabase.auth.getUser();
    // === Вычисляем total_hours ===

    const payload = {
        ...obj,
        user_id: session.user.id,// 👈 ОБЯЗАТЕЛЬНО для RLS-политик
        total_hours: calcTotalHours(obj.start_time, obj.end_time),
    };

    // 2) Пишем в ту же таблицу, что и раньше (оставь своё имя таблицы!)
    const { data, error } = await supabase
        .from("work_entries")                 // ← если у тебя тут "works" — оставь то, что было
        .insert([payload]);

    if (!error && obj.date) {
        invalidateCache(obj.date); // если у тебя уже есть такая функция
    }

    return { data, error };
}


export async function updateWork(id, obj) {
    const total_hours = calcWorkHours(obj.start_time, obj.end_time);

    const { data, error } = await supabase
        .from("work_entries")
        .update({
            date: obj.date,
            start_time: obj.start_time,
            end_time: obj.end_time,
            place: obj.place,
            partner: obj.partner,
            total_hours
        })
        .eq("id", id)
        .select();

    if (error) {
        console.error("[DB] updateWork ERROR:", error);
    }

    return { data, error };
}

export async function deleteWork(id) {
    const { data: shift, error: getError } = await supabase
        .from("work_entries")
        .select("date")
        .eq("id", id)
        .single();

    if (getError) {
        console.error("[DB] deleteWork GET ERROR:", getError);
        return { error: getError };
    }

    const { error } = await supabase
        .from("work_entries")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("[DB] deleteWork DELETE ERROR:", error);
        return { error };
    }

    return { date: shift.date };
}


export async function addTask(task) {
    return await supabase.from("tasks").insert(task);
}


/* ============================================================
   RANGE: TASKS
   Получить задачи в диапазоне дат (вкл. обе даты)
   ============================================================ */
export async function getTaskRange(dateFrom, dateTo) {
    const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .gte("date", dateFrom)
        .lte("date", dateTo)
        .order("date", { ascending: true })
        .order("time", { ascending: true });

    if (error) {
        console.error("[DB] getTaskRange ERROR:", error);
        return [];
    }

    return data || [];
}


/* ============================================================
   RANGE: WORK
   Получить все рабочие смены в диапазоне
   ============================================================ */
export async function getWorkRange(dateFrom, dateTo) {
    const { data, error } = await supabase
        .from("work_entries")
        .select("*")
        .gte("date", dateFrom)
        .lte("date", dateTo)
        .order("date", { ascending: true });

    if (error) {
        console.error("getWorkRange ERROR:", error);
        return [];
    }
    return data;
}


/* =========================================================
   КЭШ: инвалидатор
   ========================================================= */
function invalidateCache(dateISO) {
    if (!dateISO) return;
    const [y, m] = dateISO.split("-");
    const key = `${y}-${m}`;
    delete monthCache[key];
}

