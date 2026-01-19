import { PrismaClient } from '@prisma/client'
import { generateSVG, getDiagramTypeForLesson, DIAGRAM_TYPES } from '../src/lib/svg-generator'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Output directory for generated SVGs
const OUTPUT_DIR = path.join(__dirname, 'generated-svgs', '8th-grade-full')
const CHECKPOINT_FILE = path.join(__dirname, 'svg-seed-checkpoint.json')

// Rate limiting
const DELAY_BETWEEN_REQUESTS_MS = 1500

interface Checkpoint {
  completedLessonIds: string[]
  lastUpdated: string
}

interface GeneratedSVGResult {
  lessonId: string
  subtopicName: string
  lessonTitle: string
  diagramType: string | null
  svg: string | null
  success: boolean
  error?: string
  skipped?: boolean
}

function loadCheckpoint(): Checkpoint {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const data = fs.readFileSync(CHECKPOINT_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.log('No checkpoint found, starting fresh')
  }
  return { completedLessonIds: [], lastUpdated: new Date().toISOString() }
}

function saveCheckpoint(checkpoint: Checkpoint) {
  checkpoint.lastUpdated = new Date().toISOString()
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2))
}

async function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

// Specific instructions for each subtopic to improve SVG quality
const SUBTOPIC_INSTRUCTIONS: Record<string, string> = {
  'Linear Functions': 'Graph a simple line like y = 2x - 1. Clearly show the slope triangle with rise and run labeled.',
  'Intro to Systems of Equations': 'Show two lines y = x + 1 and y = -x + 3 intersecting at (1, 2). Label each line and clearly mark the solution point.',
  'Systems of Equations': 'Show two lines y = 2x - 1 and y = -x + 5 intersecting at (2, 3). Label each line and clearly mark the solution point.',
  'Exponents & Scientific Notation': 'Show powers of 2 visually: 2¹=2, 2²=4, 2³=8, 2⁴=16 using progressively larger rectangles.',
  'Radicals & Irrational Numbers': 'Show a number line from 0 to 3 with √2 ≈ 1.414 and √3 ≈ 1.732 marked between the whole numbers.',
  'Pythagorean Theorem': 'Classic 3-4-5 right triangle with squares drawn on each side to show a² + b² = c².',
  'Transformations': 'Show a triangle being translated 3 units right and 2 units up on a coordinate grid.',
  'Geometric Transformations': 'Show a triangle being translated on a coordinate grid with before and after positions.',
  'Similarity & Congruence': 'Two similar triangles with scale factor 2, showing corresponding sides and angles.',
  'Bivariate Data': 'Scatter plot with 10 points showing positive correlation and a trend line.',
  'Intro to Quadratics': 'A simple parabola y = x² on a coordinate grid with vertex at origin and points at x = -2, -1, 1, 2 marked.',
}

