import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { usePersistentState } from "./usePersistentState";

export type Theme = "dark" | "light";

export interface ThemeRevealOrigin {
  x: number;
  y: number;
}

interface ViewTransitionDocument extends Document {
  startViewTransition?: (
    update: () => void,
  ) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
}

export function useTheme() {
  const [theme, setTheme] =
    usePersistentState<Theme>(
      "portfolio-theme",
      "dark",
    );

  const transitionInProgress =
    useRef(false);

  useEffect(() => {
    document.documentElement.dataset.theme =
      theme;

    document.documentElement.style.colorScheme =
      theme;
  }, [theme]);

  const toggleTheme = (
    origin?: ThemeRevealOrigin,
  ) => {
    if (transitionInProgress.current) {
      return;
    }

    const nextTheme: Theme =
      theme === "dark"
        ? "light"
        : "dark";

    const transitionDocument =
      document as ViewTransitionDocument;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

    if (
      !origin ||
      !transitionDocument.startViewTransition ||
      reduceMotion
    ) {
      setTheme(nextTheme);
      return;
    }

    /*
     * These are VIEWPORT coordinates.
     *
     * For your screenshot they should be approximately:
     *
     * x ≈ 1390
     * y ≈ 20
     *
     * NOT x ≈ 700.
     */
    const x = origin.x;
    const y = origin.y;

    transitionInProgress.current = true;

    const transition =
      transitionDocument.startViewTransition(
        () => {
          document.documentElement.dataset.theme =
            nextTheme;

          document.documentElement.style.colorScheme =
            nextTheme;

          flushSync(() => {
            setTheme(nextTheme);
          });
        },
      );

    void transition.ready
      .then(() => {
        /*
         * Calculate the distance from our button
         * to every corner.
         *
         * The largest distance is the radius
         * required to cover the whole screen.
         */

        const distanceTopLeft =
          Math.hypot(x, y);

        const distanceTopRight =
          Math.hypot(
            window.innerWidth - x,
            y,
          );

        const distanceBottomLeft =
          Math.hypot(
            x,
            window.innerHeight - y,
          );

        const distanceBottomRight =
          Math.hypot(
            window.innerWidth - x,
            window.innerHeight - y,
          );

        const radius = Math.max(
          distanceTopLeft,
          distanceTopRight,
          distanceBottomLeft,
          distanceBottomRight,
        );

        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 700,

            easing:
              "cubic-bezier(0.76, 0, 0.24, 1)",

            pseudoElement:
              "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {
        transitionInProgress.current = false;
      });

    void transition.finished.finally(
      () => {
        transitionInProgress.current =
          false;
      },
    );
  };

  return {
    theme,
    toggleTheme,
  };
}