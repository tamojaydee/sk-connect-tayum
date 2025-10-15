import Navigation from "@/components/Navigation";
import { DocumentsSection } from "@/components/DocumentsSection";
import { FileText } from "lucide-react";

const DocumentsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <FileText className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Public Documents Repository</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Browse and access official documents, ordinances, resolutions, and reports from Sangguniang Kabataan
            </p>
          </div>

          <DocumentsSection showFilters={true} />
        </div>
      </main>
    </div>
  );
};

export default DocumentsPage;
