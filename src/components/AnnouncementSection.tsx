import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface Announcement {
  id: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  is_active: boolean;
}

const AnnouncementSection = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data) {
      setAnnouncements(data);
    }
  };

  if (announcements.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {announcements.map((announcement) => (
            <Alert key={announcement.id} className="border-primary/20">
              <Info className="h-4 w-4" />
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  {announcement.title && (
                    <AlertTitle className="text-lg font-semibold mb-2">
                      {announcement.title}
                    </AlertTitle>
                  )}
                  {announcement.content && (
                    <AlertDescription className="text-base">
                      {announcement.content}
                    </AlertDescription>
                  )}
                </div>
                {announcement.image_url && (
                  <div className="md:w-64 rounded-lg overflow-hidden">
                    <img
                      src={announcement.image_url}
                      alt={announcement.title || "Announcement"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </Alert>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnnouncementSection;