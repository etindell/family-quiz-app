import { PrismaClient } from '@prisma/client'
import { generateSVG, DIAGRAM_TYPES } from '../src/lib/svg-generator'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const OUTPUT_DIR = path.join(__dirname, 'generated-svgs', '8th-grade-additional')
const DELAY_BETWEEN_REQUESTS_MS = 1500

// Additional lessons to generate SVGs for (beyond lesson 1)
const ADDITIONAL_LESSONS: {
  subtopicName: string
  lessonSortOrders: number[]
  diagramType: keyof typeof DIAGRAM_TYPES
  instructions: Record<number, string>
}[] = [
  {
    subtopicName: 'Linear Functions',
    lessonSortOrders: [2, 3, 4],
    diagramType: 'slope-graph',
    instructions: {
      2: 'Show a line with clear rise/run triangle. Mark two points and show slope = rise/run = 2/3. Include the slope formula.',
      3: 'Show a coordinate plane with a line crossing both axes. Clearly label the x-intercept and y-intercept with their coordinates.',
      4: 'Show a real-world linear model: Cost vs Quantity graph with y = 5x + 20 (startup cost + per-unit cost). Label axes appropriately.',
    },
  },
  {
    subtopicName: 'Pythagorean Theorem',
    lessonSortOrders: [2, 3, 4],
    diagramType: 'right-triangle',
    instructions: {
      2: 'Show a right triangle with one unknown side marked with "?". Given sides a=5, b=12, solve for c. Show the calculation.',
      3: 'Show a coordinate plane with two points and a right triangle formed between them to illustrate the distance formula.',
      4: 'Show a ladder leaning against a wall - a real-world right triangle. Label the wall height, ground distance, and ladder length.',
    },
  },
  {
    subtopicName: 'Transformations',
    lessonSortOrders: [2, 3, 4],
    diagramType: 'coordinate-grid',
    instructions: {
      2: 'Show a shape being rotated 90° clockwise around the origin. Show original in blue, rotated in teal. Mark the center of rotation.',
      3: 'Show a dilation with scale factor 2. Small triangle at origin, larger similar triangle. Label corresponding vertices A→A\', B→B\', C→C\'.',
      4: 'Show a composition of transformations: translate then reflect. Show original, intermediate, and final positions with arrows.',
    },
  },
  {
    subtopicName: 'Geometric Transformations',
    lessonSortOrders: [2, 3, 4],
    diagramType: 'coordinate-grid',
    instructions: {
      2: 'Show reflection across the y-axis. Triangle on right side reflected to left side. Label original and image vertices.',
      3: 'Show rotation 180° around origin. Original shape in quadrant I, rotated to quadrant III. Show rotation arrows.',
      4: 'Show a tessellation pattern using translations and rotations of a simple shape. Show the repeating unit.',
    },
  },
  {
    subtopicName: 'Bivariate Data',
    lessonSortOrders: [2, 3, 4],
    diagramType: 'scatter-plot',
    instructions: {
      2: 'Show a scatter plot with NEGATIVE correlation. Label it "Study Time vs Errors Made". Include 10 points trending downward.',
      3: 'Show a scatter plot with a line of best fit drawn through the data. Show positive correlation. Include the equation y = 2x + 10.',
      4: 'Show a scatter plot comparing two sports statistics. Include outliers marked differently. Show weak positive correlation.',
    },
  },
  {
    subtopicName: 'Similarity & Congruence',
    lessonSortOrders: [2, 3, 4],
    diagramType: 'similar-triangles',
    instructions: {
      2: 'Show two congruent triangles with transformation arrows showing how one maps to the other via reflection.',
      3: 'Show similar triangles with scale factor 3. Label all corresponding sides and show the proportions (3/9 = 4/12 = 5/15).',
      4: 'Show indirect measurement: person casting shadow next to tree casting shadow. Similar triangles for height calculation.',
    },
  },
  {
    subtopicName: 'Intro to Quadratics',
    lessonSortOrders: [2, 3, 4],
    diagramType: 'parabola',
    instructions: {
      2: 'Show y = x² - 4 parabola. Mark the vertex at (0, -4), axis of symmetry, and x-intercepts at (-2, 0) and (2, 0).',
      3: 'Show a parabola with its factored form. Mark roots/zeros where the parabola crosses x-axis. Label (x-2)(x+3)=0.',
      4: 'Show projectile motion parabola. Ball thrown upward - mark initial height, maximum height (vertex), and landing point.',
    },
  },
  {
    subtopicName: 'Exponents & Scientific Notation',
    lessonSortOrders: [2, 3, 4],
    diagramType: 'exponents',
    instructions: {
      2: 'Show visual proof of exponent rules: x² × x³ = x⁵ using grouped squares/cubes. Show the multiplication combining.',
      3: 'Show powers of 10 on a number line from 10⁻³ to 10³. Mark scientific notation examples (0.001 to 1000).',
      4: 'Show comparison of large numbers: Earth distance to Sun vs to nearest star. Use visual scale with scientific notation.',
    },
  },
  {
    subtopicName: 'Radicals & Irrational Numbers',
    lessonSortOrders: [2, 3, 4],
    diagramType: 'number-line',
    instructions: {
      2: 'Show number line from 0 to 5. Mark √2, √3, √5, √7 at their approximate positions. Show they fall between integers.',
      3: 'Show number line distinguishing rational (blue dots) from irrational (red dots). Include fractions like 1/3 and irrationals like √2, π.',
      4: 'Show a square with side √2 and diagonal 2. Demonstrate the geometric meaning of square roots.',
    },
  },
  {
    subtopicName: 'Intro to Systems of Equations',
    lessonSortOrders: [2, 3, 4],
    diagramType: 'systems-of-equations',
    instructions: {
      2: 'Show two lines being graphed step by step. First line y=x+1, then y=-2x+4. Mark where they intersect at (1, 2).',
      3: 'Show substitution method visually: highlight where x from one equation plugs into the other. Show the intersection.',
      4: 'Show a real-world system: two phone plans crossing. Plan A: $20 + $0.10/min, Plan B: $10 + $0.20/min. Show break-even.',
    },
  },
  {
    subtopicName: 'Systems of Equations',
    lessonSortOrders: [2, 3, 4],
    diagramType: 'systems-of-equations',
    instructions: {
      2: 'Show elimination method: two equations stacked, terms aligning, one variable canceling out. Show resulting intersection.',
      3: 'Show three possible outcomes: one solution (intersecting), no solution (parallel), infinite solutions (same line).',
      4: 'Show mixture problem visually: two containers mixing. Label concentrations and amounts with system of equations.',
    },
  },
]

