"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";

interface LabelTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  includeQR: boolean;
  includeLogo: boolean;
  fields: string;
  isDefault: boolean;
}

interface AssetData {
  assetid: string;
  assetname: string;
  assettag: string;
  serialnumber: string;
  manufacturerid?: string;
  modelid?: string;
  locationid?: string;
  assetcategorytypeid?: string;
  purchasedate?: string;
}

interface PrintLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: AssetData[];
  manufacturers?: Array<{ manufacturerid: string; manufacturername: string }>;
  models?: Array<{ modelid: string; modelname: string }>;
  locations?: Array<{ locationid: string; locationname: string }>;
  categories?: Array<{ assetcategorytypeid: string; assetcategorytypename: string }>;
}

const FIELD_LABELS: Record<string, string> = {
  assetName: "Asset Name",
  assetTag: "Asset Tag",
  serialNumber: "Serial Number",
  manufacturer: "Manufacturer",
  model: "Model",
  location: "Location",
  category: "Category",
  purchaseDate: "Purchase Date",
};

export default function PrintLabelDialog({
  open,
  onOpenChange,
  assets,
  manufacturers = [],
  models = [],
  locations = [],
  categories = [],
}: PrintLabelDialogProps) {
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/labels");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        const defaultTemplate = data.find((t: LabelTemplate) => t.isDefault);
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id);
        } else if (data.length > 0) {
          setSelectedTemplateId(data[0].id);
        }
      }
    } catch {
      // Labels are optional
    }
  }, []);

  useEffect(() => {
    if (open) fetchTemplates();
  }, [open, fetchTemplates]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const getFieldValue = (asset: AssetData, field: string): string => {
    switch (field) {
      case "assetName":
        return asset.assetname || "";
      case "assetTag":
        return asset.assettag || "";
      case "serialNumber":
        return asset.serialnumber || "";
      case "manufacturer":
        return manufacturers.find((m) => m.manufacturerid === asset.manufacturerid)?.manufacturername || "";
      case "model":
        return models.find((m) => m.modelid === asset.modelid)?.modelname || "";
      case "location":
        return locations.find((l) => l.locationid === asset.locationid)?.locationname || "";
      case "category":
        return categories.find((c) => c.assetcategorytypeid === asset.assetcategorytypeid)?.assetcategorytypename || "";
      case "purchaseDate":
        return asset.purchasedate ? new Date(asset.purchasedate).toLocaleDateString() : "";
      default:
        return "";
    }
  };

  const getTemplateFields = (template: LabelTemplate): string[] => {
    try {
      const parsed = JSON.parse(template.fields);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const handlePrint = () => {
    if (!printRef.current || !selectedTemplate) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const widthIn = Number(selectedTemplate.width);
    const heightIn = Number(selectedTemplate.height);

    const doc = printWindow.document;
    doc.open();

    // Build document using DOM methods
    const style = doc.createElement("style");
    style.textContent = [
      `@page { size: ${widthIn}in ${heightIn}in; margin: 0; }`,
      "body { margin: 0; padding: 0; font-family: Arial, sans-serif; }",
      `.label { width: ${widthIn}in; height: ${heightIn}in; padding: 0.15in; box-sizing: border-box; page-break-after: always; display: flex; gap: 0.1in; }`,
      ".label:last-child { page-break-after: auto; }",
      ".label-content { flex: 1; overflow: hidden; }",
      ".label-qr { flex-shrink: 0; display: flex; align-items: center; }",
      ".field { font-size: 8pt; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }",
      ".field-label { font-weight: bold; color: #333; }",
      ".field-value { color: #000; }",
    ].join("\n");
    doc.head.appendChild(style);
    doc.title = "Print Labels";

    // Clone the preview content into the print window
    const clonedContent = printRef.current.cloneNode(true);
    doc.body.appendChild(clonedContent);

    doc.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Labels</DialogTitle>
          <DialogDescription>
            {assets.length} asset{assets.length !== 1 ? "s" : ""} selected for label printing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {templates.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No label templates configured.</p>
              <p className="text-sm mt-1">Create templates in Admin Settings &gt; Labels.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Template</label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({Number(t.width)}&quot; x {Number(t.height)}&quot;)
                        {t.isDefault ? " (Default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-sm font-medium mb-3">Preview</p>
                  <div ref={printRef} className="space-y-3">
                    {assets.map((asset) => {
                      const fields = getTemplateFields(selectedTemplate);
                      const qrSize = Math.min(Number(selectedTemplate.height) * 72, 80);
                      return (
                        <div
                          key={asset.assetid}
                          className="label bg-white border rounded p-3 flex gap-3"
                          style={{
                            maxWidth: `${Number(selectedTemplate.width) * 96}px`,
                          }}
                        >
                          <div className="label-content flex-1 min-w-0">
                            {fields.map((field) => {
                              const value = getFieldValue(asset, field);
                              if (!value) return null;
                              return (
                                <div key={field} className="field text-xs truncate">
                                  <span className="field-label text-muted-foreground">
                                    {FIELD_LABELS[field] || field}:{" "}
                                  </span>
                                  <span className="field-value font-medium">{value}</span>
                                </div>
                              );
                            })}
                          </div>
                          {selectedTemplate.includeQR && (
                            <div className="label-qr flex-shrink-0">
                              <QRCodeSVG
                                value={`${typeof window !== "undefined" ? window.location.origin : ""}/assets/${asset.assetid}`}
                                size={qrSize}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint} disabled={!selectedTemplate || assets.length === 0}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
