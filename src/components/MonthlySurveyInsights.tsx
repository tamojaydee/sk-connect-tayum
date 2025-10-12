import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Users,
  Calendar,
  Target,
  Lightbulb,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface Survey {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  has_participated: boolean;
  participation_type: string | null;
  duration_years: number | null;
  favorite_activity: string | null;
  impact_description: string | null;
  improvement_suggestions: string | null;
  interested_in_joining: boolean;
  interest_areas: string[] | null;
  preferred_activities: string[] | null;
  available_time: string | null;
  barangay_id: string;
  created_at: string;
  barangays?: {
    name: string;
  };
}

interface InsightData {
  totalResponses: number;
  monthlyGrowth: number;
  participationRate: number;
  averageAge: number;
  topInterests: { name: string; count: number }[];
  topSuggestions: string[];
  genderBalance: { male: number; female: number };
  interestedInJoining: number;
  barangayBreakdown: { name: string; count: number }[];
}

interface MonthlySurveyInsightsProps {
  barangayId?: string;
}

export const MonthlySurveyInsights = ({ barangayId }: MonthlySurveyInsightsProps) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAiReport, setLoadingAiReport] = useState(false);

  useEffect(() => {
    fetchSurveys();
  }, [barangayId]);

  const fetchSurveys = async () => {
    try {
      let query = supabase.from("surveys").select("*, barangays(name)");

      if (barangayId) {
        query = query.eq("barangay_id", barangayId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
      calculateInsights(data || []);

      if (data && data.length > 0) {
        await generateAiReport(data);
      }
    } catch (error) {
      console.error("Error fetching surveys:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAiReport = async (surveyData: Survey[]) => {
    setLoadingAiReport(true);
    try {
      const barangayName = surveyData[0]?.barangays?.name;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-survey-insights`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          surveys: surveyData,
          barangayName: barangayId ? barangayName : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI report');
      }

      const { report } = await response.json();
      setAiReport(report);
    } catch (error) {
      console.error("Error generating AI report:", error);
      setAiReport(null);
    } finally {
      setLoadingAiReport(false);
    }
  };

  const calculateInsights = (data: Survey[]) => {
    if (data.length === 0) {
      setInsights(null);
      return;
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthSurveys = data.filter(
      s => new Date(s.created_at) >= currentMonth
    );
    const lastMonthSurveys = data.filter(
      s => new Date(s.created_at) >= lastMonth && new Date(s.created_at) < currentMonth
    );

    const monthlyGrowth = lastMonthSurveys.length > 0
      ? ((currentMonthSurveys.length - lastMonthSurveys.length) / lastMonthSurveys.length) * 100
      : 0;

    const participationRate = (data.filter(s => s.has_participated).length / data.length) * 100;

    const averageAge = data.reduce((sum, s) => sum + s.age, 0) / data.length;

    const interestMap = new Map<string, number>();
    data.forEach(s => {
      if (s.interest_areas) {
        s.interest_areas.forEach(interest => {
          interestMap.set(interest, (interestMap.get(interest) || 0) + 1);
        });
      }
    });

    const topInterests = Array.from(interestMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const suggestions = data
      .map(s => s.improvement_suggestions)
      .filter(s => s && s.trim() !== "")
      .slice(0, 5) as string[];

    const maleCount = data.filter(s => s.gender === "male").length;
    const femaleCount = data.filter(s => s.gender === "female").length;

    const interestedCount = data.filter(s => s.interested_in_joining).length;

    const barangayMap = new Map<string, number>();
    data.forEach(s => {
      const name = s.barangays?.name || "Unknown";
      barangayMap.set(name, (barangayMap.get(name) || 0) + 1);
    });

    const barangayBreakdown = Array.from(barangayMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    setInsights({
      totalResponses: data.length,
      monthlyGrowth,
      participationRate,
      averageAge,
      topInterests,
      topSuggestions: suggestions,
      genderBalance: { male: maleCount, female: femaleCount },
      interestedInJoining: interestedCount,
      barangayBreakdown,
    });
  };

  const generateRecommendations = (): string[] => {
    if (!insights) return [];

    const recommendations: string[] = [];

    if (insights.participationRate < 50) {
      recommendations.push(
        "Low participation rate detected. Consider organizing more visible and accessible SK events to boost youth engagement."
      );
    }

    if (insights.monthlyGrowth < 0) {
      recommendations.push(
        "Survey responses are declining. Implement targeted outreach campaigns through social media and school visits to increase awareness."
      );
    }

    const genderRatio = insights.genderBalance.male / insights.genderBalance.female;
    if (genderRatio > 1.5 || genderRatio < 0.67) {
      const underrepresented = genderRatio > 1.5 ? "female" : "male";
      recommendations.push(
        `Gender imbalance detected with fewer ${underrepresented} respondents. Create inclusive programs that appeal to all genders and conduct targeted outreach to underrepresented groups.`
      );
    }

    if (insights.averageAge < 20) {
      recommendations.push(
        "Average respondent age is on the younger side. Develop programs specifically for older youth (21-30) to ensure comprehensive SK representation."
      );
    }

    if (insights.interestedInJoining > insights.totalResponses * 0.3) {
      recommendations.push(
        "High interest in joining SK activities detected. Fast-track volunteer orientation programs and create clear pathways for youth to get involved."
      );
    } else if (insights.interestedInJoining < insights.totalResponses * 0.15) {
      recommendations.push(
        "Low interest in joining SK activities. Showcase impact stories and success cases to inspire youth participation. Consider incentive programs."
      );
    }

    if (insights.topInterests.length > 0) {
      const topInterest = insights.topInterests[0];
      recommendations.push(
        `"${topInterest.name}" is the most popular interest area with ${topInterest.count} respondents. Prioritize programs and initiatives in this area for maximum engagement.`
      );
    }

    if (!barangayId && insights.barangayBreakdown.length > 0) {
      const lowestBarangay = insights.barangayBreakdown[insights.barangayBreakdown.length - 1];
      if (lowestBarangay.count < insights.totalResponses * 0.15) {
        recommendations.push(
          `${lowestBarangay.name} has the lowest survey participation. Schedule on-site visits and partner with local leaders to improve reach in this area.`
        );
      }
    }

    if (insights.topSuggestions.length > 0) {
      recommendations.push(
        "Youth have provided improvement suggestions. Review the 'Direct Feedback' section and incorporate feasible suggestions into your next action plan."
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Overall performance is strong. Continue current strategies while monitoring trends for any emerging issues."
      );
    }

    return recommendations;
  };

  if (loading) {
    return <div className="text-center py-8">Loading insights...</div>;
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Survey Data Available</h3>
          <p className="text-muted-foreground">
            Insights will be generated once survey responses are collected.
          </p>
        </CardContent>
      </Card>
    );
  }

  const recommendations = generateRecommendations();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-report">AI Report</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="feedback">Direct Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-report" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <CardTitle>AI-Generated Monthly Report</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAiReport ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Generating AI-powered insights...</p>
                </div>
              ) : aiReport ? (
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                      {aiReport}
                    </pre>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => generateAiReport(surveys)}
                      variant="outline"
                      size="sm"
                      disabled={loadingAiReport}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Regenerate Report
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Unable to generate AI report. Please try again.
                  </p>
                  <Button
                    onClick={() => generateAiReport(surveys)}
                    variant="outline"
                    size="sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.totalResponses}</div>
                {insights.monthlyGrowth !== 0 && (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {insights.monthlyGrowth > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                        <span className="text-green-500">+{insights.monthlyGrowth.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                        <span className="text-red-500">{insights.monthlyGrowth.toFixed(1)}%</span>
                      </>
                    )}
                    <span className="ml-1">from last month</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.participationRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.participationRate >= 50 ? "Above" : "Below"} target
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Age</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.averageAge.toFixed(1)} yrs</div>
                <p className="text-xs text-muted-foreground mt-1">Youth demographic</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Want to Join</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.interestedInJoining}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((insights.interestedInJoining / insights.totalResponses) * 100).toFixed(1)}% interested
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Male</span>
                      <span className="text-sm text-muted-foreground">
                        {insights.genderBalance.male} ({((insights.genderBalance.male / insights.totalResponses) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full"
                        style={{ width: `${(insights.genderBalance.male / insights.totalResponses) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Female</span>
                      <span className="text-sm text-muted-foreground">
                        {insights.genderBalance.female} ({((insights.genderBalance.female / insights.totalResponses) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full"
                        style={{ width: `${(insights.genderBalance.female / insights.totalResponses) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Interest Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.topInterests.length > 0 ? (
                    insights.topInterests.map((interest, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{interest.name}</span>
                        <Badge variant="secondary">{interest.count} responses</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No interest areas recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {!barangayId && insights.barangayBreakdown.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Barangay Participation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.barangayBreakdown.map((barangay, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{barangay.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {barangay.count} ({((barangay.count / insights.totalResponses) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{ width: `${(barangay.count / insights.totalResponses) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <CardTitle>AI-Driven Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Based on the analysis of {insights.totalResponses} survey responses, here are actionable recommendations to improve SK programs and youth engagement:
              </p>
              <div className="space-y-4">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex gap-3 p-4 bg-secondary/50 rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Action Priority Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50/50">
                  <h4 className="font-semibold text-sm mb-2 text-red-800">High Priority</h4>
                  <ul className="space-y-1 text-xs text-red-700">
                    {insights.participationRate < 50 && <li>Increase participation rate</li>}
                    {insights.monthlyGrowth < 0 && <li>Reverse declining survey responses</li>}
                    {insights.interestedInJoining < insights.totalResponses * 0.15 && (
                      <li>Boost youth interest in SK programs</li>
                    )}
                  </ul>
                </div>

                <div className="p-4 border-2 border-yellow-200 rounded-lg bg-yellow-50/50">
                  <h4 className="font-semibold text-sm mb-2 text-yellow-800">Medium Priority</h4>
                  <ul className="space-y-1 text-xs text-yellow-700">
                    {(insights.genderBalance.male / insights.genderBalance.female > 1.5 ||
                      insights.genderBalance.male / insights.genderBalance.female < 0.67) && (
                      <li>Address gender imbalance</li>
                    )}
                    {insights.averageAge < 20 && <li>Engage older youth demographics</li>}
                  </ul>
                </div>

                <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50">
                  <h4 className="font-semibold text-sm mb-2 text-blue-800">Opportunities</h4>
                  <ul className="space-y-1 text-xs text-blue-700">
                    {insights.interestedInJoining > insights.totalResponses * 0.3 && (
                      <li>Capitalize on high volunteer interest</li>
                    )}
                    {insights.topInterests.length > 0 && (
                      <li>Expand programs in "{insights.topInterests[0].name}"</li>
                    )}
                  </ul>
                </div>

                <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50/50">
                  <h4 className="font-semibold text-sm mb-2 text-green-800">Maintain</h4>
                  <ul className="space-y-1 text-xs text-green-700">
                    {insights.monthlyGrowth > 0 && <li>Continue current outreach strategies</li>}
                    {insights.participationRate >= 50 && <li>Sustain engagement levels</li>}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Youth Improvement Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              {insights.topSuggestions.length > 0 ? (
                <div className="space-y-4">
                  {insights.topSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 bg-secondary/50 rounded-lg border-l-4 border-primary">
                      <p className="text-sm leading-relaxed">{suggestion}</p>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-4">
                    These are direct suggestions from youth in your community. Consider incorporating them into your next planning session.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No improvement suggestions have been submitted yet. Encourage youth to share their ideas in future surveys.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
