import React from "react";
import LicencesTable from "../ui/licences/LicencesTable";
import { getLicences, getLicenceCategories, getManufacturers, getSuppliers } from "@/app/lib/data";

export const metadata = {
  title: "Asset Tracker - Licences",
  description: "Asset management tool",
};

export default async function Page() {
  const [licences, categories, manufacturers, suppliers] = await Promise.all([
    getLicences(),
    getLicenceCategories(),
    getManufacturers(),
    getSuppliers(),
  ]);

  return (
    <div>
      <LicencesTable
        items={licences}
        categories={categories}
        manufacturers={manufacturers}
        suppliers={suppliers}
      />
    </div>
  );
}
