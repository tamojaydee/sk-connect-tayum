import Navigation from "@/components/Navigation";
import { EventsSection } from "@/components/EventsSection";

const EventsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
              Events
            </h1>
            <p className="text-lg text-muted-foreground">
              Stay updated with the latest events and activities across all barangays
            </p>
          </div>
          <EventsSection />
        </div>
      </main>
    </div>
  );
};

export default EventsPage;
