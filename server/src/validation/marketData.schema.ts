import { z } from "zod";

export const yahooQuoteSchema = z
  .object({
    symbol: z.string().min(1),
    regularMarketPrice: z.number().finite().positive(),
    marketState: z.string().nullable().optional(),
    regularMarketTime: z.union([z.date(), z.string(), z.number()]).nullable().optional(),
  })
  .passthrough();

export const refreshQuerySchema = z.object({
  refresh: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

