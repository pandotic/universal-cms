"use client"

import { useEffect, useState, useMemo } from "react"
import { authHeaders } from "@/lib/api-central/auth"
import { detectFromValue, handlePastedKey, type KeyDetectionResult } from "@/lib/api-central/detection"
import { encryptValue, maskValue } from "@/lib/api-central/encryption"
import { providerBadgeColors, envBadgeColors } from "@/lib/api-central/formatting"
import { apiKeys as configApiKeys, type ApiKeyEntry } from "@/fleet.config"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api"
const API = {
  services: (id?: string) =>
    id
      ? `${API_BASE}/api-central/services/${id}`
      : `${API_BASE}/api-central/services`,
  secrets: (id?: string) =>
    id
      ? `${API_BASE}/api-central/secrets/${id}`
      : `${API_BASE}/api-central/secrets`,
  properties: `${API_BASE}/properties`,
  keyAssignments: `${API_BASE}/apis/key-assignments`,
}

const ENVS = ["production", "staging", "development", "local"]

interface ApiService {
  id: string
  name: string
  category: string
  entity: string
  status: string
}

interface ApiSecret {
  id: string
  service_id: string
  name: string
  value: string
  env: string
  encrypted?: boolean
}

interface Property {
  id: string
  name: string
  slug: string
  url: string
}

interface KeyAssignment {
  id: string
  secret_id: string
  property_id: string
  environment: string
}

