// apps/admin/api/client.ts
//
// Phase 9-ready client with:
//   ✓ VITE_API_BASE_URL support
//   ✓ Admin token injection
//   ✓ Clean error wrapper
//   ✓ Centralized fetch logic
//

// ------------------------------
// CONFIG
// ------------------------------
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://www.cactusmakesperfect.org/api/v1";

// ------------------------------
// Generic Fetch Wrapper
// ------------------------------
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("admin_token");

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Helpful dev/debug logging
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    console.error("❌ API Error", {
      path,
      status: res.status,
      body: msg,
    });
    throw new Error(`API error: ${res.status}`);
  }

  // Avoid JSON errors on empty responses
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// ------------------------------
// ADMIN AUTH
// ------------------------------
export async function adminLogin(password: string) {
  return apiFetch("/api/v1/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function verifyAdminToken(token: string) {
  try {
    const res = await fetch(`${API_BASE}/admin/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ------------------------------
// GUESTS VIEW (admin_guests_view)
// ------------------------------
export async function fetchAdminGuests() {
  return apiFetch("/admin/guests", { method: "GET" });
}

export async function fetchGuestActivity(guestId: string) {
  return apiFetch(`/admin/guest/${guestId}/activity`, {
    method: "GET",
  });
}

export async function sendAdminNudge(
  guestIds: string[],
  subject: string,
  html: string,
  text: string
) {
  return apiFetch("/admin/guests/nudge", {
    method: "POST",
    body: JSON.stringify({ guest_ids: guestIds, subject, html, text }),
  });
}

// ------------------------------
// GROUP / HOUSEHOLD MGMT
// ------------------------------
export async function updateGuestGroup(
  guestId: string,
  groupLabel: string | null
) {
  return apiFetch(`/admin/guest/${guestId}/group`, {
    method: "PATCH",
    body: JSON.stringify({ group_label: groupLabel }),
  });
}

export async function bulkUpdateGroup(
  groupLabel: string,
  guestIds: string[]
) {
  return apiFetch("/admin/group/bulk", {
    method: "PATCH",
    body: JSON.stringify({ group_label: groupLabel, guest_ids: guestIds }),
  });
}

export async function fetchGroups() {
  return apiFetch("/admin/groups", {
    method: "GET",
  });
}

export async function sendGroupNudge(
  groupLabel: string,
  subject: string,
  html: string,
  text: string
) {
  return apiFetch(`/admin/groups/${groupLabel}/nudge`, {
    method: "POST",
    body: JSON.stringify({ subject, html, text }),
  });
}