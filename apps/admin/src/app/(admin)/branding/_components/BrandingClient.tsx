'use client';

import { useState, useTransition } from 'react';
import { Save } from 'lucide-react';
import { guardarBranding } from '../actions';

interface Branding {
  nombre_sistema: string;
  nombre_org: string;
  logo_url: string | null;
  color_primario: string | null;
  color_acento: string | null;
  tipografia: string | null;
}

export default function BrandingClient({ initial }: { initial: Branding }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);

  function submit() {
    startTransition(async () => {
      const r = await guardarBranding({
        nombre_sistema: form.nombre_sistema,
        nombre_org: form.nombre_org,
        logo_url: form.logo_url,
        color_primario: form.color_primario ?? undefined,
        color_acento: form.color_acento ?? undefined,
        tipografia: form.tipografia ?? undefined,
      });
      setMsg(r.ok ? 'Guardado' : `Error: ${r.error}`);
      setTimeout(() => setMsg(null), 3000);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Branding</h1>
        <p className="mt-1 text-sm text-(--dev-muted)">
          Personaliza el aspecto de la ERP. Útil si se revende a otro sindicato.
        </p>
      </div>

      {msg && <div className="rounded-lg border border-(--dev-border) bg-(--dev-panel) px-3 py-2 text-sm text-white">{msg}</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-(--dev-border) bg-(--dev-panel) p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Identidad</h2>
          <div className="flex flex-col gap-3">
            <Field label="Nombre del sistema" value={form.nombre_sistema} onChange={(v) => setForm({ ...form, nombre_sistema: v })} />
            <Field label="Nombre de la organización" value={form.nombre_org} onChange={(v) => setForm({ ...form, nombre_org: v })} />
            <Field label="URL del logo" value={form.logo_url ?? ''} onChange={(v) => setForm({ ...form, logo_url: v || null })} />
            <Field label="Tipografía" value={form.tipografia ?? 'Inter'} onChange={(v) => setForm({ ...form, tipografia: v })} />
          </div>
        </div>

        <div className="rounded-lg border border-(--dev-border) bg-(--dev-panel) p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Colores</h2>
          <div className="flex flex-col gap-3">
            <ColorField label="Primario (críticos / acentos)" value={form.color_primario ?? '#420808'} onChange={(v) => setForm({ ...form, color_primario: v })} />
            <ColorField label="Secundario (botones primarios)" value={form.color_acento ?? '#1e293b'} onChange={(v) => setForm({ ...form, color_acento: v })} />
          </div>

          <div className="mt-5 rounded-lg border border-(--dev-border) bg-(--dev-bg) p-3">
            <div className="text-[10px] uppercase tracking-wider text-(--dev-muted) mb-2">Vista previa</div>
            <div className="flex flex-col gap-2">
              <div className="rounded-lg p-3 text-white text-sm font-semibold" style={{ background: form.color_acento ?? '#1e293b' }}>
                {form.nombre_sistema || 'Taxi ERP'}
              </div>
              <div className="rounded-lg p-2 text-white text-xs" style={{ background: form.color_primario ?? '#420808' }}>
                Alerta crítica de ejemplo
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-(--dev-accent) px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          <Save size={14} /> Guardar cambios
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-(--dev-muted)">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-(--dev-border) bg-(--dev-bg) px-3 py-2 text-sm text-white focus:border-(--dev-accent) focus:outline-none"
      />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-(--dev-muted)">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-(--dev-border) bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-(--dev-border) bg-(--dev-bg) px-3 py-2 text-sm mono text-white focus:border-(--dev-accent) focus:outline-none"
        />
      </div>
    </label>
  );
}
