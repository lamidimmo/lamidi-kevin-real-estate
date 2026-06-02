/* =============================================================================
   eval-mailer — Cloudflare Worker
   Reçoit le lead + le PDF (base64) depuis l'estimateur foncier, puis via Brevo :
     1) envoie un email au CLIENT avec le PDF en pièce jointe,
     2) envoie une notification à KEVIN.
   La clé API reste secrète côté serveur (jamais exposée dans le site).

   Variables à définir dans Cloudflare (Worker > Settings > Variables) :
     BREVO_API_KEY  (chiffrée) : clé API Brevo v3
     SENDER_EMAIL              : adresse expéditeur VÉRIFIÉE dans Brevo
     SENDER_NAME               : nom affiché (ex. "Kevin Lamidi")
     NOTIFY_EMAIL              : adresse qui reçoit les notifications (toi)
     ALLOW_ORIGIN              : origine autorisée (https://lamidimmo.github.io)
   ============================================================================= */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'method' }, 405, cors);

    let d;
    try { d = await request.json(); } catch (e) { return json({ error: 'json' }, 400, cors); }
    const email = (d.email || '').trim();
    if (!email || !d.pdf) return json({ error: 'missing' }, 400, cors);

    const sender = { email: env.SENDER_EMAIL, name: env.SENDER_NAME || 'Kevin Lamidi' };
    const notify = env.NOTIFY_EMAIL || env.SENDER_EMAIL;
    const clientName = [d.prenom, d.nom].filter(Boolean).join(' ').trim() || 'Client';
    const attachment = [{ name: 'evaluation-terrain.pdf', content: d.pdf }];

    // 1) Email au client, avec le PDF
    const r1 = await brevo(env, {
      sender,
      to: [{ email: email, name: clientName }],
      subject: 'Votre estimation foncière',
      htmlContent:
        '<div style="font-family:Helvetica,Arial,sans-serif;color:#14213d;line-height:1.6">' +
        '<p>Bonjour ' + esc(d.prenom || '') + ',</p>' +
        '<p>Merci d’avoir utilisé mon estimateur foncier. Vous trouverez votre estimation indicative en pièce jointe (PDF).</p>' +
        '<p>Je reste à votre disposition pour en discuter et affiner cette évaluation selon les particularités de votre terrain.</p>' +
        '<p>Bien à vous,<br><strong>Kevin Lamidi</strong><br>+41 76 715 50 59</p>' +
        '</div>',
      attachment: attachment
    });

    // 2) Notification à Kevin
    await brevo(env, {
      sender,
      to: [{ email: notify, name: 'Kevin Lamidi' }],
      replyTo: { email: email, name: clientName },
      subject: 'Nouveau test estimateur — ' + clientName,
      htmlContent:
        '<div style="font-family:Helvetica,Arial,sans-serif;line-height:1.6">' +
        '<p>Un client a réalisé une estimation :</p><ul>' +
        '<li><strong>Nom :</strong> ' + esc(clientName) + '</li>' +
        '<li><strong>Email :</strong> ' + esc(email) + '</li>' +
        '<li><strong>Téléphone :</strong> ' + esc(d.phone || '—') + '</li>' +
        '<li><strong>Bien :</strong> ' + esc([d.commune, d.surface ? d.surface + ' m²' : '', d.ius ? 'indice ' + d.ius : ''].filter(Boolean).join(' · ')) + '</li>' +
        (d.estimation ? '<li><strong>Estimation :</strong> ' + esc(d.estimation) + '</li>' : '') +
        '</ul><p>Le PDF envoyé au client est en pièce jointe.</p></div>',
      attachment: attachment
    });

    if (!r1.ok) {
      const t = await r1.text();
      return json({ success: false, error: 'brevo', detail: t.slice(0, 300) }, 502, cors);
    }
    return json({ success: true }, 200, cors);
  }
};

function brevo(env, payload) {
  return fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(payload)
  });
}
function json(o, status, cors) {
  return new Response(JSON.stringify(o), { status: status, headers: Object.assign({ 'Content-Type': 'application/json' }, cors) });
}
function esc(s) { return String(s == null ? '' : s).replace(/[<>&]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]; }); }
