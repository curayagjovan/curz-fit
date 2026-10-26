"use client";

import { useEffect, useMemo, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import type { Exercise } from "@prisma/client";
import type { ProgramDetail } from "@/app/types";

type DraftExercise = {
  key: string;
  id?: string;
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeightKg: number | null;
  notes: string | null;
};

type DraftDay = {
  key: string;
  id?: string;
  name: string;
  exercises: DraftExercise[];
};

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `k-${Date.now()}-${Math.random()}`;
}

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) {
    return list;
  }
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function ProgramEditorPage({
  programId,
  onDone,
}: {
  programId: string | null;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<DraftDay[]>([]);
  const [loading, setLoading] = useState(Boolean(programId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [exerciseDialog, setExerciseDialog] = useState<{
    dayKey: string;
    editingKey: string | null;
    exercise: Exercise | null;
    targetSets: string;
    targetReps: string;
    targetWeightKg: string;
    notes: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/exercises", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Exercise[]) => setExercises(data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!programId) {
      return;
    }

    let cancelled = false;

    fetch(`/api/programs/${programId}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((program: ProgramDetail | null) => {
        if (cancelled || !program) {
          return;
        }
        setName(program.name);
        setDescription(program.description ?? "");
        setDays(
          program.days.map((day) => ({
            key: day.id,
            id: day.id,
            name: day.name,
            exercises: day.exercises.map((exercise) => ({
              key: exercise.id,
              id: exercise.id,
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exercise.name,
              targetSets: exercise.targetSets,
              targetReps: exercise.targetReps,
              targetWeightKg: exercise.targetWeightKg,
              notes: exercise.notes,
            })),
          })),
        );
      })
      .catch(() => setError("Unable to load program"))
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [programId]);

  const canSave = name.trim().length > 0 && !saving;

  const handleAddDay = () => {
    setDays((current) => [
      ...current,
      { key: newKey(), name: `Day ${current.length + 1}`, exercises: [] },
    ]);
  };

  const handleRemoveDay = (dayKey: string) => {
    setDays((current) => current.filter((day) => day.key !== dayKey));
  };

  const handleMoveDay = (index: number, direction: -1 | 1) => {
    setDays((current) => moveItem(current, index, direction));
  };

  const handleDayNameChange = (dayKey: string, value: string) => {
    setDays((current) =>
      current.map((day) => (day.key === dayKey ? { ...day, name: value } : day)),
    );
  };

  const openAddExerciseDialog = (dayKey: string) => {
    setExerciseDialog({
      dayKey,
      editingKey: null,
      exercise: null,
      targetSets: "3",
      targetReps: "10",
      targetWeightKg: "",
      notes: "",
    });
  };

  const openEditExerciseDialog = (dayKey: string, exercise: DraftExercise) => {
    setExerciseDialog({
      dayKey,
      editingKey: exercise.key,
      exercise: exercises.find((item) => item.id === exercise.exerciseId) ?? null,
      targetSets: String(exercise.targetSets),
      targetReps: String(exercise.targetReps),
      targetWeightKg: exercise.targetWeightKg === null ? "" : String(exercise.targetWeightKg),
      notes: exercise.notes ?? "",
    });
  };

  const handleSaveExerciseDialog = () => {
    if (!exerciseDialog || !exerciseDialog.exercise) {
      return;
    }

    const draft: DraftExercise = {
      key: exerciseDialog.editingKey ?? newKey(),
      id: exerciseDialog.editingKey
        ? days
            .find((day) => day.key === exerciseDialog.dayKey)
            ?.exercises.find((exercise) => exercise.key === exerciseDialog.editingKey)?.id
        : undefined,
      exerciseId: exerciseDialog.exercise.id,
      exerciseName: exerciseDialog.exercise.name,
      targetSets: Math.max(1, Number(exerciseDialog.targetSets) || 1),
      targetReps: Math.max(1, Number(exerciseDialog.targetReps) || 1),
      targetWeightKg:
        exerciseDialog.targetWeightKg.trim() === ""
          ? null
          : Number(exerciseDialog.targetWeightKg),
      notes: exerciseDialog.notes.trim() || null,
    };

    setDays((current) =>
      current.map((day) => {
        if (day.key !== exerciseDialog.dayKey) {
          return day;
        }

        if (exerciseDialog.editingKey) {
          return {
            ...day,
            exercises: day.exercises.map((exercise) =>
              exercise.key === exerciseDialog.editingKey ? draft : exercise,
            ),
          };
        }

        return { ...day, exercises: [...day.exercises, draft] };
      }),
    );

    setExerciseDialog(null);
  };

  const handleRemoveExercise = (dayKey: string, exerciseKey: string) => {
    setDays((current) =>
      current.map((day) =>
        day.key === dayKey
          ? { ...day, exercises: day.exercises.filter((exercise) => exercise.key !== exerciseKey) }
          : day,
      ),
    );
  };

  const handleMoveExercise = (dayKey: string, index: number, direction: -1 | 1) => {
    setDays((current) =>
      current.map((day) =>
        day.key === dayKey ? { ...day, exercises: moveItem(day.exercises, index, direction) } : day,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      days: days.map((day, dayIndex) => ({
        id: day.id,
        name: day.name.trim() || `Day ${dayIndex + 1}`,
        order: dayIndex,
        exercises: day.exercises.map((exercise, exerciseIndex) => ({
          id: exercise.id,
          exerciseId: exercise.exerciseId,
          order: exerciseIndex,
          targetSets: exercise.targetSets,
          targetReps: exercise.targetReps,
          targetWeightKg: exercise.targetWeightKg,
          notes: exercise.notes,
        })),
      })),
    };

    try {
      const response = await fetch(
        programId ? `/api/programs/${programId}` : "/api/programs",
        {
          method: programId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Unable to save program");
      }

      onDone();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save program");
    } finally {
      setSaving(false);
    }
  };

  const availableExercises = useMemo(
    () => [...exercises].sort((a, b) => a.name.localeCompare(b.name)),
    [exercises],
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100dvh" }}>
      <AppBar position="sticky" sx={{ pt: "env(safe-area-inset-top)" }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton edge="start" onClick={onDone} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {programId ? "Edit Program" : "New Program"}
          </Typography>
          <Button variant="contained" disabled={!canSave} onClick={() => void handleSave()}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          {error ? (
            <Typography variant="body2" color="error.main">
              {error}
            </Typography>
          ) : null}

          <TextField
            label="Program Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          <Divider />

          {days.map((day, dayIndex) => (
            <Card key={day.key} variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TextField
                      value={day.name}
                      onChange={(event) => handleDayNameChange(day.key, event.target.value)}
                      size="small"
                      sx={{ flexGrow: 1 }}
                    />
                    <IconButton
                      size="small"
                      disabled={dayIndex === 0}
                      onClick={() => handleMoveDay(dayIndex, -1)}
                      aria-label="Move day up"
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={dayIndex === days.length - 1}
                      onClick={() => handleMoveDay(dayIndex, 1)}
                      aria-label="Move day down"
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveDay(day.key)}
                      aria-label="Delete day"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  <Stack spacing={1}>
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <Box
                        key={exercise.key}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 1.25,
                          py: 1,
                          borderRadius: 2,
                          bgcolor: "action.hover",
                        }}
                      >
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {exercise.exerciseName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {exercise.targetSets}×{exercise.targetReps}
                            {exercise.targetWeightKg !== null
                              ? ` @ ${exercise.targetWeightKg}kg`
                              : ""}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          disabled={exerciseIndex === 0}
                          onClick={() => handleMoveExercise(day.key, exerciseIndex, -1)}
                          aria-label="Move exercise up"
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={exerciseIndex === day.exercises.length - 1}
                          onClick={() => handleMoveExercise(day.key, exerciseIndex, 1)}
                          aria-label="Move exercise down"
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openEditExerciseDialog(day.key, exercise)}
                          aria-label="Edit exercise"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveExercise(day.key, exercise.key)}
                          aria-label="Remove exercise"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>

                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => openAddExerciseDialog(day.key)}
                  >
                    Add Exercise
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}

          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddDay}>
            Add Day
          </Button>
        </Stack>
      </Container>

      <Dialog
        open={Boolean(exerciseDialog)}
        onClose={() => setExerciseDialog(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {exerciseDialog?.editingKey ? "Edit Exercise" : "Add Exercise"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Autocomplete
              options={availableExercises}
              getOptionLabel={(option) => option.name}
              value={exerciseDialog?.exercise ?? null}
              onChange={(_event, value) =>
                setExerciseDialog((current) => (current ? { ...current, exercise: value } : current))
              }
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Stack>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.muscleGroup}
                    </Typography>
                  </Stack>
                </Box>
              )}
              renderInput={(params) => <TextField {...params} label="Exercise" autoFocus />}
            />
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Sets"
                type="number"
                value={exerciseDialog?.targetSets ?? ""}
                onChange={(event) =>
                  setExerciseDialog((current) =>
                    current ? { ...current, targetSets: event.target.value } : current,
                  )
                }
                fullWidth
              />
              <TextField
                label="Reps"
                type="number"
                value={exerciseDialog?.targetReps ?? ""}
                onChange={(event) =>
                  setExerciseDialog((current) =>
                    current ? { ...current, targetReps: event.target.value } : current,
                  )
                }
                fullWidth
              />
              <TextField
                label="Weight (kg)"
                type="number"
                value={exerciseDialog?.targetWeightKg ?? ""}
                onChange={(event) =>
                  setExerciseDialog((current) =>
                    current ? { ...current, targetWeightKg: event.target.value } : current,
                  )
                }
                fullWidth
              />
            </Stack>
            <TextField
              label="Notes (optional)"
              value={exerciseDialog?.notes ?? ""}
              onChange={(event) =>
                setExerciseDialog((current) =>
                  current ? { ...current, notes: event.target.value } : current,
                )
              }
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setExerciseDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!exerciseDialog?.exercise}
            onClick={handleSaveExerciseDialog}
          >
            {exerciseDialog?.editingKey ? "Save" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
