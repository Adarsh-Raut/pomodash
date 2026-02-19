// components/tasks/TaskList.tsx
"use client";

import { useState, useTransition } from "react";
import { createTask, updateTask, deleteTask } from "@/actions/tasks";
import type { Task } from "@prisma/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TaskListProps {
  initialTasks: Task[];
  activeTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onTasksChange?: (tasks: Task[]) => void;
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
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-base-300 text-base-content/40 hover:border-primary/50 hover:text-primary transition-all text-sm font-medium"
      >
        <span className="text-lg leading-none">+</span>
        Add task
      </button>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="rounded-xl border-2 border-primary/50 bg-base-100 p-4 space-y-3"
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
        <span className="text-xs text-base-content/50">Est. pomodoros:</span>
        {[1, 2, 3, 4, 5, 6, 8].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setEstimated(n)}
            className={cn(
              "w-7 h-7 rounded-lg text-xs font-bold transition-colors",
              estimated === n
                ? "bg-primary text-primary-content"
                : "bg-base-200 text-base-content/60 hover:bg-base-300",
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
    </motion.form>
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
  const [showActions, setShowActions] = useState(false);
  const isDone = task.completedPomodoros >= task.estimatedPomodoros;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer",
        isActive
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-base-300 bg-base-100 hover:border-primary/40",
      )}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
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
            ? "border-primary hover:bg-primary hover:border-primary"
            : "border-base-300 hover:border-primary",
        )}
      >
        {isDone && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
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
          <span className="text-xs text-base-content/40">
            {task.completedPomodoros}/{task.estimatedPomodoros}
          </span>
        </div>
      </div>

      {/* Active badge */}
      {isActive && (
        <span className="badge badge-primary badge-sm shrink-0">Selected</span>
      )}

      {/* Delete on hover */}
      <AnimatePresence>
        {showActions && !isActive && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-base-content/20 hover:text-error transition-colors shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function TaskList({
  initialTasks,
  activeTaskId,
  onSelectTask,
  onTasksChange,
}: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (title: string, estimatedPomodoros: number) => {
    startTransition(async () => {
      const newTask = await createTask({ title, estimatedPomodoros });
      setTasks((prev) => [...prev, newTask]);
      onTasksChange?.([...tasks, newTask]);
    });
  };

  const handleComplete = (taskId: string) => {
    startTransition(async () => {
      await updateTask(taskId, { completed: true });
      const next = tasks.filter((t) => t.id !== taskId);
      setTasks(next);
      onTasksChange?.(next);
      if (activeTaskId === taskId) onSelectTask(null);
    });
  };
  const handleDelete = (taskId: string) => {
    startTransition(async () => {
      await deleteTask(taskId);
      const next = tasks.filter((t) => t.id !== taskId);
      setTasks(next);
      onTasksChange?.(next);
      if (activeTaskId === taskId) onSelectTask(null);
    });
  };

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body gap-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">Tasks</h3>
          <div className="flex items-center gap-2">
            {activeTaskId && (
              <button
                onClick={() => onSelectTask(null)}
                className="text-xs text-base-content/40 hover:text-base-content transition-colors"
              >
                Deselect
              </button>
            )}
            <span className="text-xs text-base-content/30">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Hint when no task selected */}
        {!activeTaskId && tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20"
          >
            <span className="text-primary text-sm">👆</span>
            <span className="text-xs text-primary font-medium">
              Select a task to start your pomodoro
            </span>
          </motion.div>
        )}

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {tasks.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-base-content/40 text-center py-6"
              >
                Add a task to get started 🍅
              </motion.p>
            )}
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isActive={task.id === activeTaskId}
                onSelect={() =>
                  onSelectTask(task.id === activeTaskId ? null : task.id)
                }
                onComplete={() => handleComplete(task.id)}
                onDelete={() => handleDelete(task.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        <AddTaskForm onAdd={handleAdd} />
      </div>
    </div>
  );
}
