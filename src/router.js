import { createRouter, createWebHistory } from 'vue-router'
import { getAccessToken } from '@/helpers/apiHelper'

export const routes = [
  {
    path: '/auth',
    component: () => import('@/features/auth/layouts/AuthLayout.vue'),
    meta: { guestOnly: true },
    children: [
      { path: '', redirect: '/auth/login' },
      { path: 'login', name: 'login', component: () => import('@/features/auth/pages/LoginPage.vue') },
      { path: 'register', name: 'register', component: () => import('@/features/auth/pages/RegisterPage.vue') },
    ],
  },
  {
    path: '/',
    component: () => import('@/features/aucations/layouts/AucationLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'home', component: () => import('@/features/aucations/pages/HomePage.vue') },
      { path: 'aucations/:aucationId', name: 'detail', component: () => import('@/features/aucations/pages/DetailPage.vue') },
      { path: 'users', name: 'users', component: () => import('@/features/users/pages/UsersPage.vue') },
      { path: 'profile', name: 'profile', component: () => import('@/features/users/pages/ProfilePage.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/features/common/pages/NotFoundPage.vue') },
]

export function authGuard(to) {
  const isLoggedIn = Boolean(getAccessToken())
  if (to.meta.requiresAuth && !isLoggedIn) {
    return { name: 'login' }
  }
  if (to.meta.guestOnly && isLoggedIn) {
    return { name: 'home' }
  }
  return true
}

export function createAppRouter(history = createWebHistory()) {
  const router = createRouter({ history, routes })
  router.beforeEach(authGuard)
  return router
}

export default createAppRouter()