export default function ApisKeysPage() {
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<ApiService[]>([])
  const [secrets, setSecrets] = useState<ApiSecret[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [assignments, setAssignments] = useState<KeyAssignment[]>([])

  // Quick Capture state
  const [pasteValue, setPasteValue] = useState("")
  const [detected, setDetected] = useState<KeyDetectionResult | null>(null)
  const [serviceName, setServiceName] = useState("")
  const [keyName, setKeyName] = useState("")
  const [env, setEnv] = useState("production")
  const [encrypt, setEncrypt] = useState(true)
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
  const [pinInput, setPinInput] = useState("")
  const [showPinInput, setShowPinInput] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Filters
  const [filterProvider, setFilterProvider] = useState("all")
  const [filterEnv, setFilterEnv] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [servicesRes, secretsRes, propertiesRes, assignmentsRes] =
        await Promise.all([
          fetch(API.services(), { headers: authHeaders() }),
          fetch(API.secrets(), { headers: authHeaders() }),
          fetch(API.properties),
          fetch(API.keyAssignments, { headers: authHeaders() }).catch(() => null),
        ])

      if (servicesRes.ok) {
        const data = await servicesRes.json()
        setServices(data.services || [])
      }
      if (secretsRes.ok) {
        const data = await secretsRes.json()
        setSecrets(data.secrets || [])
      }
      if (propertiesRes.ok) {
        const data = await propertiesRes.json()
        setProperties(data.properties || data || [])
      }
      if (assignmentsRes?.ok) {
        const data = await assignmentsRes.json()
        setAssignments(data.assignments || [])
      }
    } catch (err) {
      console.error("Failed to load data:", err)
    } finally {
      setLoading(false)
    }
  }

  function handlePaste(text: string) {
    const result = handlePastedKey(text)
    setPasteValue(result.value)
    if (result.detected) {
      setDetected(result.detected)
      setServiceName(result.detected.service)
      setKeyName((prev) => prev || result.detected!.keyName)
    } else {
      setDetected(null)
    }
  }

  // Autocomplete for service name
  const matchingServices = useMemo(() => {
    if (!serviceName) return []
    const q = serviceName.toLowerCase()
    return services.filter((s) => s.name.toLowerCase().includes(q))
  }, [serviceName, services])

  async function handleSave() {
    if (!serviceName || !keyName || !pasteValue) return

    if (encrypt && !pinInput) {
      setShowPinInput(true)
      return
    }

    setSaving(true)
    try {
      // Find or create service
      let serviceId = ""
      const existing = services.find(
        (s) => s.name.toLowerCase() === serviceName.toLowerCase()
      )

      if (existing) {
        serviceId = existing.id
      } else {
        const det =
          detected || detectFromValue(pasteValue) || detectFromValue(keyName)
        const category = det?.category || "Other"
        const createRes = await fetch(API.services(), {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            name: serviceName,
            category,
            entity: "Pandotic",
            status: "active",
            monthly_budget: 0,
            current_spend: 0,
            billing_cycle: "monthly",
          }),
        })
        if (createRes.ok) {
          const data = await createRes.json()
          const created = data.service || data.services?.[0] || data
          serviceId = created.id
        }
      }

      if (!serviceId) {
        console.error("Failed to get service ID")
        return
      }

      // Encrypt value if requested
      let valueToStore = pasteValue
      if (encrypt && pinInput) {
        valueToStore = await encryptValue(pasteValue, pinInput)
      }

      // Create secret
      const secretRes = await fetch(API.secrets(), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          service_id: serviceId,
          name: keyName,
          value: valueToStore,
          env,
          encrypted: encrypt,
          last_rotated: new Date().toISOString().split("T")[0],
        }),
      })

      if (secretRes.ok) {
        const secretData = await secretRes.json()
        const createdSecret =
          secretData.secret || secretData.secrets?.[0] || secretData

        // Create property assignments
        if (selectedPropertyIds.length > 0 && createdSecret.id) {
          await Promise.all(
            selectedPropertyIds.map((propId) =>
              fetch(API.keyAssignments, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                  secret_id: createdSecret.id,
                  property_id: propId,
                  environment: env,
                }),
              }).catch(() => null)
            )
          )
        }

        // Reset form
        setPasteValue("")
        setDetected(null)
        setServiceName("")
        setKeyName("")
        setEnv("production")
        setSelectedPropertyIds([])
        setPinInput("")
        setShowPinInput(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        loadData()
      }
    } catch (err) {
      console.error("Failed to save:", err)
    } finally {
      setSaving(false)
    }
  }

  function toggleProperty(id: string) {
    setSelectedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  // Merge DB secrets with config keys for the registry table
  const serviceMap = new Map(services.map((s) => [s.id, s]))

  const dbRows = secrets.map((s) => {
    const svc = serviceMap.get(s.service_id)
    const secretAssignments = assignments.filter(
      (a) => a.secret_id === s.id
    )
    const assignedProperties = secretAssignments
      .map((a) => properties.find((p) => p.id === a.property_id)?.name)
      .filter(Boolean)

    return {
      source: "db" as const,
      provider: svc?.name?.toLowerCase() || "unknown",
      keyName: s.name,
      hint: maskValue(s.value),
      env: s.env,
      properties: assignedProperties as string[],
      isActive: svc?.status === "active",
      encrypted: s.encrypted ?? false,
      id: s.id,
    }
  })

  const configRows = configApiKeys.map((k: ApiKeyEntry) => ({
    source: "config" as const,
    provider: k.provider,
    keyName: k.keyName,
    hint: k.keyHint,
    env: k.environment,
    properties: [k.projectName],
    isActive: k.isActive,
    encrypted: false,
    id: `config-${k.provider}-${k.keyName}`,
  }))

  const allRows = [...dbRows, ...configRows]

  // Unique providers for filter
  const allProviders = [...new Set(allRows.map((r) => r.provider))].sort()

  const filteredRows = allRows.filter((r) => {
    if (filterProvider !== "all" && r.provider !== filterProvider) return false
    if (filterEnv !== "all" && r.env !== filterEnv) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading keys...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Quick Capture Card */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
            <svg
              className="h-5 w-5 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Quick Capture
            </h2>
            <p className="text-sm text-zinc-400">
              Paste an API key — auto-detects provider and assigns to fleet apps
            </p>
          </div>
          {saveSuccess && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              Saved
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Paste area */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Paste API Key or Secret
            </label>
            <textarea
              value={pasteValue}
              onChange={(e) => {
                setPasteValue(e.target.value)
                if (e.target.value.length > pasteValue.length + 5) {
                  handlePaste(e.target.value)
                }
              }}
              onPaste={(e) => {
                setTimeout(() => {
                  const el = e.target as HTMLTextAreaElement
                  handlePaste(el.value)
                }, 0)
              }}
              placeholder="sk-ant-abc123... or ANTHROPIC_API_KEY=sk-ant-abc123..."
              className="h-20 w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-3 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
            {detected && (
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Auto-detected: {detected.service} &mdash; {detected.keyName}
              </p>
            )}
          </div>

          {/* Service + Key Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Service Name
              </label>
              <input
                value={serviceName}
                onChange={(e) => {
                  setServiceName(e.target.value)
                  setDetected(null)
                }}
                placeholder="e.g., Anthropic, Stripe"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
              />
              {serviceName &&
                matchingServices.length > 0 &&
                !matchingServices.some(
                  (s) =>
                    s.name.toLowerCase() === serviceName.toLowerCase()
                ) && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-32 overflow-auto rounded-md border border-zinc-700 bg-zinc-900 shadow-lg">
                    {matchingServices.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                        onClick={() => setServiceName(s.name)}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="ml-2 text-xs text-zinc-500">
                          {s.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              {serviceName &&
                !matchingServices.some(
                  (s) =>
                    s.name.toLowerCase() === serviceName.toLowerCase()
                ) &&
                serviceName.length > 1 && (
                  <p className="mt-1 text-xs text-amber-400">
                    New service — will be created on save
                  </p>
                )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Key Name
              </label>
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g., ANTHROPIC_API_KEY"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Environment + Encrypt + Properties */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Environment
              </label>
              <select
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none"
              >
                {ENVS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3 pb-0.5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={encrypt}
                  onChange={(e) => setEncrypt(e.target.checked)}
                  className="rounded border-zinc-600"
                />
                <svg
                  className="h-4 w-4 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Encrypt with PIN
              </label>
            </div>
          </div>

          {/* PIN input (shown when needed) */}
          {showPinInput && (
            <div className="max-w-xs">
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Set PIN (4+ chars)
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN to encrypt"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
                autoFocus
              />
            </div>
          )}

          {/* Assign to Fleet Properties */}
          {properties.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Assign to Fleet Properties
              </label>
              <div className="flex flex-wrap gap-2">
                {properties.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProperty(p.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                      selectedPropertyIds.includes(p.id)
                        ? "bg-amber-500/20 text-amber-300 ring-amber-500/40"
                        : "bg-zinc-800 text-zinc-400 ring-zinc-700 hover:ring-zinc-600"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={!serviceName || !keyName || !pasteValue || saving}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save Key"}
            </button>
            {pasteValue && (
              <button
                onClick={() => {
                  setPasteValue("")
                  setDetected(null)
                  setServiceName("")
                  setKeyName("")
                  setSelectedPropertyIds([])
                  setPinInput("")
                  setShowPinInput(false)
                }}
                className="text-sm text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Key Registry Table */}
      <div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Key Registry</h2>
            <p className="text-sm text-zinc-500">
              {allRows.length} key{allRows.length !== 1 ? "s" : ""} &middot;{" "}
              {dbRows.length} stored &middot; {configRows.length} from config
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
            >
              <option value="all">All providers</option>
              {allProviders.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={filterEnv}
              onChange={(e) => setFilterEnv(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
            >
              <option value="all">All environments</option>
              {ENVS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredRows.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Key Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Hint
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Properties
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Env
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-900/50">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          providerBadgeColors[row.provider] ??
                          "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20"
                        }`}
                      >
                        {row.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                      {row.keyName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                      {row.hint}
                      {row.encrypted && (
                        <svg
                          className="ml-1 inline h-3 w-3 text-amber-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.properties.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {row.properties.map((p) => (
                            <span
                              key={p}
                              className="inline-flex rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">
                          &mdash;
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          envBadgeColors[row.env] ?? ""
                        }`}
                      >
                        {row.env}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          row.source === "db"
                            ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                            : "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20"
                        }`}
                      >
                        {row.source === "db" ? "Stored" : "Config"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs ${
                          row.isActive
                            ? "text-emerald-400"
                            : "text-zinc-500"
                        }`}
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            row.isActive
                              ? "bg-emerald-500"
                              : "bg-zinc-600"
                          }`}
                        />
                        {row.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
            <h3 className="text-lg font-medium text-zinc-300">
              No keys registered
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Paste an API key above to get started, or add keys to{" "}
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-400">
                fleet.config.ts
              </code>
              .
            </p>
          </div>
        )}

        {filterProvider !== "all" || filterEnv !== "all"
          ? filteredRows.length === 0 && (
              <p className="py-4 text-center text-sm text-zinc-500">
                No keys match the current filters.
              </p>
            )
          : null}
      </div>
    </div>
  )
}
