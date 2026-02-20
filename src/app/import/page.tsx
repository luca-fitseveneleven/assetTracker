import { Metadata } from "next";
import ImportPageClient from "./ui/ImportPageClient";

export const metadata: Metadata = {
  title: "Import | Asset Tracker",
  description: "Bulk import assets, accessories, consumables, licences, users, and locations via CSV",
};

export default function ImportPage() {
  return <ImportPageClient />;
}
