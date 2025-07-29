import { useState, useEffect } from "react";

const SELECTED_PROJECT_KEY = "construction-app-selected-project";

export function useSelectedProject() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // تحميل المشروع المحفوظ عند بدء التطبيق
  useEffect(() => {
    const savedProjectId = localStorage.getItem(SELECTED_PROJECT_KEY);
    if (savedProjectId) {
      setSelectedProjectId(savedProjectId);
    }
  }, []);

  // حفظ المشروع في localStorage عند تغييره
  const selectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (projectId) {
      localStorage.setItem(SELECTED_PROJECT_KEY, projectId);
    } else {
      localStorage.removeItem(SELECTED_PROJECT_KEY);
    }
  };

  return {
    selectedProjectId,
    selectProject,
  };
}