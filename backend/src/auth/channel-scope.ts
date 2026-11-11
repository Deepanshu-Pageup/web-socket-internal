/**
 * True when a verified token's `channels` claim covers `channel`: an exact
 * match, or a prefix pattern ending in `.*` (the prefix keeps its dot, and the
 * channel must be longer than the prefix).
 */
export function canAccessChannel(patterns: readonly string[], channel: string): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -1);
      return channel.startsWith(prefix) && channel.length > prefix.length;
    }
    return pattern === channel;
  });
}
