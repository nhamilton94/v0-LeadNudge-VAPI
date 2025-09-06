"use client"

import type React from "react"

import { useRef, useState } from "react"
import Image from "next/image"
import { Camera } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AvatarUploadProps {
  currentImage?: string
  onImageChange: (file: File) => void
  isUploading?: boolean
}

export function AvatarUpload({ currentImage, onImageChange, isUploading }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5MB")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    onImageChange(file)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div
          className={cn(
            "relative h-32 w-32 overflow-hidden rounded-full border-2 border-muted bg-muted",
            isUploading && "opacity-50",
          )}
        >
          {(preview || currentImage) && (
            <Image
              src={preview || currentImage || "/placeholder.svg"}
              alt="Profile picture"
              fill
              className="object-cover"
            />
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute bottom-0 right-0 rounded-full"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" />
          <span className="sr-only">Upload new picture</span>
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      {isUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
    </div>
  )
}
