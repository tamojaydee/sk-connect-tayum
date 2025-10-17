import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { logAudit } from "@/lib/auditLog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapboxLocationPicker } from "./MapboxLocationPicker";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  budget: z.string().optional(),
  barangay_id: z.string().min(1, "Barangay is required"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface AddProjectFormProps {
  barangays: Array<{ id: string; name: string }>;
  userBarangayId?: string;
  isMainAdmin: boolean;
  onSuccess: () => void;
}

export const AddProjectForm = ({ barangays, userBarangayId, isMainAdmin, onSuccess }: AddProjectFormProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      barangay_id: userBarangayId || "",
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a project",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data: newProject, error } = await supabase.from("projects").insert({
      title: data.title,
      description: data.description || null,
      budget: data.budget ? Number(data.budget) : 0,
      barangay_id: data.barangay_id,
      created_by: user.id,
      status: "active",
      progress: 0,
      location_address: selectedLocation?.address || null,
      location_lat: selectedLocation?.lat || null,
      location_lng: selectedLocation?.lng || null,
    }).select().single();

    if (error) {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Log the audit
      await logAudit({
        action: "project_create",
        tableName: "projects",
        recordId: newProject.id,
        barangayId: data.barangay_id,
        details: {
          title: data.title,
          budget: data.budget ? Number(data.budget) : 0,
        },
      });

      toast({
        title: "Success",
        description: "Project created successfully",
      });
      reset();
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Project Title*</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Enter project title"
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Enter project description"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="budget">Budget (₱)</Label>
        <Input
          id="budget"
          type="number"
          {...register("budget")}
          placeholder="0.00"
          step="0.01"
        />
      </div>

      <div>
        <Label>Project Location</Label>
        <MapboxLocationPicker
          onLocationSelect={setSelectedLocation}
          selectedLocation={selectedLocation}
        />
      </div>

      {isMainAdmin && (
        <div>
          <Label htmlFor="barangay">Barangay*</Label>
          <Select
            value={watch("barangay_id")}
            onValueChange={(value) => setValue("barangay_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select barangay" />
            </SelectTrigger>
            <SelectContent>
              {barangays.map((barangay) => (
                <SelectItem key={barangay.id} value={barangay.id}>
                  {barangay.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.barangay_id && (
            <p className="text-sm text-destructive mt-1">{errors.barangay_id.message}</p>
          )}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
      </Button>
    </form>
  );
};
