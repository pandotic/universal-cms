"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Input,
  Textarea,
  Label,
  Select,
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
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Award,
  X,
} from "lucide-react";

// ---------- types ----------
type RuleType = "score_threshold" | "attribute_match" | "manual_override" | "tag_required";

interface Rule {
  id: string;
  type: RuleType;
  config: Record<string, unknown>;
}

interface Certification {
  id: string;
  name: string;
  slug: string;
  description: string;
  criteria: string;
  badge_image_url: string;
  status: "active" | "inactive";
  rules: Rule[];
  active_entities: number;
}

const RULE_TYPE_OPTIONS = [
  { value: "score_threshold", label: "Score Threshold" },
  { value: "attribute_match", label: "Attribute Match" },
  { value: "manual_override", label: "Manual Override" },
  { value: "tag_required", label: "Tag Required" },
];

const RULE_TYPE_COLORS: Record<RuleType, string> = {
  score_threshold: "bg-blue-100 text-blue-800",
  attribute_match: "bg-purple-100 text-purple-800",
  manual_override: "bg-amber-100 text-amber-800",
  tag_required: "bg-emerald-100 text-emerald-800",
};


function ruleConfigSummary(rule: Rule): string {
  switch (rule.type) {
    case "score_threshold": {
      const cfg = rule.config as { min_score?: number; pillar?: string };
      return `${cfg.pillar ?? "composite"} >= ${cfg.min_score ?? "?"}`;
    }
    case "attribute_match": {
      const cfg = rule.config as { attribute?: string; operator?: string; value?: unknown };
      return `${cfg.attribute} ${cfg.operator ?? "="} ${String(cfg.value)}`;
    }
    case "manual_override":
      return "Manual approval by admin";
    case "tag_required": {
      const cfg = rule.config as { tag?: string };
      return `tag: ${cfg.tag}`;
    }
    default:
      return JSON.stringify(rule.config);
  }
}

