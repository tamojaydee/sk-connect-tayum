import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Facebook, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KagawadProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  barangay_id: string | null;
  contact_number: string | null;
  email: string;
  facebook_url: string | null;
  age: number | null;
  term_start_date: string | null;
  role: string;
  barangays?: {
    name: string;
  };
}

export const KagawadProfiles = ({ barangayId }: { barangayId?: string }) => {
  const [kagawads, setKagawads] = useState<KagawadProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKagawads();
  }, [barangayId]);

  const fetchKagawads = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          barangay_id,
          contact_number,
          email,
          facebook_url,
          age,
          term_start_date,
          role,
          barangays (name)
        `)
        .in('role', ['kagawad', 'sk_chairman'])
        .eq('is_active', true)
        .order('full_name');

      if (barangayId) {
        query = query.eq('barangay_id', barangayId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setKagawads((data || []) as KagawadProfile[]);
    } catch (error) {
      console.error('Error fetching kagawads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (kagawads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No kagawads found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {kagawads.map((kagawad) => (
        <Card key={kagawad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20" />
          <CardContent className="pt-0 pb-6 -mt-16">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                <AvatarImage src={kagawad.avatar_url || undefined} alt={kagawad.full_name} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {kagawad.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{kagawad.full_name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {kagawad.role === 'sk_chairman' ? 'SK Chairman' : 'SK Kagawad'}
                </Badge>
                {kagawad.barangays && (
                  <p className="text-sm text-muted-foreground">
                    {kagawad.barangays.name}
                  </p>
                )}
              </div>

              {kagawad.age && (
                <p className="text-sm text-muted-foreground">
                  Age: {kagawad.age}
                </p>
              )}

              {kagawad.term_start_date && (
                <p className="text-xs text-muted-foreground">
                  Term started: {new Date(kagawad.term_start_date).toLocaleDateString()}
                </p>
              )}

              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {kagawad.facebook_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={kagawad.facebook_url} target="_blank" rel="noopener noreferrer">
                      <Facebook className="h-4 w-4 mr-1" />
                      Facebook
                    </a>
                  </Button>
                )}
                {kagawad.contact_number && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={`tel:${kagawad.contact_number}`}>
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </a>
                  </Button>
                )}
                {kagawad.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={`mailto:${kagawad.email}`}>
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
