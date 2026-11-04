import { createRouter, createWebHistory } from 'vue-router'
import TerrariumsView from '../views/TerrariumsView.vue'
import LoginView from '../views/LoginView.vue'
import { auth, restoreSession } from "../services/auth";
import RegisterView from '../views/RegisterView.vue'
import TerrariumDetailsView from "../views/TerrariumDetailsView.vue";
import PetProfileView from "../views/PetProfileView.vue";

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
    {
      path: "/terrariums/:id",
      name: "terrarium-details",
      component: TerrariumDetailsView,
      meta: { requiresAuth: true },
    },
    {
      path: "/pets/:id/profile",
      name: "pet-profile",
      component: PetProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: "/users",
      name: "users",
      component: () => import("../views/UsersView.vue"),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: "/pets",
      name: "pets",
      component: () => import("../views/PetsView.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/care-records",
      name: "care-records",
      component: () => import("../views/CareRecordsView.vue"),
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach(async (to) => {
  await restoreSession();

  if (to.meta.requiresAuth && !auth.user) {
    return { name: "login" };
  }

  if (to.meta.requiresAdmin && auth.user?.role !== "admin") {
    return { name: "terrariums" };
  }

  if (["login", "register"].includes(to.name) && auth.user) {
    return { name: "terrariums" };
  }
});

export default router