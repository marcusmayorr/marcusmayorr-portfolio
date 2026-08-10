// POST /api/admin/login
// Body: { password }
// On success, stores a session id in KV (binding: WORKS, key prefix
// "session_") and sets it as an HttpOnly cookie. Requires the
// ADMIN_PASSWORD secret to be set on the Pages project.

export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        if (!env.ADMIN_PASSWORD) {
            return json({ message: 'Admin password not configured.' }, 500);
        }

        const body = await request.json();
        const password = body.password || '';

        if (password !== env.ADMIN_PASSWORD) {
            return json({ message: 'Incorrect password.' }, 401);
        }

        const sessionId = crypto.randomUUID();
        const EIGHT_HOURS = 60 * 60 * 8;

        await env.WORKS.put(`session_${sessionId}`, '1', { expirationTtl: EIGHT_HOURS });

        const headers = new Headers({ 'Content-Type': 'application/json' });
        headers.append(
            'Set-Cookie',
            `admin_session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${EIGHT_HOURS}`
        );

        return new Response(JSON.stringify({ message: 'ok' }), { status: 200, headers });
    } catch (err) {
        return json({ message: 'Server error.' }, 500);
    }
}

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
