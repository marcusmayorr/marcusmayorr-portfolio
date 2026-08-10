// GET /api/works?medium=painting
// Public endpoint. Reads the work index + each work's metadata from KV
// (binding name: WORKS), newest first.

export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const mediumFilter = url.searchParams.get('medium');

        if (!env.WORKS) {
            return json({ works: [] });
        }

        const indexRaw = await env.WORKS.get('index');
        const ids = indexRaw ? JSON.parse(indexRaw) : [];

        const works = [];
        for (const id of ids) {
            const raw = await env.WORKS.get(`work_${id}`);
            if (!raw) continue;
            const w = JSON.parse(raw);
            if (mediumFilter && w.medium !== mediumFilter) continue;
            works.push(w);
        }

        works.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        return json({ works });
    } catch (err) {
        return json({ works: [], error: 'Could not load works.' }, 500);
    }
}

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
