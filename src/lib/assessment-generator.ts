import { prisma } from './prisma'

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

export async function generateAdaptiveAssessment(
  subjectId: string,
  levels: Level[]
): Promise<AdaptiveAssessmentPool> {
  const questionsByLevel: Record<string, AssessmentQuestion[]> = {}

  // Initialize empty arrays for each level
  for (const level of levels) {
    questionsByLevel[level.id] = []
  }

  // Fetch random questions for each level from the database
  for (const level of levels) {
    const dbQuestions = await prisma.question.findMany({
      where: {
        subjectId,
        levelId: level.id,
      },
    })

    // Shuffle and take QUESTIONS_PER_LEVEL
    const shuffled = shuffleArray(dbQuestions)
    const selected = shuffled.slice(0, QUESTIONS_PER_LEVEL)

    // Transform to AssessmentQuestion format
    questionsByLevel[level.id] = selected.map((q, index) => ({
      id: `q_${level.sortOrder}_${index + 1}`,
      question: q.question,
      options: JSON.parse(q.options) as string[],
      correct_answer: q.correctAnswer,
      explanation: q.explanation,
      level: level.name,
      level_id: level.id,
    }))
  }

  return {
    questionsByLevel,
    levels,
  }
}
