'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/post/post-card'
import { Loader2, MapPin, Calendar, Link as LinkIcon, Upload, X, User } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/contexts/toast-context'

interface Post {
  id: string
  content: string
  mediaUrls: string[]
  mediaType: string
  likeCount: number
  commentCount: number
  repostCount: number
  saveCount: number
  hasLiked: boolean
  createdAt: string
  reactions: {
    love: number
    applaud: number
    salute: number
    shine: number
  }
  userReactions: string[]
  hasReposted: boolean
  hasSaved: boolean
  author: {
    id: string
    username: string
    displayName: string
    avatar?: string | null
  }
}

interface UserProfile {
  id: string
  username: string
  displayName: string
  email: string
  bio: string | null
  profession: string | null
  location: string | null
  avatar: string | null
  createdAt: string
  postCount: number
  friendCount: number
  followingCount: number
  followerCount: number
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    profession: '',
    location: '',
  })
  const [saving, setSaving] = useState(false)
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
      fetchProfile()
      fetchPosts()
    }
  }, [status])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/users/me/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = () => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName,
        bio: profile.bio || '',
        profession: profile.profession || '',
        location: profile.location || '',
      })
      setIsEditModalOpen(true)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error')
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      showToast('File size must be less than 10MB', 'error')
      return
    }

    setAvatarFile(file)

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

      const updateResponse = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: fileUrl }),
      })

      if (updateResponse.ok) {
        const updatedData = await updateResponse.json()
        setProfile(updatedData)
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

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setIsEditModalOpen(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">Profile not found</p>
      </div>
    )
  }

  const initials = profile.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Cover Image */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-yellow-500 dark:to-amber-600 h-48 md:h-64" />

      <div className="container mx-auto px-4 max-w-5xl">
        {/* Profile Header */}
        <div className="bg-white dark:bg-zinc-900 border dark:border-gray-700 rounded-lg shadow -mt-20 md:-mt-32 mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="w-32 h-32 border-4 border-white -mt-16 md:-mt-24">
                <AvatarImage src={profile.avatar || undefined} />
                <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{profile.displayName}</h1>
                <p className="text-gray-600 dark:text-gray-400">@{profile.username}</p>
                {profile.bio && <p className="mt-3 text-gray-700 dark:text-gray-200">{profile.bio}</p>}

                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.profession && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" />
                      <span>{profile.profession}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {joinDate}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleEditClick}
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-yellow-500 dark:text-yellow-500 dark:hover:bg-yellow-900/20"
              >
                Edit Profile
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">{profile.postCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">{profile.followingCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">{profile.followerCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">{profile.friendCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Friends</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'posts'
                    ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'about'
                    ? 'text-blue-600 dark:text-yellow-500 border-b-2 border-blue-600 dark:border-yellow-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                About
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'posts' && (
          <div className="space-y-6 pb-8">
            {posts.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border dark:border-gray-700 rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No posts yet</p>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white dark:bg-zinc-900 border dark:border-gray-700 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">About</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Email</h3>
                <p className="text-gray-700 dark:text-gray-300">{profile.email}</p>
              </div>
              {profile.bio && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Bio</h3>
                  <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
                </div>
              )}
              {profile.location && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Location</h3>
                  <p className="text-gray-700 dark:text-gray-300">{profile.location}</p>
                </div>
              )}
              {profile.profession && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Profession</h3>
                  <p className="text-gray-700 dark:text-gray-300">{profile.profession}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Member Since</h3>
                <p className="text-gray-700 dark:text-gray-300">{joinDate}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Profile</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-700">
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Avatar preview"
                        fill
                        className="object-cover"
                      />
                    ) : profile?.avatar ? (
                      <Image
                        src={profile.avatar}
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
                        className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2 text-sm"
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
                            className="px-4 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-black rounded-lg hover:bg-blue-700 dark:hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                          >
                            {uploadingAvatar ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              'Upload'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2 text-sm"
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

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label htmlFor="profession" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profession
                </label>
                <input
                  id="profession"
                  type="text"
                  value={editForm.profession}
                  onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Software Engineer"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 focus:border-transparent"
                  placeholder="New York, NY"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={saving}
                className="border-gray-300 dark:border-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-black"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
