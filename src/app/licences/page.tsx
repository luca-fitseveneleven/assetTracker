import React, { Suspense } from "react";
import LicencesTable from "../../ui/licences/LicencesTable";
import {
  getLicenceCategories,
  getManufacturers,
  getSuppliers,
} from "@/lib/data";

export const metadata = {
  title: "Asset Tracker - Licences",
  description: "Asset management tool",
};

export default async function Page() {
  const [categories, manufacturers, suppliers] = await Promise.all([
    getLicenceCategories(),
    getManufacturers(),
    getSuppliers(),
  ]);

  return (
    <div>
      <Suspense fallback={null}>
        <LicencesTable
          categories={categories}
          manufacturers={manufacturers}
          suppliers={suppliers}
        />
      </Suspense>
    </div>
  );
}
