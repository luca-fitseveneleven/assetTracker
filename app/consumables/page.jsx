import React from "react";
import ConsumablesTable from "../ui/consumables/ConsumablesTable";
import { getConsumables, getConsumableCategories, getManufacturers, getSuppliers } from "@/app/lib/data";

export const metadata = {
  title: "Asset Tracker - Consumables",
  description: "Asset management tool",
};

export default async function Page() {
  const [items, categories, manufacturers, suppliers] = await Promise.all([
    getConsumables(),
    getConsumableCategories(),
    getManufacturers(),
    getSuppliers(),
  ]);

  return (
    <div>
      <ConsumablesTable
        items={items}
        categories={categories}
        manufacturers={manufacturers}
        suppliers={suppliers}
      />
    </div>
  );
}
