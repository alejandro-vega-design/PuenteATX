import React, { useEffect, useMemo, useState } from 'react';
import { createResource, getDiscoveryCandidates, reviewDiscoveryCandidate } from '../../data/repository';
import { resourceCategories } from '../../data/categories';
import { createUniqueResourceSlug } from '../../data/resourceUtils';

const SOURCE_LABELS = { irs_bmf: 'IRS Business Master File' };

function candidateResourcePayload(candidate, resources) {
  const category = resourceCategories.find(item => item.slug === candidate.primary_category);
  const fields = candidate.suggested_fields || {};
  return {
    organization_name: candidate.organization_name,
    slug: createUniqueResourceSlug(candidate.organization_name, resources),
    primary_category_id: category?.id || null,
    status: 'draft',
    city: fields.city || '',
    state: fields.state || '',
    postal_code: fields.postal_code || '',
    county: fields.county || '',
    is_featured: fields.is_featured === '1',
    is_emergency: fields.is_emergency === '1',
    verification_notes: fields.verification_notes || ''
  };
}

export default function AdminDiscovery({ lang, resources, refresh, notify, reviewerId }) {
  const [candidates, setCandidates] = useState(null);
  const [category, setCategory] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => { setCandidates(null); getDiscoveryCandidates('pending').then(setCandidates).catch(() => setCandidates([])); };
  useEffect(load, []);

  const filtered = useMemo(() => (candidates || []).filter(item => category === 'all' || item.primary_category === category), [candidates, category]);
  const counts = useMemo(() => (candidates || []).reduce((acc, item) => { acc[item.primary_category] = (acc[item.primary_category] || 0) + 1; return acc; }, {}), [candidates]);

  const approve = async candidate => {
    setProcessingId(candidate.id);
    setError('');
    try {
      const created = await createResource(candidateResourcePayload(candidate, resources));
      await reviewDiscoveryCandidate(candidate.id, { status: 'approved', resourceId: created.id, reviewedBy: reviewerId });
      setCandidates(current => current.filter(item => item.id !== candidate.id));
      notify?.(lang === 'es' ? 'Recurso creado como borrador.' : 'Resource created as a draft.');
      refresh?.();
    } catch {
      setError(lang === 'es' ? 'No pudimos crear el recurso. Intenta nuevamente.' : 'We could not create the resource. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async candidate => {
    setProcessingId(candidate.id);
    setError('');
    try {
      await reviewDiscoveryCandidate(candidate.id, { status: 'rejected', reviewedBy: reviewerId });
      setCandidates(current => current.filter(item => item.id !== candidate.id));
    } catch {
      setError(lang === 'es' ? 'No pudimos descartar el candidato. Intenta nuevamente.' : 'We could not dismiss the candidate. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  return <>
    <header className="admin-page-header">
      <div>
        <h1>{lang === 'es' ? 'Descubrimiento de recursos' : 'Resource discovery'}</h1>
        <p className="admin-resource-summary">{lang === 'es' ? `${(candidates || []).length} candidatos pendientes` : `${(candidates || []).length} pending candidates`}</p>
      </div>
    </header>
    <div className="admin-resource-filters" style={{ gridTemplateColumns: 'minmax(200px, 1fr)' }}>
      <label><span className="sr-only">{lang === 'es' ? 'Categoría' : 'Category'}</span>
        <select value={category} onChange={event => setCategory(event.target.value)}>
          <option value="all">{lang === 'es' ? 'Todas las categorías' : 'All categories'}</option>
          {resourceCategories.map(item => <option key={item.id} value={item.slug}>{item[`label_${lang}`]} ({counts[item.slug] || 0})</option>)}
        </select>
      </label>
    </div>
    {error && <p className="field-error" role="alert"><b aria-hidden="true">!</b><span>{error}</span></p>}
    {candidates === null && <p className="loading-inline"><span className="admin-button-spinner" aria-hidden="true"/><span>{lang === 'es' ? 'Cargando…' : 'Loading…'}</span></p>}
    {candidates?.length === 0 && <p>{lang === 'es' ? 'No hay candidatos pendientes de revisión.' : 'No candidates pending review.'}</p>}
    <ul className="admin-flags-list">
      {filtered.map(candidate => {
        const category = resourceCategories.find(item => item.slug === candidate.primary_category);
        const fields = candidate.suggested_fields || {};
        const busy = processingId === candidate.id;
        return <li key={candidate.id}>
          <p className="admin-flags-reasons">{candidate.organization_name}</p>
          <p className="admin-flags-note">{category?.[`label_${lang}`] || candidate.primary_category} · {SOURCE_LABELS[candidate.source] || candidate.source}{fields.city ? ` · ${fields.city}, TX` : ''}</p>
          {fields.verification_notes && <p className="admin-flags-note">{fields.verification_notes}</p>}
          <div className="admin-form-footer-inner" style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="secondary-button" disabled={busy} onClick={() => reject(candidate)}>{lang === 'es' ? 'Descartar' : 'Dismiss'}</button>
            <button className="primary-button" disabled={busy} onClick={() => approve(candidate)}>{busy ? (lang === 'es' ? 'Procesando…' : 'Processing…') : (lang === 'es' ? 'Crear borrador' : 'Create draft')}</button>
          </div>
        </li>;
      })}
    </ul>
  </>;
}
