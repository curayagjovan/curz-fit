"use client";

import Paper from "@mui/material/Paper";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import HistoryIcon from "@mui/icons-material/History";
import { usePageContext, type AppPage } from "@/app/context/page-context";

export default function BottomNav() {
  const { currentPage, setCurrentPage } = usePageContext();

  return (
    <Paper
      elevation={0}
      sx={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: 1,
        borderColor: "divider",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <BottomNavigation
        value={currentPage}
        onChange={(_event, value: AppPage) => setCurrentPage(value)}
        showLabels
      >
        <BottomNavigationAction
          label="Programs"
          value="programs"
          icon={<FitnessCenterIcon />}
        />
        <BottomNavigationAction
          label="Workout"
          value="workout"
          icon={<PlayCircleIcon />}
        />
        <BottomNavigationAction
          label="History"
          value="history"
          icon={<HistoryIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
}
