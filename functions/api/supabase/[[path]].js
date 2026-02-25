export async function onRequest(context) {
    const { request, params } = context;

    // Construct the target URL
    const path = params.path ? params.path.join('/') : '';
    const targetUrl = new URL(`https://cknbkgeurnwdqexgqezz.supabase.co/${path}`);

    // Keep original query parameters
    const originalUrl = new URL(request.url);
    targetUrl.search = originalUrl.search;

    // Create new request with original method, headers, and body
    const newRequest = new Request(targetUrl, request);

    // Forward the request to Supabase and return the response
    return fetch(newRequest);
}
