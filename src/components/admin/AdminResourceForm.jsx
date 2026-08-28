import React, { useEffect, useRef, useState } from 'react';
import { archiveResource, createResource, deleteResourcePermanently, getAdminResources, publishResource, updateResource } from '../../data/repository';
import { resourceCategories } from '../../data/categories';
import { createResourceSlug, createUniqueResourceSlug } from '../../data/resourceUtils';
import { getPublishRequirementKeys } from '../../data/resourceValidation';
import { ChevronLeftIcon } from '../Icons';
import ConfirmDialog from '../ConfirmDialog';
import { readAdminResourceNavigation } from '../../data/adminResourceNavigation';

const blank = { slug: '', status: 'draft', organization_name: '', title_es: '', title_en: '', summary_es: '', summary_en: '', description_es: '', description_en: '', primary_category_id: '', additional_category_ids: [], keywords_es: [], keywords_en: [], languages: ['es','en'], service_methods: ['phone'], cost_type: 'unknown', eligibility_es: '', eligibility_en: '', required_documents_es: '', required_documents_en: '', application_steps_es: '', application_steps_en: '', hours_es: '', hours_en: '', accessibility_notes_es: '', accessibility_notes_en: '', service_area_es: '', service_area_en: '', phone: '', sms_phone: '', whatsapp_phone: '', email: '', website_url: '', address_line_1: '', address_line_2: '', city: '', state: 'TX', postal_code: '', county: 'Travis', source_url: '', is_featured: false, is_emergency: false, last_verified_at: '', verification_notes: '' };
const RequiredLabel = ({ children }) => <span>{children} <span className="required-mark" aria-hidden="true">*</span><span className="sr-only"> (obligatorio para publicar)</span></span>;
const Field = ({ label, name, value, onChange, textarea = false, type = 'text', publishRequired = false, ...inputProps }) => <label>{publishRequired ? <RequiredLabel>{label}</RequiredLabel> : label}{textarea ? <textarea name={name} value={value || ''} onChange={onChange} rows="4" {...inputProps}/> : <input name={name} type={type} value={value || ''} onChange={onChange} {...inputProps}/>}</label>;
const DeleteIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12Zm2-10h8v10H8V9Zm7.5-5-1-1h-5l-1 1H5v2h14V4h-3.5Z"/></svg>;
const formatPhone = value => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export default function AdminResourceForm({ t, resource, resources = [], refresh, navigate, notify, canDeletePermanently = false, locationSearch = '' }) {
  const [form, setForm] = useState(resource ? { ...blank, ...resource } : blank); const [keywordInputs, setKeywordInputs] = useState({ es: (resource?.keywords_es || []).join(', '), en: (resource?.keywords_en || []).join(', ') }); const [slugEdited, setSlugEdited] = useState(Boolean(resource?.slug)); const [dirty, setDirty] = useState(false); const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false); const [confirmArchive, setConfirmArchive] = useState(false); const [confirmDelete, setConfirmDelete] = useState(false); const [contactMethodMenuOpen, setContactMethodMenuOpen] = useState(false); const [visibleContactMethods, setVisibleContactMethods] = useState({ sms: Boolean(resource?.sms_phone), whatsapp: Boolean(resource?.whatsapp_phone) }); const firstRef = useRef(null); const contactMethodMenuRef = useRef(null);
  useEffect(() => { const before = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', before); return () => window.removeEventListener('beforeunload', before); }, [dirty]);
  useEffect(() => {
    if (!contactMethodMenuOpen) return undefined;
    const close = event => { if (!contactMethodMenuRef.current?.contains(event.target)) setContactMethodMenuOpen(false); };
    const key = event => { if (event.key === 'Escape') setContactMethodMenuOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key); };
  }, [contactMethodMenuOpen]);
  const change = event => {
    const { name, value, type, checked } = event.target;
    if (name === 'slug') setSlugEdited(true);
    setForm(current => {
      const next = { ...current, [name]: type === 'checkbox' ? checked : value };
      if (!slugEdited && ['organization_name', 'title_es', 'title_en'].includes(name)) next.slug = createResourceSlug(next.title_es || next.title_en, next.organization_name);
      return next;
    });
    setDirty(true);
  };
  const changePhone = event => { const { name, value } = event.target; setForm(current => ({ ...current, [name]: formatPhone(value) })); setDirty(true); };
  const addContactMethod = method => {
    setVisibleContactMethods(current => ({ ...current, [method]: true }));
    setContactMethodMenuOpen(false);
    window.requestAnimationFrame(() => document.querySelector(`[name="${method === 'sms' ? 'sms_phone' : 'whatsapp_phone'}"]`)?.focus());
  };
  const removeContactMethod = method => {
    const name = method === 'sms' ? 'sms_phone' : 'whatsapp_phone';
    setVisibleContactMethods(current => ({ ...current, [method]: false }));
    setForm(current => ({ ...current, [name]: '' }));
    setDirty(true);
  };
  const signVerification = () => {
    setForm(current => {
      if (current.source_url?.trim()) return current;
      const note = t.directVerificationNote;
      const existingNotes = current.verification_notes?.trim() || '';
      return { ...current, source_url: 'https://puenteatx.org', verification_notes: existingNotes.includes(note) ? existingNotes : [existingNotes, note].filter(Boolean).join('\n') };
    });
    setDirty(true);
  };
  const toggleArray = (key, value) => { setForm(current => ({ ...current, [key]: current[key].includes(value) ? current[key].filter(item => item !== value) : [...current[key], value] })); setDirty(true); };
  const publishErrors = () => {
    const details = {
      organization: { name: 'organization_name', label: t.organization },
      slug: { name: 'slug', label: t.slug },
      title: { name: 'title_es', label: `${t.titleEs} / ${t.titleEn}` },
      summary: { name: 'summary_es', label: `${t.summaryEs} / ${t.summaryEn}` },
      primaryCategory: { name: 'primary_category_id', label: t.primaryCategory },
      contact: { name: 'phone', label: t.contactRequired },
      source: { name: 'source_url', label: t.source },
      verifiedDate: { name: 'last_verified_at', label: t.verifiedDate }
    };
    return getPublishRequirementKeys(form).map(key => details[key]);
  };
  const save = async publish => {
    const errors = publish ? publishErrors() : [];
    if (errors.length) {
      setMessage(`${t.requiredError} ${t.missingFields}: ${errors.map(error => error.label).join(', ')}.`);
      document.querySelector(`[name="${errors[0].name}"]`)?.focus();
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const existingResources = await getAdminResources();
      const slug = createUniqueResourceSlug(form.slug || createResourceSlug(form.title_es || form.title_en, form.organization_name), existingResources, resource?.id);
      const values = { ...form, slug, keywords_es: keywordInputs.es.split(',').map(value => value.trim()).filter(Boolean), keywords_en: keywordInputs.en.split(',').map(value => value.trim()).filter(Boolean), published_at: publish ? new Date().toISOString() : form.published_at, status: publish ? 'published' : form.status };
      let saved = resource ? await updateResource(resource.id, values) : await createResource(values);
      if (publish && saved.status !== 'published') saved = await publishResource(saved.id);
      setForm(current => ({ ...current, ...saved, slug }));
      setDirty(false);
      notify(publish ? t.resourcePublished : form.status === 'draft' ? t.draftSaved : t.saved);
      if (!resource) navigate('/admin/recursos');
    } catch (error) {
      console.error('Unable to save resource', error);
      if (error.code === '23505') {
        setMessage(t.duplicateSlugError);
        document.querySelector('[name="slug"]')?.focus();
      } else if (error.code === '23514') {
        setMessage(t.publishConstraintError);
      } else if (error.code === '22P02') {
        setMessage(t.invalidFormatError);
      } else if (error.code === '23503') {
        setMessage(t.categoryReferenceError);
      } else if (error.code === '42501' || error.status === 401 || error.status === 403) {
        setMessage(t.permissionError);
      } else {
        setMessage(t.saveError);
      }
    } finally {
      setSaving(false);
    }
  };
  const archive = async () => {
    if (!resource) return;
    setSaving(true);
    setMessage('');
    try {
      await archiveResource(resource.id);
      setConfirmArchive(false);
      setDirty(false);
      notify(t.resourceArchived);
      navigate('/admin/recursos');
    } catch (error) {
      console.error('Unable to archive resource', error);
      setMessage(t.saveError);
    } finally {
      setSaving(false);
    }
  };
  const deletePermanently = async () => {
    if (!resource || !canDeletePermanently) return;
    const continuation = nextResource || previousResource;
    setSaving(true);
    setMessage('');
    try {
      await deleteResourcePermanently(resource.id);
      setConfirmDelete(false);
      setDirty(false);
      notify(t.resourceDeletedPermanently);
      await refresh?.();
      navigate(continuation ? `/admin/recursos/${continuation.id}/editar${locationSearch}` : `/admin/recursos${locationSearch}`);
    } catch (error) {
      console.error('Unable to permanently delete resource', error);
      setConfirmDelete(false);
      setMessage(t.resourceDeleteError);
      notify(t.resourceDeleteError);
    } finally {
      setSaving(false);
    }
  };
  const backToResources = () => {
    if (!dirty || window.confirm(t.unsavedChangesConfirm)) navigate(`/admin/recursos${locationSearch}`);
  };
  const navigationContext = readAdminResourceNavigation(locationSearch);
  const orderedResources = navigationContext
    ? navigationContext.ids.map(id => resources.find(item => item.id === id)).filter(Boolean)
    : resources;
  const resourceIndex = resource ? orderedResources.findIndex(item => item.id === resource.id) : -1;
  const previousResource = resourceIndex > 0 ? orderedResources[resourceIndex - 1] : null;
  const nextResource = resourceIndex >= 0 && resourceIndex < orderedResources.length - 1 ? orderedResources[resourceIndex + 1] : null;
  const openResource = target => {
    if (!target || saving) return;
    if (dirty && !window.confirm(t.unsavedResourceNavigationConfirm)) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
    navigate(`/admin/recursos/${target.id}/editar${locationSearch}`);
  };
  return <><button className="admin-back-link" onClick={backToResources}><ChevronLeftIcon/>{t.backToResources}</button><header className="admin-page-header"><h1>{resource ? t.edit : t.addResource}</h1></header><form className={`admin-resource-form${resource ? ' has-sticky-actions' : ''}`} onSubmit={event => event.preventDefault()}>{message && <p className="admin-form-message" aria-live="polite">{message}</p>}
    <section><h2>{t.formBasic}</h2><div className="admin-fields"><Field label={t.titleEs} name="title_es" value={form.title_es} onChange={change}/><Field label={t.titleEn} name="title_en" value={form.title_en} onChange={change}/><label><RequiredLabel>{t.organization}</RequiredLabel><input ref={firstRef} name="organization_name" value={form.organization_name} onChange={change}/></label><Field label={t.slug} name="slug" value={form.slug} onChange={change} publishRequired/></div><fieldset className="admin-required-field-group"><legend><RequiredLabel>{t.summaryRequiredGroup}</RequiredLabel></legend><p>{t.completeOneLanguage}</p><div className="admin-fields"><Field label={t.summaryEs} name="summary_es" value={form.summary_es} onChange={change} textarea/><Field label={t.summaryEn} name="summary_en" value={form.summary_en} onChange={change} textarea/></div></fieldset></section>
    <section><h2>{t.formCategories}</h2><label><RequiredLabel>{t.primaryCategory}</RequiredLabel><select name="primary_category_id" value={form.primary_category_id} onChange={change}><option value="">—</option>{resourceCategories.map(category => <option key={category.id} value={category.id}>{category.label_es} / {category.label_en}</option>)}</select></label><fieldset className="admin-check-group"><legend>Categorías adicionales</legend>{resourceCategories.filter(item => item.id !== form.primary_category_id).map(category => <label key={category.id}><input type="checkbox" checked={form.additional_category_ids.includes(category.id)} onChange={() => toggleArray('additional_category_ids', category.id)}/>{category.label_es}</label>)}</fieldset><div className="admin-fields"><Field label="Palabras clave (ES, separadas por coma)" name="keywords_es" value={keywordInputs.es} onChange={event => { setKeywordInputs(current => ({ ...current, es: event.target.value })); setDirty(true); }}/><Field label="Keywords (EN, comma separated)" name="keywords_en" value={keywordInputs.en} onChange={event => { setKeywordInputs(current => ({ ...current, en: event.target.value })); setDirty(true); }}/></div></section>
    <section><h2>{t.formContact}</h2><div className="admin-fields"><Field label={t.phone} name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength="12" value={form.phone} onChange={changePhone}/>{visibleContactMethods.sms && <div className="optional-contact-field"><div><label htmlFor="admin-sms-phone">SMS</label><button type="button" onClick={() => removeContactMethod('sms')}>{t.removeContactMethod}</button></div><input id="admin-sms-phone" name="sms_phone" type="tel" inputMode="tel" maxLength="12" value={form.sms_phone || ''} onChange={changePhone}/></div>}{visibleContactMethods.whatsapp && <div className="optional-contact-field"><div><label htmlFor="admin-whatsapp-phone">WhatsApp</label><button type="button" onClick={() => removeContactMethod('whatsapp')}>{t.removeContactMethod}</button></div><input id="admin-whatsapp-phone" name="whatsapp_phone" type="tel" inputMode="tel" maxLength="12" value={form.whatsapp_phone || ''} onChange={changePhone}/></div>}{(!visibleContactMethods.sms || !visibleContactMethods.whatsapp) && <div ref={contactMethodMenuRef} className="add-contact-method"><button type="button" className="add-contact-method-trigger" aria-expanded={contactMethodMenuOpen} aria-haspopup="menu" onClick={() => setContactMethodMenuOpen(current => !current)}><span aria-hidden="true">＋</span>{t.addContactMethod}</button>{contactMethodMenuOpen && <div className="add-contact-method-menu" role="menu">{!visibleContactMethods.whatsapp && <button type="button" role="menuitem" onClick={() => addContactMethod('whatsapp')}>WhatsApp</button>}{!visibleContactMethods.sms && <button type="button" role="menuitem" onClick={() => addContactMethod('sms')}>SMS</button>}</div>}</div>}<Field label="Email" name="email" type="email" value={form.email} onChange={change}/><Field label={t.website} name="website_url" type="url" value={form.website_url} onChange={change}/></div></section>
    <section><h2>{t.formLocation}</h2><div className="admin-fields"><Field label="Dirección" name="address_line_1" value={form.address_line_1} onChange={change}/><Field label="Dirección 2" name="address_line_2" value={form.address_line_2} onChange={change}/><Field label={t.city} name="city" value={form.city} onChange={change}/><Field label="Estado" name="state" value={form.state} onChange={change}/><Field label="ZIP" name="postal_code" value={form.postal_code} onChange={change}/><Field label="Condado" name="county" value={form.county} onChange={change}/><Field label="Latitud" name="latitude" type="number" value={form.latitude} onChange={change}/><Field label="Longitud" name="longitude" type="number" value={form.longitude} onChange={change}/></div></section>
    <section><h2>{t.formAvailability}</h2><div className="admin-fields"><Field label="Horarios (ES)" name="hours_es" value={form.hours_es} onChange={change} textarea/><Field label="Hours (EN)" name="hours_en" value={form.hours_en} onChange={change} textarea/></div><fieldset className="admin-check-group"><legend>Idiomas</legend>{['es','en'].map(value => <label key={value}><input type="checkbox" checked={form.languages.includes(value)} onChange={() => toggleArray('languages', value)}/>{value === 'es' ? 'Español' : 'English'}</label>)}</fieldset><fieldset className="admin-check-group"><legend>Métodos</legend>{['in_person','phone','online','home_visit'].map(value => <label key={value}><input type="checkbox" checked={form.service_methods.includes(value)} onChange={() => toggleArray('service_methods', value)}/>{value}</label>)}</fieldset></section>
    <section><h2>{t.formDescription}</h2><div className="admin-fields"><Field label={t.descriptionEs} name="description_es" value={form.description_es} onChange={change} textarea/><Field label={t.descriptionEn} name="description_en" value={form.description_en} onChange={change} textarea/><Field label="Área de servicio (ES)" name="service_area_es" value={form.service_area_es} onChange={change}/><Field label="Service area (EN)" name="service_area_en" value={form.service_area_en} onChange={change}/><Field label="Accesibilidad (ES)" name="accessibility_notes_es" value={form.accessibility_notes_es} onChange={change} textarea/><Field label="Accessibility (EN)" name="accessibility_notes_en" value={form.accessibility_notes_en} onChange={change} textarea/></div></section>
    <section><h2>{t.formRequirements}</h2><div className="admin-fields"><Field label={t.eligibilityEs} name="eligibility_es" value={form.eligibility_es} onChange={change} textarea/><Field label={t.eligibilityEn} name="eligibility_en" value={form.eligibility_en} onChange={change} textarea/><Field label="Pasos (ES)" name="application_steps_es" value={form.application_steps_es} onChange={change} textarea/><Field label="Steps (EN)" name="application_steps_en" value={form.application_steps_en} onChange={change} textarea/><label>{t.cost}<select name="cost_type" value={form.cost_type} onChange={change}><option value="unknown">Unknown</option><option value="free">Free</option><option value="sliding_scale">Sliding scale</option><option value="paid">Paid</option></select></label></div></section>
    <section><h2>{t.formVerification}</h2><div className="admin-fields"><label><RequiredLabel>{t.source}</RequiredLabel><span className="verification-source-field"><input name="source_url" type="url" value={form.source_url || ''} onChange={change}/>{!form.source_url?.trim() && <button type="button" onClick={signVerification}>{t.signVerification}</button>}</span></label><Field label={t.verifiedDate} name="last_verified_at" type="date" value={form.last_verified_at} onChange={change} publishRequired/><Field label="Notas internas" name="verification_notes" value={form.verification_notes} onChange={change} textarea/></div></section>
    <div className={`admin-form-footer${resource ? ' is-sticky' : ''}`}><div className="admin-form-footer-inner"><div className="admin-resource-status-actions"><p><span>{t.currentStatus}:</span> <strong>{form.status === 'published' ? t.statusPublished : form.status === 'archived' ? t.statusArchived : t.statusDraft}</strong></p>{resource && canDeletePermanently && <button type="button" className="admin-delete-resource-button" disabled={saving} onClick={() => setConfirmDelete(true)}><DeleteIcon/>{t.deletePermanently}</button>}</div><div className="admin-form-actions">{resource && <div className="admin-resource-stepper" aria-label={`${t.previousResource} / ${t.nextResource}`}><button type="button" className="secondary-button" disabled={!previousResource || saving} onClick={() => openResource(previousResource)} aria-label={t.previousResource} title={t.previousResource}><span className="material-symbols-rounded" aria-hidden="true">arrow_back</span></button><button type="button" className="secondary-button" disabled={!nextResource || saving} onClick={() => openResource(nextResource)} aria-label={t.nextResource} title={t.nextResource}><span className="material-symbols-rounded" aria-hidden="true">arrow_forward</span></button></div>}<button className={form.status === 'draft' ? 'secondary-button' : 'primary-button'} disabled={saving} onClick={() => save(false)}>{form.status === 'draft' ? t.saveDraft : t.save}</button>{form.status === 'published' ? <button className="secondary-button" disabled={saving} onClick={() => setConfirmArchive(true)}>{t.archiveResource}</button> : form.status !== 'archived' && <button className="primary-button" disabled={saving} onClick={() => save(true)}>{saving ? t.saving : t.publishResource}</button>}</div></div></div>
  </form><ConfirmDialog open={confirmArchive} title={t.archiveResourceConfirm} cancelLabel={t.cancel} confirmLabel={t.archiveResource} busy={saving} onCancel={() => setConfirmArchive(false)} onConfirm={archive}/><ConfirmDialog open={confirmDelete} title={t.deleteResourceConfirm(form.title_es || form.title_en || form.organization_name)} description={t.deleteResourceDescription} cancelLabel={t.cancel} confirmLabel={t.deletePermanently} busy={saving} onCancel={() => setConfirmDelete(false)} onConfirm={deletePermanently}/></>;
}
