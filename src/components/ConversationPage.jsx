import React, { useState } from 'react';
import { categories } from '../data';
import { submitConversationRequest } from '../services/conversation';
import { CategoryIcon, ChevronLeftIcon, MessageIcon, PhoneIcon, WhatsAppIcon } from './Icons';
import { trackPuenteEvent } from '../analytics/client';

const initialForm = { name: '', contact: '', phone: '', day: '', time: '', zip: '', help: [], details: '', consent: false };

function formatUsPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const formatZip = value => value.replace(/\D/g, '').slice(0, 5);

function Choice({ type = 'radio', name, value, checked, onChange, icon, children }) {
  return <label className={`form-choice${checked ? ' is-selected' : ''}`}>
    <input type={type} name={name} value={value} checked={checked} onChange={onChange}/>{icon}<span>{children}</span>
  </label>;
}

function RequiredMark() {
  return <span className="required-mark" aria-hidden="true"> *</span>;
}

export default function ConversationPage({ lang, t, onBack, onResources, onSaved }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const contactOptions = [{ id: 'call', icon: <PhoneIcon/> }, { id: 'text', icon: <MessageIcon/> }, { id: 'whatsapp', icon: <WhatsAppIcon/> }];
  const dayOptions = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const timeOptions = ['morning', 'afternoon', 'evening', 'anytime'];

  const validate = () => {
    const next = {};
    if (!form.contact) next.contact = t.errors.contact;
    if (form.phone.replace(/\D/g, '').length < 10) next.phone = t.errors.phone;
    if (!form.day) next.day = t.errors.day;
    if (!form.time) next.time = t.errors.time;
    if (!/^\d{5}$/.test(form.zip)) next.zip = t.errors.zip;
    if (!form.help.length) next.help = t.errors.help;
    if (!form.consent) next.consent = t.errors.consent;
    return next;
  };

  const submit = async event => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    const first = Object.keys(nextErrors)[0];
    if (first) {
      const targets = { contact: 'input[name="contact"]', phone: '#field-phone', day: 'input[name="day"]', time: 'input[name="time"]', zip: '#field-zip', help: 'input[name="help"]', consent: '#field-consent' };
      requestAnimationFrame(() => document.querySelector(targets[first])?.focus());
      return;
    }
    setSendError('');
    setSending(true);
    try {
      await submitConversationRequest(form, lang);
      trackPuenteEvent('conversation_requested');
      const digits = form.phone.replace(/\D/g, '');
      setConfirmation({ contact: form.contact, ending: digits.slice(-4), day: form.day, time: form.time, zip: form.zip });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSendError(t.sendError);
    } finally { setSending(false); }
  };

  if (confirmation) return <main className="conversation-page"><section className="conversation-container confirmation-state" aria-live="polite">
    <img className="confirmation-mark" src="/assets/icons/check_circle.svg" alt="" aria-hidden="true"/><h1>{t.confirmationTitle}</h1><p className="confirmation-lead">{t.confirmationText}</p>
    <dl><div><dt>{t.method}</dt><dd>{t[confirmation.contact]}</dd></div><div><dt>{t.phoneEnding}</dt><dd>•••• {confirmation.ending}</dd></div><div><dt>{t.preferredDay}</dt><dd>{t[confirmation.day]}</dd></div><div><dt>{t.preferredTime}</dt><dd>{t[confirmation.time]}</dd></div><div><dt>{t.zipCode}</dt><dd>{confirmation.zip}</dd></div></dl>
    <div className="confirmation-actions"><button className="primary-button" onClick={onResources}>{t.resources}</button><button className="secondary-button" onClick={onSaved}>{t.viewSaved}</button></div>
  </section></main>;

  return <main className="conversation-page"><div className="conversation-container">
    <button className="back-link" onClick={onBack}><ChevronLeftIcon/><span>{t.back}</span></button>
    <header className="conversation-intro"><h1>{t.title}</h1><p>{t.intro}</p><p className="trust-message">{t.trust}</p></header>
    <form className="conversation-form" onSubmit={submit} noValidate>
      <div className="form-section"><label htmlFor="conversation-name">{t.nameLabel}</label><input id="conversation-name" type="text" autoComplete="name" placeholder={t.namePlaceholder} value={form.name} onChange={e => set('name', e.target.value)}/></div>

      <fieldset className="form-section" aria-describedby={errors.contact ? 'error-contact' : undefined}><legend>{t.contactLegend}<RequiredMark/></legend><div className="contact-options">
        {contactOptions.map(option => <Choice key={option.id} name="contact" value={option.id} checked={form.contact === option.id} onChange={() => { set('contact', option.id); setErrors(e => ({ ...e, contact: '' })); }} icon={option.icon}>{t[option.id]}</Choice>)}
      </div>{errors.contact && <p className="field-error" id="error-contact" role="alert"><b aria-hidden="true">!</b><span>{errors.contact}</span></p>}</fieldset>

      <div className="form-section"><label htmlFor="field-phone">{t.phoneLabel}<RequiredMark/></label><p className="field-hint">{t.phoneHint}</p><input id="field-phone" className={errors.phone ? 'has-error' : ''} type="tel" inputMode="tel" autoComplete="tel" maxLength="12" required placeholder={t.phonePlaceholder} value={form.phone} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'error-phone' : undefined} onChange={e => { set('phone', formatUsPhone(e.target.value)); setErrors(x => ({ ...x, phone: '' })); }}/>{errors.phone && <p className="field-error" id="error-phone" role="alert"><b aria-hidden="true">!</b><span>{errors.phone}</span></p>}</div>

      <fieldset className="form-section" aria-describedby={errors.day ? 'error-day' : undefined}><legend>{t.dayLegend}<RequiredMark/></legend><div className="day-options">{dayOptions.map(id => <Choice key={id} name="day" value={id} checked={form.day === id} onChange={() => { set('day', id); setErrors(e => ({ ...e, day: '' })); }}>{t[id]}</Choice>)}</div>{errors.day && <p className="field-error" id="error-day" role="alert"><b aria-hidden="true">!</b><span>{errors.day}</span></p>}</fieldset>

      <fieldset className="form-section" aria-describedby={errors.time ? 'error-time' : undefined}><legend>{t.timeLegend}<RequiredMark/></legend><div className="time-options">{timeOptions.map(id => <Choice key={id} name="time" value={id} checked={form.time === id} onChange={() => { set('time', id); setErrors(e => ({ ...e, time: '' })); }}>{t[id]}</Choice>)}</div>{errors.time && <p className="field-error" id="error-time" role="alert"><b aria-hidden="true">!</b><span>{errors.time}</span></p>}</fieldset>

      <div className="form-section"><label htmlFor="field-zip">{t.zipLabel}<RequiredMark/></label><p className="field-hint">{t.zipHint}</p><input id="field-zip" className={errors.zip ? 'has-error' : ''} type="text" inputMode="numeric" autoComplete="postal-code" maxLength="5" required placeholder={t.zipPlaceholder} value={form.zip} aria-invalid={Boolean(errors.zip)} aria-describedby={errors.zip ? 'error-zip' : undefined} onChange={e => { set('zip', formatZip(e.target.value)); setErrors(x => ({ ...x, zip: '' })); }}/>{errors.zip && <p className="field-error" id="error-zip" role="alert"><b aria-hidden="true">!</b><span>{errors.zip}</span></p>}</div>

      <fieldset className="form-section help-section" aria-describedby={errors.help ? 'error-help' : undefined}><legend>{t.helpLegend}<RequiredMark/></legend><p className="field-hint">{t.multiple}</p><div className="help-options">{categories.map(category => <Choice type="checkbox" key={category.id} name="help" value={category.id} checked={form.help.includes(category.id)} onChange={() => { set('help', form.help.includes(category.id) ? form.help.filter(id => id !== category.id) : [...form.help, category.id]); setErrors(e => ({ ...e, help: '' })); }} icon={<CategoryIcon name={category.icon}/>}>{category.label[lang]}</Choice>)}</div>{errors.help && <p className="field-error" id="error-help" role="alert"><b aria-hidden="true">!</b><span>{errors.help}</span></p>}</fieldset>

      <div className="form-section"><label htmlFor="conversation-details">{t.detailsLabel}</label><textarea id="conversation-details" rows="4" placeholder={t.detailsPlaceholder} value={form.details} onChange={e => set('details', e.target.value)}/></div>

      <div className="form-section consent-section"><label className={`consent-control${errors.consent ? ' has-error' : ''}`}><input id="field-consent" type="checkbox" required checked={form.consent} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? 'error-consent privacy-note' : 'privacy-note'} onChange={e => { set('consent', e.target.checked); setErrors(x => ({ ...x, consent: '' })); }}/><span>{t.consent}<RequiredMark/></span></label>{errors.consent && <p className="field-error" id="error-consent" role="alert"><b aria-hidden="true">!</b><span>{errors.consent}</span></p>}<p className="privacy-note" id="privacy-note">{t.privacy}</p></div>
      {Object.keys(errors).some(key => errors[key]) && <p className="error-summary" aria-live="assertive"><b aria-hidden="true">!</b> {t.errorSummary}</p>}
      {sendError && <p className="error-summary" role="status"><b aria-hidden="true">!</b> {sendError}</p>}
      <button className={`primary-button conversation-submit${sending ? ' is-sending' : ''}`} type="submit" disabled={sending || !form.consent}>{sending ? t.submitting : t.submit}</button>
    </form>
  </div></main>;
}
