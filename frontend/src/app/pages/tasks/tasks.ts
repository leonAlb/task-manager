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

@Component({
  selector: 'app-tasks',
  imports: [CdkDrag, CdkDropList, CdkDropListGroup, CommonModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
})
export class Tasks implements OnInit {
  // --------------------------------------------------------------
  // Signals & Computed
  // --------------------------------------------------------------
  tasks = signal<Task[]>([]);
  todoTasks = computed(() => this.tasks().filter((t) => t.status === TaskStatus.TODO));
  inProgressTasks = computed(() => this.tasks().filter((t) => t.status === TaskStatus.IN_PROGRESS));
  completedTasks = computed(() => this.tasks().filter((t) => t.status === TaskStatus.COMPLETED));
  newTaskTitle = signal('');
  currentUser = computed(() => this.authService.currentUser());
  users = signal<User[]>([]);
  showUserPopup = signal<boolean>(false);

  // --------------------------------------------------------------
  // Injections
  // --------------------------------------------------------------
  private tasksService = inject(TasksService);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private router = inject(Router);
  TaskStatus = TaskStatus;

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

  toggleUserPopup() {
    this.showUserPopup.update((show) => !show);
    if (this.showUserPopup()) {
      this.tasksService.getUsers().subscribe((users) => this.users.set(users));
    }
  }

  seedData() {
    this.adminService.seedData().subscribe(() => {
      this.tasksService.getTasks().subscribe((tasks) => this.tasks.set(tasks));
    });
  }

  deleteAllData() {
    this.adminService.deleteAllData().subscribe(() => {
      this.tasks.set([]);
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
