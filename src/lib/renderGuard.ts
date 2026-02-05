// Render Guard utility for dashboard stability
export async function safe<T>(asyncFn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await asyncFn();
  } catch {
    return fallback;
  }
}
