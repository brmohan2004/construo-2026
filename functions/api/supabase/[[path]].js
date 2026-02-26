export async function onRequest(context) {
    const { request, params } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || '*',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    const path = params.path ? params.path.join('/') : '';
    const targetUrl = new URL(`https://cknbkgeurnwdqexgqezz.supabase.co/${path}`);

    const originalUrl = new URL(request.url);
    targetUrl.search = originalUrl.search;

    const headers = new Headers(request.headers);
    headers.set('Host', 'cknbkgeurnwdqexgqezz.supabase.co');

    let body = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        body = await request.arrayBuffer();
        if (body.byteLength === 0) body = null;
    }

    const proxyRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: headers,
        body: body,
        redirect: 'follow',
    });

    const response = await fetch(proxyRequest);

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
    });
}

