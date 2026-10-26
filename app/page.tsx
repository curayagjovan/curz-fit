"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useAuth } from "@/app/context/auth-context";
import { usePageContext } from "@/app/context/page-context";
import LoginScreen from "@/app/components/login-screen";
import BottomNav from "@/app/components/bottom-nav";
import ProgramsPage from "@/app/pages/programs-page";
import ProgramEditorPage from "@/app/pages/program-editor-page";
import WorkoutPage from "@/app/pages/workout-page";
import HistoryPage from "@/app/pages/history-page";

export default function Page() {
  const { user, appUser, loading, signOut } = useAuth();
  const { currentPage, editingProgramId, closeProgramEditor } = usePageContext();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100dvh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !appUser) {
    return <LoginScreen />;
  }

  if (editingProgramId !== null) {
    return (
      <ProgramEditorPage
        programId={editingProgramId === "new" ? null : editingProgramId}
        onDone={closeProgramEditor}
      />
    );
  }

  const pageComponents: Record<string, React.ReactNode> = {
    programs: <ProgramsPage />,
    workout: <WorkoutPage />,
    history: <HistoryPage />,
  };

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky" sx={{ pt: "env(safe-area-inset-top)" }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            CURZ FIT
          </Typography>
          <Button size="small" onClick={() => void signOut()}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="sm"
        sx={{
          py: 3,
          pb: "calc(88px + env(safe-area-inset-bottom))",
          flexGrow: 1,
        }}
      >
        <Box
          key={currentPage}
          sx={{ animation: "page-enter 240ms cubic-bezier(0.32, 0.72, 0, 1)" }}
        >
          {pageComponents[currentPage] || <ProgramsPage />}
        </Box>
      </Container>

      <BottomNav />
    </Box>
  );
}
