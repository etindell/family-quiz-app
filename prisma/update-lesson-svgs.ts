import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const SVG_DIR = path.join(__dirname, 'generated-svgs', '8th-grade-full')

// Mapping from SVG filename prefix to subtopic name
const FILE_TO_SUBTOPIC: Record<string, string> = {
  '01-linear-functions': 'Linear Functions',
  '02-intro-to-systems-of-equations': 'Intro to Systems of Equations',
  '03-systems-of-equations': 'Systems of Equations',
  '04-exponents-scientific-notation': 'Exponents & Scientific Notation',
  '05-radicals-irrational-numbers': 'Radicals & Irrational Numbers',
  '06-pythagorean-theorem': 'Pythagorean Theorem',
  '07-transformations': 'Transformations',
  '08-geometric-transformations': 'Geometric Transformations',
  '09-similarity-congruence': 'Similarity & Congruence',
  '10-bivariate-data': 'Bivariate Data',
  '11-intro-to-quadratics': 'Intro to Quadratics',
}

async function updateLessonSvgs() {
  console.log('Updating lesson SVGs...')
  console.log(`SVG directory: ${SVG_DIR}`)
  console.log('')

  // Get all SVG files
  const svgFiles = fs.readdirSync(SVG_DIR).filter(f => f.endsWith('.svg'))
  console.log(`Found ${svgFiles.length} SVG files`)

  let updatedCount = 0
  let skippedCount = 0

  for (const filename of svgFiles) {
    const filenameWithoutExt = filename.replace('.svg', '')
    const subtopicName = FILE_TO_SUBTOPIC[filenameWithoutExt]

    if (!subtopicName) {
      console.log(`  ⚠️ No mapping for: ${filename}`)
      skippedCount++
      continue
    }

    // Read SVG content
    const svgPath = path.join(SVG_DIR, filename)
    const svgContent = fs.readFileSync(svgPath, 'utf-8')

    // Find the subtopic and its first lesson
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
        lessons: {
          where: { sortOrder: 1 },
          take: 1,
        },
      },
    })

    if (!subtopic || subtopic.lessons.length === 0) {
      console.log(`  ⚠️ No lesson found for subtopic: ${subtopicName}`)
      skippedCount++
      continue
    }

    const lesson = subtopic.lessons[0]

    // Update the lesson with the SVG
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { diagramSvg: svgContent },
    })

    console.log(`  ✅ Updated: ${subtopicName} → "${lesson.title}"`)
    updatedCount++
  }

  console.log('')
  console.log('=================================')
  console.log(`Updated: ${updatedCount} lessons`)
  console.log(`Skipped: ${skippedCount}`)
  console.log('=================================')
}

updateLessonSvgs()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
