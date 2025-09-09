"use client";

import Link from "next/link";

export default function BookingWidget() {
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <input className="w-full border rounded-lg px-3 py-2" type="date" />
      <input className="w-full border rounded-lg px-3 py-2" type="date" />
      <input className="w-full border rounded-lg px-3 py-2" type="number" min={1} defaultValue={2} placeholder="Adults" />
      <input className="w-full border rounded-lg px-3 py-2" type="number" min={0} defaultValue={0} placeholder="Children" />
      <Link href="/book" className="btn">Check availability</Link>
    </div>
  );
}
