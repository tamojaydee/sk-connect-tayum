import Navigation from "@/components/Navigation";
import { TransparencyTab } from "@/components/TransparencyTab";

const TransparencyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
              Transparency Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              View real-time statistics and transparency metrics for all barangays
            </p>
          </div>
          <TransparencyTab isMainAdmin={false} />
        </div>
      </main>
    </div>
  );
};

export default TransparencyPage;
