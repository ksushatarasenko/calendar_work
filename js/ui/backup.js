// js/backup.js
import { openDB } from "../core/idb.js";

/* =========================
   EXPORT BACKUP (JSON)
========================= */
export async function exportBackup() {
    const db = await openDB();

    const backup = {
        meta: {
            app: "calendar_work",
            version: 1,
            exportedAt: new Date().toISOString()
        },
        data: {}
    };

    const storeNames = Array.from(db.objectStoreNames);

    for (const storeName of storeNames) {
        backup.data[storeName] = [];

        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);

        await new Promise((resolve, reject) => {
            const req = store.openCursor();
            req.onsuccess = e => {
                const cursor = e.target.result;
                if (cursor) {
                    backup.data[storeName].push(cursor.value);
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            req.onerror = () => reject(req.error);
        });
    }

    downloadJSON(backup, `calendar-backup-${Date.now()}.json`);
}


/* =========================
   IMPORT BACKUP (JSON)
========================= */
export async function importBackup(file) {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (!backup?.data) {
        alert("❌ Неверный файл backup");
        return;
    }

    const db = await openDB();

    for (const storeName of Object.keys(backup.data)) {
        if (!db.objectStoreNames.contains(storeName)) continue;

        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        // ❗ очищаем стор перед импортом
        store.clear();

        for (const record of backup.data[storeName]) {
            store.put(record);
        }

        await tx.complete;
    }

    alert("✅ Данные успешно восстановлены");
    location.reload();
}


/* =========================
   HELPERS
========================= */
function downloadJSON(obj, filename) {
    const blob = new Blob(
        [JSON.stringify(obj, null, 2)],
        { type: "application/json" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();

    URL.revokeObjectURL(a.href);
}
