import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ChallengesComponent } from './challenges.component';
import { provideStore, Store } from '@ngrx/store';
import { challengesFeature, challengesActions } from '../../store/challenges.store';
import { tasksFeature, tasksActions } from '../../store/tasks.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';
import { Challenge, Task } from '../../core/models';

describe('ChallengesComponent', () => {
  let component: ChallengesComponent;
  let fixture: ComponentFixture<ChallengesComponent>;
  let store: Store;
  let authServiceSpy: any;
  let currentUserSignal: any;

  beforeEach(async () => {
    currentUserSignal = signal({
      id: 42,
      name: 'Jane Doe',
      role: 'ROLE_USER'
    });
    authServiceSpy = {
      currentUser: currentUserSignal
    };

    await TestBed.configureTestingModule({
      imports: [ChallengesComponent, ReactiveFormsModule],
      providers: [
        provideStore({
          [challengesFeature.name]: challengesFeature.reducer,
          [tasksFeature.name]: tasksFeature.reducer
        }),
        { provide: AuthService, useValue: authServiceSpy },
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChallengesComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should determine isAdmin status', () => {
    expect(component.isAdmin()).toBe(false);
    currentUserSignal.set({ id: 1, name: 'Admin', role: 'ROLE_ADMIN' });
    expect(component.isAdmin()).toBe(true);
  });

  it('should calculate statistics and filter list', () => {
    const mockChallenges: Challenge[] = [
      { id: 1, name: 'Challenge Alpha', description: 'Desc A', scope: 'GLOBAL', status: 'ACTIVE', participants: [42], startAt: '', endAt: '' },
      { id: 2, name: 'Challenge Beta', description: 'Desc B', scope: 'REGIONAL', status: 'ACTIVE', participants: [1], startAt: '', endAt: '' },
      { id: 3, name: 'Challenge Gamma', description: 'Desc C', scope: 'GLOBAL', status: 'CLOSED', participants: [], startAt: '', endAt: '' }
    ];
    store.dispatch(challengesActions.loadChallengesSuccess({ challenges: mockChallenges }));
    fixture.detectChanges();

    expect(component.userJoinedCount()).toBe(1); // Joined 1 challenge (id 1)

    // Admin filtering
    component.searchText.set('alpha');
    expect(component.filteredChallenges().length).toBe(1);
    expect(component.filteredChallenges()[0].id).toBe(1);

    component.searchText.set('');
    component.statusFilter.set('closed');
    expect(component.filteredChallenges().length).toBe(1);
    expect(component.filteredChallenges()[0].id).toBe(3);

    component.statusFilter.set('all');
    component.scopeFilter.set('REGIONAL');
    expect(component.filteredChallenges().length).toBe(1);
    expect(component.filteredChallenges()[0].id).toBe(2);

    // User filtering
    component.scopeFilter.set('');
    component.statusFilter.set('joined');
    expect(component.userFilteredChallenges().length).toBe(1);
    expect(component.userFilteredChallenges()[0].id).toBe(1);
  });

  it('should paginate items', () => {
    const mockChallenges = Array(12).fill(0).map((_, i) => ({
      id: i + 1,
      name: `C ${i}`,
      scope: 'GLOBAL',
      status: 'ACTIVE',
      participants: [],
      startAt: '',
      endAt: ''
    } as any));
    store.dispatch(challengesActions.loadChallengesSuccess({ challenges: mockChallenges }));
    fixture.detectChanges();

    expect(component.totalPages()).toBe(3); // 12 / 5 rounded up = 3
    expect(component.pagesArray()).toEqual([1, 2, 3]);

    component.setCurrentPage(2);
    expect(component.paginatedChallenges().length).toBe(5);
    expect(component.paginatedChallenges()[0].id).toBe(6);
  });

  it('should handle search input events', () => {
    component.onSearchInput({ target: { value: 'test' } } as any);
    expect(component.searchText()).toBe('test');
    expect(component.currentPage()).toBe(1);

    component.setStatusFilter('active');
    expect(component.statusFilter()).toBe('active');
    expect(component.currentPage()).toBe(1);

    component.toggleScopeFilter('GLOBAL');
    expect(component.scopeFilter()).toBe('GLOBAL');
    expect(component.currentPage()).toBe(1);

    component.toggleScopeFilter('GLOBAL'); // toggle off
    expect(component.scopeFilter()).toBe('');
  });

  it('should update region validity on scope change', () => {
    const regionControl = component.challengeForm.get('region');
    
    component.onScopeChange('REGIONAL');
    expect(regionControl?.validator).toBeDefined();

    component.onScopeChange('GLOBAL');
    expect(regionControl?.validator).toBeNull();
    expect(regionControl?.value).toBe('');
  });

  it('should check if user joined and dispatch joinChallenge', () => {
    const challenge = { id: 1, participants: [42] } as Challenge;
    expect(component.isJoined(challenge)).toBe(true);

    const dispatchSpy = jest.spyOn(store, 'dispatch');
    component.onJoinChallenge(challenge);
    expect(dispatchSpy).toHaveBeenCalledWith(challengesActions.joinChallenge({
      id: 1,
      userId: 42,
      currentParticipants: [42]
    }));
  });

  it('should open create form and reset state', () => {
    component.openCreateForm();
    expect(component.isFormOpen()).toBe(true);
    expect(component.editingChallengeId()).toBeNull();
  });

  it('should open edit form with challenge details', () => {
    const challenge = {
      id: 10,
      name: 'Edit Chal',
      description: 'Desc',
      taskId: 1,
      scope: 'GLOBAL',
      region: '',
      status: 'ACTIVE',
      startAt: '2026-06-03T10:00:00.000Z',
      endAt: '2026-06-10T10:00:00.000Z',
      participants: []
    } as Challenge;
    component.openEditForm(challenge);
    expect(component.isFormOpen()).toBe(true);
    expect(component.editingChallengeId()).toBe(10);
  });

  it('should dispatch actions on submit', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    component.openCreateForm();
    component.challengeForm.patchValue({
      name: 'New Chal',
      taskId: 2,
      scope: 'GLOBAL',
      startAt: '2026-06-03T10:00',
      endAt: '2026-06-10T10:00'
    });

    // Create Challenge
    component.onFormSubmit();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: challengesActions.createChallenge.type,
      name: 'New Chal',
      taskId: 2
    }));

    // Update Challenge
    component.openEditForm({
      id: 10,
      name: 'Old',
      taskId: 1,
      scope: 'GLOBAL',
      status: 'ACTIVE',
      startAt: '2026-06-03T10:00:00Z',
      endAt: '2026-06-10T10:00:00Z',
      participants: []
    } as any);
    component.challengeForm.patchValue({
      name: 'Updated Chal'
    });
    component.onFormSubmit();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: challengesActions.updateChallenge.type,
      id: 10
    }));
  });

  it('should validate end date is after start date', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    component.openCreateForm();
    component.challengeForm.patchValue({
      name: 'New Chal',
      taskId: 2,
      scope: 'GLOBAL',
      startAt: '2026-06-10T10:00',
      endAt: '2026-06-03T10:00' // End before start
    });
    component.onFormSubmit();
    expect(alertSpy).toHaveBeenCalledWith('End Date must be after Start Date');
    alertSpy.mockRestore();
  });

  it('should set showErrors to true if form invalid', () => {
    component.openCreateForm();
    component.challengeForm.patchValue({ name: '' });
    component.onFormSubmit();
    expect(component.showErrors()).toBe(true);
  });

  it('should confirm and dispatch delete action', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    component.onDelete(5);
    expect(confirmSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(challengesActions.deleteChallenge({ id: 5 }));

    confirmSpy.mockRestore();
  });

  it('should return challenge expiry text', () => {
    expect(component.getChallengeExpiryText({ id: 1, status: 'CLOSED' } as any)).toBe('Closed');
    expect(component.getChallengeExpiryText({ id: 1, status: 'ACTIVE' } as any)).toBe('Expires in 11d');
    expect(component.getChallengeExpiryText({ id: 999, status: 'ACTIVE' } as any)).toBe('Expires soon');
  });

  it('should return false for isTagSelected (placeholder logic)', () => {
    expect(component.isTagSelected('STEPS')).toBe(false);
  });
});
