/**
 * Shared keyboard handler for reader navigation.
 * Used by both the main window and the iframe document.
 */
export function handleReaderKeyboard(
  event: KeyboardEvent,
  pagination: { prev: () => void; next: () => void }
) {
  if (event.defaultPrevented) return;

  const target = event.target as HTMLElement | null;
  if (target) {
    // Ignore if typing in an input, textarea, etc.
    if (/input|textarea|select|button/i.test(target.tagName)) return;
    
    // Ignore contenteditable elements
    if (target.isContentEditable) return;
    
    // Ignore sliders (common in Radix UI)
    if (target.getAttribute("role") === "slider") return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    pagination.prev();
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    pagination.next();
  }
}
