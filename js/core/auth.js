import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
    "https://fnocjjlsqijawypgxalm.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZub2NqamxzcWlqYXd5cGd4YWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzI3MDIsImV4cCI6MjA3OTgwODcwMn0._-aEFX0qAumIVdmkXhZhNUiDGQhSq0HRxTo73TJKyP0"
);

console.log("=== SUPABASE CLIENT CREATED ===", supabase);


// ========================================================================
// SESSION
// ========================================================================
export async function getSessionUser() {
    console.log("[SESSION] Checking session...");

    const { data, error } = await supabase.auth.getSession();

    console.log("[SESSION] Response:", data, error);

    if (error || !data.session) {
        console.warn("[SESSION] No active session");
        return null;
    }

    console.log("[SESSION] Active user:", data.session.user);
    return data.session.user;
}


// ========================================================================
// LOGIN
// ========================================================================
export async function authLogin(email, password) {
    console.log(`=== LOGIN START ===`);
    console.log(`[LOGIN] Email: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    console.log("[LOGIN] Response:", data, error);

    if (error) {
        console.error("[LOGIN] ERROR:", error);
        return error.message;
    }

    console.log("[LOGIN] SUCCESS! User:", data.user);

    await loadOrCreateProfile(data.user.id, data.user.email);

    console.log("=== LOGIN END ===");

    return null;
}


// ========================================================================
// REGISTER
// ========================================================================
export async function authRegister(email, password) {
    console.log("=== REGISTER START ===");
    console.log("[REGISTER] Email:", email);

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    console.log("[REGISTER] Response:", data, error);

    if (error) {
        console.error("[REGISTER] ERROR:", error);
        return error.message;
    }

    console.log("[REGISTER] SUCCESS! User:", data.user);

    await loadOrCreateProfile(data.user.id, email);

    console.log("=== REGISTER END ===");

    return null;
}


// ========================================================================
// LOGOUT
// ========================================================================
export async function authLogout() {
    console.log("=== LOGOUT FUNCTION CALLED ===");

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("❌ LOGOUT ERROR:", error);
    } else {
        console.log("✅ LOGOUT SUCCESS!");
    }
}

// ========================================================================
// PROFILE HANDLING
// ========================================================================
export async function loadOrCreateProfile(user_id, email) {
    console.log("=== PROFILE START ===");
    console.log("[PROFILE] user_id:", user_id, " email:", email);

    // 1) Try to load
    console.log("[PROFILE] Trying to SELECT existing profile...");

    const { data: profile, error: selectError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user_id)
        .single();

    console.log("[PROFILE] SELECT response:", profile, selectError);

    if (profile) {
        console.log("[PROFILE] Profile exists:", profile);
        return profile;
    }

    if (selectError && selectError.code !== "PGRST116") { // not "no rows"
        console.error("[PROFILE] SELECT error:", selectError);
    }

    console.warn("[PROFILE] NO PROFILE FOUND — attempting INSERT");

    // 2) Try to create profile
    const insertData = {
        id: user_id,
        email: email,
        full_name: "",
        avatar_url: ""
    };

    console.log("[PROFILE] INSERT data:", insertData);

    const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert([insertData])
        .select();

    console.log("[PROFILE] INSERT response:", inserted, insertError);

    if (insertError) {
        console.error("❌ [PROFILE] INSERT FAILED!", insertError);

        // If RLS blocked:
        if (insertError.code === "42501") {
            console.error("🚨 RLS ERROR: INSERT blocked by policy!");
        }

        return null;
    }

    console.log("[PROFILE] Profile CREATED successfully:", inserted);

    console.log("=== PROFILE END ===");

    return inserted ? inserted[0] : null;
}
