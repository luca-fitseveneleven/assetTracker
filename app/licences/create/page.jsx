import Link from "next/link";

export default function Page() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Create Licence</h1>
      <p className="text-default-500">
        Build out the licence creation workflow here when requirements are clear.
      </p>
      <Link
        href="/licences"
        className="inline-flex items-center rounded-md border border-default-300 px-3 py-2 text-sm font-medium text-foreground hover:bg-default-100"
      >
        Back to Licences
      </Link>
    </div>
  );
}
