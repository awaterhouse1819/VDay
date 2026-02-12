"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

type BoardImage = {
  id: string;
  url: string;
  caption: string | null;
  uploaded_by_initials: string;
  created_at: string;
};

type UploadStatus = {
  name: string;
  status: "pending" | "uploading" | "saving" | "done" | "error";
  message?: string;
};

type BoardClientProps = {
  initialYear: number;
  years: number[];
};

export default function BoardClient({ initialYear, years }: BoardClientProps) {
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [locked, setLocked] = useState(false);
  const [images, setImages] = useState<BoardImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const set = new Set<number>([initialYear, ...years]);
    return Array.from(set).sort((a, b) => b - a);
  }, [initialYear, years]);

  async function fetchBoard(year: number) {
    setLoading(true);
    try {
      const response = await fetch(`/api/board?year=${year}`);
      const payload = (await response.json()) as {
        locked?: boolean;
        images?: BoardImage[];
      };
      setLocked(Boolean(payload.locked));
      setImages(payload.images ?? []);
    } catch {
      setLocked(false);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBoard(selectedYear);
  }, [selectedYear]);

  async function uploadFile(file: File) {
    const status: UploadStatus = { name: file.name, status: "pending" };
    setUploads((prev) => [...prev, status]);

    const updateStatus = (next: Partial<UploadStatus>) => {
      setUploads((prev) =>
        prev.map((item) =>
          item.name === status.name ? { ...item, ...next } : item
        )
      );
    };

    try {
      updateStatus({ status: "uploading" });
      const uploadUrlResponse = await fetch("/api/board/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear,
          fileName: file.name,
          contentType: file.type
        })
      });

      if (!uploadUrlResponse.ok) {
        const payload = (await uploadUrlResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        updateStatus({
          status: "error",
          message: payload?.error ?? "Unable to prepare upload."
        });
        return;
      }

      const uploadPayload = (await uploadUrlResponse.json()) as {
        uploadUrl: string;
        storage_path: string;
      };

      const uploadResult = await fetch(uploadPayload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      if (!uploadResult.ok) {
        updateStatus({ status: "error", message: "Upload failed." });
        return;
      }

      updateStatus({ status: "saving" });
      const confirmResponse = await fetch("/api/board/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear,
          storage_path: uploadPayload.storage_path
        })
      });

      if (!confirmResponse.ok) {
        const payload = (await confirmResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        updateStatus({
          status: "error",
          message: payload?.error ?? "Unable to save metadata."
        });
        return;
      }

      updateStatus({ status: "done" });
    } catch {
      updateStatus({ status: "error", message: "Upload failed." });
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const fileArray = Array.from(files);
    const invalid = fileArray.find((file) => !ACCEPTED_TYPES.includes(file.type));
    if (invalid) {
      setUploadError("Only JPEG, PNG, WebP, or HEIC files are allowed.");
      return;
    }

    await Promise.all(fileArray.map((file) => uploadFile(file)));
    fetchBoard(selectedYear);
  }

  return (
    <div className="board">
      <div className="board-header">
        <div>
          <label className="sr-only" htmlFor="board-year">
            Valentine year
          </label>
          <select
            id="board-year"
            aria-label="Valentine year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="upload-panel">
          <label className="button">
            Upload photos
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              multiple
              onChange={(event) => handleFiles(event.target.files)}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>

      {uploadError ? <div className="error">{uploadError}</div> : null}

      {uploads.length > 0 ? (
        <div className="notice">
          {uploads.map((upload) => (
            <div key={upload.name}>
              {upload.name}: {upload.status}
              {upload.message ? ` - ${upload.message}` : ""}
            </div>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="notice">Loading board...</div>
      ) : locked ? (
        <div className="notice">
          This board is locked until February 14 (America/New_York).
        </div>
      ) : images.length === 0 ? (
        <div className="notice">No photos yet. Upload a memory!</div>
      ) : (
        <div className="board-grid">
          {images.map((image) => (
            <figure key={image.id} className="board-card">
              <Image
                src={image.url}
                alt={image.caption || "Valentine board photo"}
                width={420}
                height={420}
              />
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
