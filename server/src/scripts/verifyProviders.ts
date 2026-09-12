import { CONFIGURED_HOLDINGS } from "../data/symbolMap.js";
import { GoogleFinanceProvider } from "../providers/googleFinance.provider.js";
import { YahooFinanceProvider } from "../providers/yahooFinance.provider.js";
import { FundamentalsService } from "../services/fundamentals.service.js";

async function verifyProviders() {
  const yahoo = await new YahooFinanceProvider().fetchQuotes(CONFIGURED_HOLDINGS);
  const missingYahoo = CONFIGURED_HOLDINGS.filter(
    (holding) => yahoo.get(holding.id)?.cmp === null,
  );

  const fundamentals = await new FundamentalsService(
    new GoogleFinanceProvider(),
  ).getFundamentals(CONFIGURED_HOLDINGS, true);
  const missingGoogle = fundamentals.holdings.filter(
    (holding) => holding.status === "unavailable",
  );

  console.log(
    `Yahoo quotes: ${CONFIGURED_HOLDINGS.length - missingYahoo.length}/${CONFIGURED_HOLDINGS.length}`,
  );
  if (missingYahoo.length > 0) {
    console.log(`Yahoo unavailable: ${missingYahoo.map((holding) => holding.id).join(", ")}`);
  }

  console.log(
    `Google fundamentals: ${fundamentals.meta.available}/${CONFIGURED_HOLDINGS.length}`,
  );
  if (missingGoogle.length > 0) {
    console.log(`Google unavailable: ${missingGoogle.map((holding) => holding.holdingId).join(", ")}`);
  }

  if (missingYahoo.length > 0 || missingGoogle.length > 0) {
    process.exitCode = 1;
  }
}

verifyProviders().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Provider verification failed");
  process.exitCode = 1;
});

