// Calls your own backend endpoint, which securely calls the OpenAI API.
// NEVER put your OpenAI key directly in the app - route it through a backend
// (e.g. a Supabase Edge Function) so it can't be extracted from the app bundle.
const AI_BACKEND_URL = 'https://YOUR-BACKEND-URL/api/chat';
const SUMMARY_BACKEND_URL = 'https://YOUR-BACKEND-URL/api/summary';

export async function generateSummary(answers) {
  try {
    const res = await fetch(SUMMARY_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    return data.summary;
  } catch (e) {
    return `${answers.name} is working toward ${answers.dream}, hoping to be living in ${answers.location_goal} and working as ${answers.career_goal} in five years. Right now they're carrying some worry about ${answers.fear}, and reflecting on ${answers.regret}. ${answers.relationships} matters most to them, and they're focused on ${answers.habit}.`;
  }
}

export async function getFutureSelfReply(profile, messageHistory) {
  const res = await fetch(AI_BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, messages: messageHistory }),
  });
  if (!res.ok) throw new Error('AI request failed');
  const data = await res.json();
  return data.reply;
}

export async function generateCapsuleReflection(originalMessage) {
  try {
    const res = await fetch(SUMMARY_BACKEND_URL.replace('/summary', '/capsule-reflection'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: originalMessage }),
    });
    const data = await res.json();
    return data.reflection;
  } catch (e) {
    return "Reading this again, it's worth noticing how far you've come since you wrote it.";
  }
}
