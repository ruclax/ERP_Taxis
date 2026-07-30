'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2 } from 'lucide-react';
import { subirFotoAction } from '../actions';

export default function FotoSocio({
  socioId, fotoUrl, iniciales,
}: {
  socioId: string;
  fotoUrl: string | null;
  iniciales: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    fd.set('socio_id', socioId);
    startTransition(async () => {
      const r = await subirFotoAction(fd);
      if (!r.ok) setError(r.error);
      else router.refresh();
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  return (
    <div className="relative h-14 w-14 shrink-0">
      {fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fotoUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-400">
          {iniciales}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        aria-label="Cambiar foto"
        title="Cambiar foto"
        className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-slate-50 bg-slate-700 text-white transition-colors hover:bg-slate-900 disabled:opacity-60"
      >
        {pending ? <Loader2 size={11} className="animate-spin" /> : <Camera size={11} />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />
      {error && (
        <span className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-700">
          {error}
        </span>
      )}
    </div>
  );
}
