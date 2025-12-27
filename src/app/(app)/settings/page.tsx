'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { Loader2, Settings as SettingsIcon, User, Lock, Palette, Save, CheckCircle, Upload, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { useToast } from '@/contexts/toast-context'

interface UserData {
  id: string
  email: string
  username: string
  displayName: string
  avatar?: string | null
  bio?: string | null
  profession?: string | null
  location?: string | null
  privacyLevel: 'PUBLIC' | 'FRIENDS' | 'PRIVATE'
}

type TabType = 'account' | 'privacy' | 'appearance'

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('account')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)

  // Form states
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [profession, setProfession] = useState('')
  const [location, setLocation] = useState('')
  const [privacyLevel, setPrivacyLevel] = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  // Avatar upload states
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData()
      // Load theme preference from localStorage
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
      setTheme(savedTheme)
    }
  }, [status])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        setDisplayName(data.displayName || '')
        setBio(data.bio || '')
        setProfession(data.profession || '')
        setLocation(data.location || '')
        setPrivacyLevel(data.privacyLevel)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error')
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      showToast('File size must be less than 10MB', 'error')
      return
    }

    setAvatarFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile) return

    setUploadingAvatar(true)
    try {
      // Step 1: Get presigned URL
      const presignedResponse = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: avatarFile.name,
          fileType: avatarFile.type,
          uploadType: 'avatar',
        }),
      })

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, fileUrl } = await presignedResponse.json()

      // Step 2: Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: avatarFile,
        headers: {
          'Content-Type': avatarFile.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      // Step 3: Update user profile with new avatar URL
      const updateResponse = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: fileUrl }),
      })

      if (updateResponse.ok) {
        const updatedData = await updateResponse.json()
        setUserData(updatedData)
        setAvatarFile(null)
        setAvatarPreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Force session update to refresh avatar in navbar
        await update()
        router.refresh()

        showToast('Avatar updated successfully!', 'success')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      showToast('Failed to upload avatar. Please try again.', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveAccount = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          bio,
          profession,
          location,
        }),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setUserData(updatedData)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error saving account settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrivacy = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacyLevel }),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setUserData(updatedData)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAppearance = async () => {
    setSaving(true)
    setSaveSuccess(false)

    // Save theme to localStorage
    localStorage.setItem('theme', theme)

    // Apply theme
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    setSaveSuccess(true)
    setTimeout(() => {
      setSaving(false)
      setSaveSuccess(false)
    }, 1000)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 md:w-8 md:h-8" />
            Settings
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-zinc-900 border dark:border-gray-700 rounded-t-lg">
          <div className="flex border-b dark:border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'account'
                  ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <User className="w-5 h-5 inline mr-2" />
              Account
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'privacy'
                  ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Lock className="w-5 h-5 inline mr-2" />
              Privacy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'appearance'
                  ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Palette className="w-5 h-5 inline mr-2" />
              Appearance
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-zinc-900 border-x border-b dark:border-gray-700 rounded-b-lg p-6">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Account Information
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Update your account details and personal information
                </p>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData?.email || ''}
                  disabled
                  className="bg-gray-100 dark:bg-zinc-800"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Email cannot be changed
                </p>
              </div>

              {/* Username (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={userData?.username || ''}
                  disabled
                  className="bg-gray-100 dark:bg-zinc-800"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Username cannot be changed
                </p>
              </div>

              {/* Profile Picture */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  {/* Current or Preview Avatar */}
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-700">
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Avatar preview"
                        fill
                        className="object-cover"
                      />
                    ) : userData?.avatar ? (
                      <Image
                        src={userData.avatar}
                        alt="Current avatar"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <User className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      aria-label="Upload profile picture"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Choose Image
                      </button>

                      {avatarFile && (
                        <>
                          <button
                            type="button"
                            onClick={handleUploadAvatar}
                            disabled={uploadingAvatar}
                            className="px-4 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-black rounded-lg hover:bg-blue-700 dark:hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {uploadingAvatar ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Upload
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {avatarFile
                        ? `Selected: ${avatarFile.name}`
                        : 'JPG, PNG, GIF or WebP. Max 10MB.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  maxLength={100}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  maxLength={500}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {bio.length}/500 characters
                </p>
              </div>

              {/* Profession */}
              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Software Engineer, Designer, etc."
                  maxLength={100}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  maxLength={100}
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleSaveAccount}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-black font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Saved successfully!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Privacy Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Control who can see your content and interact with you
                </p>
              </div>

              {/* Default Privacy Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Default Post Privacy
                </label>
                <div className="space-y-3">
                  <label className="flex items-start p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                    <input
                      type="radio"
                      name="privacyLevel"
                      value="PUBLIC"
                      checked={privacyLevel === 'PUBLIC'}
                      onChange={(e) => setPrivacyLevel(e.target.value as 'PUBLIC')}
                      className="mt-1 w-4 h-4 text-blue-600 dark:text-yellow-500 focus:ring-blue-500 dark:focus:ring-yellow-500"
                    />
                    <div className="ml-3 flex-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Public</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Anyone can see your posts, even if they're not following you
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                    <input
                      type="radio"
                      name="privacyLevel"
                      value="FRIENDS"
                      checked={privacyLevel === 'FRIENDS'}
                      onChange={(e) => setPrivacyLevel(e.target.value as 'FRIENDS')}
                      className="mt-1 w-4 h-4 text-blue-600 dark:text-yellow-500 focus:ring-blue-500 dark:focus:ring-yellow-500"
                    />
                    <div className="ml-3 flex-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Friends Only</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Only your friends can see your posts
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                    <input
                      type="radio"
                      name="privacyLevel"
                      value="PRIVATE"
                      checked={privacyLevel === 'PRIVATE'}
                      onChange={(e) => setPrivacyLevel(e.target.value as 'PRIVATE')}
                      className="mt-1 w-4 h-4 text-blue-600 dark:text-yellow-500 focus:ring-blue-500 dark:focus:ring-yellow-500"
                    />
                    <div className="ml-3 flex-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Private</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Only you can see your posts
                      </p>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  This setting will be the default for new posts. You can change it for individual posts.
                </p>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleSavePrivacy}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-black font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Saved successfully!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Appearance Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Customize how the app looks and feels
                </p>
              </div>

              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Theme
                </label>
                <div className="space-y-3">
                  <label className="flex items-start p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={theme === 'light'}
                      onChange={(e) => setTheme(e.target.value as 'light')}
                      className="mt-1 w-4 h-4 text-blue-600 dark:text-yellow-500 focus:ring-blue-500 dark:focus:ring-yellow-500"
                    />
                    <div className="ml-3 flex-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Light</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Use light theme
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={theme === 'dark'}
                      onChange={(e) => setTheme(e.target.value as 'dark')}
                      className="mt-1 w-4 h-4 text-blue-600 dark:text-yellow-500 focus:ring-blue-500 dark:focus:ring-yellow-500"
                    />
                    <div className="ml-3 flex-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Dark</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Use dark theme
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                    <input
                      type="radio"
                      name="theme"
                      value="system"
                      checked={theme === 'system'}
                      onChange={(e) => setTheme(e.target.value as 'system')}
                      className="mt-1 w-4 h-4 text-blue-600 dark:text-yellow-500 focus:ring-blue-500 dark:focus:ring-yellow-500"
                    />
                    <div className="ml-3 flex-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">System</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Use system preference (automatically switch between light and dark)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleSaveAppearance}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-black font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Saved successfully!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
