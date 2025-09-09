'use client'

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't show the main website header on admin pages
  const isAdminPage = pathname.startsWith('/admin');
  
  if (isAdminPage) {
    return null;
  }
  
  return <Header />;
}