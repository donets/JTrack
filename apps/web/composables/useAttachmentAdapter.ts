import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'

interface AttachmentPayload {
  fileName: string
  mimeType: string
  base64: string
  width?: number
  height?: number
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

export const useAttachmentAdapter = () => {
  const api = useApiClient()
  const repository = useOfflineRepository()

  const fromFile = async (file: File): Promise<AttachmentPayload> => {
    const base64 = await blobToBase64(file)

    return {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      base64
    }
  }

  const captureFromDevice = async (): Promise<AttachmentPayload> => {
    if (Capacitor.isNativePlatform()) {
      const photo = await Camera.getPhoto({
        quality: 75,
        source: CameraSource.Prompt,
        resultType: CameraResultType.Base64
      })

      if (!photo.base64String) {
        throw new Error('No image data returned from camera')
      }

      const cacheFileName = `capture-${Date.now()}.jpg`
      await Filesystem.writeFile({
        path: cacheFileName,
        data: photo.base64String,
        directory: Directory.Cache
      })

      return {
        fileName: cacheFileName,
        mimeType: photo.format ? `image/${photo.format}` : 'image/jpeg',
        base64: photo.base64String
      }
    }

    throw new Error('Device capture is only available in Capacitor runtime')
  }

  const uploadAttachment = async (ticketId: string, payload: AttachmentPayload) => {
    const presign = await api.post<{
      storageKey: string
      uploadUrl: string
      headers: Record<string, string>
    }>('/attachments/presign', {
      fileName: payload.fileName,
      mimeType: payload.mimeType
    })

    const uploadResult = await api.put<{ url: string; size: number }>(presign.uploadUrl, {
      base64: payload.base64
    })

    const kind = payload.mimeType.startsWith('image/') ? 'Photo' : 'File'

    await repository.addAttachmentMetadata({
      ticketId,
      kind,
      storageKey: presign.storageKey,
      url: uploadResult.url,
      mimeType: payload.mimeType,
      size: uploadResult.size,
      width: payload.width ?? null,
      height: payload.height ?? null
    })
  }

  return {
    fromFile,
    captureFromDevice,
    uploadAttachment
  }
}
