"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import type { SessionDetail, SessionSummary } from "@/app/types";

const STATUS_COLOR: Record<SessionSummary["status"], "success" | "default" | "warning"> = {
  COMPLETED: "success",
  CANCELLED: "default",
  IN_PROGRESS: "warning",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<SessionDetail | null>(null);

  useEffect(() => {
    fetch("/api/sessions", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: SessionSummary[]) => setSessions(data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const openDetail = async (sessionId: string) => {
    const response = await fetch(`/api/sessions/${sessionId}`, { cache: "no-store" });
    if (response.ok) {
      setDetail(await response.json());
    }
  };

  const groupedSets = useMemo(() => {
    if (!detail) return [];
    const byExercise = new Map<string, { name: string; sets: SessionDetail["sets"] }>();
    for (const set of detail.sets) {
      const entry = byExercise.get(set.exerciseId) ?? { name: set.exerciseName, sets: [] };
      entry.sets.push(set);
      byExercise.set(set.exerciseId, entry);
    }
    return Array.from(byExercise.values());
  }, [detail]);

  return (
    <Stack spacing={1.5}>
      <Typography variant="h4">History</Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : sessions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No workouts logged yet.
        </Typography>
      ) : (
        sessions.map((session) => (
          <Card key={session.id} variant="outlined">
            <CardActionArea onClick={() => void openDetail(session.id)}>
              <CardContent
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <Box>
                  <Typography variant="subtitle1">
                    {session.programDayName ?? "Freeform workout"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(session.startedAt)} • {session.setCount} set
                    {session.setCount === 1 ? "" : "s"}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={session.status.replace("_", " ")}
                  color={STATUS_COLOR[session.status]}
                />
              </CardContent>
            </CardActionArea>
          </Card>
        ))
      )}

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {detail?.programDay?.name ?? "Freeform workout"}
          <IconButton size="small" onClick={() => setDetail(null)} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {detail ? (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {formatDate(detail.startedAt)}
              </Typography>
              {groupedSets.map((group) => (
                <Box key={group.name}>
                  <Typography variant="subtitle2">{group.name}</Typography>
                  <Stack spacing={0.25} sx={{ pl: 1 }}>
                    {group.sets.map((set) => (
                      <Typography key={set.id} variant="body2" color="text.secondary">
                        Set {set.setNumber}: {set.reps} reps @ {set.weightKg}kg
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              ))}
              {detail.note ? (
                <Typography variant="body2" color="text.secondary">
                  Note: {detail.note}
                </Typography>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
