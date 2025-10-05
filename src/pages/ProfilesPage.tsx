import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Facebook, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  barangay_id: string;
  avatar_url?: string;
  age?: number;
  term_start_date?: string;
  facebook_url?: string;
  contact_number?: string;
}

interface Barangay {
  id: string;
  name: string;
}

const ProfilesPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [barangays, setBarangays] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch barangays
      const { data: barangaysData, error: barangaysError } = await supabase
        .from("barangays")
        .select("id, name");

      if (barangaysError) throw barangaysError;

      const barangaysMap = (barangaysData || []).reduce((acc, b: Barangay) => {
        acc[b.id] = b.name;
        return acc;
      }, {} as { [key: string]: string });

      setBarangays(barangaysMap);

      // Fetch profiles (SK chairmen and kagawads only)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["sk_chairman", "kagawad"])
        .eq("is_active", true)
        .order("full_name");

      if (profilesError) throw profilesError;

      setProfiles(profilesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTermYears = (termStartDate?: string) => {
    if (!termStartDate) return "N/A";
    const start = new Date(termStartDate);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    return `${years} year${years !== 1 ? 's' : ''}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
            SK Leaders
          </h1>
          <p className="text-muted-foreground">
            Meet the Sangguniang Kabataan leaders of Tayum, Abra
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-48 bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No leader profiles found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <Card key={profile.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-8 flex items-center justify-center">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                      <AvatarFallback className="text-3xl font-semibold bg-primary/20 text-primary">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="p-6 space-y-3">
                    <div>
                      <h3 className="text-xl font-heading font-bold text-foreground mb-1">
                        {profile.full_name}
                      </h3>
                      <Badge variant="secondary" className="mb-2">
                        {profile.role === "sk_chairman" ? "SK Chairman" : "Kagawad"}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Barangay:</span>{" "}
                        {barangays[profile.barangay_id] || "Unknown"}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Term:</span>{" "}
                          {getTermYears(profile.term_start_date)}
                        </p>
                        {profile.age && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Age:</span>{" "}
                            {profile.age}
                          </p>
                        )}
                      </div>

                      {profile.facebook_url && (
                        <a
                          href={profile.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Facebook className="h-4 w-4" />
                          <span>Facebook Profile</span>
                        </a>
                      )}

                      {profile.contact_number && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{profile.contact_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilesPage;
