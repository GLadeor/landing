export async function onRequest(context) {
  // Solo se aceptan solicitudes POST
  if (context.request.method !== 'POST') {
    const errorResponse = { error: 'Método no permitido. Solo se aceptan solicitudes POST.' };
    // Usamos Response.json para una respuesta más limpia. Automáticamente añade el Content-Type.
    return Response.json(errorResponse, { status: 405 });
  }

  try {
    // --- VERIFICACIÓN IMPORTANTE ---
    // Verificamos que el KV namespace binding exista. Este es el error más común
    // en la configuración de Cloudflare Pages.
    if (!context.env.CONTACT_FORM) {
        throw new Error("El KV namespace 'CONTACT_FORM' no está configurado correctamente en el entorno.");
    }

    const data = await context.request.json();

    // Generar un número de folio único
    const folio = `GP-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

    // Preparar el objeto del caso para guardarlo
    const caseData = {
      ...data, // Datos del formulario
      folio: folio,
      status: "Recibido - En Análisis",
      lastUpdate: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
    };

    // Usamos la variable del entorno para acceder al KV namespace
    await context.env.CONTACT_FORM.put(folio, JSON.stringify(caseData));

    // Devolver una respuesta exitosa con el folio
    const successResponse = {
      message: 'Solicitud recibida con éxito',
      folio: folio
    };
    return Response.json(successResponse, { status: 200 });

  } catch (error) {
    // Manejar cualquier error
    console.error("Error en /api/submit:", error.message);
    // Devolvemos el mensaje de error real al cliente para una mejor depuración.
    const errorResponse = { error: error.message || 'Error interno al procesar la solicitud.' };
    return Response.json(errorResponse, { status: 500 });
  }
}
