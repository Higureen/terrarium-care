<script setup>
import { ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { login } from "../services/auth";

const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function submit() {
  if (loading.value) return;

  error.value = "";
  loading.value = true;

  try {
    await login(email.value.trim(), password.value);
    password.value = "";
    await router.push("/terrariums");
  } catch (err) {
    error.value =
      err instanceof TypeError
        ? "Nepavyko susisiekti su serveriu. Bandykite dar kartą."
        : err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="auth-card">
    <p class="eyebrow">TERRACARE</p>
    <h1>Prisijungimas</h1>
    <p class="page-description">
      Prisijunkite prie terariumų ir augintinių priežiūros sistemos.
    </p>
    <p v-if="route.query.registered === '1'" class="form-success" role="status">
      Paskyra sukurta. Prisijunkite savo el. paštu ir slaptažodžiu.
    </p>
    <form class="auth-form" :aria-busy="loading" @submit.prevent="submit">
      <div class="form-field">
        <label for="email">El. paštas</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="username"
          maxlength="254"
          required
          :disabled="loading"
        />
      </div>

      <div class="form-field">
        <label for="password">Slaptažodis</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          maxlength="128"
          required
          :disabled="loading"
        />
      </div>

      <p v-if="error" class="form-error" role="alert">
        {{ error }}
      </p>

      <button class="primary-button" type="submit" :disabled="loading">
        {{ loading ? "Jungiamasi…" : "Prisijungti" }}
      </button>
    </form>
    <p class="auth-switch">
      Neturite paskyros?
      <RouterLink to="/register">Registruotis</RouterLink>
    </p>
  </section>
</template>
