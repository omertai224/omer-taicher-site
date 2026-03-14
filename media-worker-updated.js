const ALLOWED_ORIGINS = ['https://omertai.net', 'https://omertai224.github.io'];
const BUCKET_NAME = 'omer-media';
const MEDIA_DOMAIN = 'https://media.omertai.net';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.omertai.net');

    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.slice(1));

    // העלאת קובץ
    if (request.method === 'PUT') {
      const body = await request.arrayBuffer();
      const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
      await env.BUCKET.put(key, body, { httpMetadata: { contentType } });
      return Response.json({
        url: `${MEDIA_DOMAIN}/${key}`
      }, { headers: corsHeaders });
    }

    // מחיקת קובץ
    if (request.method === 'DELETE') {
      await env.BUCKET.delete(key);
      return Response.json({ deleted: key }, { headers: corsHeaders });
    }

    // רשימת קבצים
    if (request.method === 'GET' && key === '') {
      const list = await env.BUCKET.list();
      const items = list.objects.map(obj => ({
        key: obj.key,
        url: `${MEDIA_DOMAIN}/${obj.key}`,
        size: obj.size,
        uploaded: obj.uploaded,
      }));
      return Response.json({ items }, { headers: corsHeaders });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};
