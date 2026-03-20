import React from "react";
import AssetsTableClient from "./ui/AssetsTableClient";
import {
  getLocation,
  getUsers,
  getStatus,
  getManufacturers,
  getModel,
  getCategories,
} from "@/lib/data";

export const metadata = {
  title: "Asset Tracker - Assets",
  description: "Asset management tool",
};

export default async function Page() {
  const [location, user, status, manufacturer, model, categories] =
    await Promise.all([
      getLocation(),
      getUsers(),
      getStatus(),
      getManufacturers(),
      getModel(),
      getCategories(),
    ]);

  return (
    <div>
      <AssetsTableClient
        locations={location}
        user={user}
        status={status}
        manufacturers={manufacturer}
        models={model}
        categories={categories}
      />
    </div>
  );
}
