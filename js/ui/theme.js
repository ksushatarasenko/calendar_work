// ========================================================================
//  THEME.JS
//  Motyw jasny / ciemny + zapis w localStorage.
// ========================================================================

const toggleBtn = document.getElementById("darkToggle");
const themeIcon = document.getElementById("themeIcon");

// ========================================================================
//  INIT THEME
// ========================================================================

export function initTheme() {
    console.log("[theme] Inicjalizacja motywu…");

    const saved = localStorage.getItem("theme");

    // JEŚLI BRAK — DOMYŚLNIE JASNY
    if (!saved) {
        document.body.classList.remove("dark");
        themeIcon.src = "icons/moon.svg"; // pokaż księżyc → przełącz na dark
        return;
    }

    // ODTWARZANIE
    if (saved === "dark") {
        document.body.classList.add("dark");
        themeIcon.src = "icons/sun.svg";
    } else {
        document.body.classList.remove("dark");
        themeIcon.src = "icons/moon.svg";
    }
}

// ========================================================================
//  TOGGLE THEME
// ========================================================================

toggleBtn.onclick = () => {
    const isDark = document.body.classList.toggle("dark");

    console.log("[theme] przełączam:", isDark ? "dark" : "light");

    if (isDark) {
        localStorage.setItem("theme", "dark");
        themeIcon.src = "icons/sun.svg";
    } else {
        localStorage.setItem("theme", "light");
        themeIcon.src = "icons/moon.svg";
    }
};
