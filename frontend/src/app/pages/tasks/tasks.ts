import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  CreateTask,
  ReorderTaskItem,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTask,
} from '../../models/tasks.models';
import { User, Role } from '../../models/auth.models';
import { TasksService } from '../../services/tasks';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { AdminService } from '../../services/admin';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-tasks',
  imports: [CdkDrag, CdkDropList, CommonModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
})
export class Tasks implements OnInit {
  // --------------------------------------------------------------
  // Signals & Computed
  // --------------------------------------------------------------

  // Task related
  tasks = signal<Task[]>([]);
  todoTasks = computed(() =>
    this.sortByOrder(this.tasks().filter((t) => t.status === TaskStatus.TODO)),
  );
  inProgressTasks = computed(() =>
    this.sortByOrder(this.tasks().filter((t) => t.status === TaskStatus.IN_PROGRESS)),
  );
  completedTasks = computed(() =>
    this.sortByOrder(this.tasks().filter((t) => t.status === TaskStatus.COMPLETED)),
  );

  // User related
  currentUser = computed(() => this.authService.currentUser());
  users = signal<User[]>([]);

  // UI related
  showUserPopup = signal(false);
  showTaskPopup = signal(false);
  taskPopupMode = signal<'create' | 'edit'>('create');
  editingTask = signal<Task | null>(null);
  sidebarCollapsed = signal(false);
  showAllTasksView = signal(localStorage.getItem('showAllTasksView') === 'true');

  columns = [
    {
      id: TaskStatus.TODO,
      title: 'To Do',
      tasks: this.todoTasks,
      class: 'todo-column',
    },
    {
      id: TaskStatus.IN_PROGRESS,
      title: 'In Progress',
      tasks: this.inProgressTasks,
      class: 'in-progress-column',
    },
    {
      id: TaskStatus.COMPLETED,
      title: 'Completed',
      tasks: this.completedTasks,
      class: 'completed-column',
    },
  ];

  getConnectedLists(currentId: string): string[] {
    return ['todo', 'in_progress', 'completed'].filter((id) => id !== currentId);
  }

  private sortByOrder(tasks: Task[]) {
    return [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
  }

  // Task form
  newTaskTitle = signal('');
  newTaskDescription = signal('');
  newTaskDueDate = signal('');
  newTaskPriority = signal<TaskPriority>(TaskPriority.MEDIUM);

  isTaskFormValid = computed(
    () =>
      !!this.newTaskTitle().trim() && !!this.newTaskDescription().trim() && !!this.newTaskDueDate(),
  );

  // --------------------------------------------------------------
  // Injections
  // --------------------------------------------------------------
  private tasksService = inject(TasksService);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  TaskStatus = TaskStatus;
  Role = Role;

  // --------------------------------------------------------------
  // UI State
  // --------------------------------------------------------------
  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }

  openCreatePopup() {
    this.taskPopupMode.set('create');
    this.showTaskPopup.set(true);
  }

  openEditPopup(task: Task) {
    this.editingTask.set(task);
    this.newTaskTitle.set(task.title);
    this.newTaskDescription.set(task.description);
    this.newTaskDueDate.set(this.toDateTimeLocal(task.dueDate));
    this.newTaskPriority.set(task.priority);
    this.taskPopupMode.set('edit');
    this.showTaskPopup.set(true);
  }

  closeTaskPopup() {
    this.showTaskPopup.set(false);
    this.editingTask.set(null);
    this.newTaskTitle.set('');
    this.newTaskDescription.set('');
    this.newTaskDueDate.set('');
    this.newTaskPriority.set(TaskPriority.MEDIUM);
  }

  private toDateTimeLocal(date: Date | string): string {
    return new Date(date).toISOString().slice(0, 16);
  }

  closeIfOverlay(event: MouseEvent, type: 'user' | 'task') {
    if (event.target !== event.currentTarget) return;

    if (type === 'user') {
      this.showUserPopup.set(false);
    } else {
      this.closeTaskPopup();
    }
  }

  // --------------------------------------------------------------
  // Task Management
  // --------------------------------------------------------------
  ngOnInit() {
    this.reloadTasks();
  }

  createTask() {
    if (!this.newTaskTitle().trim() || !this.newTaskDescription().trim() || !this.newTaskDueDate())
      return;

    const newTask: CreateTask = {
      title: this.newTaskTitle(),
      description: this.newTaskDescription(),
      dueDate: new Date(this.newTaskDueDate()),
      priority: this.newTaskPriority(),
      status: TaskStatus.TODO,
      userId: this.currentUser()?.id || 0,
    };
    this.tasksService.createTask(newTask).subscribe((task) => {
      this.tasks.update((tasks) => [...tasks, task]);
      this.closeTaskPopup();
    });
  }

