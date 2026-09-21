import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { User, PatronCategory } from '../../types';
import { Users, UserPlus, Search, ShieldCheck } from 'lucide-react';

export const PatronListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [libraries, setLibraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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
    fetchUsers();
    api.get('/roles').then((res) => {
      setRoles(res.data);
      if (res.data.length > 0) setRoleId(res.data[0].id);
    });
    api.get('/libraries').then((res) => {
      setLibraries(res.data);
      if (res.data.length > 0) setLibraryId(res.data[0].id);
    });
  }, []);

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

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-md flex items-center gap-2 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
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
                <th className="p-3">E-mail / Telefone</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={7} className="p-6 text-center text-slate-400">Carregando usuários...</td></tr>
              ) : (
                users.map((u) => (
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
                    <td className="p-3">{u.library || '-'}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {u.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
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
    </div>
  );
};
