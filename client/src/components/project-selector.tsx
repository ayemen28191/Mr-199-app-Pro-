import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartGantt, Building2, Star, CheckCircle2, Clock, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@shared/schema";

interface ProjectSelectorProps {
  selectedProjectId?: string;
  onProjectChange: (projectId: string, projectName?: string) => void;
  showHeader?: boolean;
  variant?: "default" | "compact" | "premium";
  className?: string;
}

export default function ProjectSelector({ 
  selectedProjectId, 
  onProjectChange, 
  showHeader = true,
  variant = "default",
  className = ""
}: ProjectSelectorProps) {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  // دالة معالجة تغيير المشروع مع تمرير اسم المشروع
  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    console.log('🔄 تغيير المشروع في ProjectSelector:', { projectId, projectName: project?.name });
    onProjectChange(projectId, project?.name);
  };

  if (variant === "compact") {
    return (
      <div className={`space-y-2 ${className}`}>
        <Select value={selectedProjectId} onValueChange={handleProjectChange} disabled={isLoading}>
          <SelectTrigger className="w-full h-12 bg-white/90 backdrop-blur-sm border-white/30 text-gray-800 font-medium">
            <SelectValue placeholder="اختر المشروع..." />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {project.name}
                  <Badge variant="secondary" className="mr-auto">
                    {project.status === 'active' ? 'نشط' : 'مكتمل'}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (variant === "premium") {
    return (
      <Card className={`mb-6 border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50 to-indigo-50 overflow-hidden project-selector-premium project-selector-card transition-all duration-500 ${className}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-blue-500/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        {showHeader && (
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <FolderOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    اختيار المشروع النشط
                  </h2>
                  <p className="text-sm text-gray-600">اختر المشروع لعرض التقارير والإحصائيات</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {projects.length} مشروع متاح
              </Badge>
            </div>
          </CardHeader>
        )}
        
        <CardContent className="p-6 pt-2 relative">
          <div className="space-y-4">
            <Select value={selectedProjectId} onValueChange={handleProjectChange} disabled={isLoading}>
              <SelectTrigger className="w-full h-14 bg-white border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 text-gray-800 font-medium rounded-xl shadow-sm">
                <div className="flex items-center gap-3 w-full">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <SelectValue placeholder="اختر المشروع..." />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200 shadow-2xl rounded-xl">
                {projects.map((project) => (
                  <SelectItem 
                    key={project.id} 
                    value={project.id}
                    className="py-3 px-4 hover:bg-blue-50 transition-colors duration-200 project-option"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-800">{project.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            نشط
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            مكتمل
                          </Badge>
                        )}
                        {selectedProjectId === project.id && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedProject && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">المشروع المحدد:</p>
                    <p className="font-bold text-blue-900">{selectedProject.name}</p>
                  </div>
                  <div className="mr-auto">
                    <Badge className="bg-blue-500 text-white">
                      {selectedProject.status === 'active' ? 'مشروع نشط' : 'مشروع مكتمل'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mb-4 ${className}`}>
      <CardContent className="p-4">
        {showHeader && (
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center">
            <ChartGantt className="ml-2 h-5 w-5 text-primary" />
            اختر المشروع
          </h2>
        )}
        <Select value={selectedProjectId} onValueChange={handleProjectChange} disabled={isLoading}>
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
