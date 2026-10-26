"use client";

import { useEffect, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Exercise } from "@prisma/client";
import type { ProgramDetail, SessionDetail, SessionSummary } from "@/app/types";

type ExerciseTarget = {
  targetSets: number;
  targetReps: number;
  targetWeightKg: number | null;
};

function SetInputRow({
  defaultReps,
  defaultWeight,
  onAdd,
}: {
  defaultReps: string;
  defaultWeight: string;
  onAdd: (reps: number, weightKg: number) => Promise<void>;
}) {
  const [reps, setReps] = useState(defaultReps);
  const [weight, setWeight] = useState(defaultWeight);
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    const repsValue = Number(reps);
    const weightValue = Number(weight) || 0;
    if (!repsValue || repsValue <= 0) {
      return;
    }
    setBusy(true);
    try {
      await onAdd(repsValue, weightValue);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <TextField
        label="Reps"
        type="number"
        size="small"
        value={reps}
        onChange={(event) => setReps(event.target.value)}
        sx={{ width: 90 }}
      />
      <TextField
        label="Weight (kg)"
        type="number"
        size="small"
        value={weight}
        onChange={(event) => setWeight(event.target.value)}
        sx={{ width: 120 }}
      />
      <Button
        size="small"
        variant="contained"
        disabled={busy}
        onClick={() => void handleAdd()}
      >
        Add Set
      </Button>
    </Stack>
  );
}

