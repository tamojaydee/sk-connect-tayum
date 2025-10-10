import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface Announcement {
  id: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  is_active: boolean;
}

export const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setAnnouncements(data);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleAdd = async () => {
    if (!newTitle && !newContent) {
      toast({
        title: "Error",
        description: "Please provide at least a title or content",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `announcement-${Date.now()}.${fileExt}`;
        const filePath = `announcements/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("page-management")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("page-management")
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from("announcements").insert({
        title: newTitle || null,
        content: newContent || null,
        image_url: imageUrl,
        created_by: userData.user?.id,
      });

      if (error) throw error;

      setNewTitle("");
      setNewContent("");
      setImageFile(null);
      fetchAnnouncements();
      toast({
        title: "Success",
        description: "Announcement added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add announcement",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
      return;
    }

    fetchAnnouncements();
    toast({
      title: "Success",
      description: "Announcement deleted successfully",
    });
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
      return;
    }

    fetchAnnouncements();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Add New Announcement</h3>
        <div className="space-y-2">
          <Label htmlFor="title">Title (Optional)</Label>
          <Input
            id="title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Announcement title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Content (Optional)</Label>
          <Textarea
            id="content"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Announcement content"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image">Image (Optional)</Label>
          <Input
            id="image"
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
              Add Announcement
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Existing Announcements</h3>
        {announcements.length === 0 ? (
          <p className="text-muted-foreground text-sm">No announcements yet</p>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {announcement.title && (
                    <h4 className="font-semibold">{announcement.title}</h4>
                  )}
                  {announcement.content && (
                    <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  )}
                  {announcement.image_url && (
                    <div className="relative w-full h-32 rounded overflow-hidden">
                      <img
                        src={announcement.image_url}
                        alt={announcement.title || "Announcement"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={announcement.is_active}
                      onCheckedChange={() => handleToggleActive(announcement.id, announcement.is_active)}
                    />
                    <Label className="text-sm">
                      {announcement.is_active ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(announcement.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};