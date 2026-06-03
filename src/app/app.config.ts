import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// Features
import { authFeature } from './store/auth.store';
import { tasksFeature } from './store/tasks.store';
import { challengesFeature } from './store/challenges.store';
import { devicesFeature } from './store/devices.store';
import { telemetryFeature } from './store/telemetry.store';
import { leaderboardFeature } from './store/leaderboard.store';
import { usersFeature } from './store/users.store';

// Effects
import * as authEffects from './store/auth.store';
import * as tasksEffects from './store/tasks.store';
import * as challengesEffects from './store/challenges.store';
import * as devicesEffects from './store/devices.store';
import * as telemetryEffects from './store/telemetry.store';
import * as leaderboardEffects from './store/leaderboard.store';
import * as usersEffects from './store/users.store';

// Lucide Icons
import { 
  provideLucideIcons, 
  LucideSearch, 
  LucidePlus, 
  LucideEdit2, 
  LucideTrash2, 
  LucideX, 
  LucideBell, 
  LucideSun, 
  LucideMoon, 
  LucideLogOut, 
  LucideUser, 
  LucideLayoutDashboard, 
  LucideClipboardList, 
  LucideTrophy, 
  LucideWatch, 
  LucideUsers, 
  LucideActivity, 
  LucideCalendar, 
  LucideCheck, 
  LucideEye, 
  LucideEyeOff, 
  LucideAlertTriangle, 
  LucideShieldAlert, 
  LucideStar, 
  LucideChevronRight, 
  LucidePlay, 
  LucideSparkles,
  LucideChevronLeft,
  LucideArrowLeft,
  LucideShield,
  LucideCompass,
  LucideAward,
  LucideUserPlus,
  LucideArrowUp,
  LucideArrowDown,
  LucideRefreshCw
} from '@lucide/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    
    // NgRx Store Config
    provideStore({
      [authFeature.name]: authFeature.reducer,
      [tasksFeature.name]: tasksFeature.reducer,
      [challengesFeature.name]: challengesFeature.reducer,
      [devicesFeature.name]: devicesFeature.reducer,
      [telemetryFeature.name]: telemetryFeature.reducer,
      [leaderboardFeature.name]: leaderboardFeature.reducer,
      [usersFeature.name]: usersFeature.reducer
    }),
    
    provideEffects({
      loginEffect: authEffects.loginEffect,
      registerEffect: authEffects.registerEffect,
      authSuccessEffect: authEffects.authSuccessEffect,
      logoutEffect: authEffects.logoutEffect,
      loadTasksEffect: tasksEffects.loadTasksEffect,
      createTaskEffect: tasksEffects.createTaskEffect,
      updateTaskEffect: tasksEffects.updateTaskEffect,
      deleteTaskEffect: tasksEffects.deleteTaskEffect,
      loadChallengesEffect: challengesEffects.loadChallengesEffect,
      createChallengeEffect: challengesEffects.createChallengeEffect,
      updateChallengeEffect: challengesEffects.updateChallengeEffect,
      deleteChallengeEffect: challengesEffects.deleteChallengeEffect,
      joinChallengeEffect: challengesEffects.joinChallengeEffect,
      loadDevicesEffect: devicesEffects.loadDevicesEffect,
      createDeviceEffect: devicesEffects.createDeviceEffect,
      updateDeviceEffect: devicesEffects.updateDeviceEffect,
      deleteDeviceEffect: devicesEffects.deleteDeviceEffect,
      loadTelemetryEffect: telemetryEffects.loadTelemetryEffect,
      submitTelemetryEffect: telemetryEffects.submitTelemetryEffect,
      loadLeaderboardEffect: leaderboardEffects.loadLeaderboardEffect,
      triggerRankJobEffect: leaderboardEffects.triggerRankJobEffect,
      triggerGameJobEffect: leaderboardEffects.triggerGameJobEffect,
      loadUsersEffect: usersEffects.loadUsersEffect,
      updateUserEffect: usersEffects.updateUserEffect
    }),
    
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75
    }),

    // Lucide Icons Provider
    provideLucideIcons(
      LucideSearch, 
      LucidePlus, 
      LucideEdit2, 
      LucideTrash2, 
      LucideX, 
      LucideBell, 
      LucideSun, 
      LucideMoon, 
      LucideLogOut, 
      LucideUser, 
      LucideLayoutDashboard, 
      LucideClipboardList, 
      LucideTrophy, 
      LucideWatch, 
      LucideUsers, 
      LucideActivity, 
      LucideCalendar, 
      LucideCheck, 
      LucideEye, 
      LucideEyeOff, 
      LucideAlertTriangle, 
      LucideShieldAlert, 
      LucideStar, 
      LucideChevronRight, 
      LucidePlay, 
      LucideSparkles,
      LucideChevronLeft,
      LucideArrowLeft,
      LucideShield,
      LucideCompass,
      LucideAward,
      LucideUserPlus,
      LucideArrowUp,
      LucideArrowDown,
      LucideRefreshCw
    )
  ],
};
