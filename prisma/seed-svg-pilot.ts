import { PrismaClient } from '@prisma/client'
import { generateSVG, DIAGRAM_TYPES } from '../src/lib/svg-generator'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Output directory for generated SVGs
const OUTPUT_DIR = path.join(__dirname, 'generated-svgs')

// Pilot test configuration: 5 lessons most suited for SVG diagrams
// One per subtopic as specified in the plan
const PILOT_LESSONS = [
  {
    subtopicName: 'Pythagorean Theorem',
    lessonSortOrder: 1, // Lesson 1: Introduction
    diagramType: 'right-triangle' as const,
    specificInstructions: 'Show the classic Pythagorean theorem visualization with squares on each side of the triangle. Label a=3, b=4, c=5 as an example.',
  },
  {
    subtopicName: 'Geometric Transformations',
    lessonSortOrder: 1, // Lesson 1: Translations & Reflections
    diagramType: 'coordinate-grid' as const,
    specificInstructions: 'Show a triangle being translated 4 units right and 2 units up. Include coordinate labels for key vertices.',
  },
  {
    subtopicName: 'Linear Functions',
    lessonSortOrder: 2, // Lesson 2: Slope & Graphing
    diagramType: 'slope-graph' as const,
    specificInstructions: 'Graph y = (2/3)x + 1. Clearly show rise=2, run=3 between two points. Mark the y-intercept at (0,1).',
  },
  {
    subtopicName: 'Similarity & Congruence',
    lessonSortOrder: 1, // Lesson 1: Similar Triangles
    diagramType: 'similar-triangles' as const,
    specificInstructions: 'Show two similar triangles with scale factor 2. Small triangle: sides 3, 4, 5. Large triangle: sides 6, 8, 10.',
  },
  {
    subtopicName: 'Bivariate Data',
    lessonSortOrder: 1, // Lesson 1: Scatter Plots
    diagramType: 'scatter-plot' as const,
    specificInstructions: 'Create a scatter plot showing "Study Hours" (x-axis, 0-8) vs "Test Score" (y-axis, 50-100) with a positive correlation.',
  },
]

interface GeneratedSVG {
  subtopicName: string
  lessonTitle: string
  lessonId: string
  diagramType: string
  svg: string
  success: boolean
  error?: string
}

async function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

async function findLesson(subtopicName: string, lessonSortOrder: number) {
  // Find the subtopic for 8th Grade Math
  const subtopic = await prisma.subtopic.findFirst({
    where: {
      name: subtopicName,
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
        where: {
          sortOrder: lessonSortOrder,
        },
      },
    },
  })

  if (!subtopic) {
    throw new Error(`Subtopic not found: ${subtopicName}`)
  }

  if (subtopic.lessons.length === 0) {
    throw new Error(`No lesson found for ${subtopicName} with sortOrder ${lessonSortOrder}`)
  }

  return {
    subtopic,
    lesson: subtopic.lessons[0],
  }
}

async function generateSVGForLesson(
  config: typeof PILOT_LESSONS[0]
): Promise<GeneratedSVG> {
  console.log(`\nProcessing: ${config.subtopicName} - Lesson ${config.lessonSortOrder}`)
  console.log(`  Diagram type: ${config.diagramType}`)

  try {
    const { subtopic, lesson } = await findLesson(config.subtopicName, config.lessonSortOrder)

    console.log(`  Found lesson: "${lesson.title}"`)

    const svg = await generateSVG({
      lessonTitle: lesson.title,
      subtopicName: config.subtopicName,
      levelName: '8th Grade',
      diagramType: config.diagramType,
      specificInstructions: config.specificInstructions,
    })

    console.log(`  SVG generated successfully (${svg.length} chars)`)

    return {
      subtopicName: config.subtopicName,
      lessonTitle: lesson.title,
      lessonId: lesson.id,
      diagramType: config.diagramType,
      svg,
      success: true,
    }
  } catch (error) {
    console.error(`  Error: ${error}`)
    return {
      subtopicName: config.subtopicName,
      lessonTitle: 'Unknown',
      lessonId: '',
      diagramType: config.diagramType,
      svg: '',
      success: false,
      error: String(error),
    }
  }
}

async function saveSVGToFile(result: GeneratedSVG, index: number) {
  if (!result.success || !result.svg) return

  const filename = `${index + 1}-${result.subtopicName.toLowerCase().replace(/\s+/g, '-')}.svg`
  const filepath = path.join(OUTPUT_DIR, filename)

  fs.writeFileSync(filepath, result.svg)
  console.log(`  Saved: ${filename}`)
}

async function generateReport(results: GeneratedSVG[]) {
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  const report = `# SVG Pilot Test Report

Generated: ${new Date().toISOString()}

## Summary
- Total lessons: ${results.length}
- Successful: ${successful.length}
- Failed: ${failed.length}

## Results

${results.map((r, i) => `### ${i + 1}. ${r.subtopicName}
- Lesson: ${r.lessonTitle}
- Diagram Type: ${r.diagramType}
- Status: ${r.success ? '✅ Success' : '❌ Failed'}
${r.error ? `- Error: ${r.error}` : ''}
${r.success ? `- SVG Size: ${r.svg.length} characters` : ''}
`).join('\n')}

## Cost Estimate
- Model: claude-sonnet-4
- Estimated tokens per diagram: ~2,500 input + ~1,000 output
- Estimated cost: ~$${(successful.length * 0.0225).toFixed(4)} for ${successful.length} diagrams

## Next Steps
1. Review the generated SVGs in the \`generated-svgs\` folder
2. Open each SVG in a browser to verify quality
3. If quality is acceptable, proceed with full 8th grade generation
`

  const reportPath = path.join(OUTPUT_DIR, 'REPORT.md')
  fs.writeFileSync(reportPath, report)
  console.log(`\nReport saved: ${reportPath}`)
}

async function main() {
  console.log('========================================')
  console.log('SVG Pilot Test - 8th Grade Math Diagrams')
  console.log('========================================')
  console.log(`\nTarget: ${PILOT_LESSONS.length} lessons`)
  console.log('Diagram types:', PILOT_LESSONS.map(l => l.diagramType).join(', '))

  await ensureOutputDir()
  console.log(`\nOutput directory: ${OUTPUT_DIR}`)

  const results: GeneratedSVG[] = []

  // Process lessons sequentially to avoid rate limiting
  for (let i = 0; i < PILOT_LESSONS.length; i++) {
    const config = PILOT_LESSONS[i]

    // Add delay between requests
    if (i > 0) {
      console.log('\nWaiting 1 second before next request...')
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const result = await generateSVGForLesson(config)
    results.push(result)

    if (result.success) {
      await saveSVGToFile(result, i)
    }
  }

  // Generate report
  await generateReport(results)

  // Summary
  console.log('\n========================================')
  console.log('Pilot Test Complete')
  console.log('========================================')
  const successCount = results.filter(r => r.success).length
  console.log(`\nResults: ${successCount}/${results.length} successful`)
  console.log(`\nGenerated SVGs saved to: ${OUTPUT_DIR}`)
  console.log('Review the SVGs and REPORT.md for quality assessment.')
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
