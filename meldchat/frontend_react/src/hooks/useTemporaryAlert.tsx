// hooks/useTemporaryAlert.js
import { useState, useEffect, useRef } from 'react';

// hooks/useTemporaryAlert.js
export function useTemporaryAlert(duration = 3000, fadeOutDuration = 500) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const timeoutRef = useRef(null);
  const fadeOutTimeoutRef = useRef(null);

  const showAlert = () => {
    // Clear existing timeouts if any
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);

    // Reset fade state and ensure alert is shown
    setFadeOut(false);
    setIsAlertOpen(true);

    // Set new timeouts
    timeoutRef.current = setTimeout(() => {
      setFadeOut(true);

      fadeOutTimeoutRef.current = setTimeout(() => {
        setIsAlertOpen(false);
        setFadeOut(false);
      }, fadeOutDuration);
    }, duration);
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);
    };
  }, []);

  return { isAlertOpen, fadeOut, showAlert };
}
