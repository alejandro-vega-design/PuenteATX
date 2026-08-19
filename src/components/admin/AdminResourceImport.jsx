import React, { useState } from 'react';
import { createResource, updateResource } from '../../data/repository';
import { applyImportVerificationDate, csvTemplate, parseCsv, prepareCsvResources } from '../../data/csvImport';
import { ChevronLeftIcon } from '../Icons';

const downloadTemplate = () => {
  const url = URL.createObjectURL(new Blob([csvTemplate()], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'puente-atx-plantilla-recursos.csv';
  link.click();
  URL.revokeObjectURL(url);
};

export default function AdminResourceImport({ t, existingResources, refresh, navigate, notify }) {
  const previewImporting = import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('previewImporting') === '1';
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [importing, setImporting] = useState(false);
  const [markVerifiedToday, setMarkVerifiedToday] = useState(true);
  const [updateMode, setUpdateMode] = useState('empty');
  const [parsedSource, setParsedSource] = useState(null);

  const preparePreview = (parsed, mode) => {
    const prepared = prepareCsvResources(parsed, existingResources, mode);
    if (!parsed.records.length) setMessage(t.csvNoRows);
    else if (prepared.missingHeaders.length) setMessage(t.csvMissingHeaders(prepared.missingHeaders));
    else {
      setPreview(prepared);
      if (prepared.truncated) setMessage(t.csvLimitNotice);
    }
  };

  const chooseFile = async event => {
    const file = event.target.files?.[0];
    setPreview(null);
    setMessage('');
    setFileName(file?.name || '');
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage(t.csvFileTooLarge);
      return;
    }
    try {
      const parsed = parseCsv(await file.text());
      setParsedSource(parsed);
      preparePreview(parsed, updateMode);
    } catch {
      setMessage(t.csvReadError);
    }
  };

  const validRows = preview?.rows.filter(row => row.errors.length === 0) || [];
  const actionableRows = validRows.filter(row => row.action === 'create' || row.action === 'update');
  const createCount = validRows.filter(row => row.action === 'create').length;
  const updateCount = validRows.filter(row => row.action === 'update').length;
  const unchangedCount = validRows.filter(row => row.action === 'unchanged').length;
  const invalidCount = preview?.rows.length ? preview.rows.length - validRows.length : 0;
  const importRows = async () => {
    if (!actionableRows.length || importing) return;
    if (updateMode === 'included' && !window.confirm(t.csvReplaceConfirm(actionableRows.length))) return;
    setImporting(true);
    setMessage('');
    let created = 0;
    let updated = 0;
    const failedRows = [];
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    for (const row of actionableRows) {
      try {
        if (row.action === 'update') {
          const patch = { ...row.patch };
          if (updateMode === 'empty' && markVerifiedToday && !row.existingResource.last_verified_at && !patch.last_verified_at) patch.last_verified_at = today;
          await updateResource(row.existingResource.id, patch);
          updated += 1;
        } else {
          await createResource(applyImportVerificationDate(row.resource, markVerifiedToday, today));
          created += 1;
        }
      } catch (error) {
        console.error(`Unable to import CSV row ${row.rowNumber}`, error);
        failedRows.push(row.rowNumber);
      }
    }
    await refresh();
    setImporting(false);
    if (failedRows.length) {
      setMessage(t.csvPartialImport(created, updated, failedRows));
      notify(t.csvImportCompleted(created, updated));
    } else {
      notify(t.csvImportCompleted(created, updated));
      navigate('/admin/recursos');
    }
  };

  return <>
    <button className="admin-back-link" onClick={() => navigate('/admin/recursos')}><ChevronLeftIcon/>{t.backToResources}</button>
    <header className="admin-page-header"><h1>{t.importCsvTitle}</h1></header>
    <section className="admin-csv-import">
      <div className="admin-csv-intro">
        <h2>{t.csvPrepareTitle}</h2>
        <p>{t.csvPrepareText}</p>
        <ul><li>{t.csvRuleDraft}</li><li>{t.csvRuleUpdates}</li><li>{t.csvRuleLists}</li><li>{t.csvRuleCategories}</li><li>{t.csvRuleNormalization}</li><li>{t.csvRuleLimit}</li></ul>
        <button className="secondary-button" type="button" onClick={downloadTemplate}>{t.downloadCsvTemplate}</button>
      </div>
      <label className="admin-csv-file">
        <span>{t.chooseCsv}</span>
        <input type="file" accept=".csv,text/csv" onChange={chooseFile}/>
        {fileName && <small>{fileName}</small>}
      </label>
      <fieldset className="admin-csv-update-mode">
        <legend>{t.csvUpdateMode}</legend>
        <label><input type="radio" name="csv-update-mode" value="empty" checked={updateMode === 'empty'} onChange={() => { setUpdateMode('empty'); if (parsedSource) preparePreview(parsedSource, 'empty'); }}/><span><strong>{t.csvFillEmpty}</strong><small>{t.csvFillEmptyHelp}</small></span></label>
        <label><input type="radio" name="csv-update-mode" value="included" checked={updateMode === 'included'} onChange={() => { setUpdateMode('included'); if (parsedSource) preparePreview(parsedSource, 'included'); }}/><span><strong>{t.csvUpdateIncluded}</strong><small>{t.csvUpdateIncludedHelp}</small></span></label>
      </fieldset>
      <label className="admin-csv-verification-option">
        <input type="checkbox" checked={markVerifiedToday} disabled={updateMode === 'included'} onChange={event => setMarkVerifiedToday(event.target.checked)}/>
        <span><strong>{t.csvVerifyToday}</strong><small>{t.csvVerifyTodayHelp}</small></span>
      </label>
      {message && <p className="admin-form-message" role="status">{message}</p>}
      {(preview || previewImporting) && <section className="admin-csv-preview" aria-labelledby="csv-preview-title">
        <header><div><h2 id="csv-preview-title">{t.csvPreviewTitle}</h2><p>{t.csvPreviewSummary(createCount, updateCount, unchangedCount, invalidCount)}</p></div><button className="primary-button admin-import-progress-button" disabled={!actionableRows.length || importing || previewImporting} aria-busy={importing || previewImporting} onClick={importRows}>{(importing || previewImporting) && <span className="admin-button-spinner" aria-hidden="true"/>}<span>{importing || previewImporting ? t.csvImporting : t.csvApplyChanges(actionableRows.length)}</span></button></header>
        {preview && <div className="admin-csv-table-wrap"><table><thead><tr><th>{t.csvRow}</th><th>{t.organization}</th><th>{t.resource}</th><th>{t.category}</th><th>{t.csvValidation}</th></tr></thead><tbody>{preview.rows.map(row => <tr key={row.rowNumber} className={row.errors.length ? 'has-errors' : row.warnings.length ? 'has-warnings' : ''}><td>{row.rowNumber}</td><td>{row.resource.organization_name || '—'}</td><td>{row.resource.title_es || row.resource.title_en || '—'}</td><td>{row.category || '—'}</td><td>{row.errors.length ? row.errors.map(key => t.csvErrorLabel(key, row.errorValues?.[key])).join(', ') : <><span>{t.csvActionLabel(row.action, row.patch, updateMode)}</span>{row.action === 'update' && <details className="admin-csv-change-preview"><summary>{t.csvReviewChanges}</summary>{Object.entries(row.patch).map(([field, value]) => <div key={field}><strong>{t.csvFieldLabel(field)}</strong><span><del>{Array.isArray(row.existingResource?.[field]) ? row.existingResource[field].join(', ') : row.existingResource?.[field] || '—'}</del><ins>{Array.isArray(value) ? value.join(', ') : String(value)}</ins></span></div>)}</details>}{row.warnings.length > 0 && <small className="admin-csv-warning">{[...new Set(row.warnings.map(key => t.csvWarningLabel(key.split(':')[0])))].join(' · ')}</small>}</>}</td></tr>)}</tbody></table></div>}
      </section>}
    </section>
  </>;
}
