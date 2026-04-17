import Link from "next/link";
import { PropertyMatrix } from "./home/property-matrix";

export default function HubHomePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Fleet Overview
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Every property across every role — switch tabs to see the same sites through a different hat.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/skills/deploy"
            className="rounded-md bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-400"
          >
            Deploy a skill
          </Link>
          <Link
            href="/fleet/onboard"
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
          >
            Add property
          </Link>
        </div>
      </div>

      <PropertyMatrix />
    </div>
  );
}
