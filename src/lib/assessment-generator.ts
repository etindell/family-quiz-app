import { prisma } from './prisma'
import { generateJSON } from './anthropic'

export interface AssessmentQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  level: string
  level_id: string
}

export interface Level {
  id: string
  name: string
  sortOrder: number
}

export interface AdaptiveAssessmentPool {
  questionsByLevel: Record<string, AssessmentQuestion[]>
  levels: Level[]
}

interface GeneratedResponse {
  questions: Array<{
    question: string
    options: string[]
    correct_answer: string
    explanation: string
  }>
}

const QUESTIONS_PER_LEVEL = 3

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Fallback: generate questions on-the-fly if none in database
async function generateQuestionsForLevel(
  subjectName: string,
  level: Level,
  count: number
): Promise<AssessmentQuestion[]> {
  const prompt = `Generate ${count} multiple choice questions for ${subjectName} at the ${level.name} level.

Return JSON: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "B", "explanation": "..."}]}`

  const response = await generateJSON<GeneratedResponse>(prompt)

  return response.questions.map((q, index) => ({
    id: `q_${level.sortOrder}_${index + 1}`,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    level: level.name,
    level_id: level.id,
  }))
}

export async function generateAdaptiveAssessment(
  subjectId: string,
  levels: Level[],
  subjectName?: string
): Promise<AdaptiveAssessmentPool> {
  const questionsByLevel: Record<string, AssessmentQuestion[]> = {}

  // Check total questions in database for this subject
  const totalDbQuestions = await prisma.question.count({
    where: { subjectId },
  })

  console.log(`Found ${totalDbQuestions} questions in database for subject ${subjectId}`)

  // Fetch random questions for each level from the database
  for (const level of levels) {
    const dbQuestions = await prisma.question.findMany({
      where: {
        subjectId,
        levelId: level.id,
      },
    })

    if (dbQuestions.length >= QUESTIONS_PER_LEVEL) {
      // Use database questions
      const shuffled = shuffleArray(dbQuestions)
      const selected = shuffled.slice(0, QUESTIONS_PER_LEVEL)

      questionsByLevel[level.id] = selected.map((q, index) => ({
        id: `q_${level.sortOrder}_${index + 1}`,
        question: q.question,
        options: JSON.parse(q.options) as string[],
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
        level: level.name,
        level_id: level.id,
      }))
    } else if (subjectName) {
      // Fallback: generate on-the-fly
      console.log(`No questions for ${level.name}, generating on-the-fly...`)
      questionsByLevel[level.id] = await generateQuestionsForLevel(
        subjectName,
        level,
        QUESTIONS_PER_LEVEL
      )
    } else {
      questionsByLevel[level.id] = []
    }
  }

  return {
    questionsByLevel,
    levels,
  }
}
