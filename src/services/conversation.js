// Personal information is sent directly to the server endpoint and is never
// persisted in browser storage.
export async function submitConversationRequest(form, lang) {
  const response = await fetch('/api/conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...form, lang })
  });
  if (!response.ok) throw new Error('conversation_request_failed');
  return response.json();
}
