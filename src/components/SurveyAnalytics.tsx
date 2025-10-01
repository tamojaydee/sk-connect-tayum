import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, UserCheck, Eye, Edit, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Survey {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  contact_number: string | null;
  email: string | null;
  address: string | null;
  has_participated: boolean;
  participation_type: string | null;
  available_time: string | null;
  barangay_id: string;
  created_at: string;
  barangays?: {
    name: string;
  };
}

interface SurveyAnalyticsProps {
  barangayId?: string;
}

export const SurveyAnalytics = ({ barangayId }: SurveyAnalyticsProps) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [editForm, setEditForm] = useState<Survey | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSurveys();
  }, [barangayId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSurveys(surveys);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = surveys.filter(
        (survey) =>
          survey.full_name.toLowerCase().includes(query) ||
          survey.barangays?.name.toLowerCase().includes(query) ||
          survey.age.toString().includes(query)
      );
      setFilteredSurveys(filtered);
    }
  }, [searchQuery, surveys]);

  const fetchSurveys = async () => {
    try {
      let query = supabase.from("surveys").select("*, barangays(name)");
      
      if (barangayId) {
        query = query.eq("barangay_id", barangayId);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      setSurveys(data || []);
      setFilteredSurveys(data || []);
    } catch (error) {
      console.error("Error fetching surveys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (survey: Survey) => {
    setSelectedSurvey(survey);
    setViewDialogOpen(true);
  };

  const handleEdit = (survey: Survey) => {
    setEditForm(survey);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    try {
      const { error } = await supabase
        .from("surveys")
        .update({
          full_name: editForm.full_name,
          age: editForm.age,
          gender: editForm.gender,
          contact_number: editForm.contact_number,
          email: editForm.email,
          address: editForm.address,
        })
        .eq("id", editForm.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Survey updated successfully",
      });

      setEditDialogOpen(false);
      fetchSurveys();
    } catch (error) {
      console.error("Error updating survey:", error);
      toast({
        title: "Error",
        description: "Failed to update survey",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this survey response?")) return;

    try {
      const { error } = await supabase.from("surveys").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Survey deleted successfully",
      });

      fetchSurveys();
    } catch (error) {
      console.error("Error deleting survey:", error);
      toast({
        title: "Error",
        description: "Failed to delete survey",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading survey data...</div>;
  }

  // Age distribution data
  const ageGroups = [
    { name: "15-17", range: [15, 17] },
    { name: "18-24", range: [18, 24] },
    { name: "25-30", range: [25, 30] },
  ];

  const ageData = ageGroups.map(group => ({
    name: group.name,
    count: surveys.filter(s => s.age >= group.range[0] && s.age <= group.range[1]).length
  }));

  // Gender distribution data
  const genderData = [
    { name: "Male", value: surveys.filter(s => s.gender === "male").length },
    { name: "Female", value: surveys.filter(s => s.gender === "female").length },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surveys.length}</div>
            <p className="text-xs text-muted-foreground">Survey responses collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Male Respondents</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{genderData[0].value}</div>
            <p className="text-xs text-muted-foreground">
              {surveys.length > 0 ? ((genderData[0].value / surveys.length) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Female Respondents</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{genderData[1].value}</div>
            <p className="text-xs text-muted-foreground">
              {surveys.length > 0 ? ((genderData[1].value / surveys.length) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Respondents" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Survey List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Survey Responses</CardTitle>
            <div className="flex items-center gap-2 w-80">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, age, or barangay..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Barangay</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {searchQuery ? "No surveys found matching your search" : "No survey responses yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSurveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell className="font-medium">{survey.full_name}</TableCell>
                    <TableCell>{survey.age}</TableCell>
                    <TableCell>{survey.barangays?.name || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(survey)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(survey)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(survey.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Survey Details</DialogTitle>
            <DialogDescription>Complete survey response information</DialogDescription>
          </DialogHeader>
          {selectedSurvey && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Full Name</Label>
                  <p className="text-sm">{selectedSurvey.full_name}</p>
                </div>
                <div>
                  <Label className="font-semibold">Age</Label>
                  <p className="text-sm">{selectedSurvey.age}</p>
                </div>
                <div>
                  <Label className="font-semibold">Gender</Label>
                  <p className="text-sm">{selectedSurvey.gender}</p>
                </div>
                <div>
                  <Label className="font-semibold">Barangay</Label>
                  <p className="text-sm">{selectedSurvey.barangays?.name || "N/A"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Email</Label>
                  <p className="text-sm">{selectedSurvey.email || "N/A"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Contact Number</Label>
                  <p className="text-sm">{selectedSurvey.contact_number || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="font-semibold">Address</Label>
                  <p className="text-sm">{selectedSurvey.address || "N/A"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Has Participated</Label>
                  <p className="text-sm">{selectedSurvey.has_participated ? "Yes" : "No"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Civil Status</Label>
                  <p className="text-sm">{selectedSurvey.participation_type || "N/A"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Youth Age Group</Label>
                  <p className="text-sm">{selectedSurvey.available_time || "N/A"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Submitted On</Label>
                  <p className="text-sm">
                    {new Date(selectedSurvey.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Survey</DialogTitle>
            <DialogDescription>Update survey response information</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-age">Age</Label>
                  <Input
                    id="edit-age"
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-gender">Gender</Label>
                  <Input
                    id="edit-gender"
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contact">Contact Number</Label>
                  <Input
                    id="edit-contact"
                    value={editForm.contact_number || ""}
                    onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={editForm.address || ""}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
