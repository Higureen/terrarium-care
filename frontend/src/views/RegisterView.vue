<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  if (loading.value) return

  error.value = ''

  if (!name.value.trim()) {
    error.value = 'Įrašykite vardą.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Slaptažodžiai nesutampa.'
    return
  }

  loading.value = true

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Nepavyko sukurti paskyros.')
    }

    password.value = ''
    confirmPassword.value = ''

    await router.push({
      name: 'login',
      query: { registered: '1' },
    })
  } catch (err) {
    error.value = err instanceof TypeError
      ? 'Nepavyko susisiekti su serveriu. Bandykite dar kartą.'
      : err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-card">
    <p class="eyebrow">TERRACARE</p>
    <h1>Registracija</h1>
    <p class="page-description">
      Sukurkite darbuotojo paskyrą.
    </p>

    <form class="auth-form" :aria-busy="loading" @submit.prevent="submit">
      <div class="form-field">
        <label for="register-name">Vardas</label>
        <input
          id="register-name"
          v-model="name"
          type="text"
          autocomplete="name"
          maxlength="100"
          required
          :disabled="loading"
        />
      </div>

      <div class="form-field">
        <label for="register-email">El. paštas</label>
        <input
          id="register-email"
          v-model="email"
          type="email"
          autocomplete="username"
          maxlength="254"
          required
          :disabled="loading"
        />
      </div>

      <div class="form-field">
        <label for="register-password">Slaptažodis</label>
        <input
          id="register-password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          minlength="15"
          maxlength="128"
          aria-describedby="password-hint"
          required
          :disabled="loading"
        />
        <small id="password-hint" class="field-hint">
          Nuo 15 iki 128 simbolių.
        </small>
      </div>

      <div class="form-field">
        <label for="confirm-password">Pakartokite slaptažodį</label>
        <input
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          minlength="15"
          maxlength="128"
          required
          :disabled="loading"
        />
      </div>

      <p v-if="error" class="form-error" role="alert">
        {{ error }}
      </p>

      <button class="primary-button" type="submit" :disabled="loading">
        {{ loading ? 'Kuriama paskyra…' : 'Registruotis' }}
      </button>
    </form>

    <p class="auth-switch">
      Jau turite paskyrą?
      <RouterLink to="/login">Prisijungti</RouterLink>
    </p>
  </section>
</template>