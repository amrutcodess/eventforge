import OpenAI from 'openai';

let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Generate AI Content Draft (Event Description, Speaker Bio, Session Summary, Announcement)
 */
export const generateAIDraft = async ({ type, title, keywords, context }) => {
  if (openaiClient) {
    try {
      const prompt = `You are an expert corporate event copywriter. Generate a high-converting, professional draft for a ${type}.
Title/Topic: "${title}"
Key details / Keywords: "${keywords || 'Industry leaders, emerging trends, innovation'}"
Context: "${context || 'Annual tech conference'}"

Return a polished text output ready for publication. Keep tone modern, authoritative, and engaging.`;

      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 400
      });

      return response.choices[0].message.content.trim();
    } catch (err) {
      console.warn('OpenAI API call failed, using fallback generator:', err.message);
    }
  }

  // Fallback generator if no OpenAI key provided
  const kw = keywords || 'innovation, industry transformation, executive networking';
  switch (type) {
    case 'event_description':
      return `Welcome to ${title || 'EventForge Summit'}, the premier gathering for industry leaders, technical pioneers, and forward-thinking executives. Over two immersive days, explore cutting-edge breakthroughs in ${kw}. Connect with key decision-makers, participate in hands-on technical workshops, and gain strategic insights to elevate your organization.`;

    case 'speaker_bio':
      return `${title || 'Distinguished Speaker'} is a visionary technology leader with over 15 years of experience driving transformation across enterprise organizations. Passionate about ${kw}, they regularly advise Fortune 500 companies on strategic growth and technology adoption.`;

    case 'session_summary':
      return `In this session on "${title || 'Future Trends'}", attendees will gain practical frameworks for navigating ${kw}. Discover actionable methodologies, real-world case studies, and key metrics to measure success in modern corporate environments.`;

    case 'announcement':
      return `📢 **Important Update regarding ${title || 'Event Schedule'}**\n\nWe are thrilled to announce exciting additions to our upcoming program focusing on ${kw}. Please check your personalized dashboard schedule for room updates and session materials.`;

    default:
      return `Professional summary for ${title} focusing on ${kw}. Designed for high-impact enterprise engagement.`;
  }
};

/**
 * AI Session Recommendation Engine based on attendee profile + interests
 */
export const recommendSessionsForAttendee = async (attendeeInterests = [], availableSessions = []) => {
  if (!availableSessions || availableSessions.length === 0) return [];

  if (openaiClient) {
    try {
      const prompt = `Given an attendee interested in: [${attendeeInterests.join(', ')}]
And the following list of available sessions:
${JSON.stringify(availableSessions.map(s => ({ id: s._id, title: s.title, summary: s.summary, track: s.track, tags: s.tags })))}

Rank the top 3-5 session IDs most relevant to this attendee. Return ONLY a valid JSON array of object IDs like: ["id1", "id2", "id3"].`;

      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      const recommendedIds = Array.isArray(parsed) ? parsed : (parsed.recommendedIds || parsed.sessionIds || []);
      return availableSessions.filter(s => recommendedIds.includes(s._id.toString()));
    } catch (err) {
      console.warn('AI Recommendation API call failed, using heuristic match:', err.message);
    }
  }

  // Heuristic matching fallback
  const userInterestsLower = attendeeInterests.map(i => i.toLowerCase());
  if (userInterestsLower.length === 0) {
    return availableSessions.slice(0, 3); // return first 3 if no interests specified
  }

  const scoredSessions = availableSessions.map(session => {
    let score = 0;
    const textToMatch = `${session.title} ${session.summary} ${session.track} ${session.description}`.toLowerCase();
    userInterestsLower.forEach(interest => {
      if (textToMatch.includes(interest)) score += 3;
    });
    return { session, score };
  });

  scoredSessions.sort((a, b) => b.score - a.score);
  return scoredSessions.slice(0, 4).map(item => item.session);
};
