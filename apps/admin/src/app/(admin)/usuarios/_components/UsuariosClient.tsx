'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, KeyRound, UserCog, Mail, Search } from 'lucide-react';
import { crearUsuario, eliminarUsuario, resetPassword, toggleActivo, asignarRol, quitarRol } from '../actions';

interface Usuario {
  id: string;
  email: string;
  nombre_display: string;
  activo: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
}

interface Props {
  initialUsers: Usuario[];
  catalogoRoles: Array<{ codigo: string; nombre: string; orden_jerarquia: number }>;
}

export default function UsuariosClient({ initialUsers, catalogoRoles }: Props) {
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingRolesFor, setEditingRolesFor] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const usuarios = initialUsers.filter((u) =>
    u.email.toLowerCase().includes(q.toLowerCase()) ||
    u.nombre_display.toLowerCase().includes(q.toLowerCase())
  );

  function notify(tone: 'ok' | 'err', text: string) {
    setMessage({ tone, text });
    setTimeout(() => setMessage(null), 4000);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuarios</h1>
          <p className="mt-1 text-sm text-(--dev-muted)">
            {initialUsers.length} usuarios registrados
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-(--dev-accent) px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {message && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${
          message.tone === 'ok'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--dev-muted)" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por email o nombre…"
          className="w-full rounded-lg border border-(--dev-border) bg-(--dev-panel) py-2 pl-9 pr-3 text-sm text-white placeholder:text-(--dev-muted) focus:border-(--dev-accent) focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-(--dev-border) bg-(--dev-panel)">
        <table className="w-full text-sm">
          <thead className="border-b border-(--dev-border) text-left text-xs uppercase tracking-wider text-(--dev-muted)">
            <tr>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Roles</th>
              <th className="px-3 py-2 hidden md:table-cell">Último login</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--dev-border)">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-(--dev-bg)/30">
                <td className="px-3 py-3">
                  <div className="font-medium text-white truncate max-w-[260px]">{u.nombre_display}</div>
                  <div className="text-xs text-(--dev-muted) mono truncate max-w-[260px]">{u.email}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 ? (
                      <span className="text-xs text-(--dev-muted)">sin rol</span>
                    ) : (
                      u.roles.map((r) => (
                        <span
                          key={r}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            r === 'superadmin'
                              ? 'bg-(--dev-accent)/20 text-(--dev-accent)'
                              : 'bg-(--dev-bg) text-(--dev-muted)'
                          }`}
                        >
                          {r}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="text-xs text-(--dev-muted) mono">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('es-MX') : '—'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const r = await toggleActivo(u.id, !u.activo);
                        if (r.ok) notify('ok', `Usuario ${!u.activo ? 'activado' : 'desactivado'}`);
                        else notify('err', r.error ?? 'Error');
                      })
                    }
                    className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                      u.activo ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    {u.activo ? 'Activo' : 'Suspendido'}
                  </button>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <IconButton
                      title="Editar roles"
                      onClick={() => setEditingRolesFor(editingRolesFor === u.id ? null : u.id)}
                    >
                      <UserCog size={14} />
                    </IconButton>
                    <IconButton
                      title="Reset password"
                      onClick={() =>
                        startTransition(async () => {
                          if (!confirm(`¿Resetear contraseña de ${u.email}? Se generará una temporal.`)) return;
                          const r = await resetPassword(u.id);
                          if (r.ok) notify('ok', `Nueva contraseña: ${r.password}`);
                          else notify('err', r.error ?? 'Error');
                        })
                      }
                    >
                      <KeyRound size={14} />
                    </IconButton>
                    <IconButton
                      title="Eliminar usuario"
                      danger
                      onClick={() =>
                        startTransition(async () => {
                          if (!confirm(`¿Eliminar permanentemente a ${u.email}? Esta acción NO se puede deshacer.`)) return;
                          const r = await eliminarUsuario(u.id);
                          if (r.ok) notify('ok', 'Usuario eliminado');
                          else notify('err', r.error ?? 'Error');
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                  {editingRolesFor === u.id && (
                    <div className="mt-2 flex flex-wrap justify-end gap-1">
                      {catalogoRoles.map((r) => {
                        const has = u.roles.includes(r.codigo);
                        return (
                          <button
                            key={r.codigo}
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                const action = has ? quitarRol : asignarRol;
                                const res = await action(u.id, r.codigo);
                                if (res.ok) notify('ok', has ? `Rol ${r.codigo} quitado` : `Rol ${r.codigo} asignado`);
                                else notify('err', res.error ?? 'Error');
                              })
                            }
                            className={`rounded px-2 py-0.5 text-[10px] ${
                              has
                                ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                                : 'bg-(--dev-bg) text-(--dev-muted) hover:text-white'
                            }`}
                          >
                            {r.codigo}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-12 text-center text-(--dev-muted)">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={(msg) => {
            setShowCreate(false);
            notify('ok', msg);
          }}
          onError={(err) => notify('err', err)}
        />
      )}
    </div>
  );
}

function IconButton({ children, danger, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      {...rest}
      className={`rounded p-1.5 text-(--dev-muted) hover:bg-(--dev-bg) ${
        danger ? 'hover:text-red-400' : 'hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function CreateUserModal({
  onClose, onCreated, onError,
}: { onClose: () => void; onCreated: (msg: string) => void; onError: (err: string) => void }) {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await crearUsuario({ email, nombre });
    setLoading(false);
    if (r.ok) onCreated(`Usuario creado. Contraseña temporal: ${r.password}`);
    else onError(r.error ?? 'Error');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-(--dev-border) bg-(--dev-panel) p-5">
        <h2 className="text-lg font-semibold text-white">Nuevo usuario</h2>
        <p className="mt-1 text-xs text-(--dev-muted)">
          Se genera contraseña temporal. Asigna rol después de crear.
        </p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-(--dev-muted)">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--dev-muted)" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-(--dev-border) bg-(--dev-bg) px-3 py-2 pl-9 text-sm text-white focus:border-(--dev-accent) focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-(--dev-muted)">Nombre completo</label>
            <input
              type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-lg border border-(--dev-border) bg-(--dev-bg) px-3 py-2 text-sm text-white focus:border-(--dev-accent) focus:outline-none"
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-(--dev-muted) hover:bg-(--dev-bg)">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="rounded-lg bg-(--dev-accent) px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
              {loading ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
