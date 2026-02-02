// =========================================================
// app.js — главный контроллер приложения
// =========================================================

// ===== UI =====
import { initCalendar, renderCalendar } from "./ui/calendar.js";
import { initTheme } from "./ui/theme.js";

import { openWorkModal, openTaskModal } from "./ui/modals-add.js";
import { openDayDetails } from "./ui/modal-day.js";

import { initReports } from "./ui/reports.js";
import { openExportModal } from "./ui/export.js";
import { initPinScreen } from "./ui/pin-screen.js";
import { exportBackup, importBackup } from "./ui/backup.js";

// =========================================================
// GLOBAL MODALS (нужны другим модулям)
// =========================================================
window.openDayDetails = openDayDetails;
window.openWorkModal = openWorkModal;
window.openTaskModal = openTaskModal;
window.openExportModal = openExportModal;

// =========================================================
// ОБНОВЛЕНИЕ КАЛЕНДАРЯ ПО СОБЫТИЯМ
// =========================================================
function handleDataUpdated(e) {
  const dateISO = e.detail;
  if (!dateISO) return;

  const [y, m] = dateISO.split("-");
  const year = Number(y);
  const month = Number(m) - 1;

  if (Number.isNaN(year) || Number.isNaN(month)) return;

  renderCalendar(year, month);

  const dayModal = document.getElementById("dayModal");
  if (dayModal && dayModal.open) {
    openDayDetails(dateISO);
  }
}

window.addEventListener("task-updated", handleDataUpdated);
window.addEventListener("work-updated", handleDataUpdated);

// =========================================================
// START APP
// =========================================================
window.onload = async () => {
  console.log("[APP] start");

  document.getElementById("splashScreen")?.classList.add("hidden");
  document.getElementById("calendarScreen")?.classList.add("hidden");

  initTheme();

  // 👇 сначала PIN
  await initPinScreen();
};

// =========================================================
// ЗАПУСК КАЛЕНДАРЯ ПОСЛЕ PIN
// =========================================================
export function startCalendarApp() {
  console.log("[APP] startCalendarApp");

  document.getElementById("calendarScreen")?.classList.remove("hidden");

  initCalendar();
  initReports();
}

// КНОПКИ БД
document.getElementById("backupExport").onclick = exportBackup;

document.getElementById("backupImportBtn").onclick = () =>
    document.getElementById("backupImport").click();

document.getElementById("backupImport").onchange = e =>
    importBackup(e.target.files[0]);
