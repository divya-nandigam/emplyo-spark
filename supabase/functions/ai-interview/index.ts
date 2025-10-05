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
    const { action, position, department, responses } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (action === 'generate_questions') {
      // Generate interview questions using AI
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are an expert HR interviewer. Generate technical and behavioral interview questions for hiring candidates.`
            },
            {
              role: 'user',
              content: `Generate 5 interview questions for a ${position} position in the ${department} department. 
              For each question, provide:
              1. The question text
              2. The category (technical, behavioral, or situational)
              3. 3-5 key points that a good answer should cover
              
              Return ONLY a valid JSON array with this structure:
              [{"question": "...", "category": "...", "expected_points": ["...", "..."]}]`
            }
          ],
          tools: [
            {
              type: "function",
              name: "return_questions",
              description: "Returns the generated interview questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        category: { type: "string", enum: ["technical", "behavioral", "situational"] },
                        expected_points: {
                          type: "array",
                          items: { type: "string" }
                        }
                      },
                      required: ["question", "category", "expected_points"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["questions"],
                additionalProperties: false
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "return_questions" } }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      const toolCall = data.choices[0].message.tool_calls?.[0];
      
      if (!toolCall) {
        throw new Error('No tool call in response');
      }

      const questions = JSON.parse(toolCall.function.arguments).questions;
      
      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'evaluate_responses') {
      // Evaluate candidate responses
      const evaluationPromises = responses.map(async (item: any) => {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are an expert HR evaluator. Evaluate candidate interview responses objectively.`
              },
              {
                role: 'user',
                content: `Question: ${item.question}
                Category: ${item.category}
                Expected points: ${item.expected_points.join(', ')}
                
                Candidate's response: ${item.response}
                
                Evaluate this response and provide:
                1. A score from 0-10
                2. Detailed feedback on strengths and areas for improvement`
              }
            ],
            tools: [
              {
                type: "function",
                name: "return_evaluation",
                description: "Returns the evaluation of the candidate's response",
                parameters: {
                  type: "object",
                  properties: {
                    score: { 
                      type: "integer",
                      minimum: 0,
                      maximum: 10
                    },
                    feedback: { type: "string" }
                  },
                  required: ["score", "feedback"],
                  additionalProperties: false
                }
              }
            ],
            tool_choice: { type: "function", function: { name: "return_evaluation" } }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to evaluate response');
        }

        const data = await response.json();
        const toolCall = data.choices[0].message.tool_calls?.[0];
        
        if (!toolCall) {
          throw new Error('No tool call in evaluation response');
        }

        return {
          question_id: item.question_id,
          ...JSON.parse(toolCall.function.arguments)
        };
      });

      const evaluations = await Promise.all(evaluationPromises);
      const avgScore = Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length);

      // Generate overall recommendation
      const recResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are an expert HR evaluator providing hiring recommendations.`
            },
            {
              role: 'user',
              content: `Based on an average score of ${avgScore}/10 across ${evaluations.length} interview questions for a ${position} position, provide a brief hiring recommendation (2-3 sentences). Be objective and professional.`
            }
          ]
        }),
      });

      const recData = await recResponse.json();
      const recommendation = recData.choices[0].message.content;

      return new Response(JSON.stringify({ 
        evaluations,
        overall_score: avgScore,
        recommendation 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in ai-interview function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
