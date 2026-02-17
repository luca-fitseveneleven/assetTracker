"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Trash2, Upload, Star, Image } from "lucide-react";
import { toast } from "sonner";

interface Attachment {
  id: string;
  assetId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  isPrimary: boolean;
  createdAt: string;
  user?: { userid: string; firstname: string; lastname: string } | null;
}

interface AssetAttachmentsProps {
  assetId: string;
  readOnly?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssetAttachments({ assetId, readOnly = false }: AssetAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/asset/attachments?assetId=${assetId}`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch {
      // Attachments are optional
    }
  }, [assetId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetId", assetId);

      const res = await fetch("/api/asset/attachments", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Upload failed");
      }

      toast.success("File uploaded", { description: file.name });
      fetchAttachments();
    } catch (err) {
      toast.error("Upload failed", { description: (err as Error).message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/asset/attachments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Attachment deleted");
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Failed to delete attachment");
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      const res = await fetch(`/api/asset/attachments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      if (!res.ok) throw new Error("Failed to set primary");
      fetchAttachments();
    } catch {
      toast.error("Failed to set as primary");
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith("image/");

  return (
    <section className="rounded-lg border border-default-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground-600">
          Attachments {attachments.length > 0 && `(${attachments.length})`}
        </h2>
        {!readOnly && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-foreground-500">No attachments.</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between text-sm gap-2 p-2 rounded hover:bg-muted/50">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isImage(att.mimeType) ? (
                  <Image className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <Paperclip className="h-4 w-4 text-foreground-400 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <a
                    href={att.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium truncate block hover:underline text-primary"
                  >
                    {att.originalName}
                  </a>
                  <span className="text-xs text-foreground-500">
                    {formatFileSize(att.size)}
                    {att.user && ` • ${att.user.firstname} ${att.user.lastname}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {att.isPrimary && (
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                )}
                {!readOnly && (
                  <>
                    {isImage(att.mimeType) && !att.isPrimary && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSetPrimary(att.id)} title="Set as primary photo">
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(att.id, att.originalName)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
