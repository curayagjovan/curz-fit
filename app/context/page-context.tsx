"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type AppPage = "programs" | "workout" | "history";

type PageContextType = {
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  editingProgramId: string | "new" | null;
  openProgramEditor: (id: string | "new") => void;
  closeProgramEditor: () => void;
};

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<AppPage>("programs");
  const [editingProgramId, setEditingProgramId] = useState<string | "new" | null>(null);

  return (
    <PageContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        editingProgramId,
        openProgramEditor: setEditingProgramId,
        closeProgramEditor: () => setEditingProgramId(null),
      }}
    >
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePageContext must be used within PageProvider");
  }
  return context;
}
