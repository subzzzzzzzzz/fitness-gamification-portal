import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { challengesActions, challengesFeature } from '../../store/challenges.store';
import { tasksActions, tasksFeature } from '../../store/tasks.store';
import { authFeature } from '../../store/auth.store';
import { LucideDynamicIcon } from '@lucide/angular';
import { Challenge } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideDynamicIcon],
  templateUrl: './challenges.component.html',
  styleUrl: './challenges.component.scss'
})
export class ChallengesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private authService = inject(AuthService);

  Math = Math;

  // Signals
  isFormOpen = signal<boolean>(false);
  editingChallengeId = signal<number | null>(null);
  editingChallengeName = signal<string>('');
  showErrors = signal<boolean>(false);
  searchText = signal<string>('');
  statusFilter = signal<string>('all');
  scopeFilter = signal<string>('');
  
  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  // Available tags
  sensorTags = ['GPS', 'HRM', 'STEPS', 'SPO2', 'SLEEP', 'ECG', 'HRV', 'STRESS'];

  // Form group
  challengeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    taskId: ['', Validators.required],
    scope: ['GLOBAL', Validators.required],
    region: [''],
    status: ['ACTIVE', Validators.required],
    startAt: ['', Validators.required],
    endAt: ['', Validators.required]
  });

  // Store selectors
  isAdmin = () => this.authService.currentUser()?.role === 'ROLE_ADMIN';
  userId = () => this.authService.currentUser()?.id || 1;
  allChallenges = this.store.selectSignal(challengesFeature.selectChallenges);
  allTasks = this.store.selectSignal(tasksFeature.selectTasks);
  
  // Select active tasks for form links dropdown
  activeTasks = computed(() => this.allTasks().filter(t => t.status === 'Active'));

  scopeVal = () => this.challengeForm.get('scope')?.value || 'GLOBAL';

  // Statistics for user view
  userJoinedCount = computed(() => {
    const uid = this.userId();
    return this.allChallenges().filter(c => c.participants.includes(uid)).length;
  });

  // Filter Logic (Admin)
  filteredChallenges = computed(() => {
    let result = this.allChallenges();
    
    // Text search
    const search = this.searchText().toLowerCase().trim();
    if (search) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(search) || 
        c.description.toLowerCase().includes(search)
      );
    }

    // Status filter
    const status = this.statusFilter();
    if (status !== 'all') {
      const activeVal = status === 'active' ? 'ACTIVE' : 'CLOSED';
      result = result.filter(c => c.status === activeVal);
    }

    // Scope filter
    const scope = this.scopeFilter();
    if (scope) {
      result = result.filter(c => c.scope === scope);
    }

    return result;
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredChallenges().length / this.pageSize()) || 1;
  });

  pagesArray = computed(() => {
    const arr = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      arr.push(i);
    }
    return arr;
  });

  paginatedChallenges = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredChallenges().slice(start, end);
  });

  // Filter Logic (User)
  userFilteredChallenges = computed(() => {
    let result = this.allChallenges();

    // Text search
    const search = this.searchText().toLowerCase().trim();
    if (search) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(search) || 
        c.description.toLowerCase().includes(search)
      );
    }

    // Filters: all, active (status ACTIVE), joined (user joined)
    const filter = this.statusFilter();
    if (filter === 'active') {
      result = result.filter(c => c.status === 'ACTIVE');
    } else if (filter === 'joined') {
      result = result.filter(c => c.participants.includes(this.userId()));
    }

    return result;
  });

  ngOnInit() {
    this.store.dispatch(challengesActions.loadChallenges());
    this.store.dispatch(tasksActions.loadTasks());
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchText.set(val);
    this.currentPage.set(1);
  }

  setStatusFilter(val: string) {
    this.statusFilter.set(val);
    this.currentPage.set(1);
  }

  toggleScopeFilter(scope: string) {
    this.scopeFilter.update(current => current === scope ? '' : scope);
    this.currentPage.set(1);
  }

  setCurrentPage(page: number) {
    this.currentPage.set(page);
  }

  onScopeChange(scope: string) {
    const regionControl = this.challengeForm.get('region');
    if (scope === 'REGIONAL') {
      regionControl?.setValidators(Validators.required);
    } else {
      regionControl?.clearValidators();
      regionControl?.setValue('');
    }
    regionControl?.updateValueAndValidity();
  }

  isTagSelected(tag: string): boolean {
    return false; // Not used on this form (Scope is checked instead)
  }

  // Joined check
  isJoined(challenge: Challenge): boolean {
    return challenge.participants.includes(this.userId());
  }

  onJoinChallenge(challenge: Challenge) {
    this.store.dispatch(challengesActions.joinChallenge({
      id: challenge.id,
      userId: this.userId(),
      currentParticipants: challenge.participants
    }));
  }

  // Form toggles
  openCreateForm() {
    this.editingChallengeId.set(null);
    this.challengeForm.reset({
      name: '',
      description: '',
      taskId: '',
      scope: 'GLOBAL',
      region: '',
      status: 'ACTIVE',
      startAt: new Date().toISOString().substring(0, 16),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16)
    });
    this.onScopeChange('GLOBAL');
    this.showErrors.set(false);
    this.isFormOpen.set(true);
  }

  openEditForm(challenge: Challenge) {
    this.editingChallengeId.set(challenge.id);
    this.editingChallengeName.set(challenge.name);
    
    // Format dates to fit input datetime-local format YYYY-MM-DDTHH:MM
    const startStr = new Date(challenge.startAt).toISOString().substring(0, 16);
    const endStr = new Date(challenge.endAt).toISOString().substring(0, 16);

    this.challengeForm.reset({
      name: challenge.name,
      description: challenge.description,
      taskId: challenge.taskId,
      scope: challenge.scope,
      region: challenge.region || '',
      status: challenge.status,
      startAt: startStr,
      endAt: endStr
    });
    this.onScopeChange(challenge.scope);
    this.showErrors.set(false);
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.editingChallengeId.set(null);
    this.showErrors.set(false);
  }

  onFormSubmit() {
    if (this.challengeForm.invalid) {
      this.showErrors.set(true);
      return;
    }

    const val = this.challengeForm.value;
    
    // Start date and end date validation
    const start = new Date(val.startAt).getTime();
    const end = new Date(val.endAt).getTime();
    if (end <= start) {
      alert('End Date must be after Start Date');
      return;
    }

    const payload = {
      name: val.name,
      description: val.description || '',
      taskId: Number(val.taskId),
      scope: val.scope as 'GLOBAL' | 'REGIONAL' | 'FRIENDLY',
      region: val.region || '',
      status: val.status as 'ACTIVE' | 'CLOSED',
      startAt: new Date(val.startAt).toISOString(),
      endAt: new Date(val.endAt).toISOString(),
      requiredTags: ['STEPS'] // default
    };

    if (this.editingChallengeId()) {
      this.store.dispatch(challengesActions.updateChallenge({
        id: this.editingChallengeId()!,
        changes: payload
      }));
    } else {
      this.store.dispatch(challengesActions.createChallenge(payload));
    }

    this.closeForm();
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this challenge?')) {
      this.store.dispatch(challengesActions.deleteChallenge({ id }));
      this.closeForm();
    }
  }

  getChallengeExpiryText(challenge: Challenge): string {
    if (challenge.status === 'CLOSED') return 'Closed';
    const expiry: { [key: number]: string } = {
      1: 'Expires in 11d',
      3: 'Expires in 19d',
      4: 'Expires in 24d'
    };
    return expiry[challenge.id] || 'Expires soon';
  }
}
