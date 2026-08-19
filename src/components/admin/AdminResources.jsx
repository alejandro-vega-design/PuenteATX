import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { archiveResource, createResource, deleteResourcePermanently, publishResource, restoreResource, updateResource } from '../../data/repository';
import { resourceCategories } from '../../data/categories';
import { createUniqueResourceSlug, localized, verificationState } from '../../data/resourceUtils';
import { getPublishRequirementKeys } from '../../data/resourceValidation';
import { createAdminResourceSearch, saveAdminResourceNavigation } from '../../data/adminResourceNavigation';
import { normalizeCounty, RESOURCE_COUNTIES } from '../../config/resourceCounties';
import { ChevronLeftIcon, MoreIcon, SearchIcon } from '../Icons';
import ConfirmDialog from '../ConfirmDialog';

const MOBILE_PAGE_SIZE = 10;

const pageSizeForSpace = availableHeight => {
  const completeRows = Math.floor(Math.max(0, availableHeight - 64) / 61);
  if (completeRows >= 18) return 20;
  if (completeRows >= 13) return 15;
  return MOBILE_PAGE_SIZE;
};

const getPageItems = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = [...new Set([1, total, page - 1, page, page + 1].filter(value => value > 0 && value <= total))].sort((a, b) => a - b);
  return pages.flatMap((value, index) => index && value - pages[index - 1] > 1 ? ['ellipsis', value] : [value]);
};

const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
const statusLabel = (status, t) => ({ published: t.statusPublished, draft: t.statusDraft, archived: t.statusArchived }[status] || status);

