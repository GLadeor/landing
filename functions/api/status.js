export async function onRequest(context) {
  // Solo se aceptan solicitudes GET
  if (context.request.method !== 'GET') {
    return Response.json({ error: 'Método no permitido.' }, { status: 405 });
  }

  try {
    // Verificamos que el KV namespace exista
    if (!context.env.CONTACT_FORM) {
      console.error("Error crítico: El KV namespace 'CONTACT_FORM' no está vinculado.");
      throw new Error("El servicio de consulta no está disponible en este momento.");
    }

    // Obtenemos el folio de los parámetros de la URL
    const url = new URL(context.request.url);
    const folio = url.searchParams.get('folio');

    if (!folio) {
      return Response.json({ error: 'Falta el parámetro de folio.' }, { status: 400 });
    }

    // Buscamos el folio en el KV namespace
    const caseDataString = await context.env.CONTACT_FORM.get(folio);

    if (caseDataString === null) {
      return Response.json({ error: 'Folio no encontrado. Verifica que lo hayas escrito correctamente.' }, { status: 404 });
    }

    const caseData = JSON.parse(caseDataString);

    // Devolvemos los datos del caso
    return Response.json(caseData, { status: 200 });

  } catch (error) {
    console.error("Error en /api/status:", error.message);
    return Response.json({ error: 'Error interno al procesar la consulta.' }, { status: 500 });
  }
}

