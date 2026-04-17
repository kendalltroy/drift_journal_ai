export function isTokenExpired(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(atob(padded));
    return (decoded.exp ?? 0) < Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}
