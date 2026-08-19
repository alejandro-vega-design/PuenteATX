import React, { useEffect, useState } from 'react';
import { getCategories, updateCategory } from '../../data/repository';

export default function AdminCategories({ t, notify }) {
  const [categories, setCategories] = useState([]); const [dirtyIds, setDirtyIds] = useState([]); const [message, setMessage] = useState('');
  useEffect(() => { getCategories({ admin: true }).then(setCategories); }, []);
  const update = (id, key, value) => { setCategories(current => current.map(category => category.id === id ? { ...category, [key]: value } : category)); setDirtyIds(current => current.includes(id) ? current : [...current, id]); };
  const save = async category => { try { await updateCategory(category.id, category); setDirtyIds(current => current.filter(id => id !== category.id)); setMessage(''); notify(t.categoryUpdated); } catch { setMessage(t.saveError); } };
  const controls = category => [
    <label key="es"><span className="sr-only">Español</span><input value={category.label_es} onChange={event => update(category.id, 'label_es', event.target.value)}/></label>,
    <label key="en"><span className="sr-only">English</span><input value={category.label_en} onChange={event => update(category.id, 'label_en', event.target.value)}/></label>,
    <label key="order"><span className="sr-only">{t.order}</span><input type="number" value={category.sort_order} onChange={event => update(category.id, 'sort_order', Number(event.target.value))}/></label>,
    <label className="admin-active" key="active"><input type="checkbox" checked={category.is_active} onChange={event => update(category.id, 'is_active', event.target.checked)}/><span className="sr-only">{t.active}</span></label>
  ];
  return <><header className="admin-page-header"><h1>{t.categoryLabels}</h1></header>{message && <p className="admin-form-message" aria-live="polite">{message}</p>}
    <div className="admin-category-table-wrap"><table className="admin-category-table"><thead><tr><th><span className="sr-only">{t.categoryIcon}</span></th><th>Español</th><th>English</th><th>{t.order}</th><th>{t.active}</th><th><span className="sr-only">{t.actions}</span></th></tr></thead><tbody>{categories.map(category => <tr key={category.id}><td><img src={category.icon_path} alt=""/></td><td>{controls(category)[0]}</td><td>{controls(category)[1]}</td><td>{controls(category)[2]}</td><td>{controls(category)[3]}</td><td><button className="secondary-button" disabled={!dirtyIds.includes(category.id)} onClick={() => save(category)}>{t.save}</button></td></tr>)}</tbody></table></div>
    <section className="admin-category-mobile">{categories.map(category => <article key={category.id}><header><img src={category.icon_path} alt=""/><strong>{category.label_es}</strong></header><div className="admin-category-mobile-fields"><label>Español<input value={category.label_es} onChange={event => update(category.id, 'label_es', event.target.value)}/></label><label>English<input value={category.label_en} onChange={event => update(category.id, 'label_en', event.target.value)}/></label><label>{t.order}<input type="number" value={category.sort_order} onChange={event => update(category.id, 'sort_order', Number(event.target.value))}/></label><label className="admin-active"><input type="checkbox" checked={category.is_active} onChange={event => update(category.id, 'is_active', event.target.checked)}/>{t.active}</label></div><button className="secondary-button" disabled={!dirtyIds.includes(category.id)} onClick={() => save(category)}>{t.save}</button></article>)}</section>
  </>;
}
