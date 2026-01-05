import { generateJSON } from './anthropic'

interface AssessmentQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  level: string
  level_id: string
}

interface AssessmentResponse {
  questions: AssessmentQuestion[]
}

interface Level {
  id: string
  name: string
}

export async function generateAssessment(
  subject: string,
  levels: Level[]
): Promise<AssessmentQuestion[]> {
  const levelList = levels.map((l) => `- ${l.name} (ID: ${l.id})`).join('\n')
  const questionsPerLevel = Math.ceil(18 / levels.length)

  const prompt = `Generate a placement assessment for ${subject} with ${questionsPerLevel * levels.length} questions.

The levels for this subject, in order from beginner to advanced, are:
${levelList}

Include ${questionsPerLevel} questions from each level. Tag each question with its level name and level_id.
Order questions from easiest (lowest level) to hardest (highest level).

Return JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "Brief explanation of why this is correct.",
      "level": "Level Name",
      "level_id": "uuid-of-level"
    }
  ]
}

Make questions genuinely diagnostic of that level's skills. Multiple choice with 4 options each.
Generate exactly ${questionsPerLevel * levels.length} questions with IDs q1, q2, q3, etc.`

  const response = await generateJSON<AssessmentResponse>(prompt)
  return response.questions
}
