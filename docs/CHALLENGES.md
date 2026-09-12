# Implementation Challenges

## Separating Active Holdings from Workbook History

**Why it happened:** The workbook includes sector rows, an active portfolio total, blank separators, and three sold positions in the same sheet.

**Investigation:** The source range was inspected by row and reconciled independently against each sector subtotal.

**Solution:** Only the 26 records above the ₹1,543,060 active total are represented in holdings.ts. Sold rows are named explicitly in a regression test.

**Trade-off:** Portfolio changes require a reviewed code update rather than automatic workbook ingestion.

**Verification:** Tests assert the holding count, unique IDs, sector totals, total investment, and sold-position exclusions.

## Provider-Specific Exchange Identifiers

**Why it happened:** The workbook mixes NSE tickers and numeric BSE codes, while Yahoo and Google require different suffix or exchange formats.

**Investigation:** A live smoke run initially resolved only 7 of 26 Yahoo quotes. Direct provider searches showed that Yahoo expects BSE trading symbols such as `ICICIBANK.BO`, while the workbook stores numeric BSE scrip codes. The same check caught LTIMindtree's February 2026 ticker change from `LTIM` to `LTM`.

**Solution:** Each holding has explicit Yahoo and Google symbols. Yahoo uses current trading symbols with `.NS` or `.BO`; Google uses NSE symbols or numeric BSE codes. No runtime guessing is performed.

**Trade-off:** Symbol mappings must be maintained when a company changes ticker or listing.

**Verification:** Static tests require both mappings for all 26 holdings. After the corrections, the live smoke command resolved 26 of 26 Yahoo quotes and 26 of 26 Google fundamentals.

## Preserving Meaningful Totals During Partial Quote Failures

**Why it happened:** Summing only 25 priced holdings would make an incomplete portfolio look like a large loss.

**Investigation:** Available-value sums and last-known-good behavior were considered separately.

**Solution:** Stale cached quotes remain usable. Without a usable quote, affected market totals become null while investment and coverage counts remain visible.

**Trade-off:** The dashboard temporarily withholds a total instead of showing an explicitly partial sum.

**Verification:** Aggregation tests cover complete, stale, partial, and fully unavailable portfolios.

## Parsing Google Finance Without Generated Class Names

**Why it happened:** Google Finance has no supported public endpoint for these fields and its HTML classes may change.

**Investigation:** The first live browser pass showed all fundamentals as null even though the provider pages were reachable. Inspecting the markup revealed that each label's immediate sibling was an explanatory tooltip; the real value followed the tooltip wrapper or appeared in the next financial-table cell.

**Solution:** Cheerio locates P/E and EPS by visible labels, skips tooltip and hidden siblings, then reads the first real value container without relying on generated classes. It normalizes punctuation and treats explicit placeholders as null.

**Trade-off:** A major content or language change can still break parsing.

**Verification:** Saved fixtures cover complete metrics, missing P/E, negative EPS, an unexpected page structure, and the observed tooltip/table wrapper shape. The corrected live run returned P/E for 22 holdings and EPS for 20; the remaining fields were explicit provider omissions.
