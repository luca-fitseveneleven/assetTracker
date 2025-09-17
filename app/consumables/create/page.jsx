import Link from "next/link";

export default function Page() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Create Consumable</h1>
      <p className="text-default-500">
        Replace this placeholder with the consumable onboarding form when ready.
      </p>
      <Link
        href="/consumables"
        className="inline-flex items-center rounded-md border border-default-300 px-3 py-2 text-sm font-medium text-foreground hover:bg-default-100"
      >
        Back to Consumables
      </Link>
    </div>
  );
}
