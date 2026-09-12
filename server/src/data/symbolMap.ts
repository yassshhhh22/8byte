import { HOLDINGS } from "./holdings.js";
import type { ConfiguredHolding, ProviderSymbols } from "../types/portfolio.js";

export const SYMBOL_MAP: Readonly<Record<string, ProviderSymbols>> = {
  "hdfc-bank": { yahooSymbol: "HDFCBANK.NS", googleSymbol: "HDFCBANK:NSE" },
  "bajaj-finance": { yahooSymbol: "BAJFINANCE.NS", googleSymbol: "BAJFINANCE:NSE" },
  "icici-bank": { yahooSymbol: "ICICIBANK.BO", googleSymbol: "532174:BOM" },
  "bajaj-housing": { yahooSymbol: "BAJAJHFL.BO", googleSymbol: "544252:BOM" },
  "savani-financials": { yahooSymbol: "MANTRA.BO", googleSymbol: "511577:BOM" },
  "affle-india": { yahooSymbol: "AFFLE.NS", googleSymbol: "AFFLE:NSE" },
  "lti-mindtree": { yahooSymbol: "LTM.NS", googleSymbol: "LTM:NSE" },
  "kpit-tech": { yahooSymbol: "KPITTECH.BO", googleSymbol: "542651:BOM" },
  "tata-tech": { yahooSymbol: "TATATECH.BO", googleSymbol: "544028:BOM" },
  "bls-e-services": { yahooSymbol: "BLSE.BO", googleSymbol: "544107:BOM" },
  "tanla": { yahooSymbol: "TANLA.BO", googleSymbol: "532790:BOM" },
  "dmart": { yahooSymbol: "DMART.NS", googleSymbol: "DMART:NSE" },
  "tata-consumer": { yahooSymbol: "TATACONSUM.BO", googleSymbol: "532540:BOM" },
  "pidilite": { yahooSymbol: "PIDILITIND.BO", googleSymbol: "500331:BOM" },
  "tata-power": { yahooSymbol: "TATAPOWER.BO", googleSymbol: "500400:BOM" },
  "kpi-green": { yahooSymbol: "KPIGREEN.BO", googleSymbol: "542323:BOM" },
  "suzlon": { yahooSymbol: "SUZLON.BO", googleSymbol: "532667:BOM" },
  "gensol": { yahooSymbol: "GENSOL.BO", googleSymbol: "542851:BOM" },
  "hariom-pipes": { yahooSymbol: "HARIOMPIPE.BO", googleSymbol: "543517:BOM" },
  "astral": { yahooSymbol: "ASTRAL.NS", googleSymbol: "ASTRAL:NSE" },
  "polycab": { yahooSymbol: "POLYCAB.BO", googleSymbol: "542652:BOM" },
  "clean-science": { yahooSymbol: "CLEAN.BO", googleSymbol: "543318:BOM" },
  "deepak-nitrite": { yahooSymbol: "DEEPAKNTR.BO", googleSymbol: "506401:BOM" },
  "fine-organic": { yahooSymbol: "FINEORG.BO", googleSymbol: "541557:BOM" },
  "gravita": { yahooSymbol: "GRAVITA.BO", googleSymbol: "533282:BOM" },
  "sbi-life": { yahooSymbol: "SBILIFE.BO", googleSymbol: "540719:BOM" },
};

export const CONFIGURED_HOLDINGS: readonly ConfiguredHolding[] = HOLDINGS.map((holding) => {
  const symbols = SYMBOL_MAP[holding.id];
  if (!symbols) {
    throw new Error(`Missing provider symbols for ${holding.id}`);
  }
  return { ...holding, ...symbols };
});
