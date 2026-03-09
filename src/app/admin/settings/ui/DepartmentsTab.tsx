"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";

interface Department {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  parentId: string | null;
  _count?: { users?: number; children?: number };
}

interface Organization {
  id: string;
  name: string;
}

export default function DepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    organizationId: "",
    parentId: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [deptRes, orgRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/organizations"),
      ]);
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (orgRes.ok) setOrganizations(await orgRes.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", organizationId: organizations[0]?.id || "", parentId: "none" });
    setDialogOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({
      name: dept.name,
      description: dept.description || "",
      organizationId: dept.organizationId,
      parentId: dept.parentId || "none",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.organizationId) {
      toast.error("Organization is required");
      return;
    }

    setSubmitting(true);
    try {
      const url = editing
        ? `/api/departments/${editing.id}`
        : "/api/departments";
      const method = editing ? "PUT" : "POST";
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        organizationId: form.organizationId,
      };
      if (form.parentId && form.parentId !== "none") body.parentId = form.parentId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to save");
      }

      toast.success(editing ? "Department updated" : "Department created");
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to save", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Delete department "${dept.name}"?`)) return;
    try {
      const res = await fetch(`/api/departments/${dept.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to delete");
      }
      toast.success("Department deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete", { description: (err as Error).message });
    }
  };

  const orgById = new Map(organizations.map((o) => [o.id, o.name]));
  const deptById = new Map(departments.map((d) => [d.id, d.name]));

  // Departments available as parents (same org, not self)
  const parentOptions = departments.filter(
    (d) => d.organizationId === form.organizationId && d.id !== editing?.id
  );

  if (loading) {
    return <p className="text-sm text-foreground-500">Loading departments...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Departments</h2>
          <p className="text-sm text-foreground-500">Manage organizational departments</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <p className="text-sm text-foreground-500">No departments configured.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-foreground-500">
              <tr>
                <th className="py-2 pr-4 font-normal">Name</th>
                <th className="py-2 pr-4 font-normal">Organization</th>
                <th className="py-2 pr-4 font-normal">Parent</th>
                <th className="py-2 pr-4 font-normal">Users</th>
                <th className="py-2 pr-4 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id} className="border-t border-default-200">
                  <td className="py-2 pr-4 font-medium">
                    <div className="flex items-center gap-2">
                      <FolderTree className="h-4 w-4 text-foreground-400" />
                      {dept.name}
                    </div>
                  </td>
                  <td className="py-2 pr-4">{orgById.get(dept.organizationId) || "-"}</td>
                  <td className="py-2 pr-4">{dept.parentId ? deptById.get(dept.parentId) || "-" : "-"}</td>
                  <td className="py-2 pr-4">{dept._count?.users ?? 0}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(dept)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(dept)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Department" : "Create Department"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update department details." : "Add a new department to an organization."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <Label htmlFor="dept-name">Name</Label>
              <Input
                id="dept-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Engineering"
              />
            </div>
            <div>
              <Label htmlFor="dept-desc">Description</Label>
              <Input
                id="dept-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label htmlFor="dept-org">Organization</Label>
              <Select
                value={form.organizationId}
                onValueChange={(v) => setForm((f) => ({ ...f, organizationId: v, parentId: "none" }))}
              >
                <SelectTrigger id="dept-org">
                  <SelectValue placeholder="Select organization..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {parentOptions.length > 0 && (
              <div>
                <Label htmlFor="dept-parent">Parent Department (optional)</Label>
                <Select
                  value={form.parentId}
                  onValueChange={(v) => setForm((f) => ({ ...f, parentId: v }))}
                >
                  <SelectTrigger id="dept-parent">
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {parentOptions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
