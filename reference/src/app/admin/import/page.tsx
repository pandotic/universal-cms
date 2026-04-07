"use client";

import { useState, useRef, useCallback } from "react";
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
  Select,
  Label,
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";
import {
  Upload,
  Download,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

// ---------- types ----------
type Step = 1 | 2 | 3 | 4;

interface CsvRow {
  [key: string]: string;
}

interface ColumnMapping {
  csvColumn: string;
  dbField: string;
}

type ImportStatus = "idle" | "importing" | "success" | "error";

const ENTITY_TYPES = [
  { value: "company", label: "Companies" },
  { value: "fund", label: "Funds / ETFs" },
  { value: "certification", label: "Certifications" },
  { value: "product", label: "Products" },
  { value: "organization", label: "Organizations" },
];

const DB_FIELDS = [
  { value: "", label: "-- Skip --" },
  { value: "name", label: "Name" },
  { value: "slug", label: "Slug" },
  { value: "description", label: "Description" },
  { value: "category", label: "Category" },
  { value: "type", label: "Type" },
  { value: "layer", label: "Layer" },
  { value: "status", label: "Status" },
  { value: "website_url", label: "Website URL" },
  { value: "logo_url", label: "Logo URL" },
  { value: "esg_score", label: "ESG Score" },
  { value: "environmental_score", label: "Environmental Score" },
  { value: "social_score", label: "Social Score" },
  { value: "governance_score", label: "Governance Score" },
  { value: "tags", label: "Tags" },
  { value: "location", label: "Location" },
  { value: "founded_year", label: "Founded Year" },
  { value: "employees", label: "Employees" },
];

// Auto-detected mappings
function autoDetectMappings(columns: string[]): ColumnMapping[] {
  const guesses: Record<string, string> = {
    name: "name",
    title: "name",
    category: "category",
    type: "type",
    layer: "layer",
    status: "status",
    esg_score: "esg_score",
    esgscore: "esg_score",
    website: "website_url",
    website_url: "website_url",
    url: "website_url",
    location: "location",
    description: "description",
    slug: "slug",
    logo: "logo_url",
    logo_url: "logo_url",
    tags: "tags",
    founded: "founded_year",
    founded_year: "founded_year",
    employees: "employees",
  };
  return columns.map((col) => ({
    csvColumn: col,
    dbField: guesses[col.toLowerCase().replace(/\s+/g, "_")] || "",
  }));
}

function parseCsv(text: string): { columns: string[]; rows: CsvRow[] } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { columns: [], rows: [] };

  const columns = lines[0].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: CsvRow = {};
    columns.forEach((col, j) => {
      row[col] = values[j] ?? "";
    });
    rows.push(row);
  }

  return { columns, rows };
}

