"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Input,
  Label,
  Select,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  DollarSign,
  Loader2,
} from "lucide-react";

// ---------- types ----------
type NetworkType =
  | "amazon"
  | "shareasale"
  | "cj"
  | "rakuten"
  | "impact"
  | "partnerstack"
  | "direct"
  | "custom";

interface AffiliateProgram {
  id: string;
  name: string;
  network: NetworkType;
  merchant_name: string | null;
  base_url: string | null;
  commission_text: string | null;
  is_active: boolean;
}

// ---------- constants ----------
const NETWORK_OPTIONS: { value: NetworkType | ""; label: string }[] = [
  { value: "", label: "Select network" },
  { value: "amazon", label: "Amazon" },
  { value: "shareasale", label: "ShareASale" },
  { value: "cj", label: "CJ Affiliate" },
  { value: "rakuten", label: "Rakuten" },
  { value: "impact", label: "Impact" },
  { value: "partnerstack", label: "PartnerStack" },
  { value: "direct", label: "Direct" },
  { value: "custom", label: "Custom" },
];

const NETWORK_COLORS: Record<NetworkType, string> = {
  amazon: "bg-orange-100 text-orange-800",
  shareasale: "bg-green-100 text-green-800",
  cj: "bg-blue-100 text-blue-800",
  rakuten: "bg-red-100 text-red-800",
  impact: "bg-purple-100 text-purple-800",
  partnerstack: "bg-teal-100 text-teal-800",
  direct: "bg-gray-100 text-gray-800",
  custom: "bg-indigo-100 text-indigo-800",
};

const emptyForm = {
  name: "",
  network: "" as NetworkType | "",
  merchant_name: "",
  commission_text: "",
  base_url: "",
};

// ---------- component ----------
export default function AffiliatesPage() {
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPrograms = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/affiliates");
      if (res.ok) {
        const json = await res.json();
        setPrograms(json.data);
      }
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowDialog(true);
  };

  const openEdit = (program: AffiliateProgram) => {
    setForm({
      name: program.name,
      network: program.network,
      merchant_name: program.merchant_name ?? "",
      commission_text: program.commission_text ?? "",
      base_url: program.base_url ?? "",
    });
    setEditingId(program.id);
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      network: (form.network || "custom") as NetworkType,
      merchant_name: form.merchant_name || null,
      commission_text: form.commission_text || null,
      base_url: form.base_url || null,
      is_active: true,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/affiliates/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setShowDialog(false);
          setForm(emptyForm);
          setEditingId(null);
          fetchPrograms();
        }
      } else {
        const res = await fetch("/api/admin/affiliates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setShowDialog(false);
          setForm(emptyForm);
          fetchPrograms();
        }
      }
    } catch {
      // Error handling
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/affiliates/${id}`, { method: "DELETE" });
      fetchPrograms();
    } catch {
      // Error handling
    }
  };

  const handleToggleActive = async (program: AffiliateProgram) => {
    try {
      await fetch(`/api/admin/affiliates/${program.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !program.is_active }),
      });
      fetchPrograms();
    } catch {
      // Error handling
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Affiliate Programs
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage affiliate partnerships and commission tracking
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Program
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-gray-500"
                  >
                    <DollarSign className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    No affiliate programs yet
                  </TableCell>
                </TableRow>
              ) : (
                programs.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.name}</span>
                        {p.base_url && (
                          <a
                            href={p.base_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-500"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          NETWORK_COLORS[p.network]
                        )}
                      >
                        {p.network}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {p.merchant_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {p.commission_text ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={() => handleToggleActive(p)}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Program" : "New Affiliate Program"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the affiliate program details."
                : "Add a new affiliate partnership."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="prog-name">Program Name</Label>
              <Input
                id="prog-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Vanguard ESG Funds"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Network</Label>
                <Select
                  options={NETWORK_OPTIONS}
                  value={form.network}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      network: e.target.value as NetworkType | "",
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="prog-merchant">Merchant</Label>
                <Input
                  id="prog-merchant"
                  value={form.merchant_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, merchant_name: e.target.value }))
                  }
                  placeholder="e.g. Vanguard"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="prog-commission">Commission</Label>
              <Input
                id="prog-commission"
                value={form.commission_text}
                onChange={(e) =>
                  setForm((p) => ({ ...p, commission_text: e.target.value }))
                }
                placeholder="e.g. 8% per sale, CPA $45"
              />
            </div>
            <div>
              <Label htmlFor="prog-url">Program URL</Label>
              <Input
                id="prog-url"
                value={form.base_url}
                onChange={(e) =>
                  setForm((p) => ({ ...p, base_url: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingId ? (
                "Save Changes"
              ) : (
                "Create Program"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
