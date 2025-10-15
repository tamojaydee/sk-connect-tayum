import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logAudit } from '@/lib/auditLog';
import { User, Session } from '@supabase/supabase-js';
import { AddEventForm } from '@/components/forms/AddEventForm';
import { AddDocumentForm } from '@/components/forms/AddDocumentForm';
import { AddSKChairmanForm } from '@/components/forms/AddSKChairmanForm';
import { EditUserDialog } from '@/components/forms/EditUserDialog';
import { EditEventDialog } from '@/components/forms/EditEventDialog';
import { EventCard } from '@/components/EventCard';
import { DocumentCard } from '@/components/DocumentCard';
import { SurveyAnalytics } from '@/components/SurveyAnalytics';
import { MonthlySurveyInsights } from '@/components/MonthlySurveyInsights';
import { BudgetManagement } from '@/components/BudgetManagement';
import { AllBarangaysBudgetManagement } from '@/components/AllBarangaysBudgetManagement';
import { TransparencyTab } from '@/components/TransparencyTab';
import { ProjectCard } from '@/components/ProjectCard';
import { AuditLogs } from '@/components/AuditLogs';
import { ProjectDetailsDialog } from '@/components/ProjectDetailsDialog';
import { AddProjectForm } from '@/components/forms/AddProjectForm';
import { EditProjectDialog } from '@/components/forms/EditProjectDialog';
import PageManagement from '@/components/PageManagement';
import { ArchiveTab } from '@/components/ArchiveTab';
import { ProfileSettings } from '@/components/ProfileSettings';
import { 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  ClipboardList,
  DollarSign,
  Eye,
  FolderKanban,
  Layout,
  Archive,
  FileCheck
} from 'lucide-react';
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'main_admin' | 'sk_chairman' | 'kagawad';
  barangay_id?: string;
  is_active: boolean;
  created_at: string;
  barangays?: {
    name: string;
    code: string;
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  status: string;
  created_by: string;
  barangay_id: string;
  budget?: number;
  thumbnail_url?: string;
  barangays: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
}

