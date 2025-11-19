import Navigation from "@/components/Navigation";
import { KagawadProfiles } from "@/components/KagawadProfiles";

const ProfilesPage = () => {
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

        <div className="space-y-12">
          {/* SK Chairperson Section */}
          <div>
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">
              SK Chairperson
            </h2>
            <KagawadProfiles role="sk_chairman" />
          </div>

          {/* SK Secretaries Section */}
          <div>
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">
              SK Secretaries
            </h2>
            <KagawadProfiles role="sk_secretary" />
          </div>

          {/* SK Kagawads Section */}
          <div>
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">
              SK Kagawads
            </h2>
            <KagawadProfiles role="kagawad" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilesPage;
