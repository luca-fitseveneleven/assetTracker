import Link from "next/link";

export default function Page() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Create Manufacturer</h1>
      <p className="text-default-500">
        Wire up the manufacturer creation form here to capture new vendors.
      </p>
      <Link
        href="/manufacturers"
        className="inline-flex items-center rounded-md border border-default-300 px-3 py-2 text-sm font-medium text-foreground hover:bg-default-100"
      >
        Back to Manufacturers
      </Link>
    </div>
  );
}
