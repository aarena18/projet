import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projectService, taskService, teamService } from "../services/api";

interface Task {
  id: string;
  name: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  assigned_to: string | null;
}

const STATUS_LABELS = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

const STATUS_COLORS = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-600",
  done: "bg-green-100 text-green-600",
};

export default function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ name: "", description: "" });

  useEffect(() => {
    if (!projectId) return;
    projectService.getProject(projectId).then((res) => {
      setProject(res.data);
      return teamService.getMembers(res.data.team_id);
    });

    taskService.getTasks(projectId).then((res) => setTasks(res.data));
  }, [projectId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newTask.name) return;
    const res = await taskService.createTask(projectId, newTask);
    setTasks([res.data, ...tasks]);
    setNewTask({ name: "", description: "" });
    setShowCreate(false);
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    await taskService.updateStatus(taskId, status);
    setTasks(
      tasks.map((t) =>
        t.id === taskId ? { ...t, status: status as Task["status"] } : t,
      ),
    );
  };

  const handleDelete = async (taskId: string) => {
    await taskService.deleteTask(taskId);
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600"
        >
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-gray-900">{project?.name}</h1>
        {project?.description && (
          <span className="text-sm text-gray-400">{project.description}</span>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Tâches</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Nouvelle tâche
          </button>
        </div>

        {showCreate && (
          <form
            onSubmit={handleCreateTask}
            className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-3"
          >
            <input
              type="text"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
              placeholder="Nom de la tâche"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <input
              type="text"
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              placeholder="Description"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Créer
            </button>
          </form>
        )}

        {/* Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: "todo", tasks: todoTasks },
            { key: "in_progress", tasks: inProgressTasks },
            { key: "done", tasks: doneTasks },
          ].map((col) => (
            <div
              key={col.key}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[col.key as Task["status"]]}`}
                >
                  {STATUS_LABELS[col.key as Task["status"]]}
                </span>
                <span className="text-gray-400 text-sm">
                  {col.tasks.length}
                </span>
              </h3>

              <div className="space-y-3">
                {col.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="border border-gray-100 rounded-lg p-3 hover:border-gray-300 transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm">
                      {task.name}
                    </p>
                    {task.description && (
                      <p className="text-xs text-gray-400 mt-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex gap-1 mt-3">
                      {Object.keys(STATUS_LABELS)
                        .filter((s) => s !== task.status)
                        .map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(task.id, s)}
                            className="text-xs text-gray-400 hover:text-blue-600 border border-gray-200 rounded px-2 py-0.5"
                          >
                            → {STATUS_LABELS[s as Task["status"]]}
                          </button>
                        ))}
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-xs text-red-400 hover:text-red-600 ml-auto"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                {col.tasks.length === 0 && (
                  <p className="text-xs text-gray-300 text-center py-4">Vide</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
