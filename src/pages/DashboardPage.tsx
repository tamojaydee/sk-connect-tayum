import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { AddEventForm } from '@/components/forms/AddEventForm';
import { AddDocumentForm } from '@/components/forms/AddDocumentForm';
import { EventCard } from '@/components/EventCard';
import { DocumentCard } from '@/components/DocumentCard';
import { 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Home,
  Plus,
  Edit,
  Trash2,
  Eye
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
  const [activeTab, setActiveTab] = useState('overview');
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

          <DashboardContent activeTab={activeTab} profile={profile} setActiveTab={setActiveTab} />
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
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'documents', label: 'Documents', icon: FileText },
    ...(profile.role === 'main_admin' || profile.role === 'sk_chairman' 
      ? [{ id: 'users', label: 'Users', icon: Users }] 
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
}

const DashboardContent = ({ activeTab, profile, setActiveTab }: DashboardContentProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);

  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents();
    } else if (activeTab === 'documents' && profile.role !== 'kagawad') {
      fetchDocuments();
    } else if (activeTab === 'users' && (profile.role === 'main_admin' || profile.role === 'sk_chairman')) {
      fetchUsers();
    } else if (activeTab === 'overview') {
      // Fetch all data for overview
      fetchEvents();
      if (profile.role !== 'kagawad') {
        fetchDocuments();
      }
      if (profile.role === 'main_admin' || profile.role === 'sk_chairman') {
        fetchUsers();
      }
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

  const renderOverview = () => {
    // Role-specific overview content
    if (profile.role === 'main_admin') {
      return (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{events.length}</div>
                <p className="text-xs text-muted-foreground">Across all barangays</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">{documents.length}</div>
                <p className="text-xs text-muted-foreground">System-wide documents</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{users.length}</div>
                <p className="text-xs text-muted-foreground">All system users</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-muted/20 to-muted/10 border-muted/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Barangays</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">11</div>
                <p className="text-xs text-muted-foreground">Tayum, Abra</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Administration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">As main administrator, you have full system access:</p>
                <ul className="text-sm space-y-1">
                  <li>• Manage SK Chairmen and Kagawads</li>
                  <li>• View and modify all content</li>
                  <li>• System-wide configuration</li>
                  <li>• User role assignments</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <AddEventForm onEventAdded={fetchEvents} userProfile={profile} />
                <AddDocumentForm onDocumentAdded={fetchDocuments} userProfile={profile} />
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  System Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (profile.role === 'sk_chairman') {
      return (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Events</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{events.length}</div>
                <p className="text-xs text-muted-foreground">In {profile.barangays?.name}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Documents</CardTitle>
                <FileText className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">{documents.length}</div>
                <p className="text-xs text-muted-foreground">Barangay documents</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Kagawads</CardTitle>
                <Users className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{users.filter(u => u.role === 'kagawad').length}</div>
                <p className="text-xs text-muted-foreground">Team members</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SK Chairman Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Managing {profile.barangays?.name} barangay:</p>
                <ul className="text-sm space-y-1">
                  <li>• Manage kagawad accounts</li>
                  <li>• Create and edit documents</li>
                  <li>• Organize barangay events</li>
                  <li>• View team activities</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <AddEventForm onEventAdded={fetchEvents} userProfile={profile} />
                <AddDocumentForm onDocumentAdded={fetchDocuments} userProfile={profile} />
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Kagawads
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Kagawad role
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Events</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{events.length}</div>
              <p className="text-xs text-muted-foreground">Events I've created</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Barangay</CardTitle>
              <Settings className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-accent">{profile.barangays?.name}</div>
              <p className="text-xs text-muted-foreground">Serving the community</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kagawad Portal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Your role in {profile.barangays?.name}:</p>
              <ul className="text-sm space-y-1">
                <li>• Create and manage events</li>
                <li>• Coordinate community activities</li>
                <li>• Support barangay initiatives</li>
                <li>• Serve the residents</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <AddEventForm onEventAdded={fetchEvents} userProfile={profile} />
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveTab('events')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                View My Events
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderEvents = () => {
    const canCreateEvents = profile.role === 'sk_chairman' || profile.role === 'kagawad' || profile.role === 'main_admin';
    const canEditEvents = (event: Event) => event.created_by === profile.id || profile.role === 'main_admin';

    const handleDeleteEvent = async (eventId: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting event:', error);
      } else {
        fetchEvents();
      }
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
      </div>
    );
  };

  const renderDocuments = () => {
    const canCreateDocuments = profile.role === 'sk_chairman' || profile.role === 'main_admin';
    const canEditDocuments = (document: Document) => document.created_by === profile.id || profile.role === 'main_admin';

    const handleDeleteDocument = async (documentId: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Error deleting document:', error);
      } else {
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
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add SK Chairman
            </Button>
          )}
        </div>
        
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
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First User
                  </Button>
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
                      <Button variant="outline" size="sm" className="hover:bg-primary/10">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {profile.role === 'main_admin' && (
                        <Button variant="outline" size="sm" className="hover:bg-destructive/10">
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

  const renderSettings = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Name:</strong> {profile.full_name}
          </div>
          <div>
            <strong>Email:</strong> {profile.email}
          </div>
          <div>
            <strong>Role:</strong> {profile.role.replace('_', ' ').toUpperCase()}
          </div>
          {profile.barangays && (
            <div>
              <strong>Barangay:</strong> {profile.barangays.name}
            </div>
          )}
          <Button>Edit Profile</Button>
        </CardContent>
      </Card>
    </div>
  );

  switch (activeTab) {
    case 'overview':
      return renderOverview();
    case 'events':
      return renderEvents();
    case 'documents':
      return renderDocuments();
    case 'users':
      return renderUsers();
    case 'settings':
      return renderSettings();
    default:
      return renderOverview();
  }
};

export default DashboardPage;