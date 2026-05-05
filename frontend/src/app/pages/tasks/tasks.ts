import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
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
import { TeamsService } from '../../services/teams';
import { TeamSummary } from '../../models/teams.models';

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
  showOwnerNames = computed(() => {
    const role = this.currentUser()?.role;
    return role === Role.ADMIN || role === Role.PROJECT_MANAGER;
  });
  isAdmin = computed(() => this.currentUser()?.role === Role.ADMIN);
  isProjectManager = computed(() => this.currentUser()?.role === Role.PROJECT_MANAGER);

  // UI related
  showUserPopup = signal(false);
  showTaskPopup = signal(false);
  taskPopupMode = signal<'create' | 'edit'>('create');
  editingTask = signal<Task | null>(null);
  sidebarCollapsed = signal(false);
  showTeamPopup = signal(false);
  showCreateTeamPopup = signal(false);
  showDelegatePopup = signal(false);
  showMembersPopup = signal(false);

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

  readonly sortedUsers = computed(() => {
    return [...this.users()].sort((a, b) => a.firstName.localeCompare(b.firstName));
  });

  // Task form
  newTaskTitle = signal('');
  newTaskDescription = signal('');
  newTaskDueDate = signal('');
  newTaskPriority = signal<TaskPriority>(TaskPriority.MEDIUM);

  isTaskFormValid = computed(
    () =>
      !!this.newTaskTitle().trim() && !!this.newTaskDescription().trim() && !!this.newTaskDueDate(),
  );

  // PM team management
  teams = signal<TeamSummary[]>([]);
  selectedTeamId = signal<number | null>(null);
  newTeamName = signal('');
  isTeamFormValid = computed(() => !!this.newTeamName().trim());
  availableUsers = signal<User[]>([]);

  // PM delegation form
  delegateUserId = signal<number | null>(null);
  delegateTitle = signal('');
  delegateDescription = signal('');
  delegateDueDate = signal('');
  delegatePriority = signal<TaskPriority>(TaskPriority.MEDIUM);
  isDelegateFormValid = computed(() => {
    return (
      !!this.delegateUserId() &&
      !!this.delegateTitle().trim() &&
      !!this.delegateDescription().trim() &&
      !!this.delegateDueDate()
    );
  });

  // --------------------------------------------------------------
  // Injections
  // --------------------------------------------------------------
  private tasksService = inject(TasksService);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private teamsService = inject(TeamsService);
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

  openCreateTeamPopup() {
    this.newTeamName.set('');
    this.showCreateTeamPopup.set(true);
  }

  closeCreateTeamPopup() {
    this.showCreateTeamPopup.set(false);
    this.newTeamName.set('');
  }

  openManageTeamsPopup() {
    this.showTeamPopup.set(true);
    this.loadManagedTeams();
  }

  closeManageTeamsPopup() {
    this.showTeamPopup.set(false);
  }

  openDelegatePopup() {
    if (!this.selectedTeamId()) return;
    this.delegateUserId.set(null);
    this.delegateTitle.set('');
    this.delegateDescription.set('');
    this.delegateDueDate.set('');
    this.delegatePriority.set(TaskPriority.MEDIUM);
    this.showTeamPopup.set(false);
    this.showDelegatePopup.set(true);
  }

  openMembersPopup() {
    const teamId = this.selectedTeamId();
    if (!teamId) return;
    this.showTeamPopup.set(false);
    this.showMembersPopup.set(true);
    this.loadAvailableMembers(teamId);
  }

  closeMembersPopup() {
    this.showMembersPopup.set(false);
  }

  closeDelegatePopup() {
    this.showDelegatePopup.set(false);
  }

  private toDateTimeLocal(date: Date | string): string {
    return new Date(date).toISOString().slice(0, 16);
  }

  closeIfOverlay(
    event: MouseEvent,
    type: 'user' | 'task' | 'team' | 'delegate' | 'create-team' | 'members',
  ) {
    if (event.target !== event.currentTarget) return;
    const actions: Record<string, () => void> = {
      user: () => this.showUserPopup.set(false),
      task: () => this.closeTaskPopup(),
      team: () => this.closeManageTeamsPopup(),
      delegate: () => this.closeDelegatePopup(),
      members: () => this.closeMembersPopup(),
      'create-team': () => this.closeCreateTeamPopup(),
    };
    actions[type]?.();
  }

  getRoleLabel(role?: Role, short = false): string {
    if (role === Role.ADMIN) return 'Admin';
    if (role === Role.PROJECT_MANAGER) return short ? 'PM' : 'Project Manager';
    return 'User';
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showTaskPopup()) { this.closeTaskPopup(); return; }
    if (this.showDelegatePopup()) { this.closeDelegatePopup(); return; }
    if (this.showMembersPopup()) { this.closeMembersPopup(); return; }
    if (this.showTeamPopup()) { this.closeManageTeamsPopup(); return; }
    if (this.showCreateTeamPopup()) { this.closeCreateTeamPopup(); return; }
    if (this.showUserPopup()) { this.showUserPopup.set(false); }
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: Event) {
    if (this.showTaskPopup() && this.isTaskFormValid()) {
      event.preventDefault();
      this.taskPopupMode() === 'create' ? this.createTask() : this.saveTask();
    } else if (this.showCreateTeamPopup() && this.isTeamFormValid()) {
      event.preventDefault();
      this.createTeam();
    } else if (this.showDelegatePopup() && this.isDelegateFormValid()) {
      event.preventDefault();
      this.delegateTask();
    }
  }

  // --------------------------------------------------------------
  // Task Management
  // --------------------------------------------------------------
  ngOnInit() {
    const profile = this.currentUser();

    if (profile) {
      this.reloadTasks();
      return;
    }

    if (this.authService.isLoggedIn()) {
      this.authService.getMe().subscribe({
        next: (user) => {
          this.authService.currentUser.set(user);
          this.reloadTasks();
        },
        error: () => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        },
      });
      return;
    }
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

  // ----------------------------------------------
  // Project Manager Team Management
  // ----------------------------------------------

  deleteTask(id: number) {
    this.tasksService.deleteTask(id).subscribe(() => {
      this.tasks.update((tasks) => tasks.filter((t) => t.id !== id));
    });
  }

  deleteTeam(teamId: number) {
    this.teamsService.deleteTeam(teamId).subscribe(() => {
      if (this.selectedTeamId() === teamId) {
        this.selectedTeamId.set(null);
        this.users.set([]);
        this.tasks.set([]);
      }
      this.loadManagedTeams();
    });
  }

  createTeam() {
    const name = this.newTeamName().trim();
    if (!name) return;

    this.teamsService.createTeam(name).subscribe(() => {
      this.closeCreateTeamPopup();
      this.loadManagedTeams();
    });
  }

  selectTeam(teamId: number) {
    if (this.selectedTeamId() === teamId) return;
    this.selectedTeamId.set(teamId);
    this.loadTeamTasks(teamId);
  }

  delegateTask() {
    if (!this.isDelegateFormValid()) return;
    const userId = this.delegateUserId();
    if (!userId) return;

    const payload: CreateTask = {
      title: this.delegateTitle(),
      description: this.delegateDescription(),
      dueDate: new Date(this.delegateDueDate()),
      priority: this.delegatePriority(),
      status: TaskStatus.TODO,
      userId,
    };

    this.tasksService.delegateTask(payload).subscribe(() => {
      const teamId = this.selectedTeamId();
      if (teamId) {
        this.loadTeamTasks(teamId);
      }
      this.closeDelegatePopup();
    });
  }

  addMember(userId: number) {
    const teamId = this.selectedTeamId();
    if (!teamId) return;

    this.teamsService.addMember(teamId, userId).subscribe(() => {
      this.loadTeamTasks(teamId);
      this.loadAvailableMembers(teamId);
      this.loadManagedTeams();
    });
  }

  removeMember(userId: number) {
    const teamId = this.selectedTeamId();
    if (!teamId) return;

    this.teamsService.removeMember(teamId, userId).subscribe(() => {
      this.loadTeamTasks(teamId);
      this.loadAvailableMembers(teamId);
      this.loadManagedTeams();
    });
  }

  private loadManagedTeams() {
    this.teamsService.getManagedTeams().subscribe((teams) => {
      this.teams.set(teams);

      if (!teams.length) {
        this.selectedTeamId.set(null);
        this.users.set([]);
        this.tasks.set([]);
        return;
      }

      const current = this.selectedTeamId();
      const next = current && teams.some((team) => team.id === current) ? current : teams[0].id;

      this.selectedTeamId.set(next);
      this.loadTeamTasks(next);
    });
  }

  private loadTeamTasks(teamId: number) {
    this.teamsService.getTeamTasks(teamId).subscribe((members) => {
      this.users.set(members);
      this.tasks.set(members.flatMap((member) => member.tasks));
    });
  }

  private loadAvailableMembers(teamId: number) {
    this.teamsService.getAvailableMembers(teamId).subscribe((members) => {
      this.availableUsers.set(members);
    });
  }

  // --------------------------------------------------------------
  // AdminStuff
  // --------------------------------------------------------------

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

  toggleUserRole(user: User) {
    if (user.role === Role.ADMIN || user.email === this.currentUser()?.email) return;

    this.adminService.toggleUserRole(user.id).subscribe(() => {
      this.tasksService.getUsers().subscribe((users) => this.users.set(users));
    });
  }

  private reloadTasks() {
    const role = this.currentUser()?.role;

    if (role === Role.ADMIN) {
      this.tasksService.getUsers().subscribe((users) => {
        this.users.set(users);
        this.tasks.set(users.flatMap((u) => u.tasks));
      });
      return;
    }

    if (role === Role.PROJECT_MANAGER) {
      this.loadManagedTeams();
      return;
    }

    this.users.set([]);
    this.tasksService.getTasks().subscribe((tasks) => this.tasks.set(tasks));
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
