"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Fab from "@mui/material/Fab";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { usePageContext } from "@/app/context/page-context";
import type { ProgramSummary } from "@/app/types";

export default function ProgramsPage() {
  const { openProgramEditor } = usePageContext();
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPrograms = useCallback(() => {
    return fetch("/api/programs", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: ProgramSummary[]) => setPrograms(data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

  const handleDelete = async (event: React.MouseEvent, programId: string) => {
    event.stopPropagation();
    if (!window.confirm("Delete this program?")) {
      return;
    }
    await fetch(`/api/programs/${programId}`, { method: "DELETE" });
    void loadPrograms();
  };

  return (
    <Box sx={{ position: "relative", minHeight: "100%" }}>
      <Stack spacing={1.5}>
        <Typography variant="h4">Programs</Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : programs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No programs yet. Tap + to build your first one.
          </Typography>
        ) : (
          programs.map((program) => (
            <Card key={program.id} variant="outlined">
              <CardActionArea onClick={() => openProgramEditor(program.id)}>
                <CardContent
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>
                      {program.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {program.dayCount} day{program.dayCount === 1 ? "" : "s"} •{" "}
                      {program.exerciseCount} exercise{program.exerciseCount === 1 ? "" : "s"}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(event) => void handleDelete(event, program.id)}
                    aria-label="Delete program"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardContent>
              </CardActionArea>
            </Card>
          ))
        )}
      </Stack>

      <Fab
        color="primary"
        aria-label="New program"
        onClick={() => openProgramEditor("new")}
        sx={{ position: "fixed", bottom: 88, right: 20 }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
