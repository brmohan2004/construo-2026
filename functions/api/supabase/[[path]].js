export async function onRequest(context) {
    const { request, params } = context;

    // Handle CORS preflight for PATCH/POST/DELETE
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

    // Construct the target URL
    const path = params.path ? params.path.join('/') : '';
    const targetUrl = new URL(`https://cknbkgeurnwdqexgqezz.supabase.co/${path}`);

    // Keep original query parameters
    const originalUrl = new URL(request.url);
    targetUrl.search = originalUrl.search;

    // Copy headers, replacing Host with the target host
    const headers = new Headers(request.headers);
    headers.set('Host', 'cknbkgeurnwdqexgqezz.supabase.co');

    // Explicitly read the request body for methods that have one
    let body = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        body = await request.arrayBuffer();
        if (body.byteLength === 0) body = null;
    }

    // Create explicit request with all parts preserved
    const proxyRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: headers,
        body: body,
        redirect: 'follow',
    });

    // Forward the request to Supabase
    const response = await fetch(proxyRequest);

    // Create a mutable response to add CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
    });
}
