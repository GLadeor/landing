async function sameKey(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a ?? '')),
    crypto.subtle.digest('SHA-256', enc.encode(b ?? '')),
  ]);
  return crypto.subtle.timingSafeEqual(ha, hb);
}

export async function onRequestPost({ request, env }) {
  try {
    const { secretKey } = await request.json();
    if (!env.DASHBOARD_SECRET_KEY || !(await sameKey(secretKey, env.DASHBOARD_SECRET_KEY))) {
      return Response.json({ error: 'Acceso no autorizado' }, { status: 401 });
    }

    const kv = env.CONTACT_FORM;
    const cases = [];
    let cursor;
    do {
      const page = await kv.list({ cursor });
      const values = await Promise.all(page.keys.map(k => kv.get(k.name)));
      for (const v of values) if (v) cases.push(JSON.parse(v));
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    return Response.json(cases);
  } catch (e) {
    console.error('Error en /api/list:', e.message);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
