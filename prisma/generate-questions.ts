import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'

const prisma = new PrismaClient()
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-haiku-4-20250514'
const QUESTIONS_PER_LEVEL = 10

interface GeneratedQuestion {
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

interface GeneratedResponse {
  questions: GeneratedQuestion[]
}

async function generateQuestionsForLevel(
  subjectName: string,
  levelName: string,
  count: number
): Promise<GeneratedQuestion[]> {
  const prompt = `Generate ${count} multiple choice questions for ${subjectName} at the ${levelName} level.

Each question should:
- Be appropriate for the ${levelName} level
- Have exactly 4 answer options
- Have one clear correct answer
- Include a brief explanation

Return JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "Brief explanation of why this is correct."
    }
  ]
}

Generate exactly ${count} questions. Return ONLY valid JSON, no markdown.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in response')
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedResponse
  return parsed.questions
}

async function main() {
  console.log('Generating questions for all subjects and levels...')
  console.log(`Using model: ${MODEL}`)
  console.log(`Questions per level: ${QUESTIONS_PER_LEVEL}`)
  console.log('')

  const subjects = await prisma.subject.findMany({
    include: {
      levels: { orderBy: { sortOrder: 'asc' } },
    },
  })

  let totalGenerated = 0

  for (const subject of subjects) {
    console.log(`\n${subject.icon} ${subject.name}`)

    for (const level of subject.levels) {
      // Check if we already have questions for this level
      const existingCount = await prisma.question.count({
        where: { subjectId: subject.id, levelId: level.id },
      })

      if (existingCount >= QUESTIONS_PER_LEVEL) {
        console.log(`  ✓ ${level.name}: ${existingCount} questions (skipping)`)
        continue
      }

      const needed = QUESTIONS_PER_LEVEL - existingCount
      console.log(`  ⏳ ${level.name}: generating ${needed} questions...`)

      try {
        const questions = await generateQuestionsForLevel(
          subject.name,
          level.name,
          needed
        )

        // Save questions to database
        for (const q of questions) {
          await prisma.question.create({
            data: {
              subjectId: subject.id,
              levelId: level.id,
              question: q.question,
              options: JSON.stringify(q.options),
              correctAnswer: q.correct_answer,
              explanation: q.explanation,
            },
          })
        }

        totalGenerated += questions.length
        console.log(`  ✓ ${level.name}: added ${questions.length} questions`)

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`  ✗ ${level.name}: failed -`, error)
      }
    }
  }

  console.log(`\n✅ Done! Generated ${totalGenerated} total questions.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
