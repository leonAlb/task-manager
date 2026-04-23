import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Task, TaskStatus } from '../../models/tasks.models';
import { User } from '../../models/auth.models';
import { TasksService } from '../../services/tasks';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
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
  todoTasks = computed(() => this.tasks().filter((t) => t.status === TaskStatus.TODO));
  inProgressTasks = computed(() => this.tasks().filter((t) => t.status === TaskStatus.IN_PROGRESS));
  completedTasks = computed(() => this.tasks().filter((t) => t.status === TaskStatus.COMPLETED));
  newTaskTitle = signal('');

  // User related
  currentUser = computed(() => this.authService.currentUser());
  users = signal<User[]>([]);


  // UI related
  showUserPopup = signal<boolean>(false);
  sidebarCollapsed = signal(false);
  showAllTasksView = signal(false);

  // --------------------------------------------------------------
  // Injections
  // --------------------------------------------------------------
  private tasksService = inject(TasksService);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  TaskStatus = TaskStatus;

  // --------------------------------------------------------------
  // UI State
  // --------------------------------------------------------------
  toggleSidebar() {
  this.sidebarCollapsed.update((v) => !v);
}

  // --------------------------------------------------------------
  // Task Management
  // --------------------------------------------------------------
  ngOnInit() {
    this.tasksService.getTasks().subscribe((tasks) => this.tasks.set(tasks));
  }

  createTask() {
    if (!this.newTaskTitle()) return;

    this.tasksService.createTask(this.newTaskTitle()).subscribe((task) => {
      this.tasks.update((tasks) => [...tasks, task]);
      this.newTaskTitle.set('');
    });
  }

  deleteTask(id: number) {
    this.tasksService.deleteTask(id).subscribe(() => {
      this.tasks.update((tasks) => tasks.filter((t) => t.id !== id));
    });
  }

  moveTask(task: Task, newStatus: TaskStatus) {
    const previousTasks = this.tasks();

    this.tasks.update((tasks) =>
      tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );

    const updatedTask = { ...task, status: newStatus };
    this.tasksService.updateTask(updatedTask).subscribe({
      error: () => {
        this.tasks.set(previousTasks);
      },
    });
  }

  // --------------------------------------------------------------
  // AdminStuff
  // --------------------------------------------------------------

  toggleAllTasksView() {
    this.showAllTasksView.update((v) => !v);
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
    if (event.previousContainer === event.container) return;

    const task = event.previousContainer.data[event.previousIndex];
    const newStatus = event.container.id as TaskStatus;

    this.tasks.update((tasks) => {
      const filtered = tasks.filter((t) => t.id !== task.id);
      const updatedTask = { ...task, status: newStatus };
      const targetTasks = filtered.filter((t) => t.status === newStatus);
      const insertIndex = filtered.indexOf(targetTasks[event.currentIndex]) + 1;
      filtered.splice(insertIndex === 0 ? filtered.length : insertIndex - 1, 0, updatedTask);
      return [...filtered];
    });

    this.moveTask(task, newStatus);
  }
}
