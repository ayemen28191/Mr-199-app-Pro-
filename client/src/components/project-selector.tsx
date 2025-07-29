import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartGantt } from "lucide-react";
import type { Project } from "@shared/schema";

interface ProjectSelectorProps {
  selectedProjectId?: string;
  onProjectChange: (projectId: string) => void;
}

export default function ProjectSelector({ selectedProjectId, onProjectChange }: ProjectSelectorProps) {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center">
          <ChartGantt className="ml-2 h-5 w-5 text-primary" />
          اختر المشروع
        </h2>
        <Select value={selectedProjectId} onValueChange={onProjectChange} disabled={isLoading}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر المشروع..." />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
