import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from '../views/LoginView.vue';
import MainLayout from '../components/MainLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import ChangePasswordView from '../views/ChangePasswordView.vue';
import MfaView from '../views/MfaView.vue';
import OrganizationsView from '../views/OrganizationsView.vue';
import UsersView from '../views/UsersView.vue';
import CloudAccountsView from '../views/CloudAccountsView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
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
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'organizations',
          name: 'organizations',
          component: OrganizationsView,
          meta: { requiresSystemAdmin: true },
        },
        {
          path: 'users',
          name: 'users',
          component: UsersView,
          meta: { requiresAdmin: true },
        },
        {
          path: 'cloud-accounts',
          name: 'cloud-accounts',
          component: CloudAccountsView,
        },
      ],
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
  const requiresSystemAdmin = to.matched.some((record) => record.meta.requiresSystemAdmin);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if route requires auth and user is not authenticated
    next('/login');
  } else if (requiresGuest && authStore.isAuthenticated) {
    // Redirect to dashboard if route requires guest and user is authenticated
    next('/dashboard');
  } else if (requiresSystemAdmin && !authStore.canManageOrganizations()) {
    // Redirect to dashboard if route requires systemadmin and user is not systemadmin
    console.warn('Access denied: systemadmin permission required');
    next('/dashboard');
  } else if (requiresAdmin && !authStore.canManageUsers()) {
    // Redirect to dashboard if route requires admin and user is not admin/systemadmin
    console.warn('Access denied: admin permission required');
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
