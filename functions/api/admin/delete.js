// POST /api/admin/delete
// Body: { id }
// Requires a valid admin_session cookie.

import { isAuthed } from '../../_lib/auth.js';

export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        if (!(await isAuthed(request, env))) {
            return json({ message: 'Not authorized.' }, 401);
        }
        if (!env.ARTWORKS || !env.WORKS) {
            return json({ message: 'Storage not configured.' }, 500);
        }

        const body = await request.json();
        const id = (body.id || '').toString();
        if (!id) return json({ message: 'Missing id.' }, 400);

        const raw = await env.WORKS.get(`work_${id}`);
        if (!raw) return json({ message: 'Not found.' }, 404);
        const work = JSON.parse(raw);

        await env.ARTWORKS.delete(work.key);
        await env.WORKS.delete(`work_${id}`);

        const indexRaw = await env.WORKS.get('index');
        const ids = indexRaw ? JSON.parse(indexRaw) : [];
        await env.WORKS.put('index', JSON.stringify(ids.filter((x) => x !== id)));

        return json({ message: 'ok' });
    } catch (err) {
        return json({ message: 'Delete failed.' }, 500);
    }
}

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
