import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { logAudit } from "@/lib/auditLog";

interface SlideshowImage {
  id: string;
  image_url: string;
  title: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export const SlideshowManager = () => {
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("slideshow_images")
      .select("*")
      .order("display_order", { ascending: true });

    if (data) {
      setImages(data);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleAdd = async () => {
    if (!newTitle || !imageFile) {
      toast({
        title: "Error",
        description: "Please provide both title and image",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `slideshow-${Date.now()}.${fileExt}`;
      const filePath = `slideshow/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("page-management")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("page-management")
        .getPublicUrl(filePath);

      const { data: userData } = await supabase.auth.getUser();
      const maxOrder = images.length > 0 ? Math.max(...images.map(img => img.display_order)) : -1;

      const { data: newImage, error } = await supabase.from("slideshow_images").insert({
        title: newTitle,
        description: newDescription || null,
        image_url: publicUrl,
        display_order: maxOrder + 1,
        created_by: userData.user?.id,
      }).select().single();

      if (error) throw error;

      // Log the audit
      await logAudit({
        action: "slideshow_create",
        tableName: "slideshow_images",
        recordId: newImage.id,
        details: {
          title: newTitle,
        },
      });

      setNewTitle("");
      setNewDescription("");
      setImageFile(null);
      fetchImages();
      toast({
        title: "Success",
        description: "Slideshow image added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add slideshow image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("slideshow_images").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete slideshow image",
        variant: "destructive",
      });
      return;
    }

    // Log the audit
    await logAudit({
      action: "slideshow_delete",
      tableName: "slideshow_images",
      recordId: id,
      details: {},
    });

    fetchImages();
    toast({
      title: "Success",
      description: "Slideshow image deleted successfully",
    });
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("slideshow_images")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update slideshow image",
        variant: "destructive",
      });
      return;
    }

    // Log the audit
    await logAudit({
      action: "slideshow_toggle_active",
      tableName: "slideshow_images",
      recordId: id,
      details: {
        is_active: !currentActive,
      },
    });

    fetchImages();
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const currentIndex = images.findIndex(img => img.id === id);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const current = images[currentIndex];
    const target = images[targetIndex];

    const { error: error1 } = await supabase
      .from("slideshow_images")
      .update({ display_order: target.display_order })
      .eq("id", current.id);

    const { error: error2 } = await supabase
      .from("slideshow_images")
      .update({ display_order: current.display_order })
      .eq("id", target.id);

    if (error1 || error2) {
      toast({
        title: "Error",
        description: "Failed to reorder images",
        variant: "destructive",
      });
      return;
    }

    fetchImages();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Add New Slideshow Image</h3>
        <div className="space-y-2">
          <Label htmlFor="slide-title">Title *</Label>
          <Input
            id="slide-title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Image title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slide-desc">Description (Optional)</Label>
          <Textarea
            id="slide-desc"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Image description"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slide-image">Image *</Label>
          <Input
            id="slide-image"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
          />
          {imageFile && (
            <p className="text-sm text-muted-foreground">Selected: {imageFile.name}</p>
          )}
        </div>
        <Button onClick={handleAdd} disabled={uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add to Slideshow
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Slideshow Images</h3>
        {images.length === 0 ? (
          <p className="text-muted-foreground text-sm">No slideshow images yet</p>
        ) : (
          images.map((image, index) => (
            <Card key={image.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="relative w-48 h-32 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-end p-3">
                    <p className="text-white text-sm font-semibold">{image.title}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold">{image.title}</h4>
                  {image.description && (
                    <p className="text-sm text-muted-foreground">{image.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={image.is_active}
                      onCheckedChange={() => handleToggleActive(image.id, image.is_active)}
                    />
                    <Label className="text-sm">
                      {image.is_active ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleReorder(image.id, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleReorder(image.id, "down")}
                    disabled={index === images.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};