interface GeneratedResult {
  subtopicName: string
  lessonTitle: string
  lessonId: string
  sortOrder: number
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

async function generateSVGsForSubtopic(config: typeof ADDITIONAL_LESSONS[0]): Promise<GeneratedResult[]> {
  const results: GeneratedResult[] = []

  // Find the subtopic
  const subtopic = await prisma.subtopic.findFirst({
    where: {
      name: config.subtopicName,
      level: {
        name: '8th Grade',
        subject: { name: 'Math' },
      },
    },
    include: {
      lessons: {
        orderBy: { sortOrder: 'asc' },
      },
      level: true,
    },
  })

  if (!subtopic) {
    console.log(`  ⚠️ Subtopic not found: ${config.subtopicName}`)
    return results
  }

  for (const sortOrder of config.lessonSortOrders) {
    const lesson = subtopic.lessons.find(l => l.sortOrder === sortOrder)

    if (!lesson) {
      console.log(`  ⚠️ Lesson ${sortOrder} not found for ${config.subtopicName}`)
      continue
    }

    // Skip if already has a diagram
    if (lesson.diagramSvg) {
      console.log(`  ⏭️ Lesson ${sortOrder} already has diagram: "${lesson.title}"`)
      continue
    }

    console.log(`  Generating for Lesson ${sortOrder}: "${lesson.title}"`)

    try {
      const svg = await generateSVG({
        lessonTitle: lesson.title,
        subtopicName: config.subtopicName,
        levelName: '8th Grade',
        diagramType: config.diagramType,
        specificInstructions: config.instructions[sortOrder],
      })

      results.push({
        subtopicName: config.subtopicName,
        lessonTitle: lesson.title,
        lessonId: lesson.id,
        sortOrder,
        diagramType: config.diagramType,
        svg,
        success: true,
      })

      console.log(`    ✅ Success (${svg.length} chars)`)
    } catch (error) {
      console.log(`    ❌ Failed: ${error}`)
      results.push({
        subtopicName: config.subtopicName,
        lessonTitle: lesson.title,
        lessonId: lesson.id,
        sortOrder,
        diagramType: config.diagramType,
        svg: '',
        success: false,
        error: String(error),
      })
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS_MS))
  }

  return results
}

async function saveSVGsToFiles(results: GeneratedResult[]) {
  for (const result of results) {
    if (!result.success || !result.svg) continue

    const safeName = result.subtopicName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const filename = `${safeName}-lesson-${result.sortOrder}.svg`
    const filepath = path.join(OUTPUT_DIR, filename)

    fs.writeFileSync(filepath, result.svg)
  }
}

async function updateDatabase(results: GeneratedResult[]) {
  let updated = 0
  for (const result of results) {
    if (!result.success || !result.svg) continue

    await prisma.lesson.update({
      where: { id: result.lessonId },
      data: { diagramSvg: result.svg },
    })
    updated++
  }
  return updated
}

async function main() {
  console.log('================================================')
  console.log('Additional 8th Grade Math SVG Generation (Opus)')
  console.log('================================================\n')

  await ensureOutputDir()

  const allResults: GeneratedResult[] = []
  let totalLessons = 0

  for (const config of ADDITIONAL_LESSONS) {
    console.log(`\n📚 ${config.subtopicName}`)
    totalLessons += config.lessonSortOrders.length

    const results = await generateSVGsForSubtopic(config)
    allResults.push(...results)
  }

  // Save to files
  await saveSVGsToFiles(allResults)

  // Update database
  console.log('\n\nUpdating database...')
  const updatedCount = await updateDatabase(allResults)

  // Summary
  const successful = allResults.filter(r => r.success).length
  const failed = allResults.filter(r => !r.success).length

  console.log('\n================================================')
  console.log('Generation Complete')
  console.log('================================================')
  console.log(`\nTarget lessons: ${totalLessons}`)
  console.log(`Generated: ${successful}`)
  console.log(`Failed: ${failed}`)
  console.log(`Database updated: ${updatedCount}`)
  console.log(`\nSVGs saved to: ${OUTPUT_DIR}`)
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
