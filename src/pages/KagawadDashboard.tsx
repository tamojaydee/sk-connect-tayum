import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, FileText, Loader2 } from 'lucide-react';
import { AddEventForm } from '@/components/forms/AddEventForm';
import { ProfileSettings } from '@/components/ProfileSettings';

export default function KagawadDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    barangayMembers: 0,
  });

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, barangays (name)')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData.role !== 'kagawad') {
        navigate('/auth');
        return;
      }

      setProfile(profileData);
      await fetchStats(profileData.barangay_id);
    } catch (error) {
      console.error('Error checking user role:', error);
      navigate('/auth');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (barangayId: string) => {
    try {
      // Total events created by this kagawad
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('barangay_id', barangayId)
        .eq('status', 'active');

      // Upcoming events
      const { count: upcomingCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('barangay_id', barangayId)
        .eq('status', 'active')
        .gte('event_date', new Date().toISOString());

      // Barangay members count
      const { count: membersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('barangay_id', barangayId)
        .eq('is_active', true);

      setStats({
        totalEvents: eventsCount || 0,
        upcomingEvents: upcomingCount || 0,
        barangayMembers: membersCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Kagawad Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {profile?.full_name}
            {profile?.barangays && ` • ${profile.barangays.name}`}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">Active events in barangay</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.upcomingEvents}</div>
              <p className="text-xs text-muted-foreground">Scheduled events</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Barangay Members</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.barangayMembers}</div>
              <p className="text-xs text-muted-foreground">Active members</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="add-event">
              <FileText className="h-4 w-4 mr-2" />
              Add Event
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Users className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View and manage events you've created for your barangay
                </p>
                {/* Events list would go here - simplified for kagawad view */}
                <div className="text-center py-8 text-muted-foreground">
                  Events you create will appear here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-event" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Event</CardTitle>
              </CardHeader>
              <CardContent>
                {profile && (
                  <AddEventForm 
                    onEventAdded={() => {
                      if (profile?.barangay_id) {
                        fetchStats(profile.barangay_id);
                      }
                    }}
                    userProfile={profile}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {profile && (
                  <ProfileSettings 
                    profile={profile}
                    onProfileUpdate={() => checkUserRole()}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
