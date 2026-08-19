const CONTACT_METHODS = new Set(['call', 'text', 'whatsapp']);
const CONTACT_DAYS = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
const CONTACT_TIMES = new Set(['morning', 'afternoon', 'evening', 'anytime']);
const CATEGORY_KEYS = {
  '10000000-0000-4000-8000-000000000001': 'food',
  '10000000-0000-4000-8000-000000000002': 'housing',
  '10000000-0000-4000-8000-000000000003': 'health',
  '10000000-0000-4000-8000-000000000004': 'transportation',
  '10000000-0000-4000-8000-000000000005': 'financial',
  '10000000-0000-4000-8000-000000000006': 'education',
  '10000000-0000-4000-8000-000000000007': 'legal',
  '10000000-0000-4000-8000-000000000008': 'other'
};

const labels = {
  es: {
    subject: 'Nueva solicitud de conversación — Puente ATX',
    name: 'Nombre o apodo', contact: 'Método de contacto', phone: 'Teléfono',
    day: 'Día preferido', time: 'Mejor momento', zip: 'Código postal', help: 'Tipos de ayuda', details: 'Información adicional',
    consent: 'La persona aceptó ser contactada', notProvided: 'No proporcionado',
    call: 'Llamada', text: 'Mensaje de texto', whatsapp: 'WhatsApp',
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes',
    morning: 'Mañana', afternoon: 'Tarde', evening: 'Noche', anytime: 'Cualquier hora',
    food: 'Comida', housing: 'Vivienda', health: 'Salud', transportation: 'Transporte',
    financial: 'Recursos financieros', education: 'Educación', legal: 'Ayuda legal', other: 'Otros recursos'
  },
  en: {
    subject: 'New conversation request — Puente ATX',
    name: 'Name or nickname', contact: 'Contact method', phone: 'Phone',
    day: 'Preferred day', time: 'Best time', zip: 'ZIP code', help: 'Types of help', details: 'Additional information',
    consent: 'The person agreed to be contacted', notProvided: 'Not provided',
    call: 'Call', text: 'Text message', whatsapp: 'WhatsApp',
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday',
    morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', anytime: 'Any time',
    food: 'Food', housing: 'Housing', health: 'Health', transportation: 'Transportation',
    financial: 'Financial resources', education: 'Education', legal: 'Legal help', other: 'Other resources'
  }
};

const clean = (value, maxLength) => typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONVERSATION_TO_EMAIL;
  const from = process.env.CONVERSATION_FROM_EMAIL || 'Puente ATX <onboarding@resend.dev>';
  if (!apiKey || !to) return response.status(503).json({ ok: false });

  const body = request.body || {};
  if (body.website) return response.status(200).json({ ok: true });

  const lang = body.lang === 'en' ? 'en' : 'es';
  const copy = labels[lang];
  const phone = clean(body.phone, 20);
  const phoneDigits = phone.replace(/\D/g, '');
  const contact = clean(body.contact, 20);
  const day = clean(body.day, 20);
  const time = clean(body.time, 20);
  const zip = clean(body.zip, 5);
  const help = Array.isArray(body.help)
    ? [...new Set(body.help.map(id => CATEGORY_KEYS[id]).filter(Boolean))].slice(0, 8)
    : [];

  if (!CONTACT_METHODS.has(contact) || !CONTACT_DAYS.has(day) || !CONTACT_TIMES.has(time) || phoneDigits.length !== 10 || !/^\d{5}$/.test(zip) || help.length === 0 || body.consent !== true) {
    return response.status(400).json({ ok: false });
  }

  const name = clean(body.name, 100);
  const details = clean(body.details, 2000);
  const text = [
    `${copy.name}: ${name || copy.notProvided}`,
    `${copy.contact}: ${copy[contact]}`,
    `${copy.phone}: ${phone}`,
    `${copy.day}: ${copy[day]}`,
    `${copy.time}: ${copy[time]}`,
    `${copy.zip}: ${zip}`,
    `${copy.help}: ${help.map(item => copy[item]).join(', ')}`,
    `${copy.details}: ${details || copy.notProvided}`,
    `${copy.consent}: Sí / Yes`
  ].join('\n\n');

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject: copy.subject, text })
    });
    if (!emailResponse.ok) return response.status(502).json({ ok: false });
    return response.status(200).json({ ok: true });
  } catch {
    return response.status(502).json({ ok: false });
  }
}
