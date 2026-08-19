import React, { useEffect, useRef, useState } from 'react';

export default function StatusToast({ toast, onClose, closeLabel }) {
  const [exiting, setExiting] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!toast) return undefined;
    setExiting(false);
    const timer = window.setTimeout(() => setExiting(true), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!toast || !exiting) return undefined;
    const timer = window.setTimeout(() => onCloseRef.current(), 240);
    return () => window.clearTimeout(timer);
  }, [toast, exiting]);

  if (!toast) return null;
  return <div className={`admin-toast${exiting ? ' is-exiting' : ''}`} role="status" aria-live="polite"><span className="admin-toast-icon" aria-hidden="true"/><span className="admin-toast-message">{toast.message}</span><button onClick={() => setExiting(true)} aria-label={closeLabel}>×</button></div>;
}