function ExerciseBlock({
  exercise,
  target,
  sets,
  onAddSet,
  onDeleteSet,
}: {
  exercise: Exercise;
  target: ExerciseTarget | null;
  sets: SessionDetail["sets"];
  onAddSet: (exerciseId: string, reps: number, weightKg: number) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
}) {
  const lastSet = sets[sets.length - 1];
  const defaultReps = String(lastSet?.reps ?? target?.targetReps ?? 8);
  const defaultWeight = String(lastSet?.weightKg ?? target?.targetWeightKg ?? "");

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.25}>
          <Box>
            <Typography variant="subtitle1">{exercise.name}</Typography>
            {target ? (
              <Typography variant="caption" color="text.secondary">
                Target: {target.targetSets}×{target.targetReps}
                {target.targetWeightKg !== null ? ` @ ${target.targetWeightKg}kg` : ""}
              </Typography>
            ) : null}
          </Box>

          {sets.length > 0 ? (
            <Stack spacing={0.5}>
              {sets.map((set) => (
                <Stack
                  key={set.id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="body2">
                    Set {set.setNumber}: {set.reps} reps @ {set.weightKg}kg
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => void onDeleteSet(set.id)}
                    aria-label="Delete set"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          ) : null}

          <SetInputRow
            key={`${exercise.id}-${sets.length}`}
            defaultReps={defaultReps}
            defaultWeight={defaultWeight}
            onAdd={(reps, weightKg) => onAddSet(exercise.id, reps, weightKg)}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function WorkoutPage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [programs, setPrograms] = useState<ProgramDetail[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [extraExerciseIds, setExtraExerciseIds] = useState<string[]>([]);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [addExerciseChoice, setAddExerciseChoice] = useState<Exercise | null>(null);

  const refreshSession = async (sessionId: string) => {
    const response = await fetch(`/api/sessions/${sessionId}`, { cache: "no-store" });
    if (response.ok) {
      setSession(await response.json());
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [sessionsRes, exercisesRes] = await Promise.all([
        fetch("/api/sessions", { cache: "no-store" }),
        fetch("/api/exercises", { cache: "no-store" }),
      ]);

      if (cancelled) return;

      if (exercisesRes.ok) {
        setExercises(await exercisesRes.json());
      }

      if (sessionsRes.ok) {
        const summaries: SessionSummary[] = await sessionsRes.json();
        const active = summaries.find((item) => item.status === "IN_PROGRESS");
        if (active) {
          const detailRes = await fetch(`/api/sessions/${active.id}`, { cache: "no-store" });
          if (!cancelled && detailRes.ok) {
            setSession(await detailRes.json());
          }
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (session) {
      return;
    }
    let cancelled = false;

    fetch("/api/programs", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then(async (summaries: { id: string }[]) => {
        const details = await Promise.all(
          summaries.map((summary) =>
            fetch(`/api/programs/${summary.id}`, { cache: "no-store" }).then((response) =>
              response.ok ? (response.json() as Promise<ProgramDetail>) : null,
            ),
          ),
        );
        if (!cancelled) {
          setPrograms(details.filter((item): item is ProgramDetail => item !== null));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [session]);

  const startSession = async (programDayId: string | null) => {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(programDayId ? { programDayId } : {}),
    });
    if (response.ok) {
      const created = await response.json();
      setExtraExerciseIds([]);
      await refreshSession(created.id);
    }
  };

  const handleAddSet = async (exerciseId: string, reps: number, weightKg: number) => {
    if (!session) return;
    const existingForExercise = session.sets.filter((set) => set.exerciseId === exerciseId);
    const response = await fetch(`/api/sessions/${session.id}/sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId,
        setNumber: existingForExercise.length + 1,
        reps,
        weightKg,
      }),
    });
    if (response.ok) {
      await refreshSession(session.id);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!session) return;
    await fetch(`/api/sessions/${session.id}/sets/${setId}`, { method: "DELETE" });
    await refreshSession(session.id);
  };

  const handleFinish = async (status: "COMPLETED" | "CANCELLED") => {
    if (!session) return;
    await fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSession(null);
    setExtraExerciseIds([]);
  };

  const plannedExerciseIds = useMemo(
    () => new Set(session?.programDay?.exercises.map((item) => item.exerciseId) ?? []),
    [session],
  );

  const extraBlocks = useMemo(() => {
    if (!session) return [];
    const loggedNotPlanned = session.sets
      .map((set) => set.exerciseId)
      .filter((id) => !plannedExerciseIds.has(id));
    const ids = Array.from(new Set([...loggedNotPlanned, ...extraExerciseIds]));
    return ids
      .map((id) => exercises.find((exercise) => exercise.id === id))
      .filter((exercise): exercise is Exercise => Boolean(exercise));
  }, [session, plannedExerciseIds, extraExerciseIds, exercises]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4">Start a Workout</Typography>

        {programs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No programs yet — build one in the Programs tab, or start a freeform workout.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {programs.map((program) => (
              <Card key={program.id} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {program.name}
                  </Typography>
                  <Stack spacing={1}>
                    {program.days.map((day) => (
                      <CardActionArea
                        key={day.id}
                        onClick={() => void startSession(day.id)}
                        sx={{ borderRadius: 1.5, p: 1 }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">{day.name}</Typography>
                          <Chip size="small" label={`${day.exercises.length} exercises`} />
                        </Stack>
                      </CardActionArea>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        <Button variant="outlined" onClick={() => void startSession(null)}>
          Start Freeform Workout
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">{session.sessionNo}</Typography>
        <Typography variant="body2" color="text.secondary">
          {session.programDay?.name ?? "Freeform workout"}
        </Typography>
      </Box>

      {session.programDay?.exercises.map((programExercise) => (
        <ExerciseBlock
          key={programExercise.id}
          exercise={programExercise.exercise}
          target={{
            targetSets: programExercise.targetSets,
            targetReps: programExercise.targetReps,
            targetWeightKg: programExercise.targetWeightKg,
          }}
          sets={session.sets.filter((set) => set.exerciseId === programExercise.exerciseId)}
          onAddSet={handleAddSet}
          onDeleteSet={handleDeleteSet}
        />
      ))}

      {extraBlocks.map((exercise) => (
        <ExerciseBlock
          key={exercise.id}
          exercise={exercise}
          target={null}
          sets={session.sets.filter((set) => set.exerciseId === exercise.id)}
          onAddSet={handleAddSet}
          onDeleteSet={handleDeleteSet}
        />
      ))}

      <Button startIcon={<AddIcon />} onClick={() => setAddExerciseOpen(true)}>
        Add Exercise
      </Button>

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="outlined"
          color="error"
          fullWidth
          onClick={() => void handleFinish("CANCELLED")}
        >
          Discard
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={() => void handleFinish("COMPLETED")}
        >
          Finish Workout
        </Button>
      </Stack>

      <Dialog open={addExerciseOpen} onClose={() => setAddExerciseOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Exercise</DialogTitle>
        <DialogContent>
          <Autocomplete
            sx={{ pt: 1 }}
            options={exercises}
            getOptionLabel={(option) => option.name}
            value={addExerciseChoice}
            onChange={(_event, value) => setAddExerciseChoice(value)}
            renderInput={(params) => <TextField {...params} label="Exercise" autoFocus />}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddExerciseOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!addExerciseChoice}
            onClick={() => {
              if (addExerciseChoice) {
                setExtraExerciseIds((current) => Array.from(new Set([...current, addExerciseChoice.id])));
              }
              setAddExerciseChoice(null);
              setAddExerciseOpen(false);
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
