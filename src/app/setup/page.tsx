import { Metadata } from "next";
import SetupForm from "./SetupForm";

export const metadata: Metadata = {
  title: "Initial Setup | Asset Tracker",
};

export default function SetupPage() {
  return <SetupForm />;
}
