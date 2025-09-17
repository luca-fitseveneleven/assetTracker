import React from "react";
import SuppliersTable from "../ui/suppliers/SuppliersTable";
import { getSuppliers } from "@/app/lib/data";

export const metadata = {
  title: "Asset Tracker - Suppliers",
  description: "Asset management tool",
};

export default async function Page() {
  const suppliers = await getSuppliers();

  return (
    <div>
      <SuppliersTable items={suppliers} />
    </div>
  );
}
