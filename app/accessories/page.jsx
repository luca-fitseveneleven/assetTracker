import React from "react";
import AccessoriesTable from "../ui/accessories/AccessoriesTable";
import {
  getAccessories,
  getManufacturers,
  getModel,
  getStatus,
  getLocation,
  getSuppliers,
  getAccessoryCategories,
} from "@/app/lib/data";

export const metadata = {
  title: "Asset Tracker - Accessories",
  description: "Asset management tool",
};

export default async function Page() {
  const [
    accessories,
    manufacturers,
    models,
    statuses,
    locations,
    suppliers,
    categories,
  ] = await Promise.all([
    getAccessories(),
    getManufacturers(),
    getModel(),
    getStatus(),
    getLocation(),
    getSuppliers(),
    getAccessoryCategories(),
  ]);

  return (
    <div>
      <AccessoriesTable
        items={accessories}
        manufacturers={manufacturers}
        models={models}
        statuses={statuses}
        categories={categories}
        locations={locations}
        suppliers={suppliers}
      />
    </div>
  );
}
