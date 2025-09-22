// functions/api/submit.js

export async function onRequest(context) {
  // Solo se aceptan solicitudes POST
  if (context.request.method !== 'POST') {
    return new Response('Método no permitido', { status: 405 });
  }

  try {
    const data = await context.request.json();

    // 1. Generar un número de folio único y seguro
    const folio = `GP-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

    // 2. Crear el objeto del caso que se guardará en la base de datos
    const caseData = {
      ...data, // Datos del formulario (nombre, email, mensaje, etc.)
      folio: folio,
      status: "En Análisis", // Estado inicial
      lastUpdate: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
      description: "Hemos recibido tu solicitud y nuestro equipo la está revisando. Analizaremos la viabilidad y nos pondremos en contacto si requerimos más información. Este proceso suele tomar de 2 a 3 días hábiles."
    };

    // 3. Guardar el caso en la base de datos KV
    const CONTACT_FORM = context.env.CONTACT_FORM;
    await CONTACT_FORM.put(folio, JSON.stringify(caseData));

    // 4. Devolver una respuesta exitosa con el folio generado
    return new Response(JSON.stringify({ 
        message: 'Solicitud recibida con éxito', 
        folio: folio 
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Manejar cualquier error
    return new Response(JSON.stringify({ error: 'Error interno al procesar la solicitud.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
