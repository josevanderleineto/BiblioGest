import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { User, PatronCategory } from '../../types';
import { Users, UserPlus, Search, ShieldCheck, KeyRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type PasswordResetTarget = Pick<User, 'id' | 'username' | 'name' | 'registrationNumber' | 'category' | 'role'>;

export const PatronListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [passwordResetTargets, setPasswordResetTargets] = useState<PasswordResetTarget[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [libraries, setLibraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<PasswordResetTarget | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const canViewUsers = hasPermission('users.view');
  const canResetPasswords = hasPermission('users.reset_password');

  // New user form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [category, setCategory] = useState<PatronCategory>('ALUNO');
  const [roleId, setRoleId] = useState('');
  const [libraryId, setLibraryId] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (canViewUsers) {
      fetchUsers();
      api.get('/roles').then((res) => {
        setRoles(res.data);
        if (res.data.length > 0) setRoleId(res.data[0].id);
      });
      api.get('/libraries').then((res) => {
        setLibraries(res.data);
        if (res.data.length > 0) setLibraryId(res.data[0].id);
      });
    }
    if (canResetPasswords) {
      api.get('/users/password-reset-targets').then((res) => setPasswordResetTargets(res.data));
    }
  }, [canViewUsers, canResetPasswords]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        name,
        username,
        password,
        email,
        registrationNumber,
        category,
        roleId,
        libraryId,
        cpf,
        phone,
      });
      setShowModal(false);
      setName('');
      setUsername('');
      setPassword('');
      setEmail('');
      setRegistrationNumber('');
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao cadastrar usuário.');
    }
  };

  const openResetModal = (user: PasswordResetTarget) => {
    setResetTarget(user);
    setTemporaryPassword('');
    setResetError('');
    setResetMessage('');
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError('');
    if (temporaryPassword.length < 6) {
      setResetError('A senha temporária deve possuir pelo menos 6 caracteres.');
      return;
    }

    setResettingPassword(true);
    try {
      const response = await api.post(`/users/${resetTarget.id}/reset-password`, { newPassword: temporaryPassword });
      setResetMessage(response.data.message);
      setTemporaryPassword('');
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Não foi possível redefinir a senha.');
    } finally {
      setResettingPassword(false);
    }
  };

  const resettableUserIds = new Set(passwordResetTargets.map((user) => user.id));
  const visibleUsers = canViewUsers ? users : passwordResetTargets;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-500" />
            <span>Gerenciamento de Usuários & Equipe</span>
          </h1>
          <p className="text-xs text-slate-500">Patronos (Alunos, Professores, Servidores) e Colaboradores da Biblioteca</p>
        </div>

        {canViewUsers && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-md flex items-center gap-2 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-semibold">
              <tr>
                <th className="p-3">Nome / Username</th>
                <th className="p-3">Matrícula</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Função / Perfil</th>
                <th className="p-3">Unidade Biblioteca</th>
                {canViewUsers && <th className="p-3">E-mail / Telefone</th>}
                {canViewUsers && <th className="p-3">Status</th>}
                {canResetPasswords && <th className="p-3 text-right">Senha</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading && canViewUsers ? (
                <tr><td colSpan={canResetPasswords ? 8 : 7} className="p-6 text-center text-slate-400">Carregando usuários...</td></tr>
              ) : (
                visibleUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      <div>{u.name}</div>
                      <div className="text-[11px] font-normal text-slate-400">@{u.username}</div>
                    </td>
                    <td className="p-3 font-mono text-brand-600 font-bold">{u.registrationNumber}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {u.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">{(u as User).library || '-'}</td>
                    {canViewUsers && <td className="p-3">{(u as User).email}</td>}
                    {canViewUsers && <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${(u as User).isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {(u as User).isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>}
                    {canResetPasswords && <td className="p-3 text-right">
                      {resettableUserIds.has(u.id) ? (
                        <button onClick={() => openResetModal(u)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-1.5 font-bold text-white hover:bg-amber-400">
                          <KeyRound className="h-3.5 w-3.5" /> Redefinir
                        </button>
                      ) : <span className="text-slate-400">Sem permissão</span>}
                    </td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for User creation */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Cadastrar Novo Usuário</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nome Completo *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded px-3 py-2" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Username *</label>
                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded px-3 py-2" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Senha inicial *</label>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded px-3 py-2" />
                <p className="mt-1 text-slate-500">Mínimo de 6 caracteres. O usuário deverá alterá-la no primeiro acesso.</p>
              </div>
              <div>
                <label className="font-semibold block mb-1">E-mail *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded px-3 py-2" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Matrícula *</label>
                <input type="text" required value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded px-3 py-2 font-mono" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Categoria de Patrono</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as PatronCategory)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded px-3 py-2">
                  <option value="ALUNO">Aluno</option>
                  <option value="PROFESSOR">Professor</option>
                  <option value="SERVIDOR">Servidor</option>
                  <option value="PESQUISADOR">Pesquisador</option>
                  <option value="COMUNIDADE">Comunidade</option>
                  <option value="VISITANTE">Visitante</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Função / Perfil RBAC</label>
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded px-3 py-2">
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg text-sm transition-all mt-4">
                Cadastrar Usuário
              </button>
            </form>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <h2 className="font-bold text-base text-slate-900 dark:text-white">Redefinir senha</h2>
                <p className="text-xs text-slate-500 mt-1">{resetTarget.name} — @{resetTarget.username}</p>
              </div>
              <button onClick={() => setResetTarget(null)} aria-label="Fechar" className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            {resetError && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{resetError}</p>}
            {resetMessage ? (
              <div className="space-y-4">
                <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{resetMessage}</p>
                <button onClick={() => setResetTarget(null)} className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-sm">Concluir</button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">Defina uma senha temporária. No próximo acesso, a pessoa deverá escolher uma senha própria.</p>
                <label className="block text-xs font-semibold">Senha temporária
                  <input autoFocus type="password" required minLength={6} value={temporaryPassword} onChange={(e) => setTemporaryPassword(e.target.value)} className="mt-1.5 w-full bg-slate-50 dark:bg-slate-900 border rounded px-3 py-2 text-sm" />
                </label>
                <button disabled={resettingPassword} type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-bold rounded-lg text-sm">
                  {resettingPassword ? 'Redefinindo...' : 'Salvar senha temporária'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
