"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  KeyRound,
  Copy,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CreatedKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt: string | null;
  createdAt: string;
  key: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVAILABLE_SCOPES = [
  { value: "assets:read", label: "Assets (Read)" },
  { value: "assets:write", label: "Assets (Write)" },
  { value: "accessories:read", label: "Accessories (Read)" },
  { value: "accessories:write", label: "Accessories (Write)" },
  { value: "consumables:read", label: "Consumables (Read)" },
  { value: "consumables:write", label: "Consumables (Write)" },
  { value: "licences:read", label: "Licences (Read)" },
  { value: "licences:write", label: "Licences (Write)" },
  { value: "components:read", label: "Components (Read)" },
  { value: "components:write", label: "Components (Write)" },
  { value: "users:read", label: "Users (Read)" },
  { value: "maintenance:read", label: "Maintenance (Read)" },
  { value: "maintenance:write", label: "Maintenance (Write)" },
  { value: "reports:read", label: "Reports (Read)" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApiKeysTab() {
  // ---- Data state ----------------------------------------------------------
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ---- Create dialog state ------------------------------------------------
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formScopes, setFormScopes] = useState<string[]>([]);

  // ---- Created key reveal dialog ------------------------------------------
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedKeyResponse | null>(null);

  // ---- Delete confirmation ------------------------------------------------
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingKey, setDeletingKey] = useState<ApiKeyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---- Fetch keys ---------------------------------------------------------

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/api-keys");
      if (!res.ok) throw new Error("Failed to fetch API keys");
      const data = await res.json();
      setKeys(data.keys ?? []);
    } catch {
      toast.error("Failed to load API keys");
    }
  }, []);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await fetchKeys();
      setIsLoading(false);
    }
    init();
  }, [fetchKeys]);

  // ---- Dialog helpers ------------------------------------------------------

  function openCreateDialog() {
    setFormName("");
    setFormExpiresAt("");
    setFormScopes([]);
    setCreateDialogOpen(true);
  }

  function openDeleteDialog(key: ApiKeyItem) {
    setDeletingKey(key);
    setDeleteDialogOpen(true);
  }

  function toggleScope(scope: string) {
    setFormScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  function handleCopyKey() {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey.key);
    toast.success("API key copied to clipboard");
  }

  // ---- Create key ---------------------------------------------------------

  async function handleCreate() {
    if (!formName.trim()) {
      toast.error("API key name is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formName.trim(),
        scopes: formScopes,
      };

      if (formExpiresAt) {
        payload.expiresAt = formExpiresAt;
      }

      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        const message =
          typeof err.error === "string"
            ? err.error
            : "Failed to create API key";
        toast.error(message);
        return;
      }

      const data: CreatedKeyResponse = await res.json();
      setCreatedKey(data);
      setCreateDialogOpen(false);
      setRevealDialogOpen(true);
      await fetchKeys();
      toast.success("API key created successfully");
    } catch {
      toast.error("Failed to create API key");
    } finally {
      setIsSaving(false);
    }
  }

  // ---- Delete key ---------------------------------------------------------

  async function handleDelete() {
    if (!deletingKey) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/api-keys/${deletingKey.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        const message =
          typeof err.error === "string"
            ? err.error
            : "Failed to revoke API key";
        toast.error(message);
        return;
      }

      toast.success("API key revoked successfully");
      setDeleteDialogOpen(false);
      setDeletingKey(null);
      await fetchKeys();
    } catch {
      toast.error("Failed to revoke API key");
    } finally {
      setIsDeleting(false);
    }
  }

  // ---- Render -------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        <span className="text-muted-foreground ml-2 text-sm">
          Loading API keys...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="h-5 w-5" />
            API Keys
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage API keys for programmatic access
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      <Separator />

      {/* Keys table */}
      {keys.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center text-sm">
          No API keys found. Create your first API key to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="px-4 py-3">Name</TableHead>
                <TableHead className="px-4 py-3">Key Preview</TableHead>
                <TableHead className="hidden px-4 py-3 text-center md:table-cell">
                  Scopes
                </TableHead>
                <TableHead className="hidden px-4 py-3 sm:table-cell">
                  Created
                </TableHead>
                <TableHead className="hidden px-4 py-3 md:table-cell">
                  Expires
                </TableHead>
                <TableHead className="px-4 py-3 text-center">Status</TableHead>
                <TableHead className="px-4 py-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((apiKey) => {
                const isExpired =
                  apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();
                return (
                  <TableRow
                    key={apiKey.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="px-4 py-3 font-medium">
                      {apiKey.name}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="font-mono text-xs">
                        {apiKey.keyPrefix}...
                      </span>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-center md:table-cell">
                      <Badge variant="secondary" className="text-xs">
                        {apiKey.scopes.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden px-4 py-3 sm:table-cell">
                      {new Date(apiKey.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden px-4 py-3 md:table-cell">
                      {apiKey.expiresAt
                        ? new Date(apiKey.expiresAt).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      {!apiKey.isActive ? (
                        <Badge variant="destructive" className="text-xs">
                          Revoked
                        </Badge>
                      ) : isExpired ? (
                        <Badge variant="secondary" className="text-xs">
                          Expired
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-xs text-green-700"
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      {apiKey.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(apiKey)}
                          title="Revoke API key"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for programmatic access. The full key will
              only be shown once after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="apikey-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="apikey-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. CI/CD Pipeline"
                maxLength={100}
              />
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="apikey-expires">Expiration Date</Label>
              <Input
                id="apikey-expires"
                type="date"
                value={formExpiresAt}
                onChange={(e) => setFormExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-muted-foreground text-xs">
                Leave empty for a key that never expires
              </p>
            </div>

            <Separator />

            {/* Scopes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Scopes</Label>
                <span className="text-muted-foreground text-xs">
                  {formScopes.length} of {AVAILABLE_SCOPES.length} selected
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {AVAILABLE_SCOPES.map((scope) => (
                  <div key={scope.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`scope-${scope.value}`}
                      checked={formScopes.includes(scope.value)}
                      onCheckedChange={() => toggleScope(scope.value)}
                    />
                    <Label
                      htmlFor={`scope-${scope.value}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {scope.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSaving || !formName.trim()}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal Key Dialog */}
      <Dialog
        open={revealDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedKey(null);
          }
          setRevealDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Copy this key now. It will not be shown again.
            </DialogDescription>
          </DialogHeader>

          {createdKey && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex items-center gap-2">
                  <code className="bg-muted flex-1 rounded-md border px-3 py-2 font-mono text-xs break-all">
                    {createdKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyKey}
                    title="Copy API key"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Store this API key in a secure location. You will not be able to
                retrieve it after closing this dialog.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                setRevealDialogOpen(false);
                setCreatedKey(null);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the API key{" "}
              <strong>{deletingKey?.name}</strong>? This action cannot be
              undone. Any integrations using this key will stop working.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingKey(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
