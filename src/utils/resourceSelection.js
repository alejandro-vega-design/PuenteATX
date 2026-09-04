export function toggleVisibleSelection(currentIds, visibleIds) {
  const uniqueVisibleIds = [...new Set(visibleIds)];
  if (!uniqueVisibleIds.length) return currentIds;

  const currentSet = new Set(currentIds);
  if (uniqueVisibleIds.every(id => currentSet.has(id))) {
    const visibleSet = new Set(uniqueVisibleIds);
    return currentIds.filter(id => !visibleSet.has(id));
  }

  return [...new Set([...currentIds, ...uniqueVisibleIds])];
}
