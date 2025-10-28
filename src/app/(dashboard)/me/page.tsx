
'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/stores/authStore'
import { useUpdateProfile } from '@/hooks/useAuthQueries'

interface ProfileForm {
  firstName: string
  lastName: string
}

export default function ProfilePage() {
  const user = useAuthStore(state => state.user)
  const updateProfile = useUpdateProfile()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    }
  })

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile.mutateAsync(data)
      alert('Profile updated successfully')
    } catch (error) {
      console.error('Update profile error:', error)
      alert('Failed to update profile')
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block mb-1 font-medium">First Name</label>
          <input
            id="firstName"
            {...register('firstName', { required: true })}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block mb-1 font-medium">Last Name</label>
          <input
            id="lastName"
            {...register('lastName', { required: true })}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
} 