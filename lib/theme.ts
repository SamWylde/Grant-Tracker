import { Card, createTheme, Paper } from "@mantine/core";

export const appTheme = createTheme({
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  headings: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    sizes: {
      h1: { fontSize: "2.75rem", fontWeight: "700" }
    }
  },
  colors: {
    midnight: [
      "#edf2ff",
      "#dbe4ff",
      "#bac8ff",
      "#91a7ff",
      "#748ffc",
      "#5c7cfa",
      "#4c6ef5",
      "#4263eb",
      "#3b5bdb",
      "#364fc7"
    ]
  },
  primaryColor: "midnight",
  primaryShade: 6,
  other: {
    surface: {
      primary: "rgba(8, 18, 40, 0.7)",
      primarySoft: "rgba(8, 17, 40, 0.65)",
      primaryStrong: "rgba(8, 17, 40, 0.8)",
      sunken: "rgba(6, 14, 32, 0.6)",
      sunkenStrong: "rgba(6, 14, 32, 0.7)",
      overlay: "rgba(2, 10, 28, 0.7)",
      backdrop: "rgba(2, 8, 23, 0.7)",
      overlayStrong: "rgba(2, 10, 28, 0.8)",
      indigo: "rgba(10, 24, 50, 0.6)",
      board: "rgba(10, 22, 45, 0.7)",
      navy: "rgba(10, 28, 60, 0.7)",
      deep: "rgba(12, 24, 50, 0.65)",
      elevated: "rgba(15, 23, 42, 0.65)",
      elevatedStrong: "rgba(15, 23, 42, 0.7)",
      elevatedSoft: "rgba(15, 23, 42, 0.6)",
      highlight: "rgba(10, 20, 45, 0.65)",
      positiveTint: "rgba(16, 89, 70, 0.4)",
      positive: "rgba(46, 160, 67, 0.12)",
      info: "rgba(56, 128, 246, 0.12)",
      purple: "rgba(142, 84, 233, 0.12)"
    },
    border: {
      subtle: "rgba(255, 255, 255, 0.05)",
      default: "rgba(255, 255, 255, 0.08)",
      strong: "rgba(255, 255, 255, 0.1)",
      positive: "rgba(46, 160, 67, 0.4)",
      info: "rgba(56, 128, 246, 0.3)",
      purple: "rgba(142, 84, 233, 0.3)"
    }
  },
  components: {
    Paper: Paper.extend({
      variants: {
        surfacePrimary: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.primary,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfacePrimarySoft: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.primarySoft,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfacePrimaryStrong: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.primaryStrong,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceSunken: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.sunken,
            borderColor: theme.other.border.subtle,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceSunkenStrong: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.sunkenStrong,
            borderColor: theme.other.border.subtle,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceOverlay: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.overlay,
            borderColor: theme.other.border.strong,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceBackdrop: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.backdrop,
            borderColor: theme.other.border.strong,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceOverlayStrong: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.overlayStrong,
            borderColor: theme.other.border.strong,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceIndigo: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.indigo,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceBoard: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.board,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceDeep: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.deep,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceElevated: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.elevated,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceElevatedStrong: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.elevatedStrong,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceElevatedSoft: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.elevatedSoft,
            borderColor: theme.other.border.subtle,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceHighlight: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.highlight,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceNavy: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.navy,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfacePositiveTint: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.positiveTint,
            borderColor: theme.other.border.positive,
            backdropFilter: "blur(16px)"
          }
        }),
        surfacePositive: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.positive,
            borderColor: theme.other.border.positive,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceInfo: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.info,
            borderColor: theme.other.border.info,
            backdropFilter: "blur(16px)"
          }
        }),
        surfacePurple: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.purple,
            borderColor: theme.other.border.purple,
            backdropFilter: "blur(16px)"
          }
        })
      }
    }),
    Card: Card.extend({
      variants: {
        surfacePrimary: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.primary,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfacePrimaryStrong: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.primaryStrong,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceSunken: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.sunken,
            borderColor: theme.other.border.subtle,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceSunkenStrong: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.sunkenStrong,
            borderColor: theme.other.border.subtle,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceOverlay: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.overlay,
            borderColor: theme.other.border.strong,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceBackdrop: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.backdrop,
            borderColor: theme.other.border.strong,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceOverlayStrong: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.overlayStrong,
            borderColor: theme.other.border.strong,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceIndigo: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.indigo,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceBoard: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.board,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceElevated: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.elevated,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceElevatedStrong: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.elevatedStrong,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceElevatedSoft: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.elevatedSoft,
            borderColor: theme.other.border.subtle,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceHighlight: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.highlight,
            borderColor: theme.other.border.default,
            backdropFilter: "blur(16px)"
          }
        }),
        surfacePositive: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.positive,
            borderColor: theme.other.border.positive,
            backdropFilter: "blur(16px)"
          }
        }),
        surfaceInfo: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.info,
            borderColor: theme.other.border.info,
            backdropFilter: "blur(16px)"
          }
        }),
        surfacePurple: (theme) => ({
          root: {
            backgroundColor: theme.other.surface.purple,
            borderColor: theme.other.border.purple,
            backdropFilter: "blur(16px)"
          }
        })
      }
    })
  }
});

export type AppTheme = typeof appTheme;
