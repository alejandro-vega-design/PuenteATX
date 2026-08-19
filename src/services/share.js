export const canonicalResourceUrl = slug => `${window.location.origin}/recursos/${slug}`;
export const sharedListUrl = slugs => `${window.location.origin}/mi-lista?recursos=${encodeURIComponent([...new Set(slugs)].slice(0, 20).join(','))}`;

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Firefox can expose the API while still denying a particular write.
    }
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.readOnly = true;
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  input.style.top = '0';
  document.body.appendChild(input);
  input.focus();
  input.select();
  input.setSelectionRange(0, input.value.length);
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('Clipboard copy was not available');
  return true;
}

export async function shareLink({ title, text, url }) {
  const shareData = { title, text, url };
  if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await copyText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export const openWhatsApp = text => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
