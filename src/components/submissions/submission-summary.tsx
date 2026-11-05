import { Download, Eye, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/ui/local-time";

const size = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export interface SummaryProps {
  version: number; versionCount: number; submittedAt: string; isLate: boolean; returned: boolean;
  files: { id: string; originalName: string; mimeType: string; sizeBytes: number }[];
}

export function SubmissionSummary({ s }: { s: SummaryProps }) {
  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-line px-5 py-3">
        <h2 className="text-sm font-semibold">Your submission</h2>
        <div className="flex items-center gap-2 text-xs text-ink-soft">
          <span>Version {s.version}{s.versionCount > 1 ? ` of ${s.versionCount}` : ""}</span>
          <Badge tone={s.isLate ? "yellow" : "green"}>{s.isLate ? "Late" : "On time"}</Badge>
          {s.returned && <Badge tone="yellow">Returned for correction</Badge>}
        </div>
      </div>
      <p className="px-5 pt-3 text-sm text-ink-soft">Submitted <LocalTime iso={s.submittedAt} /></p>
      <ul className="divide-y divide-surface-line">
        {s.files.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <span className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden /><span className="truncate">{f.originalName}</span><span className="shrink-0 text-xs text-ink-faint">{size(f.sizeBytes)}</span></span>
            <span className="flex shrink-0 gap-1">
              {f.mimeType === "application/pdf" && <a href={`/api/files/submissions/${f.id}?inline=1`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-ink-soft hover:bg-surface-muted"><Eye className="h-4 w-4" aria-hidden /> View</a>}
              <a href={`/api/files/submissions/${f.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-ink-soft hover:bg-surface-muted"><Download className="h-4 w-4" aria-hidden /> Download</a>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
