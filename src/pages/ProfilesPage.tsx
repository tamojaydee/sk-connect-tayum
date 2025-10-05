import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Facebook, Phone, MapPin, Calendar } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

interface Barangay {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
  barangay_id: string;
  avatar_url: string | null;
  age: number | null;
  term_start_date: string | null;
  facebook_url: string | null;
  contact_number: string | null;
  barangays?: Barangay;
}

const ProfilesPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          role,
          barangay_id,
          avatar_url,
          age,
          term_start_date,
          facebook_url,
          contact_number,
          barangays (
            id,
            name
          )
        `)
        .in("role", ["sk_chairman", "kagawad"])
        .eq("is_active", true)
        .order("barangay_id");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === "sk_chairman" ? "default" : "secondary";
  };

  const getRoleLabel = (role: string) => {
    return role === "sk_chairman" ? "SK Chairman" : "Kagawad";
  };

  const calculateTermYears = (termStartDate: string | null) => {
    if (!termStartDate) return "N/A";
    const start = new Date(termStartDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Loading profiles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
            SK Leaders
          </h1>
          <p className="text-muted-foreground">
            Meet our dedicated Sangguniang Kabataan leaders serving the youth of Tayum, Abra
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Avatar */}
                  <Avatar className="w-32 h-32 border-4 border-primary/10">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                    <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name and Role */}
                  <div className="space-y-2 w-full">
                    <h3 className="text-xl font-semibold text-foreground">
                      {profile.full_name}
                    </h3>
                    <Badge variant={getRoleBadgeVariant(profile.role)}>
                      {getRoleLabel(profile.role)}
                    </Badge>
                  </div>

                  {/* Barangay */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.barangays?.name || "Unknown Barangay"}</span>
                  </div>

                  {/* Term and Age */}
                  <div className="flex items-center justify-center gap-4 text-sm w-full">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Term: {calculateTermYears(profile.term_start_date)}
                      </span>
                    </div>
                    {profile.age && (
                      <span className="text-muted-foreground">
                        Age: {profile.age}
                      </span>
                    )}
                  </div>

                  {/* Social and Contact */}
                  <div className="flex flex-col gap-2 w-full pt-2 border-t border-border">
                    {profile.facebook_url && (
                      <a
                        href={profile.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        <Facebook className="w-4 h-4" />
                        <span>Facebook Profile</span>
                      </a>
                    )}
                    {profile.contact_number && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{profile.contact_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {profiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No profiles found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilesPage;
