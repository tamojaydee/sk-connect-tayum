import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Archive, RotateCcw, Trash2, Eye } from 'lucide-react';
import { EventCard } from '@/components/EventCard';
import { DocumentCard } from '@/components/DocumentCard';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectDetailsDialog } from '@/components/ProjectDetailsDialog';

interface ArchivedItem {
  id: string;
  title: string;
  description?: string;
  archived_at: string;
  created_at: string;
  status?: string;
}

export const ArchiveTab = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchArchived();
  }, []);

  const fetchArchived = async () => {
    // Fetch archived events
    const { data: eventsData } = await supabase
      .from('events')
      .select(`
        *,
        barangays (name),
        profiles (full_name)
      `)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false });

    // Fetch archived documents
    const { data: docsData } = await supabase
      .from('documents')
      .select(`
        *,
        barangays (name),
        profiles (full_name)
      `)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false });

    // Fetch archived projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select(`
        *,
        barangays (name),
        profiles!projects_created_by_fkey (full_name)
      `)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false });

    setEvents(eventsData || []);
    setDocuments(docsData || []);
    setProjects(projectsData || []);
  };

  const handleRestore = async (type: 'events' | 'documents' | 'projects', id: string) => {
    const { error } = await supabase
      .from(type)
      .update({ 
        archived_at: null,
        status: 'active'
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to restore ${type.slice(0, -1)}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Restored',
        description: `${type.slice(0, -1)} restored successfully`,
      });
      fetchArchived();
    }
  };

  const handleDelete = async (type: 'events' | 'documents' | 'projects', id: string) => {
    if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from(type)
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to delete ${type.slice(0, -1)}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: `${type.slice(0, -1)} permanently deleted`,
      });
      fetchArchived();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Archive className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Archive</h2>
      </div>
      <p className="text-muted-foreground">
        View and manage archived events, documents, and projects. You can restore or permanently delete items from here.
      </p>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4 mt-6">
          {events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No archived events</p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <div key={event.id} className="relative">
                <EventCard event={event} canEdit={false} onDelete={() => {}} />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore('events', event.id)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete('events', event.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Permanently
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4 mt-6">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No archived documents</p>
              </CardContent>
            </Card>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="relative">
                <DocumentCard document={doc} canEdit={false} onDelete={() => {}} />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore('documents', doc.id)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete('documents', doc.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Permanently
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4 mt-6">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No archived projects</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id}>
                  <ProjectCard
                    project={project}
                    onClick={() => {
                      setSelectedProject(project);
                      setShowProjectDetails(true);
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRestore('projects', project.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete('projects', project.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ProjectDetailsDialog
        open={showProjectDetails}
        onOpenChange={setShowProjectDetails}
        project={selectedProject}
      />
    </div>
  );
};
