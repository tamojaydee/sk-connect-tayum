import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    progress: number;
    budget: number | null;
    created_at: string;
    barangays?: {
      name: string;
    };
    profiles?: {
      full_name: string;
    };
    project_photos?: Array<{
      photo_url: string;
    }>;
  };
  onClick: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-secondary text-secondary-foreground";
      case "completed":
        return "bg-primary text-primary-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const firstPhoto = project.project_photos?.[0]?.photo_url;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
      onClick={onClick}
    >
      {firstPhoto && (
        <div className="h-48 w-full overflow-hidden">
          <img 
            src={firstPhoto} 
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{project.title}</CardTitle>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} />
        </div>

        {project.budget && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>₱{Number(project.budget).toLocaleString()}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>{format(new Date(project.created_at), "MMM dd, yyyy")}</span>
        </div>

        {project.barangays && (
          <div className="text-sm">
            <span className="text-muted-foreground">Barangay: </span>
            <span className="font-medium">{project.barangays.name}</span>
          </div>
        )}

        {project.profiles && (
          <div className="text-sm">
            <span className="text-muted-foreground">Created by: </span>
            <span className="font-medium">{project.profiles.full_name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
