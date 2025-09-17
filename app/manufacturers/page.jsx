import React from "react";
import ManufacturersTable from "../ui/manufacturers/ManufacturersTable";
import { getManufacturers } from "@/app/lib/data";

export const metadata = {
  title: "Asset Tracker - Manufacturers",
  description: "Asset management tool",
};

export default async function Page() {
  const manufacturers = await getManufacturers();
  return (
    <div>
      <ManufacturersTable items={manufacturers} />
    </div>
  );
}
