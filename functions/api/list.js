// functions/api/list.js

// --- IMPORTANTE: CAMBIA ESTA CONTRASEÑA ---
const DASHBOARD_SECRET_KEY = "tostadas-quemadas-REYNOSA"; 

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const providedKey = body.secretKey;

    // 1. Verificación de Seguridad
    if (providedKey !== DASHBOARD_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Acceso no autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Conexión a la Base de Datos KV
    const CONTACT_FORM = context.env.CONTACT_FORM;
    if (!CONTACT_FORM) {
        throw new Error("El KV namespace 'CONTACT_FORM' no está enlazado (bound).");
    }
    
    // 3. Obtener todas las claves (folios)
    const list = await CONTACT_FORM.list();
    if (list.keys.length === 0) {
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // 4. Obtener el valor (datos del caso) para cada clave
    const promises = list.keys.map(key => CONTACT_FORM.get(key.name));
    const values = await Promise.all(promises);

    // 5. Devolver la lista de casos
    const cases = values.map(value => JSON.parse(value));
    
    return new Response(JSON.stringify(cases), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error en /api/list:", error.message);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
