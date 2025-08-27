import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProjectContextType {
  selectedProjectId: string | null;
  selectedProjectName: string | null;
  setSelectedProject: (id: string | null, name?: string) => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);

  const setSelectedProject = (id: string | null, name?: string) => {
    setSelectedProjectId(id);
    setSelectedProjectName(name || null);
  };

  return (
    <ProjectContext.Provider value={{
      selectedProjectId,
      selectedProjectName,
      setSelectedProject
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};