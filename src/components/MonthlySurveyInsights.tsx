import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, RefreshCw, Users, Target, Calendar, CheckCircle2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SurveyData {
  totalResponses: number;
  maleCount: number;
  femaleCount: number;
  averageAge: number;
  participationRate: number;
  interestedInJoining: number;
  topInterestAreas: string[];
  barangayParticipation: Record<string, number>;
}

interface Recommendation {
  issue: string;
  action: string;
  priority: "High" | "Medium" | "Low";
}

interface PriorityMatrix {
  highPriority: string[];
  mediumPriority: string[];
  opportunities: string[];
  maintain: string[];
}

export const MonthlySurveyInsights = () => {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [aiReport, setAiReport] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [priorityMatrix, setPriorityMatrix] = useState<PriorityMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);
  const [userBarangayId, setUserBarangayId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userRole !== null) {
      fetchSurveyData();
      loadExistingReports();
    }
  }, [userRole, userBarangayId]);

  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, barangay_id')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
          setUserBarangayId(profile.barangay_id);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const loadExistingReports = async () => {
    try {
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Build query based on user role
      let overviewQuery = supabase
        .from('survey_insights')
        .select('content')
        .eq('report_type', 'overview')
        .eq('survey_month', currentMonth);

      let recsQuery = supabase
        .from('survey_insights')
        .select('content')
        .eq('report_type', 'recommendations')
        .eq('survey_month', currentMonth);

      // Filter by barangay for SK chairmen
      if (userRole === 'sk_chairman' && userBarangayId) {
        overviewQuery = overviewQuery.eq('barangay_id', userBarangayId);
        recsQuery = recsQuery.eq('barangay_id', userBarangayId);
      }

      // Load overview report
      const { data: overviewData } = await overviewQuery
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (overviewData) {
        setAiReport(overviewData.content);
      }

      // Load recommendations
      const { data: recsData } = await recsQuery
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recsData) {
        try {
          const parsed = JSON.parse(recsData.content);
          setRecommendations(parsed.recommendations || []);
          setPriorityMatrix(parsed.priorityMatrix || null);
        } catch (e) {
          console.error('Error parsing saved recommendations:', e);
        }
      }
    } catch (error) {
      console.error('Error loading existing reports:', error);
    }
  };

  const fetchSurveyData = async () => {
    try {
      let query = supabase
        .from("surveys")
        .select("*, barangays(name)");

      // Filter by barangay for SK chairmen
      if (userRole === 'sk_chairman' && userBarangayId) {
        query = query.eq('barangay_id', userBarangayId);
      }

      const { data: surveys, error } = await query;

      if (error) throw error;

      const totalResponses = surveys?.length || 0;
      const maleCount = surveys?.filter(s => s.gender === "male").length || 0;
      const femaleCount = surveys?.filter(s => s.gender === "female").length || 0;
      const averageAge = surveys?.length 
        ? surveys.reduce((sum, s) => sum + s.age, 0) / surveys.length 
        : 0;
      const participatedCount = surveys?.filter(s => s.has_participated).length || 0;
      const participationRate = totalResponses > 0 
        ? (participatedCount / totalResponses) * 100 
        : 0;
      const interestedInJoining = surveys?.filter(s => s.interested_in_joining).length || 0;

      // Get top interest areas
      const interestAreas = surveys?.flatMap(s => s.interest_areas || []) || [];
      const interestCounts = interestAreas.reduce((acc, area) => {
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topInterestAreas = Object.entries(interestCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([area]) => area);

      // Get barangay participation
      const barangayParticipation = surveys?.reduce((acc, survey) => {
        const barangayName = (survey.barangays as any)?.name || "Unknown";
        acc[barangayName] = (acc[barangayName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setSurveyData({
        totalResponses,
        maleCount,
        femaleCount,
        averageAge: Math.round(averageAge * 10) / 10,
        participationRate: Math.round(participationRate * 10) / 10,
        interestedInJoining,
        topInterestAreas,
        barangayParticipation,
      });
    } catch (error) {
      console.error("Error fetching survey data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch survey data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIReport = async () => {
    if (!surveyData) return;

    setGeneratingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-survey-insights', {
        body: {
          surveyData,
          reportType: 'overview'
        }
      });

      if (error) throw error;

      const reportText = data.result;
      setAiReport(reportText);

      // Save to database with barangay_id
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const { data: session } = await supabase.auth.getSession();
      
      await supabase.from('survey_insights').insert({
        report_type: 'overview',
        content: reportText,
        survey_month: currentMonth,
        created_by: session.session?.user.id,
        barangay_id: userRole === 'sk_chairman' ? userBarangayId : null
      });

      toast({
        title: "Success",
        description: "AI report generated and saved successfully",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI report",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const generateRecommendations = async () => {
    if (!surveyData) return;

    setGeneratingRecommendations(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-survey-insights', {
        body: {
          surveyData,
          reportType: 'recommendations'
        }
      });

      if (error) throw error;

      if (typeof data.result === 'object') {
        setRecommendations(data.result.recommendations || []);
        setPriorityMatrix(data.result.priorityMatrix || null);

        // Save to database with barangay_id
        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const { data: session } = await supabase.auth.getSession();
        
        await supabase.from('survey_insights').insert({
          report_type: 'recommendations',
          content: JSON.stringify(data.result),
          survey_month: currentMonth,
          created_by: session.session?.user.id,
          barangay_id: userRole === 'sk_chairman' ? userBarangayId : null
        });
      }

      toast({
        title: "Success",
        description: "Recommendations generated and saved successfully",
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations",
        variant: "destructive",
      });
    } finally {
      setGeneratingRecommendations(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading survey insights...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-heading font-bold text-foreground mb-2">
          Monthly Survey Insights
        </h2>
        <p className="text-muted-foreground">
          Data-driven recommendations based on survey responses
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-report">AI Report</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="feedback">Direct Feedback</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{surveyData?.totalResponses || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{surveyData?.participationRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {surveyData?.participationRate && surveyData.participationRate < 50 ? "Below target" : "On track"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Average Age</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{surveyData?.averageAge || 0} yrs</div>
                <p className="text-xs text-muted-foreground mt-1">Youth demographic</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Want to Join</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{surveyData?.interestedInJoining || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {surveyData?.totalResponses && surveyData.totalResponses > 0
                    ? `${((surveyData.interestedInJoining / surveyData.totalResponses) * 100).toFixed(1)}% interested`
                    : "0% interested"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Male</span>
                    <span className="text-sm text-muted-foreground">
                      {surveyData?.maleCount || 0} ({surveyData?.totalResponses 
                        ? ((surveyData.maleCount / surveyData.totalResponses) * 100).toFixed(1) 
                        : 0}%)
                    </span>
                  </div>
                  <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ 
                        width: `${surveyData?.totalResponses 
                          ? (surveyData.maleCount / surveyData.totalResponses) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Female</span>
                    <span className="text-sm text-muted-foreground">
                      {surveyData?.femaleCount || 0} ({surveyData?.totalResponses 
                        ? ((surveyData.femaleCount / surveyData.totalResponses) * 100).toFixed(1) 
                        : 0}%)
                    </span>
                  </div>
                  <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-secondary rounded-full"
                      style={{ 
                        width: `${surveyData?.totalResponses 
                          ? (surveyData.femaleCount / surveyData.totalResponses) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Interest Areas</CardTitle>
              </CardHeader>
              <CardContent>
                {surveyData?.topInterestAreas && surveyData.topInterestAreas.length > 0 ? (
                  <div className="space-y-2">
                    {surveyData.topInterestAreas.map((area, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <span className="text-sm">{area}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No interest areas recorded</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Barangay Participation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {surveyData?.barangayParticipation && Object.entries(surveyData.barangayParticipation).map(([barangay, count]) => (
                  <div key={barangay}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{barangay}</span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({surveyData.totalResponses 
                          ? ((count / surveyData.totalResponses) * 100).toFixed(1) 
                          : 0}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ 
                          width: `${surveyData.totalResponses 
                            ? (count / surveyData.totalResponses) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Report Tab */}
        <TabsContent value="ai-report" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>AI-Generated Monthly Report</CardTitle>
                </div>
                <Button 
                  onClick={generateAIReport} 
                  disabled={generatingReport}
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${generatingReport ? 'animate-spin' : ''}`} />
                  {generatingReport ? 'Generating...' : 'Regenerate Report'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aiReport ? (
                <div className="prose prose-sm max-w-none">
                  <div className="bg-muted/30 p-6 rounded-lg whitespace-pre-wrap">
                    {aiReport}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Generate an AI-powered monthly report based on survey data
                  </p>
                  <Button onClick={generateAIReport} disabled={generatingReport}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <CardTitle>AI-Driven Recommendations</CardTitle>
                </div>
                <Button 
                  onClick={generateRecommendations} 
                  disabled={generatingRecommendations}
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${generatingRecommendations ? 'animate-spin' : ''}`} />
                  {generatingRecommendations ? 'Generating...' : 'Generate'}
                </Button>
              </div>
              {recommendations.length > 0 && (
                <CardDescription>
                  Based on the analysis of {surveyData?.totalResponses || 0} survey responses, 
                  here are actionable recommendations to improve SK programs and youth engagement:
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${
                        rec.priority === 'High' 
                          ? 'bg-destructive/5 border-destructive/20' 
                          : rec.priority === 'Medium'
                          ? 'bg-yellow-500/5 border-yellow-500/20'
                          : 'bg-secondary/5 border-secondary/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'}>
                              {rec.priority} Priority
                            </Badge>
                          </div>
                          <p className="font-medium mb-2">{rec.issue}</p>
                          <p className="text-sm text-muted-foreground">{rec.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Generate AI-powered recommendations based on survey data
                  </p>
                  <Button onClick={generateRecommendations} disabled={generatingRecommendations}>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Generate Recommendations
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {priorityMatrix && (
            <Card>
              <CardHeader>
                <CardTitle>Action Priority Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <h4 className="font-semibold mb-3 text-destructive">High Priority</h4>
                    <ul className="space-y-2">
                      {priorityMatrix.highPriority.map((item, idx) => (
                        <li key={idx} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <h4 className="font-semibold mb-3" style={{ color: 'hsl(45 93% 47%)' }}>Medium Priority</h4>
                    <ul className="space-y-2">
                      {priorityMatrix.mediumPriority.map((item, idx) => (
                        <li key={idx} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h4 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">Opportunities</h4>
                    <ul className="space-y-2">
                      {priorityMatrix.opportunities.map((item, idx) => (
                        <li key={idx} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h4 className="font-semibold mb-3 text-green-600 dark:text-green-400">Maintain</h4>
                    <ul className="space-y-2">
                      {priorityMatrix.maintain.map((item, idx) => (
                        <li key={idx} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Direct Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Direct Feedback</CardTitle>
              <CardDescription>
                Direct feedback and comments from survey respondents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                No direct feedback available yet. This section will display comments and suggestions from survey respondents.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
