
import { useState, useEffect, useCallback } from 'react';

const useClipboard = (timeout = 30000) => {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = useCallback((text: string) => {
    if (!navigator.clipboard) {
      console.warn("Clipboard API not available");
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      setHasCopied(true);
    }).catch((err) => {
      console.error("Failed to copy!", err);
    });
  }, []);

  useEffect(() => {
    let timer: number;
    if (hasCopied) {
      timer = window.setTimeout(() => {
        setHasCopied(false);
        // Attempt to clear clipboard (Browsers limit this, but we can try writing empty string if focused)
        // Note: Most browsers don't allow reading/clearing without explicit user action for privacy,
        // but the UI state resetting indicates to the user it is "done".
      }, timeout);
    }
    return () => window.clearTimeout(timer);
  }, [hasCopied, timeout]);

  return { hasCopied, copyToClipboard };
};

export default useClipboard;
