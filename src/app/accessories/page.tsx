import React, { Suspense } from "react";
import AccessoriesTable from "../../ui/accessories/AccessoriesTable";
import {
  getManufacturers,
  getModel,
  getStatus,
  getLocation,
  getSuppliers,
  getAccessoryCategories,
} from "@/lib/data";

export const metadata = {
  title: "Asset Tracker - Accessories",
  description: "Asset management tool",
};

export default async function Page() {
  const [manufacturers, models, statuses, locations, suppliers, categories] =
    await Promise.all([
      getManufacturers(),
      getModel(),
      getStatus(),
      getLocation(),
      getSuppliers(),
      getAccessoryCategories(),
    ]);

  return (
    <div>
      <Suspense fallback={null}>
        <AccessoriesTable
          manufacturers={manufacturers}
          models={models}
          statuses={statuses}
          categories={categories}
          locations={locations}
          suppliers={suppliers}
        />
      </Suspense>
    </div>
  );
}
