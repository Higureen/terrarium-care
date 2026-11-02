import { createRouter, createWebHistory } from 'vue-router'
import TerrariumsView from '../views/TerrariumsView.vue'
import LoginView from '../views/LoginView.vue'
import { auth } from '../services/auth'
import RegisterView from '../views/RegisterView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/terrariums',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/terrariums',
      name: 'terrariums',
      component: TerrariumsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.accessToken) {
    return { name: 'login' }
  }

  if (
    ['login', 'register'].includes(to.name) &&
    auth.accessToken
  ) {
    return { name: 'terrariums' }
  }
})

export default router