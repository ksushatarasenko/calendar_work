// ========================================================================
//  EXPORT.JS 
//  Eksport do Excel (.xlsx) w zakresie dat OD → DO
// ========================================================================

import { getWorkRange, getTaskRange } from "../core/db.js";

// MODAL
const modal = document.getElementById("exportModal");
const fromInput = document.getElementById("exportFrom");
const toInput = document.getElementById("exportTo");
const confirmBtn = document.getElementById("exportConfirmBtn");

// BUTTON w nagłówku
const openBtn = document.getElementById("exportBtn");

// ========================================================================
//  INIT
// ========================================================================

export function openExportModal() {
    console.log("[export] otwieram modal eksportu");

    fromInput.value = "";
    toInput.value = "";

    modal.showModal();
}

openBtn.onclick = openExportModal;

// ========================================================================
//  GENEROWANIE EXCELA
// ========================================================================

confirmBtn.onclick = async () => {

    const from = fromInput.value;
    const to = toInput.value;

    if (!from || !to) {
        alert("Wybierz zakres dat");
        return;
    }

    console.log("[export] generuję Excel dla zakresu:", from, to);

    // Pobieramy dane
    const work = await getWorkRange(from, to);
    const tasks = await getTaskRange(from, to);

    console.log("[export] zmiany:", work.length);
    console.log("[export] zadania:", tasks.length);

    // Budujemy workbook
    const wb = XLSX.utils.book_new();

    // =============================
    //  ARKUSZ 1 — ZMIANY
    // =============================
    const workSheetData = [
        ["Data", "Od", "Do", "Godziny", "Miejsce", "Osoba"]
    ];

    work.forEach(w => {
        workSheetData.push([
            w.date,
            w.start_time.slice(0, 5),
            w.end_time.slice(0, 5),
            w.total_hours,
            w.place,
            w.partner
        ]);
    });

    const wsWork = XLSX.utils.aoa_to_sheet(workSheetData);
    XLSX.utils.book_append_sheet(wb, wsWork, "Zmiany");

    // =============================
    //  ARKUSZ 2 — ZADANIA
    // =============================
    const taskSheetData = [
        ["Data", "Godzina", "Nazwa", "Opis", "Wykonane"]
    ];

    tasks.forEach(t => {
        taskSheetData.push([
            t.date,
            t.time.slice(0, 5),
            t.title,
            t.description,
            t.completed ? "TAK" : "NIE"
        ]);
    });

    const wsTask = XLSX.utils.aoa_to_sheet(taskSheetData);
    XLSX.utils.book_append_sheet(wb, wsTask, "Zadania");

    // =============================
    //  ZAPIS PLIKU
    // =============================

    const fileName = `WorkCalendar_${from}_to_${to}.xlsx`;

    XLSX.writeFile(wb, fileName);

    modal.close();

    console.log("[export] gotowe! Zapisano:", fileName);
};
