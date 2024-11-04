// lib/supabase/storage.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'
import type { Database } from '@/lib/types/database-types'

export type UploadError = {
  message: string;
  details?: string;
}

export async function uploadTeamLogo(file: File | null): Promise<string | null> {
  if (!file) {
    return null
  }

  const supabase = createClientComponentClient<Database>()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication required')
    }

    // Validate file type
    const fileType = file.type
    if (!fileType || !fileType.startsWith('image/')) {
      throw new Error('Please upload an image file')
    }

    // Maximum file size (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 5MB')
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      throw new Error('Please upload a valid image file (jpg, jpeg, png, gif, webp)')
    }

    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `team-logos/${fileName}`

    console.log('Uploading file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      path: filePath
    })

    const { error: uploadError } = await supabase.storage
      .from('team-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('team-assets')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error in uploadTeamLogo:', error)
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    throw new Error('Upload failed. Please try again.')
  }
}