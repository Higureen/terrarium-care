<script setup>
import { ref } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";
import { auth, logout } from "./services/auth";

const router = useRouter();
const menuOpen = ref(false);
const loggingOut = ref(false);
const logoutError = ref("");

const roleNames = {
  worker: "Darbuotojas",
  manager: "Vadovas",
  admin: "Administratorius",
};

async function handleLogout() {
  if (loggingOut.value) return;

  loggingOut.value = true;
  logoutError.value = "";

  try {
    await logout();
    menuOpen.value = false;
    await router.push("/login");
  } catch {
    logoutError.value = "Nepavyko atsijungti. Bandykite dar kartą.";
  } finally {
    loggingOut.value = false;
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="container header-inner">
        <RouterLink to="/terrariums" class="brand" @click="menuOpen = false">
          <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
            aria-hidden="true">
            <path d="M20 4C10 3 4 7 5 13c1 5 7 7 11 3 3-3 4-7 4-12Z" />
            <path d="M4 21 15 10" />
          </svg>
          TerraCare
        </RouterLink>

        <button class="menu-toggle" type="button" :aria-expanded="menuOpen" aria-controls="main-navigation"
          :aria-label="menuOpen ? 'Uždaryti meniu' : 'Atidaryti meniu'" @click="menuOpen = !menuOpen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path v-if="menuOpen" d="m6 6 12 12M6 18 18 6" />
            <path v-else d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <nav id="main-navigation" class="main-navigation" :class="{ 'is-open': menuOpen }"
          aria-label="Pagrindinė navigacija" @keydown.esc="menuOpen = false">
          <RouterLink v-if="auth.user" to="/terrariums" @click="menuOpen = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <rect x="3" y="5" width="18" height="15" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
            Terariumai
          </RouterLink>
          <RouterLink v-if="auth.user" to="/pets" @click="menuOpen = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
              aria-hidden="true">
              <ellipse cx="5" cy="8" rx="2" ry="2.5" />
              <ellipse cx="10" cy="5" rx="2" ry="2.5" />
              <ellipse cx="16" cy="5" rx="2" ry="2.5" />
              <ellipse cx="20" cy="10" rx="2" ry="2.5" />
              <path d="M8 14c-2 2-3 5-1 6 2 1 3-1 5-1s3 2 5 1c2-1 1-4-1-6-2-3-6-3-8 0Z" />
            </svg>

            Augintiniai
          </RouterLink>
          <RouterLink v-if="auth.user" to="/care-records" @click="menuOpen = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
              aria-hidden="true">
              <rect x="5" y="4" width="14" height="17" rx="2" />
              <rect x="9" y="2" width="6" height="4" rx="1" />
              <path d="m9 13 2 2 4-4" />
            </svg>

            Priežiūra
          </RouterLink>
          <RouterLink v-if="auth.user?.role === 'admin'" to="/users" @click="menuOpen = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
              aria-hidden="true">
              <circle cx="9" cy="8" r="3" />
              <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
              <path d="M16 5a3 3 0 0 1 0 6" />
              <path d="M21 21v-2a6 6 0 0 0-4-5.65" />
            </svg>

            Naudotojai
          </RouterLink>
          <div v-if="auth.user" class="user-menu">
            <div class="user-info">
              <strong>{{ auth.user.name }}</strong>
              <span>{{ roleNames[auth.user.role] || auth.user.role }}</span>
            </div>

            <button class="secondary-button" type="button" :disabled="loggingOut" @click="handleLogout">
              {{ loggingOut ? "Atsijungiama…" : "Atsijungti" }}
            </button>

            <p v-if="logoutError" class="form-error" role="alert">
              {{ logoutError }}
            </p>
          </div>

          <RouterLink v-else-if="$route.path !== '/login'" to="/login" @click="menuOpen = false">
            Prisijungti
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="container main-content">
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <div>
          <RouterLink class="footer-brand" to="/terrariums"> TerraCare </RouterLink>
          <p>Zoologijos sodo terariumų ir augintinių priežiūra.</p>
        </div>

        <a href="https://terracare-api.onrender.com/api-docs" target="_blank" rel="noopener noreferrer">
          API dokumentacija ↗
        </a>
      </div>
    </footer>
  </div>
</template>
