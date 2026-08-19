const STORAGE_KEY = 'puente-atx.admin-resource-navigation.v1';

export const saveAdminResourceNavigation = ({ ids, returnSearch }) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ids, returnSearch }));
  } catch {
    // Navigation still works with the unfiltered resource collection.
  }
};

export const readAdminResourceNavigation = returnSearch => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY));
    if (!stored || stored.returnSearch !== returnSearch || !Array.isArray(stored.ids)) return null;
    return stored;
  } catch {
    return null;
  }
};

export const createAdminResourceSearch = ({ query, status, category, county, review, sort, page }) => {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (status !== 'all') params.set('status', status);
  if (category !== 'all') params.set('category', category);
  if (county !== 'all') params.set('county', county);
  if (review !== 'all') params.set('review', review);
  if (sort !== 'updated') params.set('sort', sort);
  if (page > 1) params.set('page', String(page));
  const value = params.toString();
  return value ? `?${value}` : '';
};
