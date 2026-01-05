import { generateJSON } from './anthropic'

export interface Question {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

interface QuizResponse {
  questions: Question[]
}

interface GenerateQuizParams {
  subject: string
  level: string
  topic: string
  questionCount: number
}

export async function generateQuiz({
  subject,
  level,
  topic,
  questionCount,
}: GenerateQuizParams): Promise<Question[]> {
  const prompt = `Generate a ${questionCount}-question multiple choice quiz.

Subject: ${subject}
Level: ${level}
Topic: ${topic}

Each question should:
- Be appropriate for the ${level} level
- Focus on the topic: ${topic}
- Have exactly 4 answer options
- Have one clear correct answer
- Include a brief explanation of why the answer is correct

Return JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "Brief explanation of why this is correct."
    }
  ]
}

Generate exactly ${questionCount} questions with IDs q1, q2, q3, etc.`

  const response = await generateJSON<QuizResponse>(prompt)
  return response.questions
}
