// api/send-email.js
// Función serverless de Vercel que envía el email de confirmación de reclamo

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, nombre, codigo, tramite, lugar, estacion, fecha, hora } = req.body;

  if (!email || !codigo) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  const RESEND_API_KEY = "re_HAXzAfuh_KgYBhK4o8ebx75byW9hbtYPY";

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <div style="background: #0a2a2a; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">CAU<span style="color: #03bbb4;">digital</span></h1>
        <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 13px;">Línea Urquiza · Metrovías</p>
      </div>

      <h2 style="color: #0f172a; font-size: 18px;">Recibimos tu gestión, ${nombre}.</h2>
      <p style="color: #475569;">Tu número de trámite es:</p>

      <div style="background: #f1f5f9; border-radius: 10px; padding: 16px; text-align: center; margin: 20px 0;">
        <p style="font-size: 28px; font-weight: 900; color: #028a85; margin: 0; letter-spacing: 2px;">${codigo}</p>
        <p style="color: #475569; font-size: 12px; margin: 8px 0 0;">Guardalo para consultar el avance de tu gestión</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #64748b; font-size: 13px;">Tipo</td>
          <td style="padding: 10px 0; color: #0f172a; font-size: 13px; font-weight: 600;">${tramite}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #64748b; font-size: 13px;">Lugar</td>
          <td style="padding: 10px 0; color: #0f172a; font-size: 13px; font-weight: 600;">${lugar}${estacion ? ` · ${estacion}` : ""}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #64748b; font-size: 13px;">Fecha</td>
          <td style="padding: 10px 0; color: #0f172a; font-size: 13px; font-weight: 600;">${fecha} ${hora}</td>
        </tr>
      </table>

      <p style="color: #475569; font-size: 13px; line-height: 1.6;">
        Gracias por ayudarnos a mejorar el servicio. Nuestro equipo revisará tu gestión a la brevedad.
      </p>

      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">CAUdigital · Línea Urquiza · Un proyecto de Milena Montes para Coderhouse</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "CAUdigital <onboarding@resend.dev>",
        to: [email],
        subject: `Tu gestión fue registrada · Código ${codigo}`,
        html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);
      return res.status(400).json({ error: "No pudimos verificar el email, chequealo para terminar tu gestión." });
    }

    return res.status(200).json({ success: true, id: data.id });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "No pudimos verificar el email, chequealo para terminar tu gestión." });
  }
}
