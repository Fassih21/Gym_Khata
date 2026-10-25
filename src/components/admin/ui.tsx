import type { ReactNode } from "react";

export const inp = "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500";
export function Btn({ tone = "default", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "default" | "primary" | "danger" }) {
  const c = { default: "border-zinc-700 hover:bg-zinc-800", primary: "border-emerald-600 bg-emerald-600 text-black hover:bg-emerald-500", danger: "border-red-700 bg-red-700 hover:bg-red-600" }[tone];
  return <button {...p} className={`rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${c} ${p.className ?? ""}`} />;
}
export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block space-y-1"><span className="text-xs text-zinc-400">{label}</span>{children}</label>
);
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md space-y-4 rounded-lg border border-zinc-700 bg-zinc-950 p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">{title}</h2><button onClick={onClose} aria-label="close">✕</button></div>
        {children}
      </div>
    </div>
  );
}

export const AdminShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-svh bg-zinc-950 font-sans text-zinc-100">{children}</div>
);
