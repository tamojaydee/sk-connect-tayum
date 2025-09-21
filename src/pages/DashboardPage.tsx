import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
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
  is_public: boolean;
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

          <DashboardContent activeTab={activeTab} profile={profile} />
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
}

const DashboardContent = ({ activeTab, profile }: DashboardContentProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents();
    } else if (activeTab === 'documents') {
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

  const renderOverview = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{events.length}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{documents.length}</div>
        </CardContent>
      </Card>

      {(profile.role === 'main_admin' || profile.role === 'sk_chairman') && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Events</h2>
        {(profile.role === 'sk_chairman' || profile.role === 'kagawad') && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {event.title}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
              <div className="flex justify-between text-sm">
                <span>📍 {event.location}</span>
                <span>🏘️ {event.barangays.name}</span>
                <span>👤 {event.profiles.full_name}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Documents</h2>
        {profile.role === 'sk_chairman' && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        {documents.map((document) => (
          <Card key={document.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {document.title}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{document.description}</p>
              <div className="flex justify-between text-sm">
                <span>📂 {document.document_type}</span>
                <span>🏘️ {document.barangays.name}</span>
                <span>👤 {document.profiles.full_name}</span>
                <span>{document.is_public ? '🌐 Public' : '🔒 Private'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users</h2>
        {profile.role === 'main_admin' && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {user.full_name}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {profile.role === 'main_admin' && (
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>📧 {user.email}</p>
                <p>👤 {user.role.replace('_', ' ').toUpperCase()}</p>
                {user.barangays && <p>🏘️ {user.barangays.name}</p>}
                <p>📊 {user.is_active ? '✅ Active' : '❌ Inactive'}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

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