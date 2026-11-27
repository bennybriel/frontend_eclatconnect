import { useEffect } from 'react';

// Closes a modal when the Escape key is pressed, and returns keyboard focus
// to whatever was focused before the modal opened.
export function useEscapeToClose(onClose: () => void, active: boolean = true) {
  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
    // onClose changes identity on every render; only re-run when the modal opens or closes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
