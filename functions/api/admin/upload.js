// POST /api/admin/upload
// multipart/form-data: title, medium, year, blurb, file
// Requires a valid admin_session cookie. Stores the image in R2
// (binding: ARTWORKS) and the metadata in KV (binding: WORKS).

import { isAuthed } from '../../_lib/auth.js';

const ALLOWED_MEDIUMS = ['painting', 'sculpture', 'photo', 'film'];
const EXT_BY_TYPE = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
};

export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        if (!(await isAuthed(request, env))) {
            return json({ message: 'Not authorized.' }, 401);
        }
        if (!env.ARTWORKS || !env.WORKS) {
            return json({ message: 'Storage not configured.' }, 500);
        }

        const form = await request.formData();
        const title = (form.get('title') || '').toString().trim();
        const medium = (form.get('medium') || '').toString().trim();
        const year = (form.get('year') || '').toString().trim();
        const blurb = (form.get('blurb') || '').toString().trim();
        const file = form.get('file');

        if (!title || !ALLOWED_MEDIUMS.includes(medium) || !file || typeof file === 'string') {
            return json({ message: 'Missing or invalid fields.' }, 400);
        }

        const ext = EXT_BY_TYPE[file.type] || 'jpg';
        const id = crypto.randomUUID();
        const key = `${id}.${ext}`;

        await env.ARTWORKS.put(key, file.stream(), {
            httpMetadata: { contentType: file.type || 'image/jpeg' }
        });

        const metadata = {
            id,
            title,
            medium,
            year: year ? Number(year) : null,
            blurb,
            key,
            createdAt: new Date().toISOString()
        };

        await env.WORKS.put(`work_${id}`, JSON.stringify(metadata));

        const indexRaw = await env.WORKS.get('index');
        const ids = indexRaw ? JSON.parse(indexRaw) : [];
        ids.push(id);
        await env.WORKS.put('index', JSON.stringify(ids));

        return json(metadata, 201);
    } catch (err) {
        return json({ message: 'Upload failed.' }, 500);
    }
}

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
