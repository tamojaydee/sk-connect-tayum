import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = "AIzaSyA-goCF-QLqP-iKG5WwMkd7-UY_tjfjfj8";

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

interface RequestBody {
  surveys: Survey[];
  barangayName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { surveys, barangayName }: RequestBody = await req.json();

    if (!surveys || surveys.length === 0) {
      return new Response(
        JSON.stringify({ error: "No survey data provided" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthSurveys = surveys.filter(
      (s) => new Date(s.created_at) >= currentMonth
    );
    const lastMonthSurveys = surveys.filter(
      (s) =>
        new Date(s.created_at) >= lastMonth &&
        new Date(s.created_at) < currentMonth
    );

    const participationRate = surveys.filter((s) => s.has_participated).length;
    const interestedInJoining = surveys.filter((s) => s.interested_in_joining).length;

    const interestMap = new Map<string, number>();
    surveys.forEach((s) => {
      if (s.interest_areas) {
        s.interest_areas.forEach((interest) => {
          interestMap.set(interest, (interestMap.get(interest) || 0) + 1);
        });
      }
    });

    const topInterests = Array.from(interestMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const maleCount = surveys.filter((s) => s.gender === "male").length;
    const femaleCount = surveys.filter((s) => s.gender === "female").length;

    const averageAge =
      surveys.reduce((sum, s) => sum + s.age, 0) / surveys.length;

    const monthlyGrowth =
      lastMonthSurveys.length > 0
        ? ((currentMonthSurveys.length - lastMonthSurveys.length) /
            lastMonthSurveys.length) *
          100
        : 0;

    const currentMonthName = now.toLocaleString("default", { month: "long" });
    const currentYear = now.getFullYear();

    const locationContext = barangayName
      ? `in ${barangayName}`
      : "across all barangays";

    const suggestions = surveys
      .map((s) => s.improvement_suggestions)
      .filter((s) => s && s.trim() !== "")
      .slice(0, 10);

    const prompt = `You are an expert analyst for SK (Sangguniang Kabataan - Youth Council) programs in the Philippines. Analyze the following survey data and generate a comprehensive monthly report.

Survey Data Summary:
- Location: ${locationContext}
- Period: ${currentMonthName} ${currentYear}
- Total Responses: ${surveys.length}
- Current Month Responses: ${currentMonthSurveys.length}
- Last Month Responses: ${lastMonthSurveys.length}
- Monthly Growth: ${monthlyGrowth.toFixed(1)}%
- Previous Participation Rate: ${participationRate} out of ${surveys.length} (${((participationRate / surveys.length) * 100).toFixed(1)}%)
- Gender Distribution: ${maleCount} male, ${femaleCount} female
- Average Age: ${averageAge.toFixed(1)} years
- Interested in Joining: ${interestedInJoining} out of ${surveys.length} (${((interestedInJoining / surveys.length) * 100).toFixed(1)}%)

Top Interest Areas:
${topInterests.map((i, idx) => `${idx + 1}. ${i.name} (${i.count} respondents)`).join('\n')}

Youth Improvement Suggestions (sample):
${suggestions.slice(0, 5).map((s, idx) => `${idx + 1}. "${s}"`).join('\n')}

Please generate a professional, insightful monthly report that includes:
1. Executive Summary - Key highlights and trends
2. Engagement Analysis - Discuss participation rates, growth trends, and what they mean
3. Demographics Insights - Age and gender distribution analysis
4. Interest Areas - What youth are interested in and implications
5. Youth Voice - Key themes from improvement suggestions
6. Strategic Recommendations - 3-5 actionable recommendations based on the data
7. Conclusion - Overall assessment and next steps

Write in a professional but accessible tone. Be specific with numbers and percentages. Make it actionable for SK leaders.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const report = geminiData.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ report }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate insights" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