async function get8thGradeLessons() {
  // Get all subtopics for 8th Grade Math
  const subtopics = await prisma.subtopic.findMany({
    where: {
      level: {
        name: '8th Grade',
        subject: {
          name: 'Math',
        },
      },
    },
    include: {
      level: {
        include: {
          subject: true,
        },
      },
      lessons: {
        orderBy: { sortOrder: 'asc' },
        take: 1, // Only the first lesson of each subtopic
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  // Flatten to get one lesson per subtopic
  const lessons = subtopics.flatMap(subtopic =>
    subtopic.lessons.map(lesson => ({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      subtopicId: subtopic.id,
      subtopicName: subtopic.name,
      levelName: subtopic.level.name,
    }))
  )

  return lessons
}

async function generateSVGForLesson(
  lesson: { lessonId: string; lessonTitle: string; subtopicName: string; levelName: string }
): Promise<GeneratedSVGResult> {
  // Determine diagram type
  const diagramType = getDiagramTypeForLesson(lesson.subtopicName, lesson.lessonTitle)

  if (!diagramType) {
    return {
      lessonId: lesson.lessonId,
      subtopicName: lesson.subtopicName,
      lessonTitle: lesson.lessonTitle,
      diagramType: null,
      svg: null,
      success: false,
      skipped: true,
      error: 'No suitable diagram type for this lesson',
    }
  }

  try {
    const specificInstructions = SUBTOPIC_INSTRUCTIONS[lesson.subtopicName]

    const svg = await generateSVG({
      lessonTitle: lesson.lessonTitle,
      subtopicName: lesson.subtopicName,
      levelName: lesson.levelName,
      diagramType,
      specificInstructions,
    })

    return {
      lessonId: lesson.lessonId,
      subtopicName: lesson.subtopicName,
      lessonTitle: lesson.lessonTitle,
      diagramType,
      svg,
      success: true,
    }
  } catch (error) {
    return {
      lessonId: lesson.lessonId,
      subtopicName: lesson.subtopicName,
      lessonTitle: lesson.lessonTitle,
      diagramType,
      svg: null,
      success: false,
      error: String(error),
    }
  }
}

function saveSVGToFile(result: GeneratedSVGResult, index: number) {
  if (!result.success || !result.svg) return null

  const safeName = result.subtopicName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const filename = `${String(index + 1).padStart(2, '0')}-${safeName}.svg`
  const filepath = path.join(OUTPUT_DIR, filename)

  fs.writeFileSync(filepath, result.svg)
  return filename
}

async function generateFinalReport(results: GeneratedSVGResult[], startTime: Date) {
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success && !r.skipped)
  const skipped = results.filter(r => r.skipped)

  const duration = (Date.now() - startTime.getTime()) / 1000 / 60 // minutes

  const report = `# Full 8th Grade Math SVG Generation Report

Generated: ${new Date().toISOString()}
Duration: ${duration.toFixed(1)} minutes

## Summary
- Total lessons: ${results.length}
- Successful: ${successful.length}
- Failed: ${failed.length}
- Skipped (no suitable diagram): ${skipped.length}

## Cost Estimate
- Model: claude-sonnet-4
- Diagrams generated: ${successful.length}
- Estimated input tokens: ${successful.length * 2500}
- Estimated output tokens: ${successful.length * 1000}
- Estimated cost: ~$${(successful.length * 0.0225).toFixed(2)}

## Results by Subtopic

${results.map((r, i) => `### ${i + 1}. ${r.subtopicName}
- Lesson: ${r.lessonTitle}
- Diagram Type: ${r.diagramType || 'N/A'}
- Status: ${r.success ? '✅ Success' : r.skipped ? '⏭️ Skipped' : '❌ Failed'}
${r.error ? `- Reason: ${r.error}` : ''}
${r.success && r.svg ? `- SVG Size: ${r.svg.length} characters` : ''}
`).join('\n')}

## Skipped Subtopics
${skipped.length === 0 ? 'None' : skipped.map(r => `- ${r.subtopicName}: ${r.error}`).join('\n')}

## Failed Generations
${failed.length === 0 ? 'None' : failed.map(r => `- ${r.subtopicName}: ${r.error}`).join('\n')}
`

  const reportPath = path.join(OUTPUT_DIR, 'FULL-REPORT.md')
  fs.writeFileSync(reportPath, report)
  return reportPath
}

async function main() {
  const startTime = new Date()

  console.log('================================================')
  console.log('Full 8th Grade Math SVG Generation')
  console.log('================================================')
  console.log('')

  const checkpoint = loadCheckpoint()
  console.log(`Checkpoint: ${checkpoint.completedLessonIds.length} lessons already completed`)

  await ensureOutputDir()
  console.log(`Output directory: ${OUTPUT_DIR}`)

  // Get all 8th grade lessons (first lesson of each subtopic)
  const lessons = await get8thGradeLessons()
  console.log(`\nFound ${lessons.length} subtopics with lessons`)

  // Filter out already completed
  const pendingLessons = lessons.filter(l => !checkpoint.completedLessonIds.includes(l.lessonId))
  console.log(`Pending: ${pendingLessons.length} lessons`)

  const results: GeneratedSVGResult[] = []

  // Process lessons sequentially
  for (let i = 0; i < pendingLessons.length; i++) {
    const lesson = pendingLessons[i]

    console.log(`\n[${i + 1}/${pendingLessons.length}] ${lesson.subtopicName}`)
    console.log(`  Lesson: "${lesson.lessonTitle}"`)

    // Add delay between requests
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS_MS))
    }

    const result = await generateSVGForLesson(lesson)
    results.push(result)

    if (result.success) {
      const filename = saveSVGToFile(result, i)
      console.log(`  ✅ Success - saved as ${filename}`)
    } else if (result.skipped) {
      console.log(`  ⏭️ Skipped - ${result.error}`)
    } else {
      console.log(`  ❌ Failed - ${result.error}`)
    }

    // Update checkpoint
    checkpoint.completedLessonIds.push(lesson.lessonId)
    saveCheckpoint(checkpoint)
  }

  // Generate report
  const reportPath = await generateFinalReport(results, startTime)

  // Summary
  console.log('\n================================================')
  console.log('Generation Complete')
  console.log('================================================')

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success && !r.skipped).length
  const skipped = results.filter(r => r.skipped).length

  console.log(`\nResults:`)
  console.log(`  ✅ Successful: ${successful}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  ⏭️ Skipped: ${skipped}`)
  console.log(`\nReport: ${reportPath}`)
  console.log(`SVGs: ${OUTPUT_DIR}`)
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
