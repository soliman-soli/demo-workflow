import type { ReactNode } from "react";

export default function PharmacySystemLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6 sm:py-12">{children}</div>;
}
