"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import AppUpdateBanner from "@/app/components/app-update-banner";
import ConnectivityBanner from "@/app/components/connectivity-banner";
import NotificationPermissionManager from "@/app/components/notification-permission-manager";
import { AuthProvider } from "@/app/context/auth-context";
import { PageProvider } from "@/app/context/page-context";
import { useViewportHeightSync } from "@/app/hooks/use-viewport-height";
import appTheme from "@/app/theme";

export default function Providers({ children }: { children: React.ReactNode }) {
  useViewportHeightSync();

  return (
    <AppRouterCacheProvider>
      <ThemeProvider
        theme={appTheme}
        defaultMode="system"
        disableTransitionOnChange
      >
        <CssBaseline enableColorScheme />
        <AppUpdateBanner />
        <ConnectivityBanner />
        <AuthProvider>
          <PageProvider>{children}</PageProvider>
          <NotificationPermissionManager />
        </AuthProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
