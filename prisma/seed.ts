import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const subjects = [
  { name: 'Math', icon: '📐', sortOrder: 1 },
  { name: 'Science', icon: '🔬', sortOrder: 2 },
  { name: 'History', icon: '📜', sortOrder: 3 },
  { name: 'Spanish', icon: '🇪🇸', sortOrder: 4 },
]

const levelsBySubject: Record<string, string[]> = {
  Math: [
    '1st Grade',
    '2nd Grade',
    '3rd Grade',
    '4th Grade',
    '5th Grade',
    '6th Grade',
    '7th Grade',
    '8th Grade',
    'Algebra 1',
    'Geometry',
    'Algebra 2',
    'Pre-Calculus',
    'Calculus',
  ],
  Science: [
    '1st Grade',
    '2nd Grade',
    '3rd Grade',
    '4th Grade',
    '5th Grade',
    '6th Grade',
    'Life Science',
    'Earth Science',
    'Physical Science',
    'Biology',
    'Chemistry',
    'Physics',
  ],
  History: [
    '3rd Grade',
    '4th Grade',
    '5th Grade',
    '6th Grade',
    '7th Grade',
    '8th Grade',
    'US History',
    'World History',
    'Government',
  ],
  Spanish: [
    'Novice',
    'Beginner',
    'Intermediate',
    'Upper Intermediate',
    'Advanced',
  ],
}

async function main() {
  console.log('Seeding database...')

  for (const subject of subjects) {
    const createdSubject = await prisma.subject.upsert({
      where: { name: subject.name },
      update: {},
      create: subject,
    })

    console.log(`Created subject: ${createdSubject.name}`)

    const levels = levelsBySubject[subject.name]
    for (let i = 0; i < levels.length; i++) {
      await prisma.level.upsert({
        where: {
          subjectId_name: {
            subjectId: createdSubject.id,
            name: levels[i],
          },
        },
        update: {},
        create: {
          subjectId: createdSubject.id,
          name: levels[i],
          sortOrder: i + 1,
        },
      })
    }

    console.log(`  Created ${levels.length} levels for ${subject.name}`)
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
