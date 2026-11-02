<script setup>
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { auth, apiFetch } from "../services/auth";
import TerrariumCreateModal from "../components/TerrariumCreateModal.vue";
import TerrariumDeleteModal from "../components/TerrariumDeleteModal.vue";

const router = useRouter();

const terrariums = ref([]);
const search = ref("");
const appliedSearch = ref("");
const page = ref(1);
const totalPages = ref(0);
const total = ref(0);
const loading = ref(false);
const error = ref("");
const showCreate = ref(false);
const successMessage = ref("");
const editingTerrarium = ref(null);
const deletingTerrarium = ref(null);

function openDelete(terrarium) {
  successMessage.value = "";
  deletingTerrarium.value = terrarium;
}

async function handleDeleted() {
  deletingTerrarium.value = null;
  successMessage.value = "Terariumas ištrintas.";

  const targetPage =
    terrariums.value.length === 1 && page.value > 1
      ? page.value - 1
      : page.value;

  await loadTerrariums(targetPage);
}

function openCreate() {
  editingTerrarium.value = null;
  successMessage.value = "";
  showCreate.value = true;
}

function openEdit(terrarium) {
  editingTerrarium.value = terrarium;
  successMessage.value = "";
  showCreate.value = true;
}

async function handleUpdated() {
  showCreate.value = false;
  editingTerrarium.value = null;
  successMessage.value = "Terariumo informacija atnaujinta.";

  await loadTerrariums(page.value);
}

async function handleCreated() {
  showCreate.value = false;
  successMessage.value = "Terariumas sėkmingai sukurtas.";

  search.value = "";
  appliedSearch.value = "";

  await loadTerrariums(1);
}

function handleUnauthorized() {
  showCreate.value = false;
  deletingTerrarium.value = null;
  router.push("/login");
}

async function loadTerrariums(targetPage = 1) {
  if (loading.value) return;

  loading.value = true;
  error.value = "";

  try {
    const params = new URLSearchParams({
      page: String(targetPage),
      limit: "6",
    });

    if (appliedSearch.value) {
      params.set("name", appliedSearch.value);
    }

    const response = await apiFetch(`/terrariums?${params}`);

    if (response.status === 401) {
      await router.push("/login");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Nepavyko gauti terariumų.");
    }

    terrariums.value = data.data;
    page.value = data.pagination.page;
    totalPages.value = data.pagination.totalPages;
    total.value = data.pagination.total;
  } catch (err) {
    error.value =
      err instanceof TypeError
        ? "Nepavyko susisiekti su serveriu. Bandykite dar kartą."
        : err.message;
  } finally {
    loading.value = false;
  }
}

function searchTerrariums() {
  appliedSearch.value = search.value.trim();
  loadTerrariums(1);
}

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("lt-LT").format(new Date(value))
    : "Nenurodyta";
}

onMounted(() => loadTerrariums());
</script>

<template>
  <section>
    <p class="eyebrow">GYVŪNŲ PRIEŽIŪRA</p>

    <div class="page-heading">
      <h1>Terariumai</h1>

      <button
        v-if="['manager', 'admin'].includes(auth.user?.role)"
        class="primary-button"
        type="button"
        :disabled="loading"
        @click="openCreate"
      >
        + Naujas terariumas
      </button>
    </div>

    <p class="page-description">
      Laikymo sąlygos ir paskutinio valymo informacija vienoje vietoje.
    </p>

    <p v-if="successMessage" class="form-success" role="status">
      {{ successMessage }}
    </p>

    <form class="search-form" @submit.prevent="searchTerrariums">
      <div class="form-field">
        <label for="terrarium-search">Paieška pagal pavadinimą</label>

        <input
          id="terrarium-search"
          v-model="search"
          type="search"
          placeholder="Pvz., varlių"
          :disabled="loading"
        />
      </div>

      <button
        class="primary-button"
        type="submit"
        :disabled="loading"
      >
        Ieškoti
      </button>
    </form>

    <p v-if="loading" class="status-message" role="status">
      Kraunami terariumai…
    </p>

    <div v-else-if="error" class="form-error" role="alert">
      <p>{{ error }}</p>

      <button
        class="secondary-button"
        type="button"
        @click="loadTerrariums(page)"
      >
        Bandyti dar kartą
      </button>
    </div>

    <template v-else>
      <p class="results-count" role="status">
        Rasta terariumų: {{ total }}
      </p>

      <div v-if="terrariums.length" class="terrarium-grid">
        <article
          v-for="terrarium in terrariums"
          :key="terrarium.id"
          class="terrarium-card"
        >
          <div class="card-heading">
            <span class="card-label">TERARIUMAS</span>
            <h2>{{ terrarium.name }}</h2>
          </div>

          <dl class="conditions">
            <div>
              <dt>Temperatūros ribos</dt>
              <dd>
                {{ terrarium.temperature_min }}–{{ terrarium.temperature_max }} °C
              </dd>
            </div>

            <div>
              <dt>Drėgmės ribos</dt>
              <dd>
                {{ terrarium.humidity_min }}–{{ terrarium.humidity_max }} %
              </dd>
            </div>

            <div>
              <dt>Paskutinis valymas</dt>
              <dd>{{ formatDate(terrarium.last_cleaned) }}</dd>
            </div>
          </dl>

          <p v-if="terrarium.notes" class="card-notes">
            {{ terrarium.notes }}
          </p>

          <div class="card-actions">
            <RouterLink
              class="secondary-button button-link"
              :to="{
                name: 'terrarium-details',
                params: { id: terrarium.id },
              }"
            >
              Peržiūrėti
            </RouterLink>

            <template
              v-if="['manager', 'admin'].includes(auth.user?.role)"
            >
              <button
                class="secondary-button"
                type="button"
                @click="openEdit(terrarium)"
              >
                Redaguoti
              </button>

              <button
                class="danger-button"
                type="button"
                @click="openDelete(terrarium)"
              >
                Ištrinti
              </button>
            </template>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <h2>Terariumų nerasta</h2>
        <p>Pabandykite kitą pavadinimą arba išvalykite paiešką.</p>
      </div>

      <nav
        v-if="totalPages > 1"
        class="pagination"
        aria-label="Terariumų puslapiai"
      >
        <button
          class="secondary-button"
          type="button"
          :disabled="page <= 1"
          @click="loadTerrariums(page - 1)"
        >
          ← Ankstesnis
        </button>

        <span>{{ page }} / {{ totalPages }}</span>

        <button
          class="secondary-button"
          type="button"
          :disabled="page >= totalPages"
          @click="loadTerrariums(page + 1)"
        >
          Kitas →
        </button>
      </nav>
    </template>

    <TerrariumCreateModal
      v-if="showCreate"
      :terrarium="editingTerrarium"
      @close="showCreate = false"
      @created="handleCreated"
      @updated="handleUpdated"
      @unauthorized="handleUnauthorized"
    />

    <TerrariumDeleteModal
      v-if="deletingTerrarium"
      :terrarium="deletingTerrarium"
      @close="deletingTerrarium = null"
      @deleted="handleDeleted"
      @unauthorized="handleUnauthorized"
    />
  </section>
</template>