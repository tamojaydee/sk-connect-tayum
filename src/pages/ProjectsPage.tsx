import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDetailsDialog } from "@/components/ProjectDetailsDialog";

const ProjectsPage = () => {
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const { data: activeProjects, isLoading: isLoadingActive } = useQuery({
    queryKey: ["projects", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          barangay:barangays(name),
          creator:profiles(full_name),
          project_photos(photo_url)
        `)
        .eq("status", "active")
        .is("archived_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: completedProjects, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ["projects", "completed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          barangay:barangays(name),
          creator:profiles(full_name),
          project_photos(photo_url)
        `)
        .eq("status", "completed")
        .is("archived_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
            Current Projects
          </h1>
          <p className="text-muted-foreground">
            View all active projects across barangays
          </p>
        </div>

        {isLoadingActive ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects?.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        )}

        <div className="mt-16 mb-8">
          <h2 className="text-3xl font-heading font-bold text-foreground mb-2">
            Completed Projects
          </h2>
          <p className="text-muted-foreground">
            View all completed projects across barangays
          </p>
        </div>

        {isLoadingCompleted ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : completedProjects && completedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No completed projects yet
          </div>
        )}

        {selectedProject && (
          <ProjectDetailsDialog
            project={selectedProject}
            open={!!selectedProject}
            onOpenChange={(open) => !open && setSelectedProject(null)}
            showInteractiveFeatures={false}
          />
        )}
      </main>
    </div>
  );
};

export default ProjectsPage;
