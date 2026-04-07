"use client";

import { APICentral } from "@/components/APICentral";
import { ToastProvider } from "@pandotic/universal-cms/components/ui";

export default function ApiCentralPage() {
  return (
    <ToastProvider>
      <APICentral />
    </ToastProvider>
  );
}