// ---------- step indicator ----------
function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { step: 1 as const, label: "Upload CSV" },
    { step: 2 as const, label: "Map Columns" },
    { step: 3 as const, label: "Preview" },
    { step: 4 as const, label: "Import" },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div key={s.step} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
              current === s.step
                ? "bg-gray-900 text-white"
                : current > s.step
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
            )}
          >
            {current > s.step ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              s.step
            )}
          </div>
          <span
            className={cn(
              "text-sm font-medium",
              current === s.step
                ? "text-gray-900"
                : current > s.step
                  ? "text-green-700"
                  : "text-gray-400"
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "mx-2 h-px w-8",
                current > s.step ? "bg-green-300" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------- component ----------
export default function ImportPage() {
  const [entityType, setEntityType] = useState("company");
  const [step, setStep] = useState<Step>(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: number;
    errorMessages: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { columns, rows } = parseCsv(text);
      setCsvColumns(columns);
      setCsvRows(rows);
      setMappings(autoDetectMappings(columns));
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
          const text = evt.target?.result as string;
          const { columns, rows } = parseCsv(text);
          setCsvColumns(columns);
          setCsvRows(rows);
          setMappings(autoDetectMappings(columns));
        };
        reader.readAsText(file);
      }
    },
    []
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const updateMapping = (csvColumn: string, dbField: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.csvColumn === csvColumn ? { ...m, dbField } : m))
    );
  };

  const startImport = async () => {
    setImportStatus("importing");
    setImportProgress(10);

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          rows: csvRows,
          mappings: activeMappings,
        }),
      });

      setImportProgress(90);

      if (res.ok) {
        const json = await res.json();
        setImportResults(json.data);
        setImportStatus("success");
      } else {
        const json = await res.json();
        setImportResults({
          success: 0,
          errors: csvRows.length,
          errorMessages: [json.error || "Import failed"],
        });
        setImportStatus("error");
      }
    } catch (err) {
      setImportResults({
        success: 0,
        errors: csvRows.length,
        errorMessages: [err instanceof Error ? err.message : "Network error"],
      });
      setImportStatus("error");
    } finally {
      setImportProgress(100);
    }
  };

  const resetImport = () => {
    setStep(1);
    setFileName(null);
    setCsvColumns([]);
    setCsvRows([]);
    setMappings([]);
    setImportStatus("idle");
    setImportProgress(0);
    setImportResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const activeMappings = mappings.filter((m) => m.dbField !== "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import</h1>
          <p className="mt-1 text-sm text-gray-500">
            Import entities from CSV files into the CMS
          </p>
        </div>
        <div className="w-48">
          <Label className="text-xs text-gray-500">Entity Type</Label>
          <Select
            options={ENTITY_TYPES}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          />
        </div>
      </div>

      {/* Step Indicator */}
      <Card>
        <CardContent className="py-4">
          <StepIndicator current={step} />
        </CardContent>
      </Card>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Upload a CSV file containing your entity data. The first row should
              contain column headers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 transition-colors cursor-pointer",
                fileName
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              {fileName ? (
                <>
                  <FileSpreadsheet className="mb-3 h-10 w-10 text-green-500" />
                  <p className="font-medium text-green-700">{fileName}</p>
                  <p className="mt-1 text-sm text-green-600">
                    {csvRows.length} rows, {csvColumns.length} columns detected
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-gray-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetImport();
                    }}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="mb-3 h-10 w-10 text-gray-400" />
                  <p className="font-medium text-gray-600">
                    Drop CSV file here or click to browse
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Supports .csv files up to 10MB
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <Button
                disabled={!fileName}
                onClick={() => setStep(2)}
              >
                Next: Map Columns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Map Columns */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>
              Match your CSV columns to database fields. Auto-detected mappings
              are pre-filled. Set a column to &quot;Skip&quot; to ignore it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CSV Column</TableHead>
                  <TableHead className="w-8 text-center">
                    <ArrowRight className="mx-auto h-4 w-4 text-gray-400" />
                  </TableHead>
                  <TableHead>Database Field</TableHead>
                  <TableHead>Sample Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((m) => (
                  <TableRow key={m.csvColumn}>
                    <TableCell className="font-mono text-sm font-medium">
                      {m.csvColumn}
                    </TableCell>
                    <TableCell className="text-center text-gray-400">
                      <ArrowRight className="mx-auto h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Select
                        options={DB_FIELDS}
                        value={m.dbField}
                        onChange={(e) =>
                          updateMapping(m.csvColumn, e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {csvRows[0]?.[m.csvColumn] ?? "--"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {activeMappings.length} of {mappings.length} columns mapped
                </span>
                <Button
                  disabled={activeMappings.length === 0}
                  onClick={() => setStep(3)}
                >
                  Next: Preview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import</CardTitle>
            <CardDescription>
              Review the first {Math.min(5, csvRows.length)} rows before
              importing. Only mapped columns are shown.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    {activeMappings.map((m) => (
                      <TableHead key={m.csvColumn}>
                        <div>
                          <p className="font-medium">{m.dbField}</p>
                          <p className="text-xs font-normal text-gray-400">
                            from: {m.csvColumn}
                          </p>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvRows.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-gray-400 tabular-nums">
                        {i + 1}
                      </TableCell>
                      {activeMappings.map((m) => (
                        <TableCell
                          key={m.csvColumn}
                          className="text-sm"
                        >
                          {row[m.csvColumn] || (
                            <span className="text-gray-300">--</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              Ready to import <strong>{csvRows.length} rows</strong> as{" "}
              <strong>
                {ENTITY_TYPES.find((t) => t.value === entityType)?.label}
              </strong>{" "}
              with {activeMappings.length} mapped fields.
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => { setStep(4); startImport(); }}>
                Start Import
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Import */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {importStatus === "importing"
                ? "Importing..."
                : importStatus === "success"
                  ? "Import Complete"
                  : "Import Failed"}
            </CardTitle>
            <CardDescription>
              {importStatus === "importing"
                ? "Please wait while your data is being imported."
                : importStatus === "success"
                  ? "Your data has been processed."
                  : "An error occurred during import."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress bar */}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium tabular-nums">
                  {importProgress}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    importStatus === "error"
                      ? "bg-red-500"
                      : importStatus === "success"
                        ? "bg-green-500"
                        : "bg-blue-500"
                  )}
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>

            {importStatus === "importing" && (
              <div className="flex items-center justify-center gap-2 py-4 text-blue-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">
                  Processing rows...
                </span>
              </div>
            )}

            {importResults && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Successful</p>
                      <p className="text-2xl font-bold text-green-700">
                        {importResults.success}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="text-sm text-red-600">Errors</p>
                      <p className="text-2xl font-bold text-red-700">
                        {importResults.errors}
                      </p>
                    </div>
                  </div>
                </div>

                {importResults.errorMessages.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="mb-2 text-sm font-medium text-red-700">
                      Error Details:
                    </p>
                    <ul className="space-y-1">
                      {importResults.errorMessages.map((msg, i) => (
                        <li
                          key={i}
                          className="text-sm text-red-600 font-mono"
                        >
                          {msg}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={resetImport}>
                    Import Another File
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
