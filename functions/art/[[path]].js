// GET /art/<key>
// Streams the image straight from R2 (binding: ARTWORKS).
// Filenames are random UUIDs, so aggressive caching is safe.

export async function onRequestGet(context) {
    const { params, env } = context;
    const path = Array.isArray(params.path) ? params.path.join('/') : params.path;

    if (!env.ARTWORKS) {
        return new Response('Storage not configured.', { status: 500 });
    }

    const object = await env.ARTWORKS.get(path);
    if (!object) {
        return new Response('Not found.', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);

    return new Response(object.body, { headers });
}
