// Shared helper: confirms the request carries a valid admin session
// cookie (set by /api/admin/login). Returns true/false.

export async function isAuthed(request, env) {
    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
    if (!match) return false;

    const sessionId = match[1];
    if (!env.WORKS) return false;

    const valid = await env.WORKS.get(`session_${sessionId}`);
    return valid === '1';
}
