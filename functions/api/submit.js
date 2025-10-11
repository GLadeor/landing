// functions/api/submit.js
// Se cambia a onRequestPost para manejar explícitamente solicitudes POST.

export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const folio = `GP-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

    const caseData = {
      ...data,
      folio: folio,
      status: "Recibido - En Análisis",
      lastUpdate: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
      description: "Hemos recibido tu solicitud y nuestro equipo la está revisando. Analizaremos la viabilidad y nos pondremos en contacto si requerimos más información."
    };

    const CONTACT_FORM = context.env.CONTACT_FORM;
    await CONTACT_FORM.put(folio, JSON.stringify(caseData));

    return new Response(JSON.stringify({ 
        message: 'Solicitud recibida con éxito', 
        folio: folio 
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error en /api/submit:", error);
    return new Response(JSON.stringify({ error: 'Error interno al procesar la solicitud.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

