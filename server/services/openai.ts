import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR 
});

interface ContentGenerationOptions {
  topics: string[];
  style?: 'professional' | 'casual' | 'engaging' | 'educational';
  length?: 'short' | 'medium' | 'long';
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}

interface GeneratedContent {
  content: string;
  hashtags: string[];
  engagement_score: number;
  character_count: number;
}

export async function generateTweetContent(options: ContentGenerationOptions): Promise<GeneratedContent> {
  const { topics, style = 'engaging', length = 'medium', includeHashtags = true, includeEmojis = true } = options;
  
  const topicString = topics.join(', ');
  const styleInstructions = getStyleInstructions(style);
  const lengthInstructions = getLengthInstructions(length);
  
  const prompt = `Generate a ${style} tweet about ${topicString}. 
${styleInstructions}
${lengthInstructions}
${includeHashtags ? 'Include relevant trending hashtags.' : 'Do not include hashtags.'}
${includeEmojis ? 'Include appropriate emojis to increase engagement.' : 'Do not include emojis.'}

Respond with JSON in this format:
{
  "content": "The tweet content",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "engagement_score": 8.5,
  "character_count": 247
}

The engagement_score should be between 1-10 based on how likely the tweet is to get high engagement.
Ensure the character count is accurate and under 280 characters.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert social media content creator specializing in Twitter. You understand viral content patterns, trending topics, and engagement optimization."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      content: result.content || '',
      hashtags: result.hashtags || [],
      engagement_score: Math.max(1, Math.min(10, result.engagement_score || 5)),
      character_count: result.character_count || result.content?.length || 0,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate tweet content: ${errorMessage}`);
  }
}

export async function generateMultipleTweets(
  options: ContentGenerationOptions,
  count: number = 3
): Promise<GeneratedContent[]> {
  const promises = Array(count).fill(null).map(() => generateTweetContent(options));
  return await Promise.all(promises);
}

export async function optimizeTweetContent(content: string, targetAudience?: string): Promise<GeneratedContent> {
  const prompt = `Optimize this tweet for better engagement${targetAudience ? ` targeting ${targetAudience}` : ''}:

"${content}"

Improve it by:
- Making it more engaging and compelling
- Optimizing hashtag usage
- Adding appropriate emojis
- Ensuring optimal length for engagement
- Maintaining the original message and tone

Respond with JSON in this format:
{
  "content": "The optimized tweet content",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "engagement_score": 8.5,
  "character_count": 247
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert social media optimizer specializing in Twitter engagement and viral content creation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      content: result.content || content,
      hashtags: result.hashtags || [],
      engagement_score: Math.max(1, Math.min(10, result.engagement_score || 5)),
      character_count: result.character_count || result.content?.length || 0,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to optimize tweet content: ${errorMessage}`);
  }
}

function getStyleInstructions(style: string): string {
  switch (style) {
    case 'professional':
      return 'Write in a professional, authoritative tone suitable for business audiences. Focus on insights and expertise.';
    case 'casual':
      return 'Write in a friendly, conversational tone. Keep it relatable and approachable.';
    case 'engaging':
      return 'Write to maximize engagement with compelling hooks, questions, or thought-provoking statements.';
    case 'educational':
      return 'Write in an informative, educational tone that teaches or explains concepts clearly.';
    default:
      return 'Write in an engaging, authentic voice that resonates with your audience.';
  }
}

function getLengthInstructions(length: string): string {
  switch (length) {
    case 'short':
      return 'Keep it concise, under 150 characters for maximum impact.';
    case 'medium':
      return 'Aim for 150-220 characters to balance detail with conciseness.';
    case 'long':
      return 'Use the full character limit (up to 280) to provide comprehensive content.';
    default:
      return 'Optimize length for the content type and engagement potential.';
  }
}
