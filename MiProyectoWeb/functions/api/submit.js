/**
 * Contexto de la Función de Pages
 * @param {object} context - El contexto del objeto de la función.
 * @param {Request} context.request - El objeto de la solicitud.
 * @param {object} context.env - Las variables de entorno.
 * @param {D1Database} context.env.CONTACT_DB - El enlace a la base de datos D1.
 */
export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        // Comprobar que el binding de KV exista.
        if (!env.CONTACT_FORM) {
            throw new Error("El almacén KV 'CONTACT_FORM' no está configurado.");
        }

        const data = await request.json();

        // Validación básica de los datos recibidos.
        if (!data.name || !data.email || !data.message) {
            return new Response(JSON.stringify({ error: 'Faltan campos requeridos en el formulario.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Crear una clave única para cada envío, usando la fecha y un número aleatorio.
        const key = `${new Date().toISOString()}-${crypto.randomUUID()}`;

        // Guardar los datos en formato JSON en el almacén KV.
        await env.CONTACT_FORM.put(key, JSON.stringify(data));

        // Enviar una respuesta de éxito al cliente.
        return new Response(JSON.stringify({ message: 'Datos recibidos y guardados con éxito.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        // Manejar cualquier error que ocurra durante el proceso.
        console.error("Error en la función de submit:", error);
        return new Response(JSON.stringify({ error: 'Hubo un problema al procesar tu solicitud.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

