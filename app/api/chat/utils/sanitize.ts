// File: app/api/chat/utils/sanitize.ts

export function sanitizeInput(input: string): string {
  // Implement sanitization logic as needed
  // For example, escape special characters to prevent injection attacks
  return input.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
}
