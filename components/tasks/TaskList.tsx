// components/tasks/TaskList.tsx
"use client";

import { useState, useTransition, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { createTask, updateTask, deleteTask } from "@/actions/tasks";
import type { Task } from "@prisma/client";
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onTasksChange: (updater: (tasks: Task[]) => Task[]) => void;
}
function PomodoroCircles({
  completed,
  estimated,
}: {
  completed: number;
  estimated: number;
}) {
  const total = Math.max(completed, estimated);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            i < completed ? "bg-primary" : "bg-base-300",
          )}
        />
      ))}
    </div>
  );
}

function AddTaskForm({
  onAdd,
}: {
  onAdd: (title: string, estimated: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [estimated, setEstimated] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), estimated);
    setTitle("");
    setEstimated(1);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-base-300 text-base-content/70 hover:border-primary/50 hover:text-primary transition-all text-sm font-medium"
      >
        <span className="text-lg leading-none">+</span>
        Add task
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border-2 border-primary/50 bg-base-100 p-4"
    >
      <input
        autoFocus
        type="text"
        placeholder="What are you working on?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-sm w-full bg-base-200 border-none focus:outline-none text-sm"
        maxLength={200}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-base-content/70">Est. pomodoros:</span>
        {[1, 2, 3, 4, 5, 6, 8].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setEstimated(n)}
            className={cn(
              "w-7 h-7 rounded-lg text-xs font-bold transition-colors",
              estimated === n
                ? "bg-primary text-primary-content"
                : "bg-base-200 text-base-content/70 hover:bg-base-300",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm">
          Add Task
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-ghost btn-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function TaskItem({
  task,
  isActive,
  onSelect,
  onComplete,
  onDelete,
}: {
  task: Task;
  isActive: boolean;
  onSelect: () => void;
  onComplete: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer",
        isActive
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-base-300 bg-base-100 hover:border-primary/40",
      )}
      onClick={onSelect}
    >
      {/* Completion button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        title="Mark as done"
        className={cn(
          "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all hover:scale-110",
          isActive
            ? "border-primary bg-primary/10 hover:border-primary"
            : "border-base-300 hover:border-primary",
        )}
      >
        {isActive && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <p
          className={cn(
            "text-sm font-semibold truncate",
            isActive ? "text-base-content" : "text-base-content/80",
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2">
          <PomodoroCircles
            completed={task.completedPomodoros}
            estimated={task.estimatedPomodoros}
          />
          <span className="text-xs text-base-content/70">
            {task.completedPomodoros}/{task.estimatedPomodoros}
          </span>
        </div>
      </div>

      {/* Always visible on mobile, hover-revealed on larger screens */}
      {!isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 cursor-pointer rounded-md p-1 text-error transition-all duration-200 sm:text-base-content/20 sm:opacity-0 sm:group-hover:opacity-100 sm:hover:text-error sm:hover:scale-110"
          aria-label={`Delete ${task.title}`}
        >
          <Trash2 className="w-4 h-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

export function TaskList({
  tasks,
  activeTaskId,
  onSelectTask,
  onTasksChange,
}: TaskListProps) {
  const [, startTransition] = useTransition();

  const handleAdd = useCallback(
    (title: string, estimatedPomodoros: number) => {
      startTransition(async () => {
        const newTask = await createTask({ title, estimatedPomodoros });
        onTasksChange((currentTasks) => [newTask, ...currentTasks]);
        onSelectTask(newTask.id);
      });
    },
    [onSelectTask, onTasksChange],
  );

  const handleComplete = useCallback(
    (taskId: string) => {
      startTransition(async () => {
        await updateTask(taskId, { completed: true });
        onTasksChange((currentTasks) =>
          currentTasks.filter((t) => t.id !== taskId),
        );
        if (activeTaskId === taskId) onSelectTask(null);
      });
    },
    [activeTaskId, onSelectTask, onTasksChange],
  );

  const handleDelete = useCallback(
    (taskId: string) => {
      startTransition(async () => {
        await deleteTask(taskId);
        onTasksChange((currentTasks) =>
          currentTasks.filter((t) => t.id !== taskId),
        );
        if (activeTaskId === taskId) onSelectTask(null);
      });
    },
    [activeTaskId, onSelectTask, onTasksChange],
  );

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body gap-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">Tasks</h3>
          <span className="text-xs text-base-content/70">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Hint when no task selected */}
        {!activeTaskId && tasks.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-primary text-sm">👆</span>
            <span className="text-xs text-primary font-medium">
              Select a task to start your pomodoro
            </span>
          </div>
        )}

        <AddTaskForm onAdd={handleAdd} />

        <div className="space-y-2">
          {tasks.length === 0 && (
            <p className="text-sm text-base-content/70 text-center py-6">
              Add a task to get started!
            </p>
          )}
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isActive={task.id === activeTaskId}
              onSelect={() => onSelectTask(task.id)}
              onComplete={() => handleComplete(task.id)}
              onDelete={() => handleDelete(task.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
