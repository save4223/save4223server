import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'tool-images'

// Create service role client for admin operations (bypasses RLS)
function createServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  }

  return createServiceClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Ensure bucket exists (uses service role to bypass RLS)
async function ensureBucket() {
  const supabase = createServiceRoleClient()

  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('Failed to list buckets:', listError)
    throw new Error(`Failed to list buckets: ${listError.message}`)
  }

  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      fileSizeLimit: '20MB',
    })

    if (createError) {
      console.error('Failed to create bucket:', createError)
      throw new Error(`Failed to create bucket: ${createError.message}`)
    }
    console.log(`Created bucket: ${BUCKET}`)
  }
}

/**
 * Upload an image to Supabase Storage
 * @param file - The file buffer
 * @param filename - Original filename (will be used to determine extension)
 * @param contentType - MIME type of the file
 * @returns Object containing the public URL and the path
 */
export async function uploadImage(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const supabase = await createClient()

  // Ensure bucket exists (uses service role client)
  await ensureBucket()

  // Generate unique key: timestamp-random-extension
  const ext = filename.split('.').pop() || 'jpg'
  const key = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(key, file, {
      contentType,
      upsert: false,
    })

  if (error) {
    console.error('Supabase storage upload error:', error)
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(key)

  return {
    url: urlData.publicUrl,
    key: data.path,
  }
}

/**
 * Delete an image from Supabase Storage
 * @param path - The object path to delete
 */
export async function deleteImage(path: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path])

  if (error) {
    console.error('Supabase storage delete error:', error)
    throw new Error(`Delete failed: ${error.message}`)
  }
}

export { BUCKET }
