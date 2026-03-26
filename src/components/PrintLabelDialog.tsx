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
import { renderLabelTemplate } from "@/lib/label-renderer";

interface LabelTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  layout: string;
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
  purchaseprice?: string;
  status?: string;
  assignedto?: string;
}

interface PrintLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: AssetData[];
  manufacturers?: Array<{ manufacturerid: string; manufacturername: string }>;
  models?: Array<{ modelid: string; modelname: string }>;
  locations?: Array<{ locationid: string; locationname: string }>;
  categories?: Array<{
    assetcategorytypeid: string;
    assetcategorytypename: string;
  }>;
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

/** Check whether a template layout string uses {{placeholder}} syntax */
function isTemplateString(layout: string | undefined): boolean {
  return typeof layout === "string" && layout.includes("{{");
}

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
        return (
          manufacturers.find((m) => m.manufacturerid === asset.manufacturerid)
            ?.manufacturername || ""
        );
      case "model":
        return models.find((m) => m.modelid === asset.modelid)?.modelname || "";
      case "location":
        return (
          locations.find((l) => l.locationid === asset.locationid)
            ?.locationname || ""
        );
      case "category":
        return (
          categories.find(
            (c) => c.assetcategorytypeid === asset.assetcategorytypeid,
          )?.assetcategorytypename || ""
        );
      case "purchaseDate":
        return asset.purchasedate
          ? new Date(asset.purchasedate).toLocaleDateString()
          : "";
      case "purchasePrice":
        return asset.purchaseprice || "";
      case "status":
        return asset.status || "";
      case "assignedTo":
        return asset.assignedto || "";
      default:
        return "";
    }
  };

  /** Build the full data record for an asset, used by the template renderer */
  const buildAssetData = (asset: AssetData): Record<string, string> => {
    const qrCodeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/assets/${asset.assetid}`;
    return {
      assetName: getFieldValue(asset, "assetName"),
      assetTag: getFieldValue(asset, "assetTag"),
      serialNumber: getFieldValue(asset, "serialNumber"),
      manufacturer: getFieldValue(asset, "manufacturer"),
      model: getFieldValue(asset, "model"),
      location: getFieldValue(asset, "location"),
      category: getFieldValue(asset, "category"),
      purchaseDate: getFieldValue(asset, "purchaseDate"),
      purchasePrice: getFieldValue(asset, "purchasePrice"),
      status: getFieldValue(asset, "status"),
      assignedTo: getFieldValue(asset, "assignedTo"),
      qrCodeUrl,
    };
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
      ".template-rendered { font-size: 8pt; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }",
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

  /** Render a single label using the programmable template layout */
  const renderTemplateLabel = (asset: AssetData, template: LabelTemplate) => {
    const data = buildAssetData(asset);
    const qrSize = Math.min(Number(template.height) * 72, 80);
    const qrCodeUrl = data.qrCodeUrl;

    // Check if the template references {{qrCode}} — we render it as a React component
    const layoutStr = template.layout;
    const hasQrPlaceholder = layoutStr.includes("{{qrCode}}");

    // Split around {{qrCode}} so we can inject the SVG component
    if (hasQrPlaceholder) {
      const parts = layoutStr.split("{{qrCode}}");
      const renderedParts = parts.map((part) =>
        renderLabelTemplate(part, data),
      );

      return (
        <div
          key={asset.assetid}
          className="label flex gap-3 rounded border bg-white p-3"
          style={{ maxWidth: `${Number(template.width) * 96}px` }}
        >
          <div className="label-content template-rendered min-w-0 flex-1 text-xs break-words whitespace-pre-wrap">
            {renderedParts.map((part, i) => (
              <React.Fragment key={i}>
                {part}
                {i < renderedParts.length - 1 && (
                  <span className="inline-block align-middle">
                    <QRCodeSVG value={qrCodeUrl} size={qrSize} />
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    }

    // No {{qrCode}} placeholder — render text + optional QR on the side
    const rendered = renderLabelTemplate(layoutStr, data);
    return (
      <div
        key={asset.assetid}
        className="label flex gap-3 rounded border bg-white p-3"
        style={{ maxWidth: `${Number(template.width) * 96}px` }}
      >
        <div className="label-content template-rendered min-w-0 flex-1 text-xs break-words whitespace-pre-wrap">
          {rendered}
        </div>
        {template.includeQR && (
          <div className="label-qr flex-shrink-0">
            <QRCodeSVG value={qrCodeUrl} size={qrSize} />
          </div>
        )}
      </div>
    );
  };

  /** Render a single label using the legacy fields array approach */
  const renderFieldsLabel = (asset: AssetData, template: LabelTemplate) => {
    const fields = getTemplateFields(template);
    const qrSize = Math.min(Number(template.height) * 72, 80);
    return (
      <div
        key={asset.assetid}
        className="label flex gap-3 rounded border bg-white p-3"
        style={{ maxWidth: `${Number(template.width) * 96}px` }}
      >
        <div className="label-content min-w-0 flex-1">
          {fields.map((field) => {
            const value = getFieldValue(asset, field);
            if (!value) return null;
            return (
              <div key={field} className="field truncate text-xs">
                <span className="field-label text-muted-foreground">
                  {FIELD_LABELS[field] || field}:{" "}
                </span>
                <span className="field-value font-medium">{value}</span>
              </div>
            );
          })}
        </div>
        {template.includeQR && (
          <div className="label-qr flex-shrink-0">
            <QRCodeSVG
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/assets/${asset.assetid}`}
              size={qrSize}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Print Labels</DialogTitle>
          <DialogDescription>
            {assets.length} asset{assets.length !== 1 ? "s" : ""} selected for
            label printing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {templates.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center">
              <p>No label templates configured.</p>
              <p className="mt-1 text-sm">
                Create templates in Admin Settings &gt; Labels.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Template
                </label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({Number(t.width)}&quot; x {Number(t.height)}
                        &quot;)
                        {t.isDefault ? " (Default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="bg-muted/30 rounded-lg border p-4">
                  <p className="mb-3 text-sm font-medium">Preview</p>
                  <div ref={printRef} className="space-y-3">
                    {assets.map((asset) => {
                      if (isTemplateString(selectedTemplate.layout)) {
                        return renderTemplateLabel(asset, selectedTemplate);
                      }
                      return renderFieldsLabel(asset, selectedTemplate);
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
          <Button
            onClick={handlePrint}
            disabled={!selectedTemplate || assets.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
