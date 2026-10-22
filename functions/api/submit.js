// functions/api/submit.js
const LIMITS = { name: 100, contact: 150, urls: 5000, comments: 2000 };
const CHANNELS = ['email', 'telegram', 'whatsapp'];
const RETENTION_SECONDS = 60 * 60 * 24 * 90; // los casos se borran solos a los 90 días

export async function onRequestPost({ request, env }) {
  try {
    if (Number(request.headers.get('content-length') || 0) > 20_000) {
      return Response.json({ error: 'Solicitud demasiado grande' }, { status: 413 });
    }
    const data = await request.json();

    // 1. Anti-spam (Turnstile)
    const fd = new FormData();
    fd.append('secret', env.TURNSTILE_SECRET_KEY);
    fd.append('response', String(data.turnstileToken || ''));
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) fd.append('remoteip', ip);
    const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: fd });
    const result = await check.json();
    if (!result.success) {
      return Response.json({ error: 'No pudimos verificar la seguridad. Intenta de nuevo.' }, { status: 403 });
    }

    // 2. Declaraciones y aviso de privacidad aceptados
    if (data.consentimientos !== true) {
      return Response.json({ error: 'Debes aceptar las declaraciones y el aviso de privacidad.' }, { status: 400 });
    }

    // 3. Limpiar y validar
    const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const name = text(data.name, LIMITS.name);
    const contact = text(data.contact, LIMITS.contact);
    const comments = text(data.comments, LIMITS.comments);
    const contactChannel = CHANNELS.includes(data.contactChannel) ? data.contactChannel : '';
    const urlLines = text(data.urls, LIMITS.urls).split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    if (!name || !contact || !contactChannel || urlLines.length === 0) {
      return Response.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
    }
    if (urlLines.length > 50 || urlLines.some(u => u.length > 500 || !/^https?:\/\/\S+$/i.test(u))) {
      return Response.json({ error: 'Revisa los enlaces: uno por línea, empezando con http:// o https://' }, { status: 400 });
    }

    // 4. Guardar
    const folio = `GP-${crypto.randomUUID().toUpperCase()}`;
    const now = new Date();
    const caseData = {
      folio,
      name,
      contactChannel,
      contact,
      urls: urlLines.join('\n'),
      comments,
      createdAt: now.toISOString(),
      consentimientoAceptado: now.toISOString(),
      lastUpdate: now.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
      status: 'Recibido - En Análisis',
      description: 'Hemos recibido tu solicitud y nuestro equipo la está revisando.',
    };
    await env.CONTACT_FORM.put(folio, JSON.stringify(caseData), { expirationTtl: RETENTION_SECONDS });

    return Response.json({ message: 'Solicitud recibida con éxito', folio });
  } catch (e) {
    console.error('Error en /api/submit:', e.message);
    return Response.json({ error: 'Error interno al procesar la solicitud.' }, { status: 500 });
  }
}
