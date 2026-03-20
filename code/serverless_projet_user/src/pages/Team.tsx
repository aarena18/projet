import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { teamService, projectService } from "../services/api";

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function Team() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  useEffect(() => {
    if (!teamId) return;
    Promise.all([
      teamService.getTeam(teamId),
      projectService.getProjects(teamId),
      teamService.getMembers(teamId),
    ]).then(([teamRes, projectsRes, membersRes]) => {
      setTeam(teamRes.data);
      setProjects(projectsRes.data);
      setMembers(membersRes.data);
    });
  }, [teamId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !newProject.name) return;
    const res = await projectService.createProject(teamId, newProject);
    setProjects([res.data, ...projects]);
    setNewProject({ name: "", description: "" });
    setShowCreateProject(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !inviteEmail) return;
    try {
      await teamService.invite(teamId, inviteEmail);
      setInviteMsg("Invitation envoyée !");
      setInviteEmail("");
    } catch (err: any) {
      setInviteMsg(err.response?.data?.error || "Erreur");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-400 hover:text-gray-600"
        >
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-gray-900">{team?.name}</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Projets */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Projets</h2>
              <button
                onClick={() => setShowCreateProject(!showCreateProject)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
              >
                + Nouveau projet
              </button>
            </div>

            {showCreateProject && (
              <form
                onSubmit={handleCreateProject}
                className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-3"
              >
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  placeholder="Nom du projet"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <input
                  type="text"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="Description (optionnel)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Créer
                </button>
              </form>
            )}

            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {project.description}
                    </p>
                  )}
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  Aucun projet
                </div>
              )}
            </div>
          </div>

          {/* Membres */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Membres</h2>
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="text-blue-600 text-sm hover:underline"
              >
                + Inviter
              </button>
            </div>

            {showInvite && (
              <form onSubmit={handleInvite} className="mb-4 space-y-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  Envoyer l'invitation
                </button>
                {inviteMsg && (
                  <p className="text-sm text-center text-green-600">
                    {inviteMsg}
                  </p>
                )}
              </form>
            )}

            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-sm">
                    {member.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.name}
                    </p>
                    <p className="text-xs text-gray-400">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
