<script setup>
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { auth, apiFetch } from "../services/auth";

const router = useRouter();

const users = ref([]);
const loading = ref(false);
const error = ref("");
const successMessage = ref("");

const selectedUser = ref(null);
const dialog = ref(null);
const saving = ref(false);
const modalError = ref("");

const form = reactive({
  role: "worker",
  is_active: true,
});

const roleNames = {
  worker: "Darbuotojas",
  manager: "Vadovas",
  admin: "Administratorius",
};

const isAdmin = computed(() => auth.user?.role === "admin");

const hasChanges = computed(() => {
  if (!selectedUser.value) return false;

  return (
    form.role !== selectedUser.value.role ||
    form.is_active !== selectedUser.value.is_active
  );
});

function isOwnAccount(user) {
  return Number(user.id) === Number(auth.user?.id);
}

async function loadUsers() {
  if (loading.value || !isAdmin.value) return;

  loading.value = true;
  error.value = "";

  try {
    const response = await apiFetch("/users");

    if (response.status === 401) {
      await router.push("/login");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Nepavyko gauti naudotojų.");
    }

    users.value = data;
  } catch (err) {
    error.value =
      err instanceof TypeError
        ? "Nepavyko susisiekti su serveriu. Bandykite dar kartą."
        : err.message;
  } finally {
    loading.value = false;
  }
}

async function openEdit(user) {
  if (isOwnAccount(user)) return;

  selectedUser.value = user;
  form.role = user.role;
  form.is_active = user.is_active;
  modalError.value = "";
  successMessage.value = "";

  await nextTick();
  dialog.value?.showModal();
}

function closeEdit() {
  if (saving.value) return;

  dialog.value?.close();
  selectedUser.value = null;
  modalError.value = "";
}

