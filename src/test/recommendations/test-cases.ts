/**
 * Test Cases for Recommendation Engine
 * Ground truth data for evaluating retrieval and ranking quality
 */

export interface TestCase {
  id: string
  query: string
  expectedTools: string[] // Tool names that MUST be recommended
  relevantTools: string[] // Tool names that could be recommended
  irrelevantTools: string[] // Tool names that should NOT be recommended
  difficulty: 'easy' | 'medium' | 'hard'
  category: string // e.g., "woodworking", "electronics", "3d-printing"
  description: string // Explanation of why these tools are expected
}

export const testCases: TestCase[] = [
  // ============================================
  // Electronics Projects (Easy)
  // ============================================
  {
    id: 'elec-001',
    query: 'I want to repair a circuit board with SMD components',
    expectedTools: ['Soldering Station', 'Multimeter'],
    relevantTools: ['Digital Oscilloscope', 'Precision Screwdriver Set'],
    irrelevantTools: [],
    difficulty: 'easy',
    category: 'electronics',
    description: 'SMD repair requires soldering iron and multimeter for testing',
  },
  {
    id: 'elec-002',
    query: 'I need to measure voltage and current in my circuit',
    expectedTools: ['Multimeter'],
    relevantTools: ['Digital Oscilloscope'],
    irrelevantTools: [],
    difficulty: 'easy',
    category: 'electronics',
    description: 'Multimeter is the primary tool for voltage/current measurement',
  },
  {
    id: 'elec-003',
    query: 'I want to debug a PWM signal from my microcontroller',
    expectedTools: ['Digital Oscilloscope'],
    relevantTools: ['Multimeter'],
    irrelevantTools: [],
    difficulty: 'easy',
    category: 'electronics',
    description: 'Oscilloscope is essential for visualizing PWM signals',
  },

  // ============================================
  // Woodworking Projects (Medium)
  // ============================================
  {
    id: 'wood-001',
    query: 'I want to build a wooden picture frame',
    expectedTools: [],
    relevantTools: ['Precision Screwdriver Set'],
    irrelevantTools: ['Soldering Station', 'Digital Oscilloscope', 'Multimeter'],
    difficulty: 'medium',
    category: 'woodworking',
    description: 'Picture frames need saw, sandpaper, clamps - basic woodworking tools',
  },
  {
    id: 'wood-002',
    query: 'I need to assemble furniture with various screws',
    expectedTools: ['Precision Screwdriver Set'],
    relevantTools: [],
    irrelevantTools: ['Soldering Station', 'Digital Oscilloscope'],
    difficulty: 'easy',
    category: 'woodworking',
    description: 'Screwdrivers are essential for furniture assembly',
  },

  // ============================================
  // Mixed Projects (Medium)
  // ============================================
  {
    id: 'mixed-001',
    query: 'I want to build a wooden drone frame with electronic speed controllers',
    expectedTools: ['Soldering Station', 'Multimeter'],
    relevantTools: ['Digital Oscilloscope', 'Precision Screwdriver Set'],
    irrelevantTools: [],
    difficulty: 'medium',
    category: 'mixed',
    description: 'Drone frame needs woodworking for frame, soldering for ESCs',
  },
  {
    id: 'mixed-002',
    query: "I'm making an Arduino-based temperature monitoring system",
    expectedTools: ['Soldering Station', 'Multimeter'],
    relevantTools: ['Digital Oscilloscope'],
    irrelevantTools: [],
    difficulty: 'medium',
    category: 'electronics',
    description: 'Arduino projects need soldering for connections, multimeter for debugging',
  },

  // ============================================
  // Hard Cases (Ambiguous Queries)
  // ============================================
  {
    id: 'hard-001',
    query: 'I need to fix something that is not working',
    expectedTools: [],
    relevantTools: ['Multimeter', 'Precision Screwdriver Set', 'Soldering Station'],
    irrelevantTools: [],
    difficulty: 'hard',
    category: 'general',
    description: 'Very ambiguous query - should recommend diagnostic tools',
  },
  {
    id: 'hard-002',
    query: 'Help me with my project',
    expectedTools: [],
    relevantTools: ['Multimeter', 'Precision Screwdriver Set', 'Digital Oscilloscope', 'Soldering Station'],
    irrelevantTools: [],
    difficulty: 'hard',
    category: 'general',
    description: 'No context - should ask for more information or show general tools',
  },

  // ============================================
  // 3D Printing / Prototyping (Medium)
  // ============================================
  {
    id: 'proto-001',
    query: "I'm making a 3D printed enclosure for my Raspberry Pi",
    expectedTools: ['Precision Screwdriver Set'],
    relevantTools: ['Multimeter', 'Soldering Station'],
    irrelevantTools: [],
    difficulty: 'medium',
    category: 'prototyping',
    description: 'Enclosure needs screwdrivers for assembly, may need electronics tools',
  },
  {
    id: 'proto-002',
    query: 'I want to prototype a new IoT device with sensors',
    expectedTools: ['Soldering Station', 'Multimeter'],
    relevantTools: ['Digital Oscilloscope', 'Precision Screwdriver Set'],
    irrelevantTools: [],
    difficulty: 'medium',
    category: 'electronics',
    description: 'IoT prototyping needs soldering for components, multimeter for testing',
  },

  // ============================================
  // Maintenance / Repair (Easy)
  // ============================================
  {
    id: 'maint-001',
    query: 'I need to open and clean my laptop',
    expectedTools: ['Precision Screwdriver Set'],
    relevantTools: [],
    irrelevantTools: ['Soldering Station'],
    difficulty: 'easy',
    category: 'maintenance',
    description: 'Laptop maintenance requires precision screwdrivers',
  },
  {
    id: 'maint-002',
    query: 'I want to check if my power supply is working correctly',
    expectedTools: ['Multimeter'],
    relevantTools: ['Digital Oscilloscope'],
    irrelevantTools: ['Precision Screwdriver Set'],
    difficulty: 'easy',
    category: 'electronics',
    description: 'Power supply testing primarily needs a multimeter',
  },

  // ============================================
  // Additional Test Cases
  // ============================================
  {
    id: 'elec-004',
    query: 'I want to analyze audio signals from my synthesizer',
    expectedTools: ['Digital Oscilloscope'],
    relevantTools: ['Multimeter'],
    irrelevantTools: [],
    difficulty: 'easy',
    category: 'electronics',
    description: 'Audio signal analysis requires oscilloscope',
  },
  {
    id: 'elec-005',
    query: 'I need to solder wires together for a custom cable',
    expectedTools: ['Soldering Station'],
    relevantTools: ['Multimeter'],
    irrelevantTools: [],
    difficulty: 'easy',
    category: 'electronics',
    description: 'Wire soldering requires soldering station',
  },
  {
    id: 'mech-001',
    query: 'I need to tighten screws on my 3D printer',
    expectedTools: ['Precision Screwdriver Set'],
    relevantTools: [],
    irrelevantTools: ['Soldering Station'],
    difficulty: 'easy',
    category: 'mechanical',
    description: '3D printer maintenance needs screwdrivers',
  },
  {
    id: 'edu-001',
    query: "I'm a beginner learning about electronics, what tools do I need?",
    expectedTools: ['Multimeter'],
    relevantTools: ['Soldering Station', 'Precision Screwdriver Set'],
    irrelevantTools: [],
    difficulty: 'medium',
    category: 'education',
    description: 'Beginners should start with a multimeter',
  },
  {
    id: 'robot-001',
    query: 'I want to build a simple line-following robot',
    expectedTools: ['Soldering Station', 'Multimeter'],
    relevantTools: ['Digital Oscilloscope', 'Precision Screwdriver Set'],
    irrelevantTools: [],
    difficulty: 'medium',
    category: 'robotics',
    description: 'Robot building needs soldering for circuits and multimeter for debugging',
  },
  {
    id: 'audio-001',
    query: 'I want to repair my headphones that have a loose connection',
    expectedTools: ['Soldering Station'],
    relevantTools: ['Multimeter', 'Precision Screwdriver Set'],
    irrelevantTools: ['Digital Oscilloscope'],
    difficulty: 'medium',
    category: 'electronics',
    description: 'Headphone repair often needs soldering for loose wires',
  },
]

/**
 * Get test cases by difficulty
 */
export function getTestCasesByDifficulty(difficulty: TestCase['difficulty']): TestCase[] {
  return testCases.filter((tc) => tc.difficulty === difficulty)
}

/**
 * Get test cases by category
 */
export function getTestCasesByCategory(category: string): TestCase[] {
  return testCases.filter((tc) => tc.category === category)
}

/**
 * Get statistics about test dataset
 */
export function getTestDatasetStats() {
  return {
    total: testCases.length,
    byDifficulty: {
      easy: testCases.filter((tc) => tc.difficulty === 'easy').length,
      medium: testCases.filter((tc) => tc.difficulty === 'medium').length,
      hard: testCases.filter((tc) => tc.difficulty === 'hard').length,
    },
    byCategory: testCases.reduce(
      (acc, tc) => {
        acc[tc.category] = (acc[tc.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
    avgExpectedTools: testCases.reduce((sum, tc) => sum + tc.expectedTools.length, 0) / testCases.length,
    avgRelevantTools: testCases.reduce((sum, tc) => sum + tc.relevantTools.length, 0) / testCases.length,
  }
}
