'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Stats {
  streak: {
    current: number
    longest: number
  }
  overall: {
    totalQuizzes: number
    totalQuestions: number
    overallAccuracy: number
  }
  subjectStats: Array<{
    subject: { id: string; name: string; icon: string }
    currentLevel: { id: string; name: string } | null
    suggestedLevel: { id: string; name: string } | null
    quizzesCompleted: number
    accuracy: number
  }>
}

interface User {
  id: string
  username: string
  displayName: string
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, statsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/stats'),
        ])
        const userData = await userRes.json()
        const statsData = await statsRes.json()
        setUser(userData.user)
        setStats(statsData)
        setDisplayName(userData.user?.displayName || '')
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function updateDisplayName() {
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      })
      if (res.ok) {
        setMessage('Display name updated!')
        setEditing(false)
        router.refresh()
      }
    } catch {
      setMessage('Failed to update display name')
    }
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      setMessage('New password must be at least 8 characters')
      return
    }

    try {
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
      } else {
        setMessage(data.error || 'Failed to change password')
      }
    } catch {
      setMessage('Failed to change password')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !stats) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          {message}
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Username</label>
            <div className="text-gray-900">{user.username}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Display Name</label>
            {editing ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={updateDisplayName}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-gray-900">{user.displayName}</span>
                <button
                  onClick={() => setEditing(true)}
                  className="text-blue-600 text-sm"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Member Since</label>
            <div className="text-gray-900">
              {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.streak.current}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">{stats.streak.longest}</div>
            <div className="text-sm text-gray-600">Best Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.overall.totalQuizzes}</div>
            <div className="text-sm text-gray-600">Quizzes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.overall.overallAccuracy}%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
        </div>
      </div>

      {/* Subject Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subject Progress</h2>
        <div className="space-y-4">
          {stats.subjectStats.map((stat) => (
            <div key={stat.subject.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{stat.subject.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">{stat.subject.name}</div>
                  <div className="text-sm text-gray-600">
                    Level: {stat.currentLevel?.name || 'Not set'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{stat.quizzesCompleted} quizzes</div>
                <div className="text-sm text-gray-600">{stat.accuracy}% accuracy</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={changePassword}
            disabled={!currentPassword || !newPassword}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  )
}
