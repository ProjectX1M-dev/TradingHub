import { createClient } from "npm:@supabase/supabase-js@2.39.0";

// Define types
interface ChatbotRequest {
  query: string;
  userId?: string;
  conversationId?: string;
  previousMessages?: Message[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotResponse {
  answer: string;
  source?: string;
  category?: string;
  confidence?: number;
  relatedQuestions?: string[];
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to format response with numbered steps
function formatResponseWithSteps(answer: string): string {
  // Check if the answer contains steps that need formatting
  if (answer.includes('1)') || answer.includes('1.') || 
      answer.includes('Step 1') || answer.includes('step 1')) {
    
    // Format numbered steps
    let formattedAnswer = answer;
    
    // Replace "Step 1: Do something" with "1. Do something"
    formattedAnswer = formattedAnswer.replace(/Step (\d+):\s+/gi, '$1. ');
    
    // Replace "1) Do something" with "1. Do something"
    formattedAnswer = formattedAnswer.replace(/(\d+\))\s+/g, '$1 ');
    
    // Add line breaks before numbered steps if they don't already exist
    formattedAnswer = formattedAnswer.replace(/([^\n])(\d+[\.\)])/g, '$1\n\n$2');
    
    return formattedAnswer;
  }
  
  return answer;
}

// Function to find the best matching knowledge base entry
async function findBestMatch(query: string): Promise<ChatbotResponse | null> {
  try {
    console.log(`🔍 [findBestMatch] Searching for: "${query}"`);
    
    // Normalize the query
    const normalizedQuery = query.toLowerCase().trim();
    
    // Extract potential keywords from the query
    const words = normalizedQuery
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 3); // Only keep words longer than 3 chars
    
    console.log(`🔍 [findBestMatch] Extracted keywords: ${words.join(', ')}`);
    
    // First, try to find exact matches in question_phrase
    const { data: exactMatches, error: exactMatchError } = await supabase
      .from('chatbot_knowledge')
      .select('*')
      .ilike('question_phrase', `%${normalizedQuery}%`)
      .limit(3);
    
    if (exactMatchError) {
      console.error(`❌ [findBestMatch] Error searching for exact matches: ${exactMatchError.message}`);
      return null;
    }
    
    if (exactMatches && exactMatches.length > 0) {
      console.log(`✅ [findBestMatch] Found ${exactMatches.length} exact matches`);
      
      // Return the best match with formatted answer
      const bestMatch = exactMatches[0];
      const formattedAnswer = formatResponseWithSteps(bestMatch.answer_text);
      
      return {
        answer: formattedAnswer,
        category: bestMatch.category,
        confidence: 0.9,
        relatedQuestions: exactMatches.slice(1).map(m => m.question_phrase)
      };
    }
    
    // If no exact matches, try keyword search
    if (words.length > 0) {
      // Build a query that checks if any keyword is in the keywords array
      let query = supabase
        .from('chatbot_knowledge')
        .select('*');
      
      // Add conditions for each keyword
      for (const word of words) {
        query = query.or(`keywords.cs.{${word}}`);
      }
      
      const { data: keywordMatches, error: keywordMatchError } = await query.limit(5);
      
      if (keywordMatchError) {
        console.error(`❌ [findBestMatch] Error searching by keywords: ${keywordMatchError.message}`);
        return null;
      }
      
      if (keywordMatches && keywordMatches.length > 0) {
        console.log(`✅ [findBestMatch] Found ${keywordMatches.length} keyword matches`);
        
        // Calculate relevance scores based on how many keywords match
        const scoredMatches = keywordMatches.map(match => {
          const matchKeywords = match.keywords || [];
          const matchingKeywordCount = words.filter(word => 
            matchKeywords.some((kw: string) => kw.toLowerCase().includes(word))
          ).length;
          
          return {
            ...match,
            score: matchingKeywordCount / words.length
          };
        });
        
        // Sort by score
        scoredMatches.sort((a, b) => b.score - a.score);
        
        // Return the best match with formatted answer
        const bestMatch = scoredMatches[0];
        const formattedAnswer = formatResponseWithSteps(bestMatch.answer_text);
        
        return {
          answer: formattedAnswer,
          category: bestMatch.category,
          confidence: bestMatch.score,
          relatedQuestions: scoredMatches.slice(1, 3).map(m => m.question_phrase)
        };
      }
    }
    
    // If still no matches, try a more general search
    const { data: fuzzyMatches, error: fuzzyMatchError } = await supabase
      .from('chatbot_knowledge')
      .select('*')
      .or(
        `question_phrase.ilike.%${words[0] || normalizedQuery}%,` +
        `answer_text.ilike.%${words[0] || normalizedQuery}%`
      )
      .limit(3);
    
    if (fuzzyMatchError) {
      console.error(`❌ [findBestMatch] Error in fuzzy search: ${fuzzyMatchError.message}`);
      return null;
    }
    
    if (fuzzyMatches && fuzzyMatches.length > 0) {
      console.log(`✅ [findBestMatch] Found ${fuzzyMatches.length} fuzzy matches`);
      
      // Return the best match with formatted answer
      const bestMatch = fuzzyMatches[0];
      const formattedAnswer = formatResponseWithSteps(bestMatch.answer_text);
      
      return {
        answer: formattedAnswer,
        category: bestMatch.category,
        confidence: 0.6,
        relatedQuestions: fuzzyMatches.slice(1).map(m => m.question_phrase)
      };
    }
    
    // No matches found
    console.log(`❌ [findBestMatch] No matches found for query: "${query}"`);
    return null;
    
  } catch (error) {
    console.error(`❌ [findBestMatch] Error finding best match: ${error.message}`);
    return null;
  }
}

// Function to get fallback response when no match is found
function getFallbackResponse(query: string): ChatbotResponse {
  // List of common fallback responses
  const fallbacks = [
    "I don't have specific information about that yet. Could you try asking in a different way or about another topic?",
    "I'm not sure I understand your question. Could you rephrase it or ask about trading robots, signals, or broker connections?",
    "I don't have an answer for that specific question. I can help with questions about trading robots, TradingView integration, risk management, and other platform features.",
    "I'm still learning and don't have information on that topic yet. Is there something else about the trading platform I can help with?"
  ];
  
  // Randomly select a fallback response
  const randomIndex = Math.floor(Math.random() * fallbacks.length);
  
  return {
    answer: fallbacks[randomIndex],
    confidence: 0.1,
    relatedQuestions: [
      "How do I create a trading robot?",
      "How do I set up TradingView webhooks?",
      "What are tokens used for?"
    ]
  };
}

// Main handler using Deno.serve
Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request
    const requestData: ChatbotRequest = await req.json();
    const { query } = requestData;
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({
          error: "Query parameter is required and must be a string"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`📥 [chatbot-api] Received query: "${query}"`);
    
    // Find the best matching response
    const matchResult = await findBestMatch(query);
    
    let response: ChatbotResponse;
    
    if (matchResult && matchResult.confidence && matchResult.confidence > 0.5) {
      // We have a good match
      response = matchResult;
      console.log(`✅ [chatbot-api] Found good match with confidence: ${matchResult.confidence}`);
    } else if (matchResult) {
      // We have a low confidence match, but still use it
      response = matchResult;
      console.log(`⚠️ [chatbot-api] Found low confidence match: ${matchResult.confidence}`);
    } else {
      // No match found, use fallback
      response = getFallbackResponse(query);
      console.log(`❌ [chatbot-api] No match found, using fallback response`);
    }
    
    // Return the response
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    console.error(`❌ [chatbot-api] Error processing request: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});