import imageCompression from 'browser-image-compression'

const COMPRESSIBLE = new Set(['image/png', 'image/jpeg', 'image/jpg'])

export async function compressForUpload(file: File): Promise<File> {
  if (!COMPRESSIBLE.has(file.type)) return file

  try {
    const isPng = file.type === 'image/png'
    const compressed = await imageCompression(file, {
      fileType: 'image/webp',
      initialQuality: isPng ? 0.95 : 0.90,
      maxWidthOrHeight: 2560,
      useWebWorker: true,
    })
    const name = file.name.replace(/\.[^.]+$/, '.webp')
    return new File([compressed], name, { type: 'image/webp' })
  } catch (err) {
    console.warn('[compressForUpload] failed, using original:', err)
    return file
  }
}