function RowMenu({ resource, t, onDuplicate, onArchive, onRestore, onPreview, onDelete }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const toggle = () => {
    if (!open) {
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedHeight = (resource.status === 'published' ? 144 : 100) + (onDelete ? 44 : 0);
      const openAbove = rect.bottom + estimatedHeight > window.innerHeight;
      setPosition({ top: openAbove ? Math.max(8, rect.top - estimatedHeight - 6) : rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setOpen(value => !value);
  };
  useEffect(() => {
    if (!open) return undefined;
    const outside = event => { if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false); };
    const key = event => { if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } };
    const close = () => setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);
  const action = callback => () => { setOpen(false); callback(); };
  return <div className="admin-row-menu"><button ref={triggerRef} className="admin-row-menu-trigger" aria-label={t.moreActions} title={t.moreActions} aria-expanded={open} aria-haspopup="menu" onClick={toggle}><MoreIcon/></button>{open && createPortal(<div ref={menuRef} className="admin-row-menu-popover" role="menu" style={position}>{resource.status === 'published' && <button role="menuitem" onClick={action(onPreview)}>{t.preview}</button>}<button role="menuitem" onClick={action(onDuplicate)}>{t.duplicate}</button>{resource.status === 'archived' ? <button role="menuitem" onClick={action(onRestore)}>{t.restore}</button> : <button role="menuitem" onClick={action(onArchive)}>{t.archive}</button>}{onDelete && <button className="admin-destructive-menu-item" role="menuitem" onClick={action(onDelete)}>{t.deletePermanently}</button>}</div>, document.body)}</div>;
}

export default function AdminResources({ t, lang, resources, refresh, navigate, notify, canDeletePermanently = false, initialReview = false, locationSearch = '' }) {
  const initialParams = useMemo(() => new URLSearchParams(locationSearch), [locationSearch]);
  const [query, setQuery] = useState(() => initialParams.get('q') || ''); const [status, setStatus] = useState(() => initialParams.get('status') || 'all'); const [category, setCategory] = useState(() => initialParams.get('category') || 'all'); const [county, setCounty] = useState(() => initialParams.get('county') || 'all'); const [review, setReview] = useState(() => initialParams.get('review') || (initialReview ? 'review' : 'all')); const [sort, setSort] = useState(() => initialParams.get('sort') || 'updated'); const [page, setPage] = useState(() => Math.max(1, Number.parseInt(initialParams.get('page'), 10) || 1));
  const [pageSize, setPageSize] = useState(MOBILE_PAGE_SIZE);
  const [selected, setSelected] = useState([]); const [processing, setProcessing] = useState(false); const [feedback, setFeedback] = useState(''); const [categoryDialog, setCategoryDialog] = useState(false); const [archiveDialog, setArchiveDialog] = useState(null); const [deleteDialog, setDeleteDialog] = useState(null); const [bulkCategory, setBulkCategory] = useState(''); const [publishReport, setPublishReport] = useState(null); const categorySelectRef = useRef(null); const categoryDialogRef = useRef(null); const categoryTriggerRef = useRef(null); const publishReportRef = useRef(null); const selectPageRef = useRef(null); const mobileSelectPageRef = useRef(null);
  const tableWrapRef = useRef(null); const pageRef = useRef(page); const pageSizeRef = useRef(pageSize);
  const filtered = useMemo(() => resources.filter(resource => status === 'all' || resource.status === status).filter(resource => category === 'all' || resource.primary_category_id === category).filter(resource => county === 'all' || normalizeCounty(resource.county) === normalizeCounty(county)).filter(resource => review === 'all' || verificationState(resource) === review).filter(resource => `${localized(resource, 'title', lang)} ${resource.organization_name}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === 'title' ? localized(a,'title',lang).localeCompare(localized(b,'title',lang)) : new Date(b.updated_at) - new Date(a.updated_at)), [resources, status, category, county, review, sort, query, lang]);
  const pageCount = Math.ceil(filtered.length / pageSize); const pageItems = getPageItems(page, pageCount); const visible = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]); const visibleIds = useMemo(() => visible.map(resource => resource.id), [visible]); const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selected.includes(id));
  const publishedCount = resources.filter(resource => resource.status === 'published').length;
  const visibleStart = filtered.length ? (page - 1) * pageSize + 1 : 0;
  const visibleEnd = Math.min(page * pageSize, filtered.length);
  const resourceSearch = createAdminResourceSearch({ query, status, category, county, review, sort, page });
  const openEditor = id => {
    saveAdminResourceNavigation({ ids: filtered.map(item => item.id), returnSearch: resourceSearch });
    navigate(`/admin/recursos/${id}/editar${resourceSearch}`);
  };

  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { pageSizeRef.current = pageSize; }, [pageSize]);
  useEffect(() => {
    let timer;
    const updatePageSize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const mobile = window.matchMedia('(max-width: 800px)').matches;
        const tableTop = tableWrapRef.current?.getBoundingClientRect().top ?? 0;
        const nextSize = mobile ? MOBILE_PAGE_SIZE : pageSizeForSpace(window.innerHeight - tableTop);
        if (nextSize === pageSizeRef.current) return;
        const firstVisibleIndex = (pageRef.current - 1) * pageSizeRef.current;
        pageSizeRef.current = nextSize;
        setPageSize(nextSize);
        setPage(Math.floor(firstVisibleIndex / nextSize) + 1);
      }, 150);
    };
    updatePageSize();
    window.addEventListener('resize', updatePageSize);
    return () => { window.clearTimeout(timer); window.removeEventListener('resize', updatePageSize); };
  }, []);
  useEffect(() => { if (page > pageCount) setPage(Math.max(1, pageCount)); }, [page, pageCount]);
  useEffect(() => {
    const filteredIds = new Set(filtered.map(resource => resource.id));
    setSelected(current => current.filter(id => filteredIds.has(id)));
  }, [filtered]);
  useEffect(() => { [selectPageRef.current, mobileSelectPageRef.current].filter(Boolean).forEach(input => { input.indeterminate = selected.length > 0 && !allVisibleSelected; }); }, [selected, allVisibleSelected]);
  useEffect(() => { if (!categoryDialog) return undefined; const previous = document.activeElement; const trigger = categoryTriggerRef.current; const key = event => { if (event.key === 'Escape') setCategoryDialog(false); if (event.key === 'Tab') { const items = [...categoryDialogRef.current.querySelectorAll('button,select')].filter(item => !item.disabled); const first = items[0]; const last = items[items.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } }; document.addEventListener('keydown', key); categorySelectRef.current?.focus(); return () => { document.removeEventListener('keydown', key); (previous?.isConnected ? previous : trigger)?.focus(); }; }, [categoryDialog]);
  useEffect(() => { if (!publishReport) return undefined; const previous = document.activeElement; const key = event => { if (event.key === 'Escape') setPublishReport(null); }; document.addEventListener('keydown', key); publishReportRef.current?.focus(); return () => { document.removeEventListener('keydown', key); previous?.isConnected && previous.focus(); }; }, [publishReport]);

  const duplicate = async resource => {
    setProcessing(true);
    try {
      const values = { ...resource };
      ['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'resource_categories'].forEach(key => delete values[key]);
      await createResource({ ...values, slug: createUniqueResourceSlug(`${resource.slug}-copia`, resources), status: 'draft', published_at: null, archived_at: null, title_es: `${resource.title_es} (copia)`, title_en: `${resource.title_en} (copy)` });
      setFeedback(t.resourceDuplicated);
      notify(t.resourceDuplicated);
      await refresh();
    } catch (error) {
      console.error('Unable to duplicate resource', error);
      setFeedback(t.resourceDuplicateError);
    } finally {
      setProcessing(false);
    }
  };
  const toggleSelected = id => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const toggleVisible = () => setSelected(current => allVisibleSelected
    ? current.filter(id => !visibleIds.includes(id))
    : [...new Set([...current, ...visibleIds])]);
  const selectedResources = resources.filter(resource => selected.includes(resource.id));
  const selectedDrafts = selectedResources.filter(resource => resource.status === 'draft');
  const archiveSelected = async () => {
    setProcessing(true); const results = await Promise.allSettled(selected.map(id => archiveResource(id))); const failed = results.filter(result => result.status === 'rejected').length; const resultMessage = failed ? t.bulkPartial(results.length - failed, failed) : t.bulkArchived(results.length); setFeedback(resultMessage); notify(resultMessage); setSelected([]); await refresh(); setProcessing(false);
    setArchiveDialog(null);
  };
  const archiveOne = async resource => {
    setProcessing(true);
    try {
      await archiveResource(resource.id);
      notify(t.resourceArchived);
      await refresh();
      setArchiveDialog(null);
    } finally {
      setProcessing(false);
    }
  };
  const deleteOne = async resource => {
    if (!canDeletePermanently) return;
    setProcessing(true);
    try {
      await deleteResourcePermanently(resource.id);
      notify(t.resourceDeletedPermanently);
      setSelected(current => current.filter(id => id !== resource.id));
      setDeleteDialog(null);
      await refresh();
    } catch (error) {
      console.error('Unable to permanently delete resource', error);
      setFeedback(t.resourceDeleteError);
      notify(t.resourceDeleteError);
    } finally {
      setProcessing(false);
    }
  };
  const changeCategory = async () => {
    if (!bulkCategory) return; setProcessing(true); const results = await Promise.allSettled(selectedResources.map(resource => updateResource(resource.id, { ...resource, primary_category_id: bulkCategory }))); const failed = results.filter(result => result.status === 'rejected').length; const resultMessage = failed ? t.bulkPartial(results.length - failed, failed) : t.bulkCategoryChanged(results.length); setFeedback(resultMessage); notify(resultMessage); setSelected([]); setCategoryDialog(false); setBulkCategory(''); await refresh(); setProcessing(false);
  };
  const publishSelected = async () => {
    if (!selectedDrafts.length || !window.confirm(t.bulkPublishConfirm(selectedDrafts.length))) return;
    const ready = [];
    const skipped = [];
    selectedDrafts.forEach(resource => {
      const missing = getPublishRequirementKeys(resource);
      if (missing.length) skipped.push({ id: resource.id, title: localized(resource, 'title', lang), missing });
      else ready.push(resource);
    });
    setProcessing(true);
    const results = await Promise.allSettled(ready.map(resource => publishResource(resource.id)));
    const failed = results.flatMap((result, index) => result.status === 'rejected' ? [{ id: ready[index].id, title: localized(ready[index], 'title', lang), missing: ['publishFailed'] }] : []);
    const published = results.length - failed.length;
    const unresolved = [...skipped, ...failed];
    const resultMessage = t.bulkPublishResult(published, unresolved.length);
    setFeedback(resultMessage);
    notify(resultMessage);
    setSelected(unresolved.map(resource => resource.id));
    await refresh();
    setProcessing(false);
    setPublishReport({ published, unresolved });
  };
  const exportSelected = () => {
    const rows = selectedResources.map(resource => [resource.organization_name, resource.title_es, resource.title_en, resource.status, resourceCategories.find(item => item.id === resource.primary_category_id)?.[`label_${lang}`] || '', resource.last_verified_at, resource.updated_at]);
    const csv = [[t.organization, t.titleEs, t.titleEn, t.status, t.categories, t.verifiedDate, t.modified], ...rows].map(row => row.map(csvCell).join(',')).join('\n'); const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `puente-atx-recursos-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url); setFeedback(t.bulkExported(rows.length));
  };
  const rowActions = resource => ({ onDuplicate: () => duplicate(resource), onArchive: () => setArchiveDialog({ type: 'single', resource }), onRestore: async () => { await restoreResource(resource.id); notify(t.resourceRestored); refresh(); }, onPreview: () => navigate(`/recursos/${resource.slug}`), onDelete: canDeletePermanently ? () => setDeleteDialog(resource) : undefined });
  const updateFilter = setter => event => { setter(event.target.value); setPage(1); };
  const bulkActions = desktop => <section className="admin-bulk-bar" aria-label={t.bulkActions}><span className="admin-bulk-summary">{!desktop && <label><input ref={mobileSelectPageRef} type="checkbox" checked={allVisibleSelected} onChange={toggleVisible}/><span className="sr-only">{t.selectPage}</span></label>}<strong>{t.selectedCount(selected.length)}</strong></span><div><button className="admin-bulk-publish-button" disabled={processing || !selectedDrafts.length} onClick={publishSelected}><span className="material-symbols-outlined" aria-hidden="true">publish</span>{t.publish}</button><button disabled={processing} onClick={() => setArchiveDialog({ type: 'bulk' })}><span className="material-symbols-outlined" aria-hidden="true">archive</span>{t.archive}</button><button ref={desktop ? categoryTriggerRef : undefined} disabled={processing} onClick={() => setCategoryDialog(true)}><span className="material-symbols-outlined" aria-hidden="true">category</span>{t.changeCategory}</button><button disabled={processing} onClick={exportSelected}><span className="material-symbols-outlined" aria-hidden="true">file_export</span>{t.export}</button></div></section>;
  const sortLabel = sort === 'updated' ? t.modifiedRecent : 'A–Z';
  const nextSortLabel = sort === 'updated' ? 'A–Z' : t.modifiedRecent;

  return <><header className="admin-resource-header"><div><h1>{t.resources}</h1><p className="admin-resource-summary"><strong>{t.totalResources(resources.length)}</strong><span aria-hidden="true">·</span><span>{t.publishedResources(publishedCount)}</span></p></div><div className="admin-resource-header-actions"><button className="secondary-button admin-import-resource-button" onClick={() => navigate('/admin/recursos/importar')}><span className="material-symbols-outlined" aria-hidden="true">upload_file</span>{t.importCsv}</button><button className="primary-button admin-add-resource-button" onClick={() => navigate('/admin/recursos/nuevo')}><span aria-hidden="true">＋</span>{t.addResource}</button></div></header>
    <div className="admin-resource-filters"><label className="admin-resource-search"><span className="sr-only">{t.search}</span><span className="admin-resource-search-icon"><SearchIcon/></span><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder={t.searchPlaceholder}/></label><label><span className="sr-only">{t.categories}</span><select value={category} onChange={updateFilter(setCategory)}><option value="all">{t.allCategories}</option>{resourceCategories.map(item => <option key={item.id} value={item.id}>{item[`label_${lang}`]}</option>)}</select></label><label><span className="sr-only">{t.status}</span><select value={status} onChange={updateFilter(setStatus)}><option value="all">{t.allStatuses}</option><option value="published">{t.statusPublished}</option><option value="draft">{t.statusDraft}</option><option value="archived">{t.statusArchived}</option></select></label><label><span className="sr-only">{t.county}</span><select value={county} onChange={updateFilter(setCounty)}><option value="all">{t.allCounties}</option>{RESOURCE_COUNTIES.map(item => <option key={item} value={item}>{item}</option>)}</select></label><label><span className="sr-only">{t.verifiedDate}</span><select value={review} onChange={updateFilter(setReview)}><option value="all">{t.allVerification}</option><option value="recent">{t.recentlyUpdated}</option><option value="review">{t.needsReview}</option><option value="unverified">{t.unverified}</option></select></label><button type="button" className="admin-resource-sort-button" onClick={() => { setSort(value => value === 'updated' ? 'title' : 'updated'); setPage(1); }} aria-label={t.changeSort(sortLabel, nextSortLabel)} title={t.changeSort(sortLabel, nextSortLabel)}><span className="material-symbols-rounded" aria-hidden="true">swap_vert</span><span className="sr-only">{sortLabel}</span></button></div>
    <p className="sr-only" aria-live="polite">{feedback}</p>
    <div ref={tableWrapRef} className="admin-resource-table-wrap"><table className="admin-resource-table"><thead><tr className={selected.length > 0 ? 'admin-bulk-row' : undefined}><th className="admin-check-cell"><input ref={selectPageRef} type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} aria-label={t.selectPage}/></th>{selected.length > 0 ? <th colSpan="5">{bulkActions(true)}</th> : <><th>{t.resource}</th><th>{t.status}</th><th>{t.category}</th><th>{t.modified}</th><th><span className="sr-only">{t.actions}</span></th></>}</tr></thead><tbody>{visible.map(resource => { const checked = selected.includes(resource.id); const categoryItem = resourceCategories.find(item => item.id === resource.primary_category_id); return <tr key={resource.id} className={checked ? 'is-selected' : ''}><td className="admin-check-cell"><input type="checkbox" checked={checked} onChange={() => toggleSelected(resource.id)} aria-label={t.selectResource(localized(resource, 'title', lang))}/></td><td><strong>{localized(resource, 'title', lang)}</strong><span>{resource.organization_name}</span></td><td><span className={`status-badge status-${resource.status}`}>{statusLabel(resource.status, t)}</span></td><td>{categoryItem?.[`label_${lang}`]}</td><td>{new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium' }).format(new Date(resource.updated_at))}</td><td><div className="admin-table-actions"><button onClick={() => openEditor(resource.id)}><span className="material-symbols-outlined" aria-hidden="true">edit</span>{t.edit}</button><RowMenu resource={resource} t={t} {...rowActions(resource)}/></div></td></tr>; })}</tbody></table></div>
    <section className="admin-resource-mobile"><div className="admin-mobile-selection-bar">{selected.length > 0 ? bulkActions(false) : <label className="admin-mobile-select-page"><input ref={mobileSelectPageRef} type="checkbox" checked={allVisibleSelected} onChange={toggleVisible}/><span>{t.selectPageLabel}</span></label>}</div>{visible.map(resource => { const checked = selected.includes(resource.id); const categoryItem = resourceCategories.find(item => item.id === resource.primary_category_id); return <article key={resource.id} className={checked ? 'is-selected' : ''}><header><input type="checkbox" checked={checked} onChange={() => toggleSelected(resource.id)} aria-label={t.selectResource(localized(resource, 'title', lang))}/><div><h2>{localized(resource, 'title', lang)}</h2><p>{resource.organization_name}</p></div><RowMenu resource={resource} t={t} {...rowActions(resource)}/></header><dl><div><dt>{t.status}</dt><dd><span className={`status-badge status-${resource.status}`}>{statusLabel(resource.status, t)}</span></dd></div><div><dt>{t.category}</dt><dd>{categoryItem?.[`label_${lang}`]}</dd></div><div><dt>{t.modified}</dt><dd>{new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium' }).format(new Date(resource.updated_at))}</dd></div></dl><button className="admin-mobile-edit" onClick={() => openEditor(resource.id)}><span className="material-symbols-outlined" aria-hidden="true">edit</span>{t.edit}</button></article>; })}</section>
    {pageCount > 1 && <nav className="admin-pagination" aria-label={t.pagination}><p>{t.resourceRange(visibleStart, visibleEnd, filtered.length)}</p><div><button className="pagination-chevron" disabled={page === 1} onClick={() => setPage(value => value - 1)} aria-label={t.previousPage}><ChevronLeftIcon/></button>{pageItems.map((item, index) => item === 'ellipsis' ? <span className="pagination-ellipsis" aria-hidden="true" key={`ellipsis-${index}`}>…</span> : <button className={item === page ? 'is-current' : ''} aria-current={item === page ? 'page' : undefined} aria-label={t.pageLabel(item)} onClick={() => setPage(item)} key={item}>{item}</button>)}<button className="pagination-chevron is-next" disabled={page === pageCount} onClick={() => setPage(value => value + 1)} aria-label={t.nextPage}><ChevronLeftIcon/></button></div></nav>}
    {categoryDialog && <div className="admin-dialog-overlay" onMouseDown={event => event.target === event.currentTarget && setCategoryDialog(false)}><section ref={categoryDialogRef} className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="bulk-category-title"><h2 id="bulk-category-title">{t.changeCategory}</h2><p>{t.changeCategoryHelp(selected.length)}</p><label>{t.category}<select ref={categorySelectRef} value={bulkCategory} onChange={event => setBulkCategory(event.target.value)}><option value="">{t.chooseCategory}</option>{resourceCategories.map(item => <option value={item.id} key={item.id}>{item[`label_${lang}`]}</option>)}</select></label><div><button className="secondary-button" onClick={() => setCategoryDialog(false)}>{t.cancel}</button><button className="primary-button" disabled={!bulkCategory || processing} onClick={changeCategory}>{processing ? t.processing : t.applyChange}</button></div></section></div>}
    {publishReport && <div className="admin-dialog-overlay" onMouseDown={event => event.target === event.currentTarget && setPublishReport(null)}><section className="admin-dialog admin-publish-report" role="dialog" aria-modal="true" aria-labelledby="bulk-publish-title"><h2 id="bulk-publish-title">{t.bulkPublishTitle}</h2><p>{t.bulkPublishResult(publishReport.published, publishReport.unresolved.length)}</p>{publishReport.unresolved.length > 0 && <><h3>{t.bulkPublishNeedsAttention}</h3><ul>{publishReport.unresolved.map(resource => <li key={resource.id}><strong>{resource.title}</strong><span>{resource.missing.map(t.bulkRequirementLabel).join(', ')}</span></li>)}</ul></>}<div><button ref={publishReportRef} className="primary-button" onClick={() => setPublishReport(null)}>{t.bulkClose}</button></div></section></div>}
    <ConfirmDialog open={Boolean(archiveDialog)} title={archiveDialog?.type === 'bulk' ? t.bulkArchiveConfirm(selected.length) : t.archiveResourceConfirm} cancelLabel={t.cancel} confirmLabel={t.archive} busy={processing} onCancel={() => setArchiveDialog(null)} onConfirm={() => archiveDialog?.type === 'bulk' ? archiveSelected() : archiveOne(archiveDialog.resource)}/>
    <ConfirmDialog open={Boolean(deleteDialog)} title={deleteDialog ? t.deleteResourceConfirm(localized(deleteDialog, 'title', lang)) : ''} description={t.deleteResourceDescription} cancelLabel={t.cancel} confirmLabel={t.deletePermanently} busy={processing} onCancel={() => setDeleteDialog(null)} onConfirm={() => deleteOne(deleteDialog)}/>
  </>;
}