// ---------- component ----------
export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/certifications")
      .then((res) => res.json())
      .then((json) => { setCertifications(json.data ?? []); })
      .catch(() => { /* silently handle - empty list is fine */ })
      .finally(() => setLoading(false));
  }, []);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState<string | null>(null);

  // New certification form
  const [newCert, setNewCert] = useState({
    name: "",
    slug: "",
    description: "",
    criteria: "",
    badge_image_url: "",
  });

  // New rule form
  const [newRule, setNewRule] = useState<{ type: RuleType; configJson: string }>({
    type: "score_threshold",
    configJson: '{\n  "min_score": 80,\n  "pillar": "composite"\n}',
  });

  const handleCreateCert = () => {
    const cert: Certification = {
      id: `c${Date.now()}`,
      name: newCert.name,
      slug:
        newCert.slug ||
        newCert.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      description: newCert.description,
      criteria: newCert.criteria,
      badge_image_url: newCert.badge_image_url,
      status: "active",
      rules: [],
      active_entities: 0,
    };
    setCertifications((prev) => [...prev, cert]);
    setNewCert({ name: "", slug: "", description: "", criteria: "", badge_image_url: "" });
    setShowNewDialog(false);
  };

  const handleDeleteCert = (id: string) => {
    setCertifications((prev) => prev.filter((c) => c.id !== id));
    fetch(`/api/admin/certifications/${id}`, { method: "DELETE" }).catch(() => { /* silently handle */ });
  };

  const handleToggleStatus = (id: string) => {
    setCertifications((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "active" ? "inactive" : "active" }
          : c
      )
    );
  };

  const handleAddRule = (certId: string) => {
    try {
      const config = JSON.parse(newRule.configJson);
      const rule: Rule = { id: `r${Date.now()}`, type: newRule.type, config };
      setCertifications((prev) =>
        prev.map((c) =>
          c.id === certId ? { ...c, rules: [...c.rules, rule] } : c
        )
      );
      setShowRuleDialog(null);
      setNewRule({
        type: "score_threshold",
        configJson: '{\n  "min_score": 80,\n  "pillar": "composite"\n}',
      });
    } catch {
      alert("Invalid JSON configuration");
    }
  };

  const handleDeleteRule = (certId: string, ruleId: string) => {
    setCertifications((prev) =>
      prev.map((c) =>
        c.id === certId
          ? { ...c, rules: c.rules.filter((r) => r.id !== ruleId) }
          : c
      )
    );
  };

  const ruleTemplates: Record<RuleType, string> = {
    score_threshold: '{\n  "min_score": 80,\n  "pillar": "composite"\n}',
    attribute_match: '{\n  "attribute": "field_name",\n  "operator": ">=",\n  "value": 50\n}',
    manual_override: '{\n  "reason": "Admin approval"\n}',
    tag_required: '{\n  "tag": "tag_name"\n}',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage certification badges and their qualification rules
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Certification
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Rules</TableHead>
                <TableHead className="text-center">Active Entities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {certifications.map((cert) => {
                const isExpanded = expandedId === cert.id;
                return (
                  <TableRow key={cert.id} className="group">
                    <TableCell>
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : cert.id)
                        }
                        className="rounded p-1 text-gray-400 hover:bg-gray-100"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium">{cert.name}</p>
                          <p className="text-xs text-gray-500">
                            {cert.description.slice(0, 80)}
                            {cert.description.length > 80 && "..."}
                          </p>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-4 ml-7 space-y-4">
                          <div>
                            <p className="text-xs font-semibold uppercase text-gray-400">
                              Criteria
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              {cert.criteria}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold uppercase text-gray-400">
                                Rules ({cert.rules.length})
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowRuleDialog(cert.id)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Add Rule
                              </Button>
                            </div>
                            {cert.rules.length === 0 ? (
                              <p className="text-sm text-gray-400 italic">
                                No rules configured
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {cert.rules.map((rule) => (
                                  <div
                                    key={rule.id}
                                    className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={cn(
                                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                          RULE_TYPE_COLORS[rule.type]
                                        )}
                                      >
                                        {rule.type.replace(/_/g, " ")}
                                      </span>
                                      <span className="text-sm text-gray-600">
                                        {ruleConfigSummary(rule)}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleDeleteRule(cert.id, rule.id)
                                      }
                                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {cert.rules.length}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {cert.active_entities}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          cert.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {cert.status}
                      </span>
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
                          <DropdownMenuItem
                            onClick={() =>
                              setExpandedId(isExpanded ? null : cert.id)
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {isExpanded ? "Collapse" : "Expand"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(cert.id)}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            {cert.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => handleDeleteCert(cert.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Certification Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Certification</DialogTitle>
            <DialogDescription>
              Create a new certification badge with qualification criteria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="cert-name">Name</Label>
              <Input
                id="cert-name"
                value={newCert.name}
                onChange={(e) =>
                  setNewCert((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. ESG Leader"
              />
            </div>
            <div>
              <Label htmlFor="cert-slug">Slug</Label>
              <Input
                id="cert-slug"
                value={newCert.slug}
                onChange={(e) =>
                  setNewCert((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder="Auto-generated from name if empty"
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="cert-desc">Description</Label>
              <Textarea
                id="cert-desc"
                value={newCert.description}
                onChange={(e) =>
                  setNewCert((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="What this certification recognizes..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="cert-criteria">Criteria</Label>
              <Textarea
                id="cert-criteria"
                value={newCert.criteria}
                onChange={(e) =>
                  setNewCert((p) => ({ ...p, criteria: e.target.value }))
                }
                placeholder="Qualification requirements..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="cert-badge">Badge Image URL</Label>
              <Input
                id="cert-badge"
                value={newCert.badge_image_url}
                onChange={(e) =>
                  setNewCert((p) => ({
                    ...p,
                    badge_image_url: e.target.value,
                  }))
                }
                placeholder="https://images.example.com/badge.svg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCert} disabled={!newCert.name.trim()}>
              Create Certification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rule Dialog */}
      <Dialog
        open={showRuleDialog !== null}
        onOpenChange={() => setShowRuleDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Rule</DialogTitle>
            <DialogDescription>
              Define a qualification rule for this certification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Rule Type</Label>
              <Select
                options={RULE_TYPE_OPTIONS}
                value={newRule.type}
                onChange={(e) => {
                  const type = e.target.value as RuleType;
                  setNewRule({ type, configJson: ruleTemplates[type] });
                }}
              />
            </div>
            <div>
              <Label>Configuration (JSON)</Label>
              <Textarea
                value={newRule.configJson}
                onChange={(e) =>
                  setNewRule((p) => ({ ...p, configJson: e.target.value }))
                }
                rows={5}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRuleDialog(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => showRuleDialog && handleAddRule(showRuleDialog)}
            >
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
