"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const docTypes = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "national_id", label: "National ID" },
];

function VerifyContent() {
  const [docType, setDocType] = useState("passport");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-green-50">
            <svg
              className="size-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Verification Submitted
          </h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Your documents are being reviewed. We&apos;ll notify you once
            verification is complete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Verify Your Identity
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload a government-issued ID to verify your identity
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Document Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {docTypes.map((d) => (
              <button
                type="button"
                key={d.value}
                onClick={() => setDocType(d.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  docType === d.value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <FileUpload
          label="Front of ID"
          file={frontFile}
          onFile={setFrontFile}
        />
        <FileUpload
          label="Back of ID"
          file={backFile}
          onFile={setBackFile}
        />

        <button
          type="submit"
          className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-md"
        >
          Submit Verification
        </button>
      </form>
    </div>
  );
}

function FileUpload({
  label,
  file,
  onFile,
}: {
  label: string;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 transition-all hover:border-brand-300 hover:bg-brand-50/30"
      >
        <svg
          className="size-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        {file ? (
          <span className="text-sm font-medium text-brand-600">
            {file.name}
          </span>
        ) : (
          <>
            <span className="text-sm font-medium text-gray-600">
              Click to upload
            </span>
            <span className="text-xs text-gray-400">
              PNG, JPG or PDF (max 10MB)
            </span>
          </>
        )}
        <input
          id={id}
          type="file"
          accept="image/*,application/pdf"
          required
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <ProtectedRoute>
      <VerifyContent />
    </ProtectedRoute>
  );
}
