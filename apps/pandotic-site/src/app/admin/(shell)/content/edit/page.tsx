import { Suspense } from "react";
import { EditContentForm } from "./EditContentForm";

export default function EditContentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
      }
    >
      <EditContentForm />
    </Suspense>
  );
}
