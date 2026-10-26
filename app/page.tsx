"use client";

import { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { Exercise } from "@prisma/client";
import { useAuth } from "@/app/context/auth-context";
import LoginScreen from "@/app/components/login-screen";

export default function Page() {
  const { user, appUser, loading, signOut } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);

  useEffect(() => {
    if (!appUser) {
      return;
    }

    let cancelled = false;

    fetch("/api/exercises", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Exercise[]) => {
        if (!cancelled) {
          setExercises(data);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setExercisesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [appUser]);

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

  return (
    <Box sx={{ minHeight: "100dvh" }}>
      <AppBar position="sticky">
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
          animation: "page-enter 240ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4">
              Hi, {appUser.displayName || appUser.email.split("@")[0]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ready for a workout?
            </Typography>
          </Box>

          <Typography variant="subtitle1">Exercise Library</Typography>

          {exercisesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Stack spacing={1.25}>
              {exercises.map((exercise) => (
                <Card key={exercise.id} variant="outlined">
                  <CardContent
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1">
                        {exercise.name}
                      </Typography>
                      {exercise.equipment ? (
                        <Typography variant="body2" color="text.secondary">
                          {exercise.equipment}
                        </Typography>
                      ) : null}
                    </Box>
                    <Chip
                      size="small"
                      label={exercise.muscleGroup}
                      color="primary"
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
