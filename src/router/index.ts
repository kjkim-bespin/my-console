import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import ChangePasswordView from '../views/ChangePasswordView.vue';
import MfaView from '../views/MfaView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: ChangePasswordView,
      meta: { requiresChallenge: true },
    },
    {
      path: '/mfa',
      name: 'mfa',
      component: MfaView,
      meta: { requiresChallenge: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
  ],
});

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Check auth status on first load
  if (!authStore.user) {
    await authStore.checkAuthStatus();
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest);

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if route requires auth and user is not authenticated
    next('/login');
  } else if (requiresGuest && authStore.isAuthenticated) {
    // Redirect to dashboard if route requires guest and user is authenticated
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
