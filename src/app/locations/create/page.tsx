import React from "react";
import LocationCreateForm from "./ui/LocationCreateForm";
import { getLocation } from "@/lib/data";

export const metadata = {
  title: "Asset Tracker - Create Location",
};

export default async function Page() {
  const locations = (await getLocation()) as {
    locationid: string;
    locationname: string | null;
  }[];
  const locationOptions = locations.map((loc) => ({
    locationid: loc.locationid,
    locationname: loc.locationname,
  }));

  return <LocationCreateForm locations={locationOptions} />;
}
