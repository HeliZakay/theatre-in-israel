/** Only allow relative URLs that don't start with // (protocol-relative). */
export function isValidCallbackUrl(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}
