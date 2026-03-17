'use client'

import { useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { cpp } from '@codemirror/lang-cpp'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { go } from '@codemirror/lang-go'
import { java } from '@codemirror/lang-java'
import { useTheme } from 'next-themes'

const languageExtensions = {
  cpp: () => cpp(),
  javascript: () => javascript(),
  python: () => python(),
  go: () => go(),
  java: () => java(),
}

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: 'cpp' | 'javascript' | 'python' | 'go' | 'java'
  disabled?: boolean
}

export function CodeEditor({ value, onChange, language, disabled }: CodeEditorProps) {
  const { resolvedTheme } = useTheme()

  const handleChange = useCallback(
    (val: string) => {
      if (!disabled) onChange(val)
    },
    [onChange, disabled],
  )

  const extensions = [languageExtensions[language]()]

  return (
    <CodeMirror
      value={value}
      onChange={handleChange}
      extensions={extensions}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      editable={!disabled}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        autocompletion: false,
        highlightActiveLine: !disabled,
        indentOnInput: true,
      }}
      minHeight="300px"
      maxHeight="500px"
    />
  )
}
