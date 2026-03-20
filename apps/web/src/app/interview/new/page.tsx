'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  const { token, _hasHydrated } = useAuth()
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
      if (file.type !== 'application/pdf') { toast.error('Please upload a PDF file'); return }
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
    if (!resumeText.trim()) { toast.error('Please upload your resume or paste the text'); return }
    if (!jobDescription.trim()) { toast.error('Please paste the job description'); return }

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

  if (!_hasHydrated) return null
  if (!token) { router.push('/auth/login'); return null }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#60A5FA] mb-1">
          Quick Interview
        </p>
        <h1 className="text-2xl font-bold text-white">New Mock Interview</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Upload your resume and job description to get tailored questions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resume Upload */}
        <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5 space-y-3">
          <p className="text-sm font-semibold text-white">Resume</p>

          {resumeFile ? (
            <div className="flex items-center justify-between rounded-xl border border-[#1E2535] bg-[#0F1219] px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#60A5FA]" />
                <span className="text-sm text-white">{resumeFile}</span>
              </div>
              <button
                type="button"
                className="text-[#64748B] hover:text-white transition-colors"
                onClick={() => { setResumeFile(null); setResumeText('') }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              onClick={open}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 transition-colors ${
                isDragActive
                  ? 'border-[#2563EB] bg-[#172554]/20'
                  : 'border-[#1E2535] hover:border-[#2563EB]/40 hover:bg-[#172554]/10'
              }`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
              ) : (
                <>
                  <Upload className="mb-2 h-6 w-6 text-[#64748B]" />
                  <p className="text-sm text-[#94A3B8]">Drop your PDF here or click to browse</p>
                  <p className="mt-1 text-xs text-[#64748B]">Max 5MB</p>
                </>
              )}
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#1E2535]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#161B26] px-2 text-[#64748B]">or paste text</span>
            </div>
          </div>

          <Textarea
            placeholder="Paste your resume content here..."
            rows={4}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="resize-none bg-[#0F1219] border-[#1E2535] text-sm text-white placeholder:text-[#334155] focus:border-[#2563EB]"
          />
        </div>

        {/* Job Description */}
        <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5 space-y-3">
          <p className="text-sm font-semibold text-white">Job Description</p>
          <Textarea
            placeholder="Paste the job description here..."
            rows={6}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
            className="resize-none bg-[#0F1219] border-[#1E2535] text-sm text-white placeholder:text-[#334155] focus:border-[#2563EB]"
          />
        </div>

        {/* Company & Role */}
        <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5 space-y-3">
          <p className="text-sm font-semibold text-white">Target Company & Role <span className="text-[#64748B] font-normal">(optional)</span></p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">Company</label>
              <Select value={companyName} onValueChange={setCompanyName}>
                <SelectTrigger className="bg-[#0F1219] border-[#1E2535] text-[#94A3B8] focus:border-[#2563EB]">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E2640] border-[#1E2535] text-white">
                  {COMPANIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">Role</label>
              <Input
                placeholder="e.g. SDE-1, Frontend Engineer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="bg-[#0F1219] border-[#1E2535] text-white placeholder:text-[#334155] focus:border-[#2563EB]"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-2.5"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating questions...
            </>
          ) : (
            'Start Interview →'
          )}
        </Button>
      </form>
    </div>
  )
}
