"use client";
import { T } from "@/components/i18n/I18nProvider";


import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportResult {
  email: string;
  status: "created" | "updated" | "skipped";
  error?: string;
}

const EXAMPLE_CSV = `firstname,lastname,email,title,company,phone,mobile,department
Max,Mustermann,max@firma.de,Senior Developer,Firma GmbH,+49 89 1234567,+49 170 1234567,Engineering
Erika,Musterfrau,erika@firma.de,Projektmanagerin,Firma GmbH,,+49 171 9876543,Management`;

export function ImportClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState("");

  function handleFile(f: File) {
    if (!f.name.endsWith(".csv")) {
      setError("Bitte eine CSV-Datei hochladen.");
      return;
    }
    setFile(f);
    setError("");
    setResults(null);
  }

  async function upload() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/bulk-import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fehler beim Import");
      setResults(json.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  function downloadExample() {
    const blob = new Blob([EXAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "import-vorlage.csv";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  const counts = results
    ? {
        created: results.filter((r) => r.status === "created").length,
        updated: results.filter((r) => r.status === "updated").length,
        skipped: results.filter((r) => r.status === "skipped").length,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Format info */}
      <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm"><T text={"CSV-Format"} /></p>
            <p className="text-xs text-muted-foreground mt-1"><T text={"Pflichtfelder:"} /><code className="bg-muted px-1 rounded">firstname</code>{" "}<T text={"(oder"} />{" "}<code className="bg-muted px-1 rounded">vorname</code>),{" "}
              <code className="bg-muted px-1 rounded">email</code><T text={". Optionale Felder:"} />{" "}
              <code className="bg-muted px-1 rounded">lastname</code>, <code className="bg-muted px-1 rounded">title</code>,{" "}
              <code className="bg-muted px-1 rounded">company</code>, <code className="bg-muted px-1 rounded">phone</code>,{" "}
              <code className="bg-muted px-1 rounded">mobile</code>, <code className="bg-muted px-1 rounded">department</code>.
            </p>
            <p className="text-xs text-muted-foreground mt-1"><T text={"Der Import aktualisiert bestehende Mitglieder (gleiche E-Mail in der Org). Neue E-Mails werden als „nicht gefunden\" markiert — nutze dafür Einladungen."} /></p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadExample} className="shrink-0">
            <Download className="h-3.5 w-3.5" /><T text={"Vorlage"} /></Button>
        </div>
        <pre className="text-[10px] font-mono bg-muted rounded-lg p-3 overflow-x-auto text-muted-foreground leading-relaxed">
          {EXAMPLE_CSV}
        </pre>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground hover:bg-muted/20",
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-10 w-10 text-primary" />
            <p className="font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)}{" "}<T text={"KB"} /></p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-10 w-10" />
            <p className="font-medium text-sm"><T text={"CSV-Datei hierher ziehen oder klicken"} /></p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {file && !results && (
        <Button onClick={upload} disabled={loading} className="w-full" size="lg">
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" />{" "}<T text={"Wird importiert…"} /></>
            : <><Upload className="h-4 w-4" />{" "}<T text={"Import starten"} /></>}
        </Button>
      )}

      {/* Results */}
      {results && counts && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Erstellt",    value: counts.created, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { label: "Aktualisiert", value: counts.updated, color: "text-blue-700 bg-blue-50 border-blue-200" },
              { label: "Übersprungen", value: counts.skipped, color: "text-amber-700 bg-amber-50 border-amber-200" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl border p-4 text-center ${color}`}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground"><T text={"E-Mail"} /></th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground"><T text={"Status"} /></th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground"><T text={"Hinweis"} /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-xs">{r.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.status === "created"  ? "bg-emerald-100 text-emerald-700" :
                        r.status === "updated"  ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {r.status === "created" && <CheckCircle2 className="h-3 w-3" />}
                        {r.status === "created" ? "Erstellt" : r.status === "updated" ? "Aktualisiert" : "Übersprungen"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.error ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button variant="outline" className="w-full" onClick={() => { setFile(null); setResults(null); if (fileRef.current) fileRef.current.value = ""; }}><T text={"Weiteren Import starten"} /></Button>
        </div>
      )}
    </div>
  );
}
