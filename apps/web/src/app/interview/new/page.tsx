'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Loader2, Upload, FileText, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

const COMPANIES = [
  'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple',
  'Razorpay', 'Flipkart', 'Swiggy', 'PhonePe', 'CRED',
  'Zerodha', 'Atlassian', 'Samsung', 'Adobe', 'Intuit', 'Walmart',
]

export default function NewInterviewPage() {
  const { token } = useAuth()
  const router = useRouter()

  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    async (files: File[]) => {
      if (!token || files.length === 0) return
      const file = files[0]

      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file')
        return
      }

      setUploading(true)
      try {
        const result = await api.interviews.uploadResume(token, file)
        setResumeText(result.text)
        setResumeFile(file.name)
        toast.success(`Resume parsed — ${result.pages} page(s)`)
      } catch (err: any) {
        toast.error(err.message || 'Failed to parse resume')
      } finally {
        setUploading(false)
      }
    },
    [token],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    noClick: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!resumeText.trim()) {
      toast.error('Please upload your resume or paste the text')
      return
    }
    if (!jobDescription.trim()) {
      toast.error('Please paste the job description')
      return
    }

    setLoading(true)
    try {
      const result = await api.interviews.create(token, {
        resumeText,
        jobDescription,
        companyName: companyName || undefined,
        roleTitle: roleTitle || undefined,
      })
      router.push(`/interview/${result.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to start interview')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New mock interview</h1>
        <p className="text-sm text-muted-foreground">
          Upload your resume and paste the job description to get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Resume Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumeFile ? (
              <div className="flex items-center justify-between rounded-md border px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{resumeFile}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setResumeFile(null)
                    setResumeText('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                onClick={open}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-6 py-10 transition-colors ${
                  isDragActive ? 'border-primary bg-muted/50' : 'hover:bg-muted/50'
                }`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drop your PDF here or click to browse
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Max 5MB</p>
                  </>
                )}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or paste text</span>
              </div>
            </div>

            <Textarea
              placeholder="Paste your resume content here..."
              rows={4}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="resize-none text-sm"
            />
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Job description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste the job description here..."
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
              className="resize-none text-sm"
            />
          </CardContent>
        </Card>

        {/* Company & Role */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Target company & role</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-xs">
                Company (optional)
              </Label>
              <Select value={companyName} onValueChange={setCompanyName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs">
                Role (optional)
              </Label>
              <Input
                id="role"
                placeholder="e.g. SDE-1, Frontend Engineer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating questions...
            </>
          ) : (
            'Start Interview'
          )}
        </Button>
      </form>
    </div>
  )
}