interface Document {
  id: string;
  title: string;
  description: string;
  document_type: string;
  file_url: string | null;
  is_public: boolean;
  created_at: string;
  created_by: string;
  barangays: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
}

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('events');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch user profile
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        barangays (
          name,
          code
        )
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } else {
      setProfile(data);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load user profile. Please try logging in again.</p>
            <Button onClick={handleLogout} className="mt-4">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar 
          profile={profile} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 p-6">
          <div className="mb-6">
            <SidebarTrigger className="mb-4" />
            <h1 className="text-3xl font-bold">
              {profile.role === 'main_admin' ? 'Main Admin Dashboard' : 
               profile.role === 'sk_chairman' ? 'SK Chairman Dashboard' : 
               'Kagawad Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {profile.full_name}
              {profile.barangays && ` - ${profile.barangays.name}`}
            </p>
          </div>

          <DashboardContent 
            activeTab={activeTab} 
            profile={profile} 
            setActiveTab={setActiveTab}
            onProfileUpdate={fetchProfile}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

interface DashboardSidebarProps {
  profile: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const DashboardSidebar = ({ profile, activeTab, setActiveTab, onLogout }: DashboardSidebarProps) => {
  const { state } = useSidebar();

  const menuItems = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'transparency', label: 'Transparency', icon: Eye },
    { id: 'documents', label: 'Documents', icon: FileText },
    ...(profile.role === 'main_admin' || profile.role === 'sk_chairman' 
      ? [
          { id: 'projects', label: 'Projects', icon: FolderKanban },
          { id: 'budget', label: 'Budget', icon: DollarSign },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'surveys', label: 'Surveys', icon: ClipboardList },
          { id: 'audit-logs', label: 'Audit Logs', icon: FileCheck }
        ] 
      : []),
    ...(profile.role === 'main_admin'
      ? [
          { id: 'archive', label: 'Archive', icon: Archive },
          { id: 'page-management', label: 'Page Management', icon: Layout }
        ]
      : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => setActiveTab(item.id)}
                    className={activeTab === item.id ? "bg-primary text-primary-foreground" : ""}
                  >
                    <item.icon className="h-4 w-4" />
                    {state !== "collapsed" && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onLogout}>
                  <LogOut className="h-4 w-4" />
                  {state !== "collapsed" && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

interface DashboardContentProps {
  activeTab: string;
  profile: UserProfile;
  setActiveTab: (tab: string) => void;
  onProfileUpdate: () => void;
}

const DashboardContent = ({ activeTab, profile, setActiveTab, onProfileUpdate }: DashboardContentProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<Array<{ id: string; name: string }>>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [surveyTab, setSurveyTab] = useState('insights');
  const { toast } = useToast();

  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents();
    } else if (activeTab === 'projects') {
      fetchProjects();
      fetchBarangays();
    } else if (activeTab === 'documents' && profile.role !== 'kagawad') {
      fetchDocuments();
    } else if (activeTab === 'users' && (profile.role === 'main_admin' || profile.role === 'sk_chairman')) {
      fetchUsers();
    }
  }, [activeTab, profile]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        barangays (name),
        profiles (full_name)
      `)
      .is('archived_at', null)
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
  };

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        barangays (name),
        profiles (full_name)
      `)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setDocuments(data || []);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        barangays (name, code)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        barangays (name),
        profiles!projects_created_by_fkey (full_name)
      `)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error fetching projects",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProjects(data || []);
    }
  };

  const fetchBarangays = async () => {
    const { data, error } = await supabase
      .from('barangays')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching barangays:', error);
    } else {
      setBarangays(data || []);
    }
  };

  const renderTransparency = () => (
    <TransparencyTab isMainAdmin={profile.role === 'main_admin'} />
  );

  const renderEvents = () => {
    const canCreateEvents = profile.role === 'sk_chairman' || profile.role === 'kagawad' || profile.role === 'main_admin';
    const canEditEvents = (event: Event) => event.created_by === profile.id || profile.role === 'main_admin';

    const handleDeleteEvent = async (eventId: string) => {
      const event = events.find((e) => e.id === eventId);
      const { error } = await supabase
        .from('events')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', eventId);

      if (error) {
        console.error('Error archiving event:', error);
        toast({
          title: "Error",
          description: "Failed to archive event",
          variant: "destructive",
        });
      } else {
        // Log the audit
        await logAudit({
          action: 'event_archive',
          tableName: 'events',
          recordId: eventId,
          barangayId: event?.barangay_id,
          details: event ? { title: event.title, budget: event.budget ?? 0 } : undefined,
        });

        toast({
          title: "Archived",
          description: "Event moved to Archive",
        });
        fetchEvents();
      }
    };

    const handleEditEvent = (event: Event) => {
      setEditingEvent(event);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Events</h2>
          {canCreateEvents && (
            <AddEventForm onEventAdded={fetchEvents} userProfile={profile} />
          )}
        </div>
        <div className="grid gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              canEdit={canEditEvents(event)}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
            />
          ))}
          {events.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No events found</p>
              </CardContent>
            </Card>
          )}
        </div>
        <EditEventDialog
          event={editingEvent}
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
          onEventUpdated={fetchEvents}
        />
      </div>
    );
  };

  const renderDocuments = () => {
    const canCreateDocuments = profile.role === 'sk_chairman' || profile.role === 'main_admin';
    const canEditDocuments = (document: Document) => document.created_by === profile.id || profile.role === 'main_admin';

    const handleDeleteDocument = async (documentId: string) => {
      const document = documents.find((d) => d.id === documentId);
      const { error } = await supabase
        .from('documents')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) {
        console.error('Error archiving document:', error);
        toast({
          title: "Error",
          description: "Failed to archive document",
          variant: "destructive",
        });
      } else {
        // Log the audit
        await logAudit({
          action: 'document_archive',
          tableName: 'documents',
          recordId: documentId,
          details: document ? { title: document.title } : undefined,
        });

        toast({
          title: "Archived",
          description: "Document moved to Archive",
        });
        fetchDocuments();
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Documents</h2>
          {canCreateDocuments && (
            <AddDocumentForm onDocumentAdded={fetchDocuments} userProfile={profile} />
          )}
        </div>
        {profile.role === 'kagawad' ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                As a Kagawad, you don't have access to view documents. Please contact your SK Chairman for assistance.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                canEdit={canEditDocuments(doc)}
                onDelete={handleDeleteDocument}
              />
            ))}
            {documents.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No documents found</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://fllwjnmzpexoxlqtbvxa.supabase.co/functions/v1/delete-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const renderUsers = () => {
    const filteredUsers = profile.role === 'sk_chairman' 
      ? users.filter(user => user.role === 'kagawad' && user.barangay_id === profile.barangay_id)
      : users;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {profile.role === 'main_admin' ? 'All Users' : 'My Kagawads'}
          </h2>
          {profile.role === 'main_admin' && (
            <AddSKChairmanForm onSuccess={fetchUsers} />
          )}
        </div>
        
        {editingUser && (
          <EditUserDialog
            user={editingUser}
            open={!!editingUser}
            onOpenChange={(open) => !open && setEditingUser(null)}
            onSuccess={fetchUsers}
            currentUserRole={profile.role}
          />
        )}

        <div className="grid gap-4">
          {filteredUsers.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {profile.role === 'sk_chairman' ? 'No Kagawads Yet' : 'No Users Yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {profile.role === 'sk_chairman' 
                    ? 'Start by adding kagawads to help manage your barangay.'
                    : 'Start by adding SK Chairmen for each barangay.'
                  }
                </p>
                {profile.role === 'main_admin' && (
                  <AddSKChairmanForm onSuccess={fetchUsers} />
                )}
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      {user.full_name}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'main_admin' ? 'bg-accent/20 text-accent' :
                        user.role === 'sk_chairman' ? 'bg-primary/20 text-primary' :
                        'bg-secondary/20 text-secondary'
                      }`}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-primary/10"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {((profile.role === 'main_admin' && (user.role === 'sk_chairman' || user.role === 'kagawad')) ||
                        (profile.role === 'sk_chairman' && user.role === 'kagawad' && user.barangay_id === profile.barangay_id)) && 
                        user.id !== profile.id && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover:bg-destructive/10"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Barangay</p>
                      <p className="font-medium">{user.barangays?.name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className={`font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Joined</p>
                      <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderSurveys = () => (
    <div className="space-y-6">
      <div className="border-b">
        <nav className="flex gap-4">
          <button
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              surveyTab === 'insights'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setSurveyTab('insights')}
          >
            Monthly Insights
          </button>
          <button
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              surveyTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setSurveyTab('analytics')}
          >
            Survey Analytics
          </button>
        </nav>
      </div>

      {surveyTab === 'insights' && <MonthlySurveyInsights />}
      {surveyTab === 'analytics' && (
        <SurveyAnalytics 
          barangayId={profile.role === 'sk_chairman' ? profile.barangay_id : undefined} 
        />
      )}
    </div>
  );

  const renderBudget = () => {
    // Main admins can see all barangay budgets
    if (profile.role === 'main_admin') {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Budget Management - All Barangays</h2>
          <AllBarangaysBudgetManagement />
        </div>
      );
    }

    // SK Chairmen see their own barangay budget
    if (!profile.barangay_id) {
      return (
        <Card>
          <CardContent className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Barangay Assigned</h3>
            <p className="text-muted-foreground">
              You need to be assigned to a barangay to manage budgets.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Budget Management</h2>
        <BudgetManagement 
          barangayId={profile.barangay_id} 
          barangayName={profile.barangays?.name}
        />
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Settings</h2>
      <ProfileSettings 
        profile={profile} 
        onProfileUpdate={onProfileUpdate} 
      />
    </div>
  );

  const renderProjects = () => {
    const canCreateProjects = profile.role === 'main_admin' || profile.role === 'sk_chairman';

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Projects</h2>
          {canCreateProjects && (
            <Button onClick={() => setShowAddProject(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          )}
        </div>

        {showAddProject && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
            </CardHeader>
            <CardContent>
              <AddProjectForm
                barangays={barangays}
                userBarangayId={profile.barangay_id}
                isMainAdmin={profile.role === 'main_admin'}
                onSuccess={() => {
                  setShowAddProject(false);
                  fetchProjects();
                }}
              />
            </CardContent>
          </Card>
        )}

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
              {(project.created_by === profile.id || profile.role === 'main_admin') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setEditingProject(project)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first project
              </p>
              {canCreateProjects && (
                <Button onClick={() => setShowAddProject(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <ProjectDetailsDialog
          open={showProjectDetails}
          onOpenChange={setShowProjectDetails}
          project={selectedProject}
        />

        <EditProjectDialog
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          project={editingProject}
          onSuccess={() => {
            fetchProjects();
            setEditingProject(null);
          }}
        />
      </div>
    );
  };

  switch (activeTab) {
    case 'events':
      return renderEvents();
    case 'transparency':
      return renderTransparency();
    case 'documents':
      return renderDocuments();
    case 'projects':
      return renderProjects();
    case 'budget':
      return renderBudget();
    case 'users':
      return renderUsers();
    case 'surveys':
      return renderSurveys();
    case 'audit-logs':
      return <AuditLogs />;
    case 'archive':
      return <ArchiveTab />;
    case 'page-management':
      return <PageManagement />;
    case 'settings':
      return renderSettings();
    default:
      return renderEvents();
  }
};

export default DashboardPage;