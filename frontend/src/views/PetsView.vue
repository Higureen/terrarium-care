<script setup>
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { apiFetch } from "../services/auth";

const router = useRouter();

const pets = ref([]);
const species = ref("");
const appliedSpecies = ref("");

const page = ref(1);
const totalPages = ref(0);
const total = ref(0);

const loading = ref(false);
const error = ref("");

async function loadPets(targetPage = 1) {
  if (loading.value) return;

  loading.value = true;
  error.value = "";

  try {
    const params = new URLSearchParams({
      page: String(targetPage),
      limit: "6",
    });

    if (appliedSpecies.value) {
      params.set("species", appliedSpecies.value);
    }

    const response = await apiFetch(`/pets?${params}`);

    if (response.status === 401) {
      await router.push("/login");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Nepavyko gauti augintinių.");
    }

    pets.value = data.data;
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

function applyFilter() {
  if (loading.value) return;

  appliedSpecies.value = species.value.trim();
  loadPets(1);
}

function clearFilter() {
  if (loading.value) return;

  species.value = "";
  appliedSpecies.value = "";
  loadPets(1);
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : "Nenurodyta";
}

onMounted(() => loadPets());
</script>

<template>
  <section>
    <p class="eyebrow">GYVŪNŲ PRIEŽIŪRA</p>

    <div class="page-heading">
      <h1>Augintiniai</h1>
    </div>

    <p class="page-description">
      Visų terariumų augintiniai ir nuorodos į jų priežiūros istoriją.
    </p>

    <form class="search-form pets-filter" @submit.prevent="applyFilter">
      <div class="form-field">
        <label for="species-filter">Filtruoti pagal rūšį</label>

        <input id="species-filter" v-model="species" type="search" maxlength="150" placeholder="Pvz., Litoria caerulea"
          aria-describedby="species-filter-hint" :disabled="loading" />

        <p id="species-filter-hint" class="filter-hint">
          Įrašykite visą rūšies pavadinimą. Raidžių dydis nesvarbus.
        </p>
      </div>

      <div class="filter-buttons">
        <button class="primary-button" type="submit" :disabled="loading">
          Filtruoti
        </button>

        <button class="secondary-button" type="button" :disabled="loading || (!species && !appliedSpecies)"
          @click="clearFilter">
          Išvalyti
        </button>
      </div>
    </form>

    <p v-if="loading" class="status-message" role="status">
      Kraunami augintiniai…
    </p>

    <div v-else-if="error" class="form-error" role="alert">
      <p>{{ error }}</p>

      <button class="secondary-button" type="button" @click="loadPets(page)">
        Bandyti dar kartą
      </button>
    </div>

    <template v-else>
      <p class="results-count" role="status">
        Rasta augintinių: {{ total }}
        <span v-if="appliedSpecies">
          · Rūšis: {{ appliedSpecies }}
        </span>
      </p>

      <div v-if="pets.length" class="terrarium-grid">
        <article v-for="pet in pets" :key="pet.id" class="terrarium-card">
          <div class="card-heading">
            <span class="card-label">AUGINTINIS</span>
            <h2>{{ pet.name }}</h2>
          </div>

          <dl class="conditions">
            <div>
              <dt>Rūšis</dt>
              <dd>{{ pet.species }}</dd>
            </div>

            <div>
              <dt>Atvykimo data</dt>
              <dd>{{ formatDate(pet.arrival_date) }}</dd>
            </div>
          </dl>

          <p v-if="pet.notes" class="card-notes">
            {{ pet.notes }}
          </p>

          <div class="card-actions">
            <RouterLink class="primary-button button-link" :to="{
              name: 'pet-profile',
              params: { id: pet.id },
              query: { from: 'pets' },
            }">
              Profilis ir priežiūra
            </RouterLink>

            <RouterLink class="secondary-button button-link" :to="`/terrariums/${pet.terrarium_id}`">
              Terariumas
            </RouterLink>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <h2>Augintinių nerasta</h2>

        <p v-if="appliedSpecies">
          Patikrinkite rūšies pavadinimą arba išvalykite filtrą.
        </p>

        <p v-else>
          Naują augintinį galite pridėti atidarę jo terariumą.
        </p>
      </div>

      <nav v-if="totalPages > 1" class="pagination" aria-label="Augintinių puslapiai">
        <button class="secondary-button" type="button" :disabled="page <= 1" @click="loadPets(page - 1)">
          ← Ankstesnis
        </button>

        <span>{{ page }} / {{ totalPages }}</span>

        <button class="secondary-button" type="button" :disabled="page >= totalPages" @click="loadPets(page + 1)">
          Kitas →
        </button>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.pets-filter {
  align-items: flex-start;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-top: 28px;
}

.filter-hint {
  margin: 6px 0 0;
  color: #526354;
  font-size: 13px;
  line-height: 1.5;
}

.card-heading h2,
.conditions dd,
.card-notes {
  overflow-wrap: anywhere;
}

@media (max-width: 768px) {
  .pets-filter {
    flex-direction: column;
  }

  .pets-filter .form-field {
    width: 100%;
    max-width: none;
  }

  .filter-buttons {
    width: 100%;
    padding-top: 0;
  }
}
</style>