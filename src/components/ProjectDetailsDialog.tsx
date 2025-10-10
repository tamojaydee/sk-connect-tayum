import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { ImageZoomDialog } from "./ImageZoomDialog";

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
  uploaded_by: string;
  profiles?: {
    full_name: string;
  };
}

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  } | null;
  showInteractiveFeatures?: boolean;
}

export const ProjectDetailsDialog = ({ open, onOpenChange, project, showInteractiveFeatures = true }: ProjectDetailsDialogProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (project?.id) {
      fetchComments();
      fetchPhotos();
    }
  }, [project?.id]);

  const fetchComments = async () => {
    if (!project?.id) return;
    
    const { data, error } = await supabase
      .from("project_comments")
      .select(`
        *,
        profiles!project_comments_user_id_fkey (full_name, avatar_url)
      `)
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching comments",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setComments(data as any || []);
    }
  };

  const fetchPhotos = async () => {
    if (!project?.id) return;
    
    const { data, error } = await supabase
      .from("project_photos")
      .select(`
        *,
        profiles!project_photos_uploaded_by_fkey (full_name)
      `)
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching photos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPhotos(data as any || []);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !project?.id) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to comment",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("project_comments")
      .insert({
        project_id: project.id,
        comment: newComment,
        user_id: user.id,
      });

    if (error) {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
      setNewComment("");
      fetchComments();
    }

    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !project?.id) return;

    const file = e.target.files[0];
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload photos",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Error uploading photo",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("project-photos")
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase
      .from("project_photos")
      .insert({
        project_id: project.id,
        photo_url: publicUrl,
        uploaded_by: user.id,
      });

    if (insertError) {
      toast({
        title: "Error saving photo",
        description: insertError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
      fetchPhotos();
    }

    setUploading(false);
  };

  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    const { error } = await supabase
      .from("project_photos")
      .delete()
      .eq("id", photoId);

    if (error) {
      toast({
        title: "Error deleting photo",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Photo deleted successfully",
      });
      fetchPhotos();
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-2xl">{project.title}</DialogTitle>
            <Badge className={
              project.status === "active" ? "bg-secondary" :
              project.status === "completed" ? "bg-primary" : "bg-destructive"
            }>
              {project.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{project.description || "No description provided"}</p>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Progress</h3>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} />
          </div>

          {/* Budget */}
          {project.budget && (
            <div>
              <h3 className="font-semibold mb-2">Budget</h3>
              <p className="text-2xl font-bold">₱{Number(project.budget).toLocaleString()}</p>
            </div>
          )}

          {/* Photos Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Photos</h3>
              {showInteractiveFeatures && (
                <label htmlFor="photo-upload">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      Upload Photo
                    </span>
                  </Button>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || "Project photo"}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setZoomedImage(photo.photo_url)}
                  />
                  {showInteractiveFeatures && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeletePhoto(photo.id, photo.photo_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs rounded-b-lg">
                    <p>{photo.profiles?.full_name}</p>
                    <p>{format(new Date(photo.created_at), "MMM dd, yyyy")}</p>
                  </div>
                </div>
              ))}
              {photos.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No photos yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          {showInteractiveFeatures && (
            <div>
              <h3 className="font-semibold mb-4">Comments</h3>
              
              <div className="space-y-4 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">{comment.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <p className="text-muted-foreground">{comment.comment}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">No comments yet</p>
                )}
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={loading || !newComment.trim()}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Comment"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <ImageZoomDialog
        open={!!zoomedImage}
        onOpenChange={(open) => !open && setZoomedImage(null)}
        imageUrl={zoomedImage || ""}
      />
    </Dialog>
  );
};
