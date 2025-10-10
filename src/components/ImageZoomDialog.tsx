import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageZoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  alt?: string;
}

export const ImageZoomDialog = ({ open, onOpenChange, imageUrl, alt }: ImageZoomDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center bg-black/90">
          <img
            src={imageUrl}
            alt={alt || "Zoomed image"}
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
