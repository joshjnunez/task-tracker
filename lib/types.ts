export type TaskStatus = "BACKLOG" | "IN_PROGRESS" | "WAITING" | "DONE";

export type Task = {
  id: string;
  title: string;
  description?: string;
  ae: string;
  account: string;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string | null;
};

export type TaskFilters = {
  query: string;
  ae: string;
  account: string;
  status: "ALL" | TaskStatus;
  dueThisWeek: boolean;
  overdue: boolean;
};
