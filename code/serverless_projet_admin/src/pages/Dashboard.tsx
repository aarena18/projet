import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminService } from "../services/api";

interface Stats {
  users: number;
  teams: number;
  projects: number;
  tasks: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

interface Backup {
  id: string;
  filename: string;
  s3_key: string;
  url: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "backups">("users");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getStats(),
      adminService.getUsers(),
      adminService.getBackups(),
    ])
      .then(([statsRes, usersRes, backupsRes]) => {
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setBackups(backupsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-gray-400">
            Connecté en tant que {user?.email}
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-red-400 hover:text-red-300"
        >
          Déconnexion
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Utilisateurs",
              value: stats?.users,
              color: "bg-blue-600",
            },
            { label: "Équipes", value: stats?.teams, color: "bg-purple-600" },
            { label: "Projets", value: stats?.projects, color: "bg-green-600" },
            { label: "Tâches", value: stats?.tasks, color: "bg-amber-600" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className={`w-10 h-10 ${stat.color} rounded-lg mb-3`} />
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            Utilisateurs ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("backups")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "backups"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            Backups ({backups.length})
          </button>
        </div>

        {activeTab === "users" && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                    Nom
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                    Rôle
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                    Inscrit le
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b border-gray-700/50 ${i % 2 === 0 ? "bg-gray-800" : "bg-gray-900"}`}
                  >
                    <td className="px-6 py-4 text-sm text-white">
                      {u.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-purple-900/50 text-purple-400"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(u.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "backups" && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            {backups.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                Aucun backup disponible
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                      Fichier
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.id} className="border-b border-gray-700/50">
                      <td className="px-6 py-4 text-sm text-white font-mono">
                        {backup.filename}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(backup.created_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={backup.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Télécharger
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
