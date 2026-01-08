import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Subtopics for each level with fixed prompts for AI question generation
const subtopicsByLevel: Record<string, Record<string, { name: string; prompt: string }[]>> = {
  Math: {
    '1st Grade': [
      { name: 'Counting', prompt: 'Counting numbers from 1 to 100, skip counting by 2s, 5s, and 10s' },
      { name: 'Addition', prompt: 'Basic addition with single digits and sums up to 20' },
      { name: 'Subtraction', prompt: 'Basic subtraction with single digits and numbers up to 20' },
      { name: 'Shapes', prompt: 'Identifying and describing 2D shapes like circles, squares, triangles, and rectangles' },
      { name: 'Comparing Numbers', prompt: 'Comparing numbers using greater than, less than, and equal to' },
    ],
    '2nd Grade': [
      { name: 'Addition & Subtraction', prompt: 'Two-digit addition and subtraction with and without regrouping' },
      { name: 'Place Value', prompt: 'Understanding place value for ones, tens, and hundreds' },
      { name: 'Measurement', prompt: 'Measuring length using standard and non-standard units' },
      { name: 'Time', prompt: 'Telling time to the nearest five minutes on analog and digital clocks' },
      { name: 'Money', prompt: 'Counting coins and bills, making change up to one dollar' },
      { name: 'Word Problems', prompt: 'Solving simple word problems involving addition and subtraction' },
    ],
    '3rd Grade': [
      { name: 'Multiplication', prompt: 'Multiplication facts through 10x10 and understanding equal groups' },
      { name: 'Division', prompt: 'Basic division facts and understanding sharing equally' },
      { name: 'Fractions', prompt: 'Understanding fractions as parts of a whole, comparing simple fractions' },
      { name: 'Area & Perimeter', prompt: 'Calculating area and perimeter of rectangles and squares' },
      { name: 'Rounding', prompt: 'Rounding numbers to the nearest 10 and 100' },
      { name: 'Word Problems', prompt: 'Multi-step word problems involving multiplication and division' },
    ],
    '4th Grade': [
      { name: 'Multi-digit Multiplication', prompt: 'Multiplying multi-digit numbers using standard algorithm' },
      { name: 'Long Division', prompt: 'Dividing multi-digit numbers by single-digit divisors' },
      { name: 'Fractions', prompt: 'Adding, subtracting, and comparing fractions with like denominators' },
      { name: 'Decimals', prompt: 'Understanding decimals to hundredths, comparing and ordering decimals' },
      { name: 'Factors & Multiples', prompt: 'Finding factors, multiples, prime and composite numbers' },
      { name: 'Geometry', prompt: 'Classifying angles, parallel and perpendicular lines, symmetry' },
    ],
    '5th Grade': [
      { name: 'Fractions Operations', prompt: 'Adding, subtracting, multiplying fractions with unlike denominators' },
      { name: 'Decimals Operations', prompt: 'Multiplying and dividing decimals, converting fractions to decimals' },
      { name: 'Volume', prompt: 'Calculating volume of rectangular prisms using cubic units' },
      { name: 'Coordinate Plane', prompt: 'Plotting points and graphing on the coordinate plane' },
      { name: 'Order of Operations', prompt: 'Evaluating expressions using PEMDAS order of operations' },
      { name: 'Expressions', prompt: 'Writing and evaluating numerical expressions with parentheses' },
    ],
    '6th Grade': [
      { name: 'Ratios', prompt: 'Understanding ratios, unit rates, and equivalent ratios' },
      { name: 'Percents', prompt: 'Converting between fractions, decimals, and percents' },
      { name: 'Integers', prompt: 'Understanding positive and negative integers on a number line' },
      { name: 'Expressions & Equations', prompt: 'Writing and solving one-step algebraic equations' },
      { name: 'Area & Surface Area', prompt: 'Finding area of triangles, quadrilaterals, and surface area of 3D shapes' },
      { name: 'Statistics', prompt: 'Mean, median, mode, range, and interpreting data displays' },
    ],
    '7th Grade': [
      { name: 'Proportions', prompt: 'Solving proportions and applying to real-world problems' },
      { name: 'Percent Applications', prompt: 'Calculating percent increase, decrease, tax, tip, and discounts' },
      { name: 'Rational Numbers', prompt: 'Operations with positive and negative fractions and decimals' },
      { name: 'Two-Step Equations', prompt: 'Solving two-step linear equations with rational numbers' },
      { name: 'Inequalities', prompt: 'Writing and solving one-step and two-step inequalities' },
      { name: 'Geometry', prompt: 'Angle relationships, area and circumference of circles' },
      { name: 'Probability', prompt: 'Calculating simple and compound probability' },
    ],
    '8th Grade': [
      { name: 'Linear Equations', prompt: 'Solving multi-step linear equations including distributive property' },
      { name: 'Systems of Equations', prompt: 'Solving systems of two linear equations graphically and algebraically' },
      { name: 'Functions', prompt: 'Understanding functions, function notation, and linear functions' },
      { name: 'Slope & Graphing', prompt: 'Finding slope, writing equations in slope-intercept form, graphing lines' },
      { name: 'Exponents', prompt: 'Laws of exponents including negative and zero exponents' },
      { name: 'Pythagorean Theorem', prompt: 'Applying the Pythagorean theorem to find missing side lengths' },
      { name: 'Transformations', prompt: 'Translations, reflections, rotations, and dilations on the coordinate plane' },
    ],
    'Algebra 1': [
      { name: 'Linear Equations', prompt: 'Solving complex linear equations with variables on both sides' },
      { name: 'Inequalities', prompt: 'Solving and graphing compound inequalities and absolute value inequalities' },
      { name: 'Systems of Equations', prompt: 'Solving systems using substitution, elimination, and graphing' },
      { name: 'Polynomials', prompt: 'Adding, subtracting, multiplying polynomials and FOIL method' },
      { name: 'Factoring', prompt: 'Factoring trinomials, difference of squares, and GCF' },
      { name: 'Quadratic Equations', prompt: 'Solving quadratic equations by factoring and quadratic formula' },
      { name: 'Radical Expressions', prompt: 'Simplifying radicals and solving radical equations' },
      { name: 'Functions', prompt: 'Domain, range, function operations, and inverse functions' },
    ],
    'Geometry': [
      { name: 'Logic & Proofs', prompt: 'Conditional statements, deductive reasoning, and two-column proofs' },
      { name: 'Parallel Lines', prompt: 'Angle relationships with parallel lines cut by a transversal' },
      { name: 'Triangles', prompt: 'Triangle congruence theorems (SSS, SAS, ASA, AAS) and proofs' },
      { name: 'Similar Figures', prompt: 'Similarity theorems, proportions in similar figures, and scale factors' },
      { name: 'Right Triangles', prompt: 'Pythagorean theorem, special right triangles, and trigonometric ratios' },
      { name: 'Quadrilaterals', prompt: 'Properties of parallelograms, rectangles, rhombi, squares, and trapezoids' },
      { name: 'Circles', prompt: 'Arc length, sector area, inscribed angles, and chord properties' },
      { name: 'Area & Volume', prompt: 'Surface area and volume of prisms, pyramids, cylinders, cones, and spheres' },
    ],
    'Algebra 2': [
      { name: 'Complex Numbers', prompt: 'Operations with complex numbers and solving equations with complex solutions' },
      { name: 'Polynomial Functions', prompt: 'Graphing polynomials, end behavior, zeros, and the factor theorem' },
      { name: 'Rational Functions', prompt: 'Graphing rational functions, asymptotes, and solving rational equations' },
      { name: 'Exponential Functions', prompt: 'Exponential growth and decay, solving exponential equations' },
      { name: 'Logarithms', prompt: 'Properties of logarithms, solving logarithmic equations' },
      { name: 'Sequences & Series', prompt: 'Arithmetic and geometric sequences and series, summation notation' },
      { name: 'Conic Sections', prompt: 'Equations and graphs of circles, ellipses, parabolas, and hyperbolas' },
    ],
    'Pre-Calculus': [
      { name: 'Functions & Graphs', prompt: 'Function transformations, compositions, and piecewise functions' },
      { name: 'Polynomial & Rational Functions', prompt: 'Advanced polynomial division, partial fractions, and graphing' },
      { name: 'Exponential & Logarithmic', prompt: 'Natural exponential and logarithmic functions, applications' },
      { name: 'Trigonometric Functions', prompt: 'Unit circle, graphing trig functions, and inverse trig functions' },
      { name: 'Trigonometric Identities', prompt: 'Proving and using trig identities including sum, difference, double angle' },
      { name: 'Vectors', prompt: 'Vector operations, dot product, and applications' },
      { name: 'Polar Coordinates', prompt: 'Converting between polar and rectangular, graphing polar equations' },
      { name: 'Limits', prompt: 'Introduction to limits, evaluating limits algebraically and graphically' },
    ],
    'Calculus': [
      { name: 'Limits & Continuity', prompt: 'Evaluating limits, limit laws, continuity, and intermediate value theorem' },
      { name: 'Derivatives', prompt: 'Definition of derivative, power rule, product rule, quotient rule, chain rule' },
      { name: 'Applications of Derivatives', prompt: 'Related rates, optimization, curve sketching, and motion' },
      { name: 'Integrals', prompt: 'Antiderivatives, definite integrals, fundamental theorem of calculus' },
      { name: 'Integration Techniques', prompt: 'U-substitution, integration by parts, and partial fractions' },
      { name: 'Applications of Integration', prompt: 'Area between curves, volumes of revolution, and arc length' },
      { name: 'Differential Equations', prompt: 'Separable differential equations and slope fields' },
    ],
  },
  Science: {
    '1st Grade': [
      { name: 'Living Things', prompt: 'Characteristics of living vs non-living things' },
      { name: 'Plants', prompt: 'Parts of a plant and what plants need to grow' },
      { name: 'Animals', prompt: 'Basic animal needs and animal habitats' },
      { name: 'Weather', prompt: 'Types of weather and seasons' },
      { name: 'Senses', prompt: 'The five senses and how we use them' },
    ],
    '2nd Grade': [
      { name: 'Life Cycles', prompt: 'Life cycles of plants, butterflies, and frogs' },
      { name: 'Habitats', prompt: 'Different habitats and how animals adapt' },
      { name: 'Matter', prompt: 'States of matter: solid, liquid, and gas' },
      { name: 'Forces & Motion', prompt: 'Push, pull, and simple machines' },
      { name: 'Earth Materials', prompt: 'Rocks, soil, and water on Earth' },
    ],
    '3rd Grade': [
      { name: 'Ecosystems', prompt: 'Food chains, food webs, and ecosystems' },
      { name: 'Adaptations', prompt: 'How plants and animals adapt to their environment' },
      { name: 'Weather & Climate', prompt: 'Weather patterns and climate zones' },
      { name: 'Simple Machines', prompt: 'Types of simple machines and how they work' },
      { name: 'Solar System', prompt: 'Planets, sun, moon, and basic astronomy' },
    ],
    '4th Grade': [
      { name: 'Energy', prompt: 'Forms of energy and energy transfer' },
      { name: 'Electricity', prompt: 'Basic electricity, circuits, and conductors' },
      { name: 'Sound & Light', prompt: 'Properties of sound and light waves' },
      { name: 'Rock Cycle', prompt: 'Types of rocks and the rock cycle' },
      { name: 'Human Body', prompt: 'Major body systems and organs' },
    ],
    '5th Grade': [
      { name: 'Cells', prompt: 'Basic cell structure and function' },
      { name: 'Matter & Chemistry', prompt: 'Properties of matter and chemical vs physical changes' },
      { name: 'Forces', prompt: 'Gravity, friction, and balanced/unbalanced forces' },
      { name: 'Earth Systems', prompt: 'Water cycle, atmosphere, and Earth layers' },
      { name: 'Space', prompt: 'Stars, galaxies, and the solar system in depth' },
    ],
    '6th Grade': [
      { name: 'Cells & Organisms', prompt: 'Cell organelles, unicellular vs multicellular organisms' },
      { name: 'Energy Transfer', prompt: 'Heat transfer, thermal energy, and temperature' },
      { name: 'Waves', prompt: 'Properties of waves, electromagnetic spectrum' },
      { name: 'Earth Science', prompt: 'Plate tectonics, earthquakes, and volcanoes' },
      { name: 'Weather Systems', prompt: 'Air pressure, fronts, and severe weather' },
    ],
    'Life Science': [
      { name: 'Cell Biology', prompt: 'Cell structure, organelles, cell division, and mitosis' },
      { name: 'Genetics', prompt: 'DNA, heredity, Punnett squares, and genetic traits' },
      { name: 'Evolution', prompt: 'Natural selection, adaptation, and evidence for evolution' },
      { name: 'Ecology', prompt: 'Ecosystems, biomes, population dynamics, and cycles' },
      { name: 'Human Biology', prompt: 'Body systems, homeostasis, and human health' },
      { name: 'Classification', prompt: 'Taxonomy, kingdoms of life, and species identification' },
    ],
    'Earth Science': [
      { name: 'Plate Tectonics', prompt: 'Continental drift, plate boundaries, earthquakes, and volcanoes' },
      { name: 'Rocks & Minerals', prompt: 'Rock types, mineral properties, and the rock cycle' },
      { name: 'Atmosphere', prompt: 'Atmospheric layers, composition, and weather patterns' },
      { name: 'Oceanography', prompt: 'Ocean currents, tides, and marine ecosystems' },
      { name: 'Climate', prompt: 'Climate zones, climate change, and greenhouse effect' },
      { name: 'Astronomy', prompt: 'Solar system, stars, galaxies, and space exploration' },
    ],
    'Physical Science': [
      { name: 'Motion & Forces', prompt: 'Newtons laws, velocity, acceleration, and momentum' },
      { name: 'Energy', prompt: 'Kinetic and potential energy, conservation of energy' },
      { name: 'Waves & Sound', prompt: 'Wave properties, sound waves, and the Doppler effect' },
      { name: 'Light & Optics', prompt: 'Reflection, refraction, lenses, and the electromagnetic spectrum' },
      { name: 'Electricity & Magnetism', prompt: 'Electric circuits, magnetism, and electromagnetism' },
      { name: 'Matter & Chemistry', prompt: 'Atomic structure, periodic table, and chemical reactions' },
    ],
    'Biology': [
      { name: 'Biochemistry', prompt: 'Organic molecules, enzymes, and metabolic processes' },
      { name: 'Cell Biology', prompt: 'Cell structure, membrane transport, and cellular respiration' },
      { name: 'Molecular Genetics', prompt: 'DNA replication, transcription, translation, and mutations' },
      { name: 'Evolution', prompt: 'Mechanisms of evolution, speciation, and phylogenetics' },
      { name: 'Ecology', prompt: 'Population ecology, community interactions, and biogeochemical cycles' },
      { name: 'Plant Biology', prompt: 'Photosynthesis, plant structure, and plant reproduction' },
      { name: 'Animal Physiology', prompt: 'Nervous, circulatory, and immune systems' },
    ],
    'Chemistry': [
      { name: 'Atomic Structure', prompt: 'Atomic models, electron configuration, and periodic trends' },
      { name: 'Chemical Bonding', prompt: 'Ionic, covalent, and metallic bonds, Lewis structures' },
      { name: 'Stoichiometry', prompt: 'Mole concept, balancing equations, and limiting reactants' },
      { name: 'States of Matter', prompt: 'Gas laws, phase changes, and intermolecular forces' },
      { name: 'Solutions', prompt: 'Concentration, solubility, and colligative properties' },
      { name: 'Acids & Bases', prompt: 'pH, acid-base reactions, and buffer solutions' },
      { name: 'Thermochemistry', prompt: 'Enthalpy, Hesss law, and calorimetry' },
    ],
    'Physics': [
      { name: 'Kinematics', prompt: 'Motion in one and two dimensions, projectile motion' },
      { name: 'Dynamics', prompt: 'Newtons laws, friction, and circular motion' },
      { name: 'Energy & Work', prompt: 'Work-energy theorem, power, and conservation of energy' },
      { name: 'Momentum', prompt: 'Linear momentum, impulse, and collisions' },
      { name: 'Waves & Optics', prompt: 'Wave interference, diffraction, and optical instruments' },
      { name: 'Electricity', prompt: 'Electric fields, circuits, and Ohms law' },
      { name: 'Magnetism', prompt: 'Magnetic fields, electromagnetic induction, and motors' },
    ],
  },
  History: {
    '3rd Grade': [
      { name: 'Community', prompt: 'Local community, community helpers, and civic responsibility' },
      { name: 'Maps & Geography', prompt: 'Reading maps, continents, and oceans' },
      { name: 'Native Americans', prompt: 'Native American cultures and regions' },
      { name: 'Colonial America', prompt: 'Early settlers and colonial life' },
      { name: 'American Symbols', prompt: 'American flag, landmarks, and national symbols' },
    ],
    '4th Grade': [
      { name: 'State History', prompt: 'State geography, history, and government' },
      { name: 'Regions of US', prompt: 'Geographic regions of the United States' },
      { name: 'American Revolution', prompt: 'Causes and events of the American Revolution' },
      { name: 'Early America', prompt: 'Formation of the new nation and Constitution' },
      { name: 'Westward Expansion', prompt: 'Louisiana Purchase and westward movement' },
    ],
    '5th Grade': [
      { name: 'Colonial Period', prompt: 'The thirteen colonies and colonial society' },
      { name: 'Revolutionary War', prompt: 'Revolutionary War battles, leaders, and outcomes' },
      { name: 'Constitution', prompt: 'Creation of the Constitution and Bill of Rights' },
      { name: 'Civil War', prompt: 'Causes, events, and effects of the Civil War' },
      { name: 'Immigration', prompt: 'Immigration waves and their impact on America' },
    ],
    '6th Grade': [
      { name: 'Ancient Civilizations', prompt: 'Mesopotamia, Egypt, Greece, and Rome' },
      { name: 'World Geography', prompt: 'Continents, climate zones, and physical features' },
      { name: 'World Religions', prompt: 'Major world religions and their origins' },
      { name: 'Medieval Period', prompt: 'Middle Ages, feudalism, and the Renaissance' },
      { name: 'Ancient Asia', prompt: 'Ancient China, India, and the Silk Road' },
    ],
    '7th Grade': [
      { name: 'Age of Exploration', prompt: 'European exploration and colonization' },
      { name: 'Renaissance', prompt: 'Renaissance art, science, and culture' },
      { name: 'Reformation', prompt: 'Protestant Reformation and religious conflicts' },
      { name: 'Enlightenment', prompt: 'Enlightenment thinkers and ideas' },
      { name: 'Revolutions', prompt: 'French Revolution and Latin American independence' },
    ],
    '8th Grade': [
      { name: 'Early Republic', prompt: 'Early US government, political parties, and expansion' },
      { name: 'Sectionalism', prompt: 'Regional differences leading to the Civil War' },
      { name: 'Reconstruction', prompt: 'Post-Civil War Reconstruction era' },
      { name: 'Industrialization', prompt: 'Industrial Revolution in America' },
      { name: 'Progressive Era', prompt: 'Progressive reforms and social movements' },
    ],
    'US History': [
      { name: 'World War I', prompt: 'Causes, events, and aftermath of World War I' },
      { name: 'Roaring Twenties', prompt: '1920s culture, economy, and society' },
      { name: 'Great Depression', prompt: 'Causes and effects of the Great Depression' },
      { name: 'World War II', prompt: 'World War II causes, events, and impact' },
      { name: 'Cold War', prompt: 'Cold War tensions, conflicts, and policies' },
      { name: 'Civil Rights', prompt: 'Civil Rights Movement leaders and achievements' },
      { name: 'Modern America', prompt: 'Post-1970s American politics and society' },
    ],
    'World History': [
      { name: 'Ancient World', prompt: 'Ancient civilizations from Mesopotamia to Rome' },
      { name: 'Medieval World', prompt: 'Medieval Europe, Islamic Golden Age, and feudalism' },
      { name: 'Early Modern Period', prompt: 'Renaissance, Reformation, and Age of Exploration' },
      { name: 'Age of Revolutions', prompt: 'Political and industrial revolutions of 18th-19th centuries' },
      { name: 'World Wars', prompt: 'World War I and II causes, events, and consequences' },
      { name: 'Cold War Era', prompt: 'Cold War, decolonization, and global conflicts' },
      { name: 'Contemporary World', prompt: 'Globalization, technology, and modern challenges' },
    ],
    'Government': [
      { name: 'Constitutional Foundations', prompt: 'US Constitution, amendments, and founding principles' },
      { name: 'Branches of Government', prompt: 'Executive, legislative, and judicial branches' },
      { name: 'Federalism', prompt: 'Federal vs state powers and responsibilities' },
      { name: 'Civil Rights & Liberties', prompt: 'Bill of Rights and civil liberties' },
      { name: 'Political Parties', prompt: 'Political parties, elections, and voting' },
      { name: 'Public Policy', prompt: 'How laws and policies are made' },
    ],
  },
  Spanish: {
    'Novice': [
      { name: 'Greetings', prompt: 'Basic Spanish greetings and introductions' },
      { name: 'Numbers', prompt: 'Spanish numbers 1-100' },
      { name: 'Colors & Shapes', prompt: 'Colors and basic shapes in Spanish' },
      { name: 'Family', prompt: 'Family members vocabulary in Spanish' },
      { name: 'Basic Phrases', prompt: 'Common everyday phrases in Spanish' },
    ],
    'Beginner': [
      { name: 'Present Tense', prompt: 'Regular present tense verb conjugation in Spanish' },
      { name: 'Nouns & Articles', prompt: 'Spanish noun gender, articles, and plurals' },
      { name: 'Adjectives', prompt: 'Adjective agreement and placement in Spanish' },
      { name: 'Common Verbs', prompt: 'High-frequency verbs ser, estar, tener, ir in Spanish' },
      { name: 'Daily Activities', prompt: 'Vocabulary for daily routines in Spanish' },
      { name: 'Food & Drink', prompt: 'Food, drinks, and restaurant vocabulary in Spanish' },
    ],
    'Intermediate': [
      { name: 'Past Tense', prompt: 'Preterite and imperfect tense in Spanish' },
      { name: 'Object Pronouns', prompt: 'Direct and indirect object pronouns in Spanish' },
      { name: 'Reflexive Verbs', prompt: 'Reflexive verbs and daily routine in Spanish' },
      { name: 'Comparisons', prompt: 'Comparatives and superlatives in Spanish' },
      { name: 'Future Tense', prompt: 'Future tense conjugation in Spanish' },
      { name: 'Commands', prompt: 'Imperative mood and giving commands in Spanish' },
    ],
    'Upper Intermediate': [
      { name: 'Subjunctive Mood', prompt: 'Present subjunctive formation and uses in Spanish' },
      { name: 'Conditional', prompt: 'Conditional tense and hypothetical statements in Spanish' },
      { name: 'Perfect Tenses', prompt: 'Present perfect and past perfect in Spanish' },
      { name: 'Por vs Para', prompt: 'Uses of por and para in Spanish' },
      { name: 'Relative Pronouns', prompt: 'Relative clauses and pronouns in Spanish' },
      { name: 'Idiomatic Expressions', prompt: 'Common Spanish idioms and expressions' },
    ],
    'Advanced': [
      { name: 'Past Subjunctive', prompt: 'Imperfect subjunctive and si clauses in Spanish' },
      { name: 'Passive Voice', prompt: 'Passive constructions and se impersonal in Spanish' },
      { name: 'Advanced Grammar', prompt: 'Complex sentence structures and advanced grammar in Spanish' },
      { name: 'Literary Spanish', prompt: 'Formal and literary Spanish expressions' },
      { name: 'Regional Variations', prompt: 'Dialectal differences across Spanish-speaking regions' },
      { name: 'Advanced Vocabulary', prompt: 'Sophisticated vocabulary and nuanced word choice in Spanish' },
    ],
  },
  'Computer Programming': {
    'Coding Basics': [
      { name: 'What is Programming', prompt: 'Introduction to programming concepts and how computers work' },
      { name: 'Algorithms', prompt: 'Understanding algorithms and step-by-step problem solving' },
      { name: 'Pseudocode', prompt: 'Writing pseudocode to plan programs' },
      { name: 'Binary & Data', prompt: 'Binary numbers and how computers store data' },
      { name: 'Programming Languages', prompt: 'Overview of programming languages and their uses' },
    ],
    'Variables & Data': [
      { name: 'Variables', prompt: 'Declaring and using variables in programming' },
      { name: 'Data Types', prompt: 'Primitive data types: strings, numbers, booleans' },
      { name: 'Operators', prompt: 'Arithmetic, comparison, and logical operators' },
      { name: 'Type Conversion', prompt: 'Converting between data types' },
      { name: 'Constants', prompt: 'Using constants and naming conventions' },
    ],
    'Logic & Control Flow': [
      { name: 'Boolean Logic', prompt: 'Boolean expressions and truth tables' },
      { name: 'If Statements', prompt: 'Conditional statements and if-else logic' },
      { name: 'Switch Statements', prompt: 'Switch/case statements for multiple conditions' },
      { name: 'Nested Conditions', prompt: 'Combining multiple conditions and nested if statements' },
      { name: 'Error Handling', prompt: 'Basic error handling and input validation' },
    ],
    'Loops & Iteration': [
      { name: 'For Loops', prompt: 'For loops and counting iterations' },
      { name: 'While Loops', prompt: 'While loops and condition-based iteration' },
      { name: 'Loop Control', prompt: 'Break, continue, and loop control statements' },
      { name: 'Nested Loops', prompt: 'Working with nested loops and patterns' },
      { name: 'Iteration Patterns', prompt: 'Common iteration patterns and algorithms' },
    ],
    'Functions': [
      { name: 'Function Basics', prompt: 'Defining and calling functions' },
      { name: 'Parameters', prompt: 'Function parameters and arguments' },
      { name: 'Return Values', prompt: 'Returning values from functions' },
      { name: 'Scope', prompt: 'Variable scope and lifetime' },
      { name: 'Recursion', prompt: 'Recursive functions and base cases' },
    ],
    'Data Structures': [
      { name: 'Arrays', prompt: 'Arrays, indexing, and array methods' },
      { name: 'Objects', prompt: 'Objects, properties, and key-value pairs' },
      { name: 'Stacks & Queues', prompt: 'Stack and queue data structures' },
      { name: 'Sets & Maps', prompt: 'Sets, maps, and hash tables' },
      { name: 'Sorting & Searching', prompt: 'Basic sorting and searching algorithms' },
    ],
    'Web Fundamentals': [
      { name: 'HTML Basics', prompt: 'HTML elements, tags, and document structure' },
      { name: 'CSS Basics', prompt: 'CSS selectors, properties, and styling' },
      { name: 'Layout', prompt: 'CSS layout with flexbox and grid' },
      { name: 'Responsive Design', prompt: 'Responsive web design and media queries' },
      { name: 'Web Forms', prompt: 'HTML forms and user input' },
    ],
    'JavaScript Essentials': [
      { name: 'JS Syntax', prompt: 'JavaScript syntax and basic operations' },
      { name: 'DOM Manipulation', prompt: 'Selecting and modifying DOM elements with JavaScript' },
      { name: 'Events', prompt: 'Event listeners and handling user interactions' },
      { name: 'Async JavaScript', prompt: 'Promises, async/await, and asynchronous programming' },
      { name: 'ES6 Features', prompt: 'Modern JavaScript features: arrow functions, destructuring, modules' },
    ],
    'Databases & APIs': [
      { name: 'SQL Basics', prompt: 'SQL queries: SELECT, INSERT, UPDATE, DELETE' },
      { name: 'Database Design', prompt: 'Tables, relationships, and database normalization' },
      { name: 'REST APIs', prompt: 'REST API concepts and HTTP methods' },
      { name: 'Fetch & AJAX', prompt: 'Making API requests with fetch and handling responses' },
      { name: 'JSON', prompt: 'JSON format and parsing data' },
    ],
    'Git & Collaboration': [
      { name: 'Git Basics', prompt: 'Git init, add, commit, and basic workflow' },
      { name: 'Branching', prompt: 'Git branches, merging, and resolving conflicts' },
      { name: 'Remote Repos', prompt: 'Working with GitHub and remote repositories' },
      { name: 'Pull Requests', prompt: 'Creating and reviewing pull requests' },
      { name: 'Collaboration', prompt: 'Team workflows and code review best practices' },
    ],
    'AI & LLM Fundamentals': [
      { name: 'What is AI', prompt: 'Introduction to artificial intelligence and machine learning' },
      { name: 'How LLMs Work', prompt: 'Large language models, tokens, and how they generate text' },
      { name: 'Prompt Engineering', prompt: 'Writing effective prompts for AI models' },
      { name: 'AI Ethics', prompt: 'AI bias, safety, and ethical considerations' },
      { name: 'AI Applications', prompt: 'Real-world applications of AI in software' },
    ],
    'AI-Assisted Coding': [
      { name: 'Code Generation', prompt: 'Using AI to generate code and boilerplate' },
      { name: 'Debugging with AI', prompt: 'Using AI to find and fix bugs' },
      { name: 'Code Review', prompt: 'AI-assisted code review and improvements' },
      { name: 'Documentation', prompt: 'Generating documentation with AI' },
      { name: 'Testing with AI', prompt: 'AI-assisted test generation and coverage' },
    ],
  },
}

