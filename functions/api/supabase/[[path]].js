export async function onRequest(context) {
    const { request, params } = context;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    const path = params.path ? params.path.join('/') : '';
    const originUrl = new URL(request.url);
    const targetUrl = new URL(`https://cknbkgeurnwdqexgqezz.supabase.co/${path}${originUrl.search}`);

    // Forward ONLY essential headers to avoid CF-internal header conflicts
    const headers = new Headers();
    const headersToForward = ['apikey', 'authorization', 'content-type', 'prefer', 'range'];

    for (const [key, value] of request.headers.entries()) {
        if (headersToForward.includes(key.toLowerCase())) {
            headers.set(key, value);
        }
    }

    // Set host explicitly for Supabase
    headers.set('Host', 'cknbkgeurnwdqexgqezz.supabase.co');

    let body = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        body = await request.arrayBuffer();
    }

    try {
        const response = await fetch(targetUrl.toString(), {
            method: request.method,
            headers: headers,
            body: body,
            redirect: 'follow'
        });

        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}
