import { useEffect, useState } from 'react';
import { clearSavedResources, getSavedResources, importSharedList, subscribeSavedResources, toggleResource } from '../services/savedResources';

export function useSavedResources() {
  const [slugs, setSlugs] = useState(getSavedResources);
  useEffect(() => subscribeSavedResources(setSlugs), []);
  return { slugs, toggle: slug => setSlugs(toggleResource(slug)), clear: () => setSlugs(clearSavedResources()), importList: values => setSlugs(importSharedList(values)), isSaved: slug => slugs.includes(slug) };
}
