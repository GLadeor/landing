const MAX = { nombre: 100, email: 150, telefono: 30, mensaje: 2000 }; // ajusta a tus campos reales

export async function onRequestPost({ request, env }) {
  try {
    if (Number(request.headers.get('content-length') || 0) > 10_000) {
      return Response.json({ error: 'Solicitud demasiado grande' }, { status: 413 });
    }
    const data = await request.json();

    const clean = {};
    for (const [field, max] of Object.entries(MAX)) {
      const v = data[field];
      if (typeof v === 'string' && v.trim()) clean[field] = v.trim().slice(0, max);
    }
    if (!clean.nombre || !clean.email) {
      return Response.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const folio = `GP-${crypto.randomUUID().toUpperCase()}`;
    const caseData = {
      ...clean,
      folio,
      status: 'Recibido - En Análisis',
      lastUpdate: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
      description: 'Hemos recibido tu solicitud y nuestro equipo la está revisando.',
    };
    await env.CONTACT_FORM.put(folio, JSON.stringify(caseData));

    return Response.json({ message: 'Solicitud recibida con éxito', folio });
  } catch (e) {
    console.error('Error en /api/submit:', e.message);
    return Response.json({ error: 'Error interno al procesar la solicitud.' }, { status: 500 });
  }
}
