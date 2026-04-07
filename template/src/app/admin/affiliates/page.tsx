"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
} from "@pandotic/universal-cms/components/ui";
import { Link2 } from "lucide-react";

export default function AffiliatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Affiliates</h1>
        <p className="text-foreground-secondary">
          Manage affiliate links, partners, and referral tracking.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Link2 className="h-12 w-12 text-foreground-tertiary" />
          <h3 className="mt-4 text-lg font-semibold">Coming Soon</h3>
          <p className="mt-1 text-sm text-foreground-secondary">
            Affiliate management is being built. Check back soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
