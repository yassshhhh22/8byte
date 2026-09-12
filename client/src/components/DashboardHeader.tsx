import * as Tooltip from "@radix-ui/react-tooltip";
import { Moon, RefreshCw, Sun, WalletCards } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";
import type { AggregateQuoteStatus } from "../types/portfolio";
import type { Theme, ThemeRevealOrigin } from "../hooks/useTheme";
import { formatTimestamp } from "../utils/formatting";
import { IconButton } from "./ui/IconButton";
import { SourceStatus } from "./SourceStatus";

interface DashboardHeaderProps {
  generatedAt: string;
  fundamentalsAt?: string;
  yahooStatus: AggregateQuoteStatus;
  googleStatus: AggregateQuoteStatus;
  yahooCoverage: string;
  googleCoverage?: string;
  isRefreshing: boolean;
  theme: Theme;
  onRefresh: () => void;
  onToggleTheme: (origin: ThemeRevealOrigin) => void;
}

export function DashboardHeader(props: DashboardHeaderProps) {
  const reduceMotion = useReducedMotion();

  // This wrapper is used ONLY to get the exact
  // location of the theme toggle button.
  const themeButtonRef = useRef<HTMLSpanElement>(null);

  const handleThemeToggle = () => {
    const element = themeButtonRef.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();

    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    props.onToggleTheme({
      x,
      y,
    });
  };

  return (
    <Tooltip.Provider delayDuration={350}>
      <header className="app-header">
        <div className="app-shell flex h-full items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : {
                      rotate: props.isRefreshing ? 8 : 0,
                    }
              }
              className="brand-mark"
            >
              <WalletCards
                aria-hidden="true"
                size={19}
                strokeWidth={1.8}
              />
            </motion.div>

            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <h1 className="truncate text-[15px] font-semibold text-[var(--text)] sm:text-base">
                  Portfolio Dashboard
                </h1>

                <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)] sm:inline">
                  Live overview
                </span>
              </div>

              <p className="truncate text-[11px] text-[var(--muted)] sm:text-xs">
                Prices {formatTimestamp(props.generatedAt)}

                <span
                  className="mx-1.5"
                  aria-hidden="true"
                >
                  /
                </span>

                Fundamentals{" "}
                {formatTimestamp(props.fundamentalsAt)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 xl:flex">
              <SourceStatus
                label="Yahoo"
                status={props.yahooStatus}
                detail={props.yahooCoverage}
              />

              <SourceStatus
                label="Google"
                status={props.googleStatus}
                detail={props.googleCoverage}
              />
            </div>

            <IconButton
              disabled={props.isRefreshing}
              label={
                props.isRefreshing
                  ? "Refreshing data"
                  : "Refresh all data"
              }
              onClick={props.onRefresh}
            >
              <RefreshCw
                aria-hidden="true"
                className={
                  props.isRefreshing && !reduceMotion
                    ? "animate-spin"
                    : ""
                }
                size={17}
              />
            </IconButton>

            {/* IMPORTANT:
                We measure THIS wrapper instead of relying
                on event.currentTarget.
            */}
            <span
              ref={themeButtonRef}
              className="inline-flex"
            >
              <IconButton
                label={`Switch to ${
                  props.theme === "dark"
                    ? "light"
                    : "dark"
                } theme`}
                onClick={handleThemeToggle}
              >
                {props.theme === "dark" ? (
                  <Sun
                    aria-hidden="true"
                    size={17}
                  />
                ) : (
                  <Moon
                    aria-hidden="true"
                    size={17}
                  />
                )}
              </IconButton>
            </span>
          </div>
        </div>
      </header>

      <div className="app-shell mt-3 flex flex-wrap gap-2 xl:hidden">
        <SourceStatus
          label="Yahoo"
          status={props.yahooStatus}
          detail={props.yahooCoverage}
        />

        <SourceStatus
          label="Google"
          status={props.googleStatus}
          detail={props.googleCoverage}
        />
      </div>
    </Tooltip.Provider>
  );
}