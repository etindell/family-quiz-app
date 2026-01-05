import { generateJSON } from './anthropic'

interface WrongAnswer {
  question: string
  userAnswer: string
  correctAnswer: string
}

interface Lesson {
  question_id: string
  lesson: string
}

interface LessonsResponse {
  lessons: Lesson[]
}

interface Suggestion {
  topic: string
  reason: string
}

interface SuggestionsResponse {
  suggestions: Suggestion[]
}

export async function generateLessons(
  subject: string,
  level: string,
  topic: string,
  wrongAnswers: WrongAnswer[]
): Promise<Lesson[]> {
  if (wrongAnswers.length === 0) {
    return []
  }

  const wrongAnswersList = wrongAnswers
    .map(
      (wa, i) => `Question ${i + 1}: ${wa.question}
Their answer: ${wa.userAnswer}
Correct answer: ${wa.correctAnswer}`
    )
    .join('\n\n')

  const prompt = `The student just completed a ${level} ${subject} quiz on "${topic}".

They got these questions wrong:

${wrongAnswersList}

For each missed question, write a brief 2-4 sentence mini-lesson that:
- Explains the underlying concept
- Clarifies why the correct answer is right
- Gives a tip for remembering this in the future
- Is encouraging in tone

Return JSON in this exact format:
{
  "lessons": [
    {
      "question_id": "q1",
      "lesson": "Your lesson text here..."
    }
  ]
}

Include a lesson for each of the ${wrongAnswers.length} wrong answers, with question_ids q1, q2, etc. matching the order above.`

  const response = await generateJSON<LessonsResponse>(prompt)
  return response.lessons
}

export async function generateSuggestions(
  subject: string,
  level: string,
  topic: string,
  score: number,
  total: number,
  missedConcepts: string
): Promise<Suggestion[]> {
  const prompt = `Based on this ${level} ${subject} quiz performance:

Topic: ${topic}
Score: ${score}/${total}
Missed concepts: ${missedConcepts}

Suggest 2-3 specific quiz topics at the ${level} level that would help this student improve. Focus on the areas where they struggled.

Return JSON in this exact format:
{
  "suggestions": [
    {
      "topic": "Suggested topic name",
      "reason": "One sentence on why this would help"
    }
  ]
}

Provide exactly 2-3 suggestions.`

  const response = await generateJSON<SuggestionsResponse>(prompt)
  return response.suggestions
}
