/**
 * emailjs-notifications.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestión de notificaciones por email usando EmailJS.
 *
 * Requisitos previos:
 *   1. Incluir el SDK de EmailJS en el HTML:
 *      <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
 *   2. Llamar a emailjs.init() con tu Public Key al cargar la página:
 *      emailjs.init({ publicKey: "TU_PUBLIC_KEY" });
 *   3. En tu cuenta EmailJS crea una plantilla con las variables:
 *      {{cliente_nombre}}, {{pedido_id}}, {{pedido_estado}}, {{to_email}}
 *
 * Uso:
 *   // Cuando el backend confirme el cambio de estado del pedido:
 *   notificarClientePedido({
 *     clienteNombre : "Juan García",
 *     clienteEmail  : "juan@ejemplo.com",
 *     pedidoId      : 42,
 *     estadoPedido  : "ACEPTADO"   // o "RECHAZADO"
 *   });
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Configuración ─────────────────────────────────────────────────────────────
// Carga los IDs de EmailJS desde un objeto global `window.APP_CONFIG` que debe
// ser definido en el HTML antes de incluir este script, por ejemplo:
//
//   <script>
//     window.APP_CONFIG = {
//       emailjsServiceId : "service_xxxxxxx",
//       emailjsTemplateId: "template_xxxxxxx"
//     };
//   </script>
//
// Esto evita commitear credenciales en el repositorio.

const EMAILJS_SERVICE_ID  = (window.APP_CONFIG || {}).emailjsServiceId  || "";
const EMAILJS_TEMPLATE_ID = (window.APP_CONFIG || {}).emailjsTemplateId || "";

// ── Función principal ─────────────────────────────────────────────────────────

/**
 * Notifica al cliente por email cuando su pedido es ACEPTADO o RECHAZADO.
 *
 * @param {Object} options
 * @param {string} options.clienteNombre - Nombre del cliente destinatario.
 * @param {string} options.clienteEmail  - Email guardado en el perfil del cliente.
 * @param {number} options.pedidoId      - ID del pedido.
 * @param {string} options.estadoPedido  - "ACEPTADO" | "RECHAZADO"
 * @returns {Promise<void>}
 */
async function notificarClientePedido({ clienteNombre, clienteEmail, pedidoId, estadoPedido }) {
  if (estadoPedido !== "ACEPTADO" && estadoPedido !== "RECHAZADO") {
    console.warn(`notificarClientePedido: estado '${estadoPedido}' no requiere notificación.`);
    return;
  }

  const templateParams = {
    to_email      : clienteEmail,
    cliente_nombre: clienteNombre,
    pedido_id     : pedidoId,
    pedido_estado : estadoPedido,
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    console.log(`Email enviado a ${clienteEmail} (pedido #${pedidoId}):`, response.status, response.text);
  } catch (error) {
    console.error(`Error al enviar email a ${clienteEmail}:`, error);
  }
}

// ── Integración con el backend ────────────────────────────────────────────────

/**
 * Llama al endpoint PATCH del backend para cambiar el estado de un pedido y,
 * si la respuesta es exitosa, envía la notificación al cliente por email.
 *
 * @param {number} pedidoId   - ID del pedido a actualizar.
 * @param {string} nuevoEstado - "ACEPTADO" | "RECHAZADO"
 * @param {string} apiBaseUrl  - URL base del backend, ej. "https://mi-api.railway.app"
 * @param {string} authToken   - Token de autenticación (Bearer) del Admin.
 */
async function cambiarEstadoPedido(pedidoId, nuevoEstado, apiBaseUrl, authToken) {
  const url = `${apiBaseUrl}/api/pedidos/${pedidoId}/estado`;

  let respuestaJson;
  try {
    const response = await fetch(url, {
      method : "PATCH",
      headers: {
        "Content-Type" : "application/json",
        "Authorization": `Basic ${authToken}`,
      },
      body: JSON.stringify({ estado: nuevoEstado }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error del servidor (${response.status}): ${errorText}`);
    }

    respuestaJson = await response.json();
  } catch (error) {
    console.error("Error al cambiar el estado del pedido:", error);
    throw error;
  }

  // El backend devuelve el objeto Pedido con el usuario anidado
  const cliente = respuestaJson.usuario;
  await notificarClientePedido({
    clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
    clienteEmail : cliente.email,
    pedidoId     : respuestaJson.id,
    estadoPedido : respuestaJson.estado,
  });

  return respuestaJson;
}