  saveTask() {
    const editing = this.editingTask();
    if (!editing) return;
    if (!this.newTaskTitle().trim() || !this.newTaskDescription().trim() || !this.newTaskDueDate())
      return;

    const updatedTask: UpdateTask = {
      id: editing.id,
      title: this.newTaskTitle(),
      description: this.newTaskDescription(),
      dueDate: new Date(this.newTaskDueDate()),
      priority: this.newTaskPriority(),
    };
    this.tasksService.updateTask(updatedTask).subscribe(() => {
      this.reloadTasks();
      this.closeTaskPopup();
    });
  }

  deleteTask(id: number) {
    this.tasksService.deleteTask(id).subscribe(() => {
      this.tasks.update((tasks) => tasks.filter((t) => t.id !== id));
    });
  }

  // --------------------------------------------------------------
  // AdminStuff
  // --------------------------------------------------------------

  toggleAllTasksView() {
    this.showAllTasksView.update((v) => !v);
    localStorage.setItem('showAllTasksView', String(this.showAllTasksView()));
    if (!this.showAllTasksView()) this.users.set([]);
    this.reloadTasks();
  }

  getUserName(userId: number): string {
    const user = this.users().find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  toggleUserPopup() {
    this.showUserPopup.update((show) => !show);
    if (this.showUserPopup()) {
      this.tasksService.getUsers().subscribe((users) => this.users.set(users));
    }
  }

  private reloadTasks() {
    if (this.showAllTasksView()) {
      this.tasksService.getUsers().subscribe((users) => {
        this.users.set(users);
        this.tasks.set(users.flatMap((u) => u.tasks));
      });
    } else {
      this.tasksService.getTasks().subscribe((tasks) => this.tasks.set(tasks));
    }
  }

  seedData() {
    this.adminService.seedData().subscribe(() => this.reloadTasks());
  }

  deleteAllData() {
    this.adminService.deleteAllData().subscribe(() => {
      this.tasks.set([]);
      this.users.set([]);
    });
  }

  deleteAllTasks() {
    this.adminService.deleteAllTasks().subscribe(() => {
      this.tasks.set([]);
    });
  }

  deleteUser(id: number) {
    this.adminService.deleteUser(id).subscribe(() => {
      this.tasks.update((tasks) => tasks.filter((t) => t.userId !== id));
      this.users.update((users) => users.filter((u) => u.id !== id));
    });
  }

  // --------------------------------------------------------------
  // Auth
  // --------------------------------------------------------------

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  // --------------------------------------------------------------
  // Drag & Drop
  // --------------------------------------------------------------
  onDrop(event: CdkDragDrop<Task[]>) {
    const tasksBeforeChange = this.tasks();
    const sameContainer = event.previousContainer === event.container;

    if (sameContainer) {
      if (event.previousIndex === event.currentIndex) {
        return;
      }
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    const targetStatus = event.container.id as TaskStatus;
    const targetItems = this.buildReorderUpdates(event.container.data, targetStatus);
    const items = sameContainer
      ? targetItems
      : [
          ...targetItems,
          ...this.buildReorderUpdates(
            event.previousContainer.data,
            event.previousContainer.id as TaskStatus,
          ),
        ];

    const changedItems = this.filterReorderChanges(items, tasksBeforeChange);

    this.applyReorder(changedItems);

    if (!changedItems.length) {
      return;
    }

    this.tasksService.reorderTasks(changedItems).subscribe({
      error: () => {
        this.tasks.set(tasksBeforeChange);
      },
    });
  }

  private buildReorderUpdates(tasks: Task[], status: TaskStatus): ReorderTaskItem[] {
    return tasks.map((task, index) => ({
      id: task.id,
      order: index,
      status,
    }));
  }

  private applyReorder(items: ReorderTaskItem[]) {
    const updatesById = new Map(items.map((item) => [item.id, item]));

    this.tasks.update((tasks) =>
      tasks.map((task) => {
        const update = updatesById.get(task.id);
        if (!update) return task;

        const nextStatus = update.status ?? task.status;
        const nextOrder = update.order ?? task.order;
        if (task.order === nextOrder && task.status === nextStatus) return task;

        return {
          ...task,
          order: nextOrder,
          status: nextStatus,
        };
      }),
    );
  }

  private filterReorderChanges(items: ReorderTaskItem[], previousTasks: Task[]) {
    const previousById = new Map(previousTasks.map((task) => [task.id, task]));

    return items.filter((item) => {
      const previous = previousById.get(item.id);
      if (!previous) return true;

      const nextStatus = item.status ?? previous.status;
      const nextOrder = item.order ?? previous.order;

      return previous.status !== nextStatus || previous.order !== nextOrder;
    });
  }
}
