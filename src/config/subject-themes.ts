export interface SubjectTheme {
  primary: string
  primaryLight: string
  gradient: string
  headerBg: string
  headerText: string
  icon: string
}

export const subjectThemes: Record<string, SubjectTheme> = {
  'Math': {
    primary: '#2563eb',
    primaryLight: '#dbeafe',
    gradient: 'from-blue-600 to-blue-800',
    headerBg: 'bg-blue-600',
    headerText: 'text-white',
    icon: '📐',
  },
  'Science': {
    primary: '#16a34a',
    primaryLight: '#dcfce7',
    gradient: 'from-green-600 to-green-800',
    headerBg: 'bg-green-600',
    headerText: 'text-white',
    icon: '🔬',
  },
  'History': {
    primary: '#d97706',
    primaryLight: '#fef3c7',
    gradient: 'from-amber-600 to-amber-800',
    headerBg: 'bg-amber-600',
    headerText: 'text-white',
    icon: '📜',
  },
  'Spanish': {
    primary: '#dc2626',
    primaryLight: '#fee2e2',
    gradient: 'from-red-600 to-red-800',
    headerBg: 'bg-red-600',
    headerText: 'text-white',
    icon: '🌎',
  },
  'Computer Programming': {
    primary: '#9333ea',
    primaryLight: '#f3e8ff',
    gradient: 'from-purple-600 to-purple-800',
    headerBg: 'bg-purple-600',
    headerText: 'text-white',
    icon: '💻',
  },
}

export function getSubjectTheme(subjectName: string): SubjectTheme {
  return subjectThemes[subjectName] || subjectThemes['Math']
}
