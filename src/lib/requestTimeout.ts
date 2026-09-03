/** Fails server-side Firebase calls quickly when a local network is unavailable. */
export function withTimeout<T>(promise: Promise<T>, milliseconds = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timed out')), milliseconds))
  ]);
}
