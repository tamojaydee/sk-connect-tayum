import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyData, reportType } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    let prompt = '';
    
    if (reportType === 'overview') {
      prompt = `Based on the following SK survey data, generate a detailed monthly report:

Total Responses: ${surveyData.totalResponses}
Gender Distribution: ${surveyData.maleCount} males, ${surveyData.femaleCount} females
Average Age: ${surveyData.averageAge}
Participation Rate: ${surveyData.participationRate}%
Interest in Joining: ${surveyData.interestedInJoining}
Top Interest Areas: ${surveyData.topInterestAreas?.join(', ') || 'None recorded'}
Barangay Participation: ${JSON.stringify(surveyData.barangayParticipation || {})}

Generate a comprehensive monthly survey report for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Include:
1. An opening summary of the month's responses
2. Analysis of participation patterns
3. Demographic insights (gender, age distribution)
4. Youth engagement opportunities
5. Overall assessment with recommendations

Keep the tone professional and data-driven.`;
    } else if (reportType === 'recommendations') {
      prompt = `Based on the following SK survey data, generate actionable recommendations:

Total Responses: ${surveyData.totalResponses}
Gender Distribution: ${surveyData.maleCount} males, ${surveyData.femaleCount} females
Participation Rate: ${surveyData.participationRate}%
Interest in Joining: ${surveyData.interestedInJoining}

Generate 3-5 specific, actionable recommendations to improve SK programs and youth engagement. 
For each recommendation:
1. Identify the issue or opportunity
2. Suggest a concrete action
3. Classify the priority (High, Medium, Low)

Also create an action priority matrix with 4 categories:
- High Priority: urgent actions needed
- Medium Priority: important but not urgent
- Opportunities: potential improvements
- Maintain: things working well

Format the response as JSON with this structure:
{
  "recommendations": [
    {
      "issue": "description",
      "action": "what to do",
      "priority": "High/Medium/Low"
    }
  ],
  "priorityMatrix": {
    "highPriority": ["item1", "item2"],
    "mediumPriority": ["item1"],
    "opportunities": ["item1"],
    "maintain": ["item1"]
  }
}`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to parse as JSON if recommendations, otherwise return as text
    let result = generatedText;
    if (reportType === 'recommendations') {
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                         generatedText.match(/```\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[1]);
        } else {
          result = JSON.parse(generatedText);
        }
      } catch (e) {
        console.error('Failed to parse JSON from recommendations:', e);
        // If parsing fails, return as text
      }
    }

    return new Response(
      JSON.stringify({ result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-survey-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
