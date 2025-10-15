import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Edit, Trash2, User, Globe, Lock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentViewerDialog } from './DocumentViewerDialog';

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

interface DocumentCardProps {
  document: Document;
  canEdit?: boolean;
  onEdit?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  canEdit = false,
  onEdit,
  onDelete,
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleDownload = async () => {
    if (!document.file_url) return;
    
    try {
      const response = await fetch(document.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.title}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      ordinance: 'bg-blue-100 text-blue-800',
      resolution: 'bg-green-100 text-green-800',
      memorandum: 'bg-yellow-100 text-yellow-800',
      report: 'bg-purple-100 text-purple-800',
      certificate: 'bg-indigo-100 text-indigo-800',
      permit: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{document.title}</CardTitle>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {document.profiles?.full_name || 'Unknown'}
              </div>
              <div className="flex items-center gap-1">
                {document.is_public ? (
                  <Globe className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {document.is_public ? 'Public' : 'Private'}
              </div>
              <span>{format(new Date(document.created_at), 'PPP')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getTypeColor(document.document_type)}>
              {document.document_type.charAt(0).toUpperCase() + document.document_type.slice(1)}
            </Badge>
            {canEdit && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(document)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(document.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {document.description && (
          <p className="text-muted-foreground">{document.description}</p>
        )}
        
        <div className="flex gap-2 items-center pt-2">
          {document.file_url ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewerOpen(true)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No file attached</span>
          )}
        </div>
      </CardContent>

      {document.file_url && (
        <DocumentViewerDialog
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          documentUrl={document.file_url}
          documentTitle={document.title}
        />
      )}
    </Card>
  );
};