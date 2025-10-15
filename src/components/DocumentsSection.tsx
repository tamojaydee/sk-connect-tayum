import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DocumentCard } from './DocumentCard';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, FileText } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface Document {
  id: string;
  title: string;
  description: string;
  document_type: string;
  file_url: string | null;
  is_public: boolean;
  created_at: string;
  created_by: string;
  profiles?: {
    full_name: string;
  };
}

interface DocumentsSectionProps {
  limit?: number;
  showFilters?: boolean;
}

export const DocumentsSection = ({ limit, showFilters = true }: DocumentsSectionProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((doc) => doc.document_type === selectedType);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, selectedType]);

  const fetchDocuments = async () => {
    setLoading(true);
    let query = supabase
      .from('documents')
      .select('*, profiles(full_name)')
      .eq('is_public', true)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setDocuments(data || []);
      setFilteredDocuments(data || []);
    }
    setLoading(false);
  };

  const documentTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'ordinance', label: 'Ordinance' },
    { value: 'resolution', label: 'Resolution' },
    { value: 'memorandum', label: 'Memorandum' },
    { value: 'report', label: 'Report' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'permit', label: 'Permit' },
    { value: 'other', label: 'Other' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {showFilters && (
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full md:w-48" />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedType !== 'all'
              ? 'Try adjusting your filters'
              : 'No public documents available yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </div>
  );
};
