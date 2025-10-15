import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { logAudit } from "@/lib/auditLog";

const editProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "cancelled"]),
  progress: z.number().min(0).max(100),
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    progress: number;
    barangay_id: string;
  } | null;
  onSuccess: () => void;
}

export const EditProjectDialog = ({ open, onOpenChange, project, onSuccess }: EditProjectDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
  });

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description || "",
        status: project.status as "active" | "completed" | "cancelled",
        progress: project.progress,
      });
    }
  }, [project, reset]);

  const progressValue = watch("progress") || 0;

  const onSubmit = async (data: EditProjectFormData) => {
    if (!project) return;

    setLoading(true);

    const { error } = await supabase
      .from("projects")
      .update({
        title: data.title,
        description: data.description || null,
        status: data.status,
        progress: data.progress,
      })
      .eq("id", project.id);

    if (error) {
      toast({
        title: "Error updating project",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Log the audit
      await logAudit({
        action: "project_update",
        tableName: "projects",
        recordId: project.id,
        barangayId: project.barangay_id,
        details: {
          title: data.title,
          status: data.status,
          progress: data.progress,
        },
      });

      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      onSuccess();
      onOpenChange(false);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!project) return;

    if (!confirm("Are you sure you want to delete this project?")) return;

    setLoading(true);

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Log the audit
      await logAudit({
        action: "project_delete",
        tableName: "projects",
        recordId: project.id,
        barangayId: project.barangay_id,
        details: {
          title: project.title,
        },
      });

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      onSuccess();
      onOpenChange(false);
    }

    setLoading(false);
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Project Title*</Label>
            <Input
              id="edit-title"
              {...register("title")}
              placeholder="Enter project title"
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              {...register("description")}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="edit-status">Status*</Label>
            <Select
              value={watch("status")}
              onValueChange={(value: "active" | "completed" | "cancelled") => setValue("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-progress">Progress: {progressValue}%</Label>
            <Slider
              id="edit-progress"
              min={0}
              max={100}
              step={5}
              value={[progressValue]}
              onValueChange={(value) => setValue("progress", value[0])}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
