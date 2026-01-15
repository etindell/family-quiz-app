'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Subject, useSubject } from '@/contexts/SubjectContext'
import { getSubjectTheme } from '@/config/subject-themes'

interface HeaderProps {
  user: {
    displayName: string
    currentStreak: number
  } | null
  currentSubject?: Subject | null
}

export default function Header({ user, currentSubject: propSubject }: HeaderProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  // Try to get subject from context, fall back to prop
  let currentSubject = propSubject
  try {
    const ctx = useSubject()
    currentSubject = ctx.currentSubject ?? propSubject
  } catch {
    // Context not available, use prop
  }

  const theme = currentSubject ? getSubjectTheme(currentSubject.name) : null

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const handleSwitchSubject = () => {
    router.push('/select-subject')
  }

  // Dynamic classes based on theme
  const headerBg = theme ? theme.headerBg : 'bg-white'
  const headerBorder = theme ? 'border-white/20' : 'border-gray-200'
  const logoColor = theme ? 'text-white' : 'text-blue-600'
  const navColor = theme ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-gray-900'
  const streakBg = theme ? 'bg-white/20' : 'bg-orange-100'
  const streakText = theme ? 'text-white' : 'text-orange-600'
  const userText = theme ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'
  const dropdownBg = theme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const dropdownText = theme ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'

  return (
    <header className={`${headerBg} border-b ${headerBorder} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            {/* Logo / Subject indicator */}
            {currentSubject ? (
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{currentSubject.icon}</span>
                <span className={`text-xl font-bold ${logoColor}`}>
                  {currentSubject.name}
                </span>
              </div>
            ) : (
              <Link href="/select-subject" className={`text-xl font-bold ${logoColor}`}>
                Pruebas
              </Link>
            )}

            {/* Navigation - only show when subject is selected */}
            {currentSubject && (
              <nav className="hidden md:flex space-x-4">
                <Link
                  href="/dashboard"
                  className={`${navColor} px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  Dashboard
                </Link>
                <Link
                  href={`/subjects/${currentSubject.id}`}
                  className={`${navColor} px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  Study
                </Link>
                <Link
                  href={`/quiz/create?subjectId=${currentSubject.id}`}
                  className={`${navColor} px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  Create Quiz
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Switch Subject button */}
            {currentSubject && (
              <button
                onClick={handleSwitchSubject}
                className={`hidden md:flex items-center space-x-1 ${navColor} px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Switch</span>
              </button>
            )}

            {user && (
              <>
                <div className={`flex items-center space-x-2 ${streakBg} px-3 py-1 rounded-full`}>
                  <span className={`${streakText} font-medium`}>{user.currentStreak}</span>
                  <span className={theme ? 'text-white/80' : 'text-orange-500'}>day streak</span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`flex items-center space-x-2 ${userText} transition-colors`}
                  >
                    <span className="text-sm font-medium">{user.displayName}</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className={`absolute right-0 mt-2 w-48 ${dropdownBg} rounded-md shadow-lg py-1 z-50 border`}>
                      <Link
                        href="/profile"
                        className={`block px-4 py-2 text-sm ${dropdownText}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        Profile & Stats
                      </Link>
                      {currentSubject && (
                        <button
                          onClick={() => {
                            setMenuOpen(false)
                            handleSwitchSubject()
                          }}
                          className={`md:hidden block w-full text-left px-4 py-2 text-sm ${dropdownText}`}
                        >
                          Switch Subject
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className={`block w-full text-left px-4 py-2 text-sm ${dropdownText}`}
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
