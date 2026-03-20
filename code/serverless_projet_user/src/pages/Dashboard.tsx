import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { teamService, invitationService } from "../services/api";

interface Team {
  id: string;
  name: string;
  created_at: string;
}

interface Invitation {
  id: string;
  team_name: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([teamService.getTeams(), invitationService.getInvitations()])
      .then(([teamsRes, invitesRes]) => {
        setTeams(teamsRes.data);
        setInvitations(invitesRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const res = await teamService.createTeam(newTeamName);
    setTeams([res.data, ...teams]);
    setNewTeamName("");
    setShowCreateTeam(false);
  };

  const handleAccept = async (id: string) => {
    await invitationService.accept(id);
    setInvitations(invitations.filter((i) => i.id !== id));
    const res = await teamService.getTeams();
    setTeams(res.data);
  };

  const handleReject = async (id: string) => {
    await invitationService.reject(id);
    setInvitations(invitations.filter((i) => i.id !== id));
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">👋 {user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Invitations */}
        {invitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Invitations en attente ({invitations.length})
            </h2>
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Invitation à rejoindre <strong>{inv.team_name}</strong>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(inv.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleReject(inv.id)}
                      className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm hover:bg-red-200"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teams */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Mes équipes</h2>
          <button
            onClick={() => setShowCreateTeam(!showCreateTeam)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Nouvelle équipe
          </button>
        </div>

        {showCreateTeam && (
          <form
            onSubmit={handleCreateTeam}
            className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex gap-3"
          >
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Nom de l'équipe"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Créer
            </button>
          </form>
        )}

        {teams.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-2">Aucune équipe pour l'instant</p>
            <p className="text-sm text-gray-400">Crée ta première équipe !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => navigate(`/teams/${team.id}`)}
                className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 text-lg">
                  {team.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Créée le{" "}
                  {new Date(team.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
