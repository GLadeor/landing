// functions/api/status.js

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const caseId = body.caseId;

    if (!caseId || typeof caseId !== 'string' || caseId.length > 60) {
      return new Response(JSON.stringify({ error: 'Número de folio no proporcionado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const CONTACT_FORM = context.env.CONTACT_FORM;
    const caseDataString = await CONTACT_FORM.get(caseId.toUpperCase());

    if (caseDataString === null) {
      return new Response(JSON.stringify({ error: 'Folio no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Solo se devuelve lo necesario, sin datos personales
    const { folio, status, lastUpdate, description } = JSON.parse(caseDataString);
    return new Response(JSON.stringify({ folio, status, lastUpdate, description }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error en /api/status:", error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
