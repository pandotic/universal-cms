'use client';

import { useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import Link from 'next/link';

interface ParsedFrontmatter {
  name?: string;
  description?: string;
  version?: string;
  category?: string;
  tags?: string;
  icon?: string;
}

interface UploadResult {
  slug: string;
  name: string;
  version: string;
  description: string;
  category: string;
  isNew: boolean;
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;

function parsePreview(text: string): ParsedFrontmatter {
  const match = text.match(FRONTMATTER_RE);
  if (!match) return {};
  const result: ParsedFrontmatter = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim() as keyof ParsedFrontmatter;
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (['name', 'description', 'version', 'category', 'tags', 'icon'].includes(key)) {
      result[key] = val;
    }
  }
  return result;
}

export default function UploadSkillPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedFrontmatter | null>(null);
  const [syncToDb, setSyncToDb] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);

    if (f.name.endsWith('.md')) {
      const text = await f.text();
      setPreview(parsePreview(text));
    } else if (f.name.endsWith('.zip')) {
      // For zip files we can't preview client-side without jszip
      setPreview({ name: f.name.replace('.zip', ''), description: 'Zip archive — preview available after upload' });
    } else {
      setError('File must be a .md or .zip file');
      setFile(null);
      setPreview(null);
    }
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const onFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('syncToDb', syncToDb ? 'true' : 'false');

      const res = await fetch('/api/skills/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Upload failed');
      } else {
        setResult(json.data);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-1 text-sm text-zinc-500">
          <Link href="/skills" className="hover:text-zinc-300">
            Skill Library
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-300">Upload Skill</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Upload Skill</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload a SKILL.md file or a zip archive containing a SKILL.md and optional component files.
        </p>
      </div>

      {/* Success State */}
      {result && (
        <div className="rounded-lg border border-green-800/50 bg-green-900/20 p-6">
          <h2 className="text-lg font-semibold text-green-400">
            {result.isNew ? 'Skill Added' : 'Skill Updated'}
          </h2>
          <div className="mt-3 space-y-1 text-sm text-zinc-300">
            <p>
              <span className="text-zinc-500">Name:</span> {result.name}
            </p>
            <p>
              <span className="text-zinc-500">Slug:</span> {result.slug}
            </p>
            <p>
              <span className="text-zinc-500">Version:</span> {result.version}
            </p>
            <p>
              <span className="text-zinc-500">Category:</span> {result.category}
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <Link
              href="/skills"
              className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              View Skills
            </Link>
            <button
              onClick={reset}
              className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Upload Form */}
      {!result && (
        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-500/5'
                : file
                  ? 'border-zinc-600 bg-zinc-900'
                  : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
            }`}
          >
            {file ? (
              <div>
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={reset}
                  className="mt-2 text-xs text-zinc-400 underline hover:text-zinc-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-zinc-400">
                  Drag & drop a <span className="text-zinc-300">.md</span> or{' '}
                  <span className="text-zinc-300">.zip</span> file here
                </p>
                <p className="mt-1 text-xs text-zinc-600">or</p>
                <label className="mt-2 cursor-pointer rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors">
                  Browse Files
                  <input
                    type="file"
                    accept=".md,.zip"
                    onChange={onFileInput}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="mb-3 text-sm font-medium text-zinc-400">Preview</h3>
              <div className="space-y-1.5 text-sm">
                {preview.name && (
                  <p>
                    <span className="text-zinc-500">Name:</span>{' '}
                    <span className="text-white">{preview.name}</span>
                  </p>
                )}
                {preview.description && (
                  <p>
                    <span className="text-zinc-500">Description:</span>{' '}
                    <span className="text-zinc-300">{preview.description}</span>
                  </p>
                )}
                {preview.version && (
                  <p>
                    <span className="text-zinc-500">Version:</span>{' '}
                    <span className="text-zinc-300">{preview.version}</span>
                  </p>
                )}
                {preview.category && (
                  <p>
                    <span className="text-zinc-500">Category:</span>{' '}
                    <span className="text-zinc-300">{preview.category}</span>
                  </p>
                )}
                {preview.tags && (
                  <p>
                    <span className="text-zinc-500">Tags:</span>{' '}
                    <span className="text-zinc-300">{preview.tags}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Options */}
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={syncToDb}
              onChange={(e) => setSyncToDb(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900"
            />
            Sync to database after upload
          </label>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={upload}
            disabled={!file || uploading}
            className="w-full rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Skill'}
          </button>
        </div>
      )}
    </div>
  );
}
