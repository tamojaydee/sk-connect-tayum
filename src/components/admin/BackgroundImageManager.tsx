import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { logAudit } from "@/lib/auditLog";

export const BackgroundImageManager = () => {
  const [uploading, setUploading] = useState(false);
  const [currentBackground, setCurrentBackground] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentBackground();
  }, []);

  const fetchCurrentBackground = async () => {
    const { data, error } = await supabase
      .from("homepage_settings")
      .select("hero_background_url")
      .single();

    if (data) {
      setCurrentBackground(data.hero_background_url);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-background-${Date.now()}.${fileExt}`;
      const filePath = `backgrounds/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("page-management")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("page-management")
        .getPublicUrl(filePath);

      const { data: userData } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from("homepage_settings")
        .update({
          hero_background_url: publicUrl,
          updated_by: userData.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", "00000000-0000-0000-0000-000000000001");

      if (updateError) throw updateError;

      // Log the audit
      await logAudit({
        action: "homepage_background_update",
        tableName: "homepage_settings",
        recordId: "00000000-0000-0000-0000-000000000001",
        details: {
          image_url: publicUrl,
        },
      });

      setCurrentBackground(publicUrl);
      toast({
        title: "Success",
        description: "Background image updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload background image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {currentBackground && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border">
          <img
            src={currentBackground}
            alt="Current background"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="background">Upload New Background Image</Label>
        <div className="flex items-center gap-2">
          <Input
            id="background"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </div>
    </div>
  );
};