const subjects = [
  { name: 'Math', icon: '📐', sortOrder: 1 },
  { name: 'Science', icon: '🔬', sortOrder: 2 },
  { name: 'History', icon: '📜', sortOrder: 3 },
  { name: 'Spanish', icon: '🇪🇸', sortOrder: 4 },
  { name: 'Computer Programming', icon: '💻', sortOrder: 5 },
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
  'Computer Programming': [
    'Coding Basics',
    'Variables & Data',
    'Logic & Control Flow',
    'Loops & Iteration',
    'Functions',
    'Data Structures',
    'Web Fundamentals',
    'JavaScript Essentials',
    'Databases & APIs',
    'Git & Collaboration',
    'AI & LLM Fundamentals',
    'AI-Assisted Coding',
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
      const level = await prisma.level.upsert({
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

      // Seed subtopics for this level
      const subtopics = subtopicsByLevel[subject.name]?.[levels[i]] || []
      for (let j = 0; j < subtopics.length; j++) {
        await prisma.subtopic.upsert({
          where: {
            levelId_name: {
              levelId: level.id,
              name: subtopics[j].name,
            },
          },
          update: {
            prompt: subtopics[j].prompt,
            sortOrder: j + 1,
          },
          create: {
            levelId: level.id,
            name: subtopics[j].name,
            prompt: subtopics[j].prompt,
            sortOrder: j + 1,
          },
        })
      }
    }

    console.log(`  Created ${levels.length} levels for ${subject.name}`)
  }

  // Count total subtopics
  const subtopicCount = await prisma.subtopic.count()
  console.log(`Total subtopics seeded: ${subtopicCount}`)

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
