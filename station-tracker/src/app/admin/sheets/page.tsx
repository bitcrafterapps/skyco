"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminSubNav from "@/components/AdminSubNav";
import AppFooter from "@/components/AppFooter";
import OrderSearch from "@/components/OrderSearch";
import SmartLogoLink from "@/components/SmartLogoLink";
import ThemeToggle from "@/components/ThemeToggle";

interface SheetTestResult {
  title: string;
  sheetName: string;
  headers: string[];
  columnCount: number;
  rowCount: number;
}

interface SyncResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
  message: string;
}

function SheetsAdminPageContent() {
  const searchParams = useSearchParams();

  // Credentials
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsMessage, setCredsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auth
  const [hasRefreshToken, setHasRefreshToken] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Sheet config
  const [sheetInput, setSheetInput] = useState("");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [savingSheet, setSavingSheet] = useState(false);
  const [sheetConfigMessage, setSheetConfigMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Test connection
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<SheetTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Sync
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Loading
  const [loading, setLoading] = useState(true);

  // Extract Sheet ID from a full Google Sheets URL or plain ID
  const extractSheetId = (input: string): string => {
    const trimmed = input.trim();
    // Match Google Sheets URL pattern
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    // Otherwise assume it's already an ID
    return trimmed;
  };

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const settings: Record<string, string> = json.data || {};

      if (settings.google_client_id) {
        setClientId(settings.google_client_id);
      }
      if (settings.google_client_secret) {
        // It's masked, show it but don't overwrite with masked value when saving
        setClientSecret(settings.google_client_secret);
      }
      if (settings.google_refresh_token) {
        setHasRefreshToken(true);
      }
      if (settings.google_sheet_id) {
        setSheetInput(settings.google_sheet_id);
      }
      if (settings.google_sheet_name) {
        setSheetName(settings.google_sheet_name);
      }
      if (settings.google_last_sync) {
        setLastSync(settings.google_last_sync);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle OAuth callback messages from URL params
  useEffect(() => {
    const authSuccess = searchParams.get("auth_success");
    const authError = searchParams.get("auth_error");

    if (authSuccess === "true") {
      setAuthMessage({ type: "success", text: "Successfully connected to Google!" });
      setHasRefreshToken(true);
      // Clean up URL params
      window.history.replaceState({}, "", "/admin/sheets");
    } else if (authError) {
      setAuthMessage({ type: "error", text: `Authentication failed: ${authError}` });
      window.history.replaceState({}, "", "/admin/sheets");
    }
  }, [searchParams]);

  const handleSaveCredentials = async () => {
    setSavingCreds(true);
    setCredsMessage(null);
    try {
      // Save client ID
      let res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "google_client_id", value: clientId.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }

      // Only save client secret if it doesn't look masked
      if (clientSecret && !clientSecret.startsWith("****")) {
        res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "google_client_secret", value: clientSecret.trim() }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || `HTTP ${res.status}`);
        }
      }

      setCredsMessage({ type: "success", text: "Credentials saved successfully." });
    } catch (err) {
      setCredsMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save credentials" });
    } finally {
      setSavingCreds(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setAuthMessage(null);
    try {
      const res = await fetch("/api/google/auth");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      } else {
        throw new Error("No OAuth URL returned");
      }
    } catch (err) {
      setAuthMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to initiate OAuth" });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch("/api/google/auth", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to disconnect");

      setHasRefreshToken(false);
      setAuthMessage({ type: "success", text: "Disconnected from Google." });
    } catch (err) {
      setAuthMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to disconnect" });
    }
  };

  const handleSaveSheetConfig = async () => {
    setSavingSheet(true);
    setSheetConfigMessage(null);
    try {
      const sheetId = extractSheetId(sheetInput);

      let res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "google_sheet_id", value: sheetId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }

      res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "google_sheet_name", value: sheetName.trim() || "Sheet1" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }

      setSheetInput(sheetId);
      setSheetConfigMessage({ type: "success", text: "Sheet configuration saved." });
    } catch (err) {
      setSheetConfigMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save sheet config" });
    } finally {
      setSavingSheet(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setTestError(null);
    try {
      const res = await fetch("/api/google/sheets");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setTestResult(json.data);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res = await fetch("/api/google/sheets", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setSyncResult(json.data);
      setLastSync(new Date().toISOString());
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="h-8 w-8 animate-spin text-[#005B97]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Premium header with bevel and radiance */}
      <header
        className="relative px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:py-5"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,91,151,0.06)",
          borderBottom: "1px solid rgba(0,91,151,0.08)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 15% 50%, rgba(0,91,151,0.04) 0%, transparent 60%)",
          }}
        />
        <div className="relative flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full md:w-auto min-w-0 md:min-w-[290px]">
            <Link
              href="/admin"
              className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97] shrink-0"
              style={{
                background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,91,151,0.08)",
              }}
              aria-label="Back to admin"
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <SmartLogoLink alt="Skyco" imgClassName="h-7 sm:h-8 md:h-10 w-auto" />
            <div className="h-6 sm:h-7 md:h-8 w-px bg-slate-200" />
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap" style={{ letterSpacing: "-0.02em" }}>
                Google Sheets
              </h1>
              <p className="text-xs text-[#6497B0] font-medium hidden lg:block">Import orders from spreadsheet</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 w-full md:flex-1 md:min-w-0 justify-start md:justify-end overflow-x-auto overflow-y-visible hide-scrollbar pb-0.5 md:pb-0">
            <ThemeToggle />
            <OrderSearch theme="light" />
          </div>
        </div>
      </header>
      <AdminSubNav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Section 1: Google API Credentials */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Google API Credentials</h2>
            <p className="text-sm text-slate-500 mt-1">
              Configure your OAuth 2.0 credentials from the Google Cloud Console.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="123456789-abc.apps.googleusercontent.com"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Client Secret
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="GOCSPX-..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors min-h-[44px]"
              />
            </div>

            {credsMessage && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  credsMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {credsMessage.text}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveCredentials}
                disabled={savingCreds || !clientId.trim()}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out active:scale-[0.97] min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/50"
                style={{
                  background: "linear-gradient(180deg, #0069AD 0%, #005B97 50%, #004A7C 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,91,151,0.25), 0 0 12px rgba(0,91,151,0.1)",
                }}
              >
                {savingCreds ? "Saving..." : "Save Credentials"}
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-600">How to get credentials:</span> Go to the{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#005B97] underline hover:text-[#004A7C]"
                >
                  Google Cloud Console
                </a>
                {" "}&rarr; Create an OAuth 2.0 Client ID (Web application type). Add{" "}
                <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-xs">
                  {typeof window !== "undefined" ? window.location.origin : ""}/api/google/callback
                </code>{" "}
                as an authorized redirect URI. Enable the Google Sheets API in the API Library.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Authentication Status */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Authentication Status</h2>
            <p className="text-sm text-slate-500 mt-1">
              Connect your Google account to allow reading spreadsheet data.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${hasRefreshToken ? "bg-emerald-500" : "bg-slate-300"}`}
              />
              <span className="text-sm font-medium text-slate-700">
                {hasRefreshToken ? "Connected to Google" : "Not connected"}
              </span>
            </div>

            {authMessage && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  authMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {authMessage.text}
              </div>
            )}

            <div className="flex items-center gap-3">
              {!hasRefreshToken ? (
                <button
                  onClick={handleConnect}
                  disabled={connecting || !clientId.trim()}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out active:scale-[0.97] min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/50"
                  style={{
                    background: "linear-gradient(180deg, #0069AD 0%, #005B97 50%, #004A7C 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,91,151,0.25), 0 0 12px rgba(0,91,151,0.1)",
                  }}
                >
                  {connecting ? "Redirecting..." : "Connect to Google"}
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 transition-all duration-150 ease-out active:scale-[0.97] min-h-[44px] hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Sheet Configuration */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Sheet Configuration</h2>
            <p className="text-sm text-slate-500 mt-1">
              Specify which Google Sheet to import order data from.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Google Sheet URL or ID
              </label>
              <input
                type="text"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiM... or just the ID"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Sheet / Tab Name
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="Sheet1"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors min-h-[44px]"
              />
            </div>

            {sheetConfigMessage && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  sheetConfigMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {sheetConfigMessage.text}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveSheetConfig}
                disabled={savingSheet || !sheetInput.trim()}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out active:scale-[0.97] min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/50"
                style={{
                  background: "linear-gradient(180deg, #0069AD 0%, #005B97 50%, #004A7C 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,91,151,0.25), 0 0 12px rgba(0,91,151,0.1)",
                }}
              >
                {savingSheet ? "Saving..." : "Save Sheet Config"}
              </button>
              <button
                onClick={handleTestConnection}
                disabled={testing || !sheetInput.trim() || !hasRefreshToken}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-[#005B97] bg-white border border-[#005B97]/30 transition-all duration-150 ease-out active:scale-[0.97] min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#005B97]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/30"
              >
                {testing ? "Testing..." : "Test Connection"}
              </button>
            </div>

            {testError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {testError}
              </div>
            )}

            {testResult && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-4">
                <h3 className="text-sm font-semibold text-emerald-800 mb-2">Connection Successful</h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <dt className="text-emerald-600">Spreadsheet Title</dt>
                  <dd className="text-emerald-800 font-medium">{testResult.title}</dd>
                  <dt className="text-emerald-600">Sheet Name</dt>
                  <dd className="text-emerald-800 font-medium">{testResult.sheetName}</dd>
                  <dt className="text-emerald-600">Columns</dt>
                  <dd className="text-emerald-800 font-medium">{testResult.columnCount}</dd>
                  <dt className="text-emerald-600">Data Rows</dt>
                  <dd className="text-emerald-800 font-medium">{testResult.rowCount}</dd>
                </dl>
                {testResult.headers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Column Headers:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {testResult.headers.map((header, i) => (
                        <span
                          key={i}
                          className="inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        >
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Section 4: Sync */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Sync</h2>
            <p className="text-sm text-slate-500 mt-1">
              Import or update orders from the configured Google Sheet.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            {lastSync && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Last synced:{" "}
                  <span className="font-medium text-slate-700">
                    {new Date(lastSync).toLocaleString()}
                  </span>
                </span>
              </div>
            )}

            <button
              onClick={handleSync}
              disabled={syncing || !sheetInput.trim() || !hasRefreshToken}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out active:scale-[0.97] min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/50"
              style={{
                background: "linear-gradient(180deg, #0069AD 0%, #005B97 50%, #004A7C 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,91,151,0.25), 0 0 12px rgba(0,91,151,0.1)",
              }}
            >
              {syncing ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Syncing...
                </span>
              ) : (
                "Sync Now"
              )}
            </button>

            {syncError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {syncError}
              </div>
            )}

            {syncResult && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Sync Results</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{syncResult.imported}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Imported</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#005B97]">{syncResult.updated}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-400">{syncResult.skipped}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Skipped</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${syncResult.errors > 0 ? "text-red-600" : "text-slate-400"}`}>
                      {syncResult.errors}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Errors</div>
                  </div>
                </div>
                {syncResult.errorDetails.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-medium text-red-600 mb-1">Error details:</p>
                    <ul className="text-xs text-red-500 space-y-0.5">
                      {syncResult.errorDetails.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
        </div>
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  );
}

export default function SheetsAdminPage() {
  return (
    <Suspense fallback={<div className="h-dvh flex items-center justify-center">Loading...</div>}>
      <SheetsAdminPageContent />
    </Suspense>
  );
}
