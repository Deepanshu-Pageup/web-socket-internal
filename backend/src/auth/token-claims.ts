import { z } from 'zod';

/** Exact channel name, or a prefix pattern ending in `.*`. */
export const scopePatternRegex =
  /^(?:[A-Za-z0-9][A-Za-z0-9._:-]{0,127}|[A-Za-z0-9][A-Za-z0-9._:-]{0,125}\.\*)$/;

export const tokenClaimsSchema = z.strictObject({
  sub: z.string().min(1).max(128),
  dep: z.string().min(1).max(64),
  iat: z.number().int(),
  exp: z.number().int(),
  channels: z.array(z.string().regex(scopePatternRegex)).max(100),
});

export type TokenClaims = z.infer<typeof tokenClaimsSchema>;

export const tokenFormatVersion = 'v1';
export const maxTokenLength = 4096;
export const keyIdRegex = /^[A-Za-z0-9_-]{1,32}$/;