async function saveUser() {
  if (saving.value || !selectedUser.value || !hasChanges.value) return;

  saving.value = true;
  modalError.value = "";

  const userId = selectedUser.value.id;
  const changes = {};

  if (form.role !== selectedUser.value.role) {
    changes.role = form.role;
  }

  if (form.is_active !== selectedUser.value.is_active) {
    changes.is_active = form.is_active;
  }

  try {
    const response = await apiFetch(`/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(changes),
    });

    if (response.status === 401) {
      dialog.value?.close();
      selectedUser.value = null;
      await router.push("/login");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Nepavyko atnaujinti naudotojo.");
    }

    users.value = users.value.map((user) =>
      user.id === userId ? { ...user, ...data } : user,
    );

    dialog.value?.close();
    selectedUser.value = null;

    successMessage.value =
      "Naudotojas atnaujintas. Jo ankstesnės prisijungimo sesijos nutrauktos.";
  } catch (err) {
    modalError.value =
      err instanceof TypeError
        ? "Nepavyko susisiekti su serveriu. Bandykite dar kartą."
        : err.message;
  } finally {
    saving.value = false;
  }
}

function formatDate(value) {
  if (!value) return "Nenurodyta";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Nenurodyta"
    : new Intl.DateTimeFormat("lt-LT").format(date);
}

onMounted(loadUsers);
</script>

<template>
  <section>
    <p class="eyebrow">ADMINISTRAVIMAS</p>
    <h1>Naudotojai</h1>

    <p class="page-description">
      Paskyrų rolės ir prieigos prie sistemos valdymas.
    </p>

    <p v-if="!isAdmin" class="form-error" role="alert">
      Šis puslapis prieinamas tik administratoriui.
    </p>

    <template v-else>
      <p v-if="successMessage" class="form-success" role="status">
        {{ successMessage }}
      </p>

      <p v-if="loading" class="status-message" role="status">
        Kraunami naudotojai…
      </p>

      <div v-else-if="error" class="form-error" role="alert">
        <p>{{ error }}</p>

        <button
          class="secondary-button"
          type="button"
          @click="loadUsers"
        >
          Bandyti dar kartą
        </button>
      </div>

      <template v-else>
        <p class="results-count" role="status">
          Naudotojų: {{ users.length }}
        </p>

        <div v-if="users.length" class="terrarium-grid">
          <article
            v-for="user in users"
            :key="user.id"
            class="terrarium-card"
          >
            <div class="card-heading">
              <span class="card-label">
                {{ roleNames[user.role] || user.role }}
              </span>

              <h2>{{ user.name }}</h2>

              <span v-if="isOwnAccount(user)" class="own-account">
                Jūsų paskyra
              </span>
            </div>

            <dl class="conditions">
              <div>
                <dt>El. paštas</dt>
                <dd>{{ user.email }}</dd>
              </div>

              <div>
                <dt>Paskyros būsena</dt>
                <dd>
                  <span
                    class="account-status"
                    :class="{ 'account-status-inactive': !user.is_active }"
                  >
                    {{ user.is_active ? "Aktyvi" : "Išjungta" }}
                  </span>
                </dd>
              </div>

              <div>
                <dt>Registracijos data</dt>
                <dd>{{ formatDate(user.created_at) }}</dd>
              </div>
            </dl>

            <div class="card-actions">
              <button
                class="secondary-button"
                type="button"
                :disabled="isOwnAccount(user)"
                @click="openEdit(user)"
              >
                {{ isOwnAccount(user) ? "Savo teisių keisti negalima" : "Keisti teises" }}
              </button>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <h2>Naudotojų nerasta</h2>
        </div>
      </template>
    </template>

    <dialog
      v-if="selectedUser"
      ref="dialog"
      class="modal"
      aria-labelledby="user-edit-title"
      :aria-busy="saving"
      @cancel.prevent="closeEdit"
    >
      <div class="modal-heading">
        <h2 id="user-edit-title">Naudotojo teisės</h2>

        <button
          class="secondary-button"
          type="button"
          aria-label="Uždaryti langą"
          :disabled="saving"
          @click="closeEdit"
        >
          ✕
        </button>
      </div>

      <p class="page-description">
        {{ selectedUser.name }} · {{ selectedUser.email }}
      </p>

      <form @submit.prevent="saveUser">
        <fieldset :disabled="saving">
          <div class="form-field">
            <label for="user-role">Rolė</label>

            <select id="user-role" v-model="form.role" required>
              <option value="worker">Darbuotojas</option>
              <option value="manager">Vadovas</option>
              <option value="admin">Administratorius</option>
            </select>
          </div>

          <label class="user-active-control" for="user-active">
            <input
              id="user-active"
              v-model="form.is_active"
              type="checkbox"
            />
            <span>Paskyra aktyvi</span>
          </label>

          <p class="user-permissions-note">
            Išjungtas naudotojas negalės prisijungti. Išsaugojus pakeitimus,
            jo dabartinės sesijos bus nutrauktos ir reikės prisijungti iš naujo.
          </p>

          <p
            v-if="form.role === 'admin' && selectedUser.role !== 'admin'"
            class="user-permissions-note"
          >
            Administratoriaus rolė suteikia teisę valdyti kitų naudotojų
            paskyras.
          </p>

          <p v-if="modalError" class="form-error" role="alert">
            {{ modalError }}
          </p>

          <div class="modal-actions">
            <button
              class="secondary-button"
              type="button"
              @click="closeEdit"
            >
              Atšaukti
            </button>

            <button
              class="primary-button"
              type="submit"
              :disabled="saving || !hasChanges"
            >
              {{ saving ? "Saugoma…" : "Išsaugoti" }}
            </button>
          </div>
        </fieldset>
      </form>
    </dialog>
  </section>
</template>

<style scoped>
.own-account {
  display: inline-block;
  margin-top: 10px;
  font-size: 13px;
  color: #42624e;
}

.account-status {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  background: #e8f3e9;
  color: #275d42;
  font-size: 13px;
  font-weight: 700;
}

.account-status-inactive {
  background: #f8e9e7;
  color: #983e35;
}

.user-active-control {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  cursor: pointer;
}

.user-active-control input {
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: #275d42;
}

.user-permissions-note {
  margin: 0;
  padding: 14px;
  border-radius: 10px;
  background: #f3f5ef;
  color: #526354;
  font-size: 14px;
  line-height: 1.6;
}

.card-heading h2,
.conditions dd {
  overflow-wrap: anywhere;
}

.secondary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>