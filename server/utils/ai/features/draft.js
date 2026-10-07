import { askLLM } from '../provider.js';
import { llmOrFallback } from '../orchestrate.js';
import { loadEventBundle } from '../retrieval.js';

/**
 * Copywriting drafts — the feature that existed before this work, rebuilt.
 *
 * The old fallback returned literal template strings ("Welcome to ${title}, the premier
 * gathering for industry leaders..."), which is what the app served to anyone who had not
 * configured an API key — i.e. the default state. It read like filler because it was filler.
 *
 * The replacement composes from whatever real material it is given: when a draft is requested
 * for an actual event, the venue, dates, tracks and speaker names come from the database, and
 * the sentences are selected by a hash of the title so two different events never produce
 * byte-identical copy. With nothing but a title to work from it is more generic, which is
 * honest — it has nothing else to go on.
 */

const DRAFT_TYPES = ['event_description', 'speaker_bio', 'session_summary', 'announcement'];

/** Stable small hash, so the same input always picks the same wording. */
const hash = (s = '') => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const pick = (variants, seed) => variants[hash(seed) % variants.length];

const clean = (s) => String(s || '').replace(/^["'\s]+|["'\s]+$/g, '').trim();

const TYPE_BRIEF = {
  event_description:
    'a description for an event landing page. Roughly 60-90 words. Open with what the event is, then who attends and what they take away. No heading, no bullet points.',
  speaker_bio:
    'a speaker biography. Roughly 50-70 words, third person, present tense. Mention their expertise and what they bring to the stage. No heading.',
  session_summary:
    'a session summary. Roughly 50-70 words. What the session covers and what an attendee will be able to do afterwards. No heading.',
  announcement:
    'an announcement to registered attendees. Roughly 40-60 words, warm and direct, second person. No heading, no emoji.'
};

const deterministicDraft = ({ type, title, keywords, context, bundle }) => {
  const subject = clean(title) || 'this event';
  const kwList = String(keywords || '')
    .split(/[,;]/)
    .map((k) => k.trim())
    .filter(Boolean);
  const keywordPhrase =
    kwList.length > 1
      ? `${kwList.slice(0, -1).join(', ')} and ${kwList[kwList.length - 1]}`
      : kwList[0] || '';

  // Real facts, when a real event was supplied.
  const facts = bundle
    ? {
        when: `${new Date(bundle.event.startDate).toISOString().slice(0, 10)}`,
        where: bundle.venue ? `${bundle.venue.name}${bundle.venue.city ? `, ${bundle.venue.city}` : ''}` : null,
        tracks: [...new Set(bundle.sessions.map((s) => s.track || 'General'))],
        sessionCount: bundle.sessions.length,
        speakerNames: bundle.speakers.slice(0, 3).map((s) => s.name),
        speakerCount: bundle.speakers.length,
        category: bundle.event.category,
        tagline: bundle.event.tagline
      }
    : null;

  const contextNote = clean(context);

  switch (type) {
    case 'event_description': {
      const opening = facts
        ? `${subject} is a ${facts.category} held on ${facts.when}${facts.where ? ` at ${facts.where}` : ''}.`
        : pick(
            [
              `${subject} brings together the people building and running modern software systems.`,
              `${subject} is a working forum for practitioners who ship.`,
              `${subject} gathers the teams turning strategy into shipped systems.`
            ],
            subject
          );

      const middle = facts && facts.sessionCount
        ? `Across ${facts.sessionCount} sessions in ${facts.tracks.length} track${facts.tracks.length !== 1 ? 's' : ''}${facts.tracks.length ? ` — including ${facts.tracks.slice(0, 3).join(', ')} —` : ''} the programme stays on implementation rather than theory.`
        : keywordPhrase
          ? `The programme centres on ${keywordPhrase}.`
          : 'The programme stays on implementation rather than theory.';

      const close = facts?.speakerCount
        ? `${facts.speakerCount} speaker${facts.speakerCount !== 1 ? 's' : ''}${facts.speakerNames.length ? `, among them ${facts.speakerNames.join(', ')}` : ''}, and a room of people solving the same problems.`
        : 'Expect a room of people solving the same problems you are.';

      return [opening, facts?.tagline, middle, close].filter(Boolean).join(' ');
    }

    case 'speaker_bio': {
      const role = keywordPhrase || 'enterprise systems';
      const opener = pick(
        [
          `${subject} works on ${role}.`,
          `${subject} leads work in ${role}.`,
          `${subject}'s focus is ${role}.`
        ],
        subject
      );
      const body = contextNote
        ? `${contextNote}`
        : `Their work spans design, delivery and the operational realities that follow a launch — the parts that decide whether a system survives contact with production.`;
      const close = pick(
        [
          `On stage they favour concrete examples over frameworks, and case studies over slides.`,
          `They are known for talks that leave you with something you can apply on Monday.`,
          `Expect a session grounded in what actually shipped, including what did not work.`
        ],
        subject
      );
      return `${opener} ${body} ${close}`;
    }

    case 'session_summary': {
      const topic = keywordPhrase || 'the practical work of building reliable systems';
      const opener = `"${subject}" is a working session on ${topic}.`;
      const body = facts?.sessionCount
        ? `It sits among ${facts.sessionCount} sessions on the programme and is aimed at teams already past the proof-of-concept stage.`
        : `It is aimed at teams already past the proof-of-concept stage.`;
      const close = pick(
        [
          `Attendees leave with a clear model of the trade-offs and a short list of things to try next.`,
          `You will leave able to explain the trade-offs to your team, and knowing which ones to measure first.`,
          `Expect concrete patterns you can adapt, and a realistic account of where they stop working.`
        ],
        subject
      );
      return `${opener} ${body} ${close}`;
    }

    case 'announcement': {
      const opener = pick(
        [`An update on ${subject}.`, `A quick note about ${subject}.`, `Important detail regarding ${subject}.`],
        subject
      );
      const body = keywordPhrase
        ? `We have added detail on ${keywordPhrase} to the programme.`
        : `We have updated the programme.`;
      const close =
        'Your personal schedule in the dashboard reflects the change, along with room assignments and any session materials. Check it before you travel.';
      return `${opener} ${body} ${close}`;
    }

    default:
      return `${subject} — ${keywordPhrase || 'a working session for practitioners'}.`;
  }
};

/**
 * @returns {Promise<{draft:string, source:'llm'|'fallback', degraded:boolean}>}
 */
export async function writeDraft({ type, title, keywords, context, eventId, scope }) {
  const safeType = DRAFT_TYPES.includes(type) ? type : 'event_description';

  // Real grounding, when the caller named an event. This is what the old implementation was
  // missing — its `context` argument was plumbed through the route and never sent by anyone.
  const bundle = eventId && scope ? await loadEventBundle(eventId, scope) : null;

  const factsForPrompt = bundle
    ? `\n\nEVENT FACTS (use these, do not contradict them):\n` +
      `Title: ${bundle.event.title}\n` +
      `Category: ${bundle.event.category}\n` +
      `Dates: ${new Date(bundle.event.startDate).toISOString().slice(0, 10)} to ${new Date(bundle.event.endDate).toISOString().slice(0, 10)}\n` +
      (bundle.venue ? `Venue: ${bundle.venue.name}, ${bundle.venue.city || ''}\n` : '') +
      (bundle.event.tagline ? `Tagline: ${bundle.event.tagline}\n` : '') +
      `Sessions: ${bundle.sessions.length} across tracks ${[...new Set(bundle.sessions.map((s) => s.track || 'General'))].join(', ') || 'none'}\n` +
      `Speakers: ${bundle.speakers.map((s) => s.name).join(', ') || 'none'}`
    : '';

  const result = await llmOrFallback({
    feature: 'draft',
    primary: () =>
      askLLM({
        temperature: 0.7,
        maxTokens: 500,
        system:
          'You are a corporate event copywriter. You write plain, specific, confident prose. You avoid cliche, hype and filler adjectives.',
        user:
          `Write ${TYPE_BRIEF[safeType]}\n\n` +
          `Subject: "${clean(title)}"\n` +
          (keywords ? `Keywords to work in naturally: ${keywords}\n` : '') +
          (context ? `Context: ${clean(context)}\n` : '') +
          factsForPrompt +
          `\nReturn only the copy. No preamble, no quotes around it, no markdown.`
      }),
    fallback: () => deterministicDraft({ type: safeType, title, keywords, context, bundle })
  });

  return {
    draft: typeof result.value === 'string' ? result.value.trim() : '',
    source: result.source,
    degraded: result.degraded
  };
}
