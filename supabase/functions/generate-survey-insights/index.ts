import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
      .slice(0, 3);

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

    let report = `Monthly Survey Report for ${currentMonthName} ${currentYear}\n\n`;

    report += `This month, ${currentMonthSurveys.length} ${
      currentMonthSurveys.length === 1 ? "user has" : "users have"
    } submitted survey responses ${locationContext}. `;

    if (monthlyGrowth > 0) {
      report += `This represents a ${monthlyGrowth.toFixed(
        1
      )}% increase compared to last month, indicating growing engagement with SK programs. `;
    } else if (monthlyGrowth < 0) {
      report += `This shows a ${Math.abs(monthlyGrowth).toFixed(
        1
      )}% decrease from last month, suggesting a need to boost outreach efforts. `;
    } else if (lastMonthSurveys.length === 0 && currentMonthSurveys.length > 0) {
      report += `This is great progress as we had no responses last month. `;
    }

    report += `\n\nOut of ${surveys.length} total respondents, ${participationRate} ${
      participationRate === 1 ? "has" : "have"
    } previously participated in SK activities (${(
      (participationRate / surveys.length) *
      100
    ).toFixed(1)}%). `;

    if ((participationRate / surveys.length) * 100 < 50) {
      report += `With less than half having prior participation, there's significant opportunity to convert interested youth into active participants. `;
    } else {
      report += `This strong participation rate shows good community engagement. `;
    }

    report += `\n\nThe gender distribution shows ${maleCount} male and ${femaleCount} female respondents. `;
    const genderRatio = maleCount / femaleCount;
    if (genderRatio > 1.3) {
      report += `There's an imbalance with more male respondents, suggesting targeted outreach to female youth could improve representation. `;
    } else if (genderRatio < 0.77) {
      report += `Female respondents outnumber males, indicating strong female engagement but potential to reach more male youth. `;
    } else {
      report += `This balanced representation across genders is excellent for inclusive programming. `;
    }

    report += `The average age of respondents is ${averageAge.toFixed(
      1
    )} years. `;

    if (topInterests.length > 0) {
      report += `\n\nThe top interest areas among youth are:\n`;
      topInterests.forEach((interest, index) => {
        report += `${index + 1}. ${interest.name} (${interest.count} ${
          interest.count === 1 ? "respondent" : "respondents"
        })\n`;
      });
      report += `\nThese interests should guide program planning to maximize youth engagement. `;
    }

    report += `\n\n${interestedInJoining} ${
      interestedInJoining === 1 ? "respondent has" : "respondents have"
    } expressed interest in joining SK activities (${(
      (interestedInJoining / surveys.length) *
      100
    ).toFixed(1)}%). `;

    if ((interestedInJoining / surveys.length) * 100 > 30) {
      report += `This high interest level presents an excellent opportunity to recruit new volunteers and expand program participation. Consider fast-tracking orientation sessions. `;
    } else if ((interestedInJoining / surveys.length) * 100 < 15) {
      report += `The relatively low interest suggests a need to better communicate the benefits and impact of SK involvement. Showcasing success stories could help. `;
    } else {
      report += `This moderate interest level is a good foundation to build upon through targeted recruitment campaigns. `;
    }

    const suggestions = surveys
      .map((s) => s.improvement_suggestions)
      .filter((s) => s && s.trim() !== "")
      .slice(0, 3);

    if (suggestions.length > 0) {
      report += `\n\nYouth have provided ${suggestions.length} improvement suggestions that deserve attention. Review the feedback section to incorporate actionable ideas into planning. `;
    }

    report += `\n\nOverall Assessment: `;
    if (monthlyGrowth > 10 && (participationRate / surveys.length) * 100 > 40) {
      report += `The SK program is showing strong momentum with growing survey engagement and solid participation rates. Continue current strategies while exploring new initiatives based on youth interests.`;
    } else if (monthlyGrowth < -10 || (participationRate / surveys.length) * 100 < 30) {
      report += `There are opportunities to strengthen youth engagement. Focus on increasing visibility through social media, school partnerships, and community events to boost both awareness and participation.`;
    } else {
      report += `The SK program is maintaining steady engagement. Focus on converting interested youth into active participants and addressing any gaps in representation or interest areas.`;
    }

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
