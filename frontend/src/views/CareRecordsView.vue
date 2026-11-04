<script setup>
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { apiFetch } from "../services/auth";

const router = useRouter();

const records = ref([]);
const careType = ref("");
const petId = ref("");

const appliedCareType = ref("");
const appliedPetId = ref("");

const page = ref(1);
const totalPages = ref(0);
const total = ref(0);

const loading = ref(false);
const error = ref("");
const filterError = ref("");

const careTypeNames = {
  feeding: "Maitinimas",
  observation: "Būklės stebėjimas",
  other: "Kita priežiūra",
};

async function loadRecords(targetPage = 1) {
  if (loading.value) return;

  loading.value = true;
  error.value = "";

  try {
    const params = new URLSearchParams({
      page: String(targetPage),
      limit: "6",
    });

    if (appliedCareType.value) {
      params.set("care_type", appliedCareType.value);
    }

    if (appliedPetId.value) {
      params.set("pet_id", appliedPetId.value);
    }

    const response = await apiFetch(`/care-records?${params}`);

    if (response.status === 401) {
      await router.push("/login");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Nepavyko gauti priežiūros įrašų.");
    }

    records.value = data.data;
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

function applyFilters() {
  if (loading.value) return;

  filterError.value = "";

  const id = String(petId.value).trim();

  if (
    id &&
    (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647)
  ) {
    filterError.value = "Augintinio ID turi būti teigiamas sveikasis skaičius.";
    return;
  }

  appliedCareType.value = careType.value;
  appliedPetId.value = id;

  loadRecords(1);
}

function clearFilters() {
  if (loading.value) return;

  careType.value = "";
  petId.value = "";
  appliedCareType.value = "";
  appliedPetId.value = "";
  filterError.value = "";

  loadRecords(1);
}

function formatDateTime(value) {
  if (!value) return "Nenurodyta";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Nenurodyta"
    : new Intl.DateTimeFormat("lt-LT", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
}

onMounted(() => loadRecords());
</script>

<template>
  <section>
    <p class="eyebrow">GYVŪNŲ PRIEŽIŪRA</p>
    <h1>Priežiūros įrašai</h1>

    <p class="page-description">
      Maitinimo, būklės stebėjimo ir kitų priežiūros veiksmų istorija.
      Įrašus kurti ir valdyti galite augintinio profilyje.
    </p>

    <form class="care-filters" @submit.prevent="applyFilters">
      <div class="form-field">
        <label for="care-type-filter">Priežiūros tipas</label>

        <select id="care-type-filter" v-model="careType" :disabled="loading">
          <option value="">Visi tipai</option>
          <option value="feeding">Maitinimas</option>
          <option value="observation">Būklės stebėjimas</option>
          <option value="other">Kita priežiūra</option>
        </select>
      </div>

      <div class="form-field">
        <label for="pet-id-filter">Augintinio ID</label>

        <input id="pet-id-filter" v-model="petId" type="number" min="1" max="2147483647" step="1"
          placeholder="Visi augintiniai" :disabled="loading" />
      </div>

      <div class="filter-actions">
        <button class="primary-button" type="submit" :disabled="loading">
          Filtruoti
        </button>

        <button class="secondary-button" type="button" :disabled="loading" @click="clearFilters">
          Išvalyti
        </button>
      </div>
    </form>

    <p v-if="filterError" class="form-error" role="alert">
      {{ filterError }}
    </p>

    <p v-if="loading" class="status-message" role="status">
      Kraunami priežiūros įrašai…
    </p>

    <div v-else-if="error" class="form-error" role="alert">
      <p>{{ error }}</p>

      <button class="secondary-button" type="button" @click="loadRecords(page)">
        Bandyti dar kartą
      </button>
    </div>

    <template v-else>
      <p class="results-count" role="status">
        Rasta įrašų: {{ total }}
        <span v-if="appliedCareType">
          · {{ careTypeNames[appliedCareType] }}
        </span>
        <span v-if="appliedPetId">
          · Augintinio ID: {{ appliedPetId }}
        </span>
      </p>

      <div v-if="records.length" class="care-records-grid">
        <article v-for="record in records" :key="record.id" class="care-entry">
          <div class="care-entry-heading">
            <span class="card-label">
              Augintinis #{{ record.pet_id }}
            </span>

            <h2>
              {{ careTypeNames[record.care_type] || record.care_type }}
            </h2>

            <time :datetime="record.performed_at">
              {{ formatDateTime(record.performed_at) }}
            </time>
          </div>

          <p class="care-entry-notes">{{ record.notes }}</p>

          <RouterLink class="secondary-button button-link profile-link" :to="{
            name: 'pet-profile',
            params: { id: record.pet_id },
            query: { from: 'care-records' },
          }">
            Augintinio profilis
          </RouterLink>
        </article>
      </div>

      <div v-else class="empty-state">
        <h2>Priežiūros įrašų nerasta</h2>

        <p v-if="appliedCareType || appliedPetId">
          Pakeiskite filtrus arba juos išvalykite.
        </p>

        <p v-else>
          Pirmą priežiūros įrašą galite sukurti augintinio profilyje.
        </p>
      </div>

      <nav v-if="totalPages > 1" class="pagination" aria-label="Priežiūros įrašų puslapiai">
        <button class="secondary-button" type="button" :disabled="page <= 1" @click="loadRecords(page - 1)">
          ← Ankstesnis
        </button>

        <span>{{ page }} / {{ totalPages }}</span>

        <button class="secondary-button" type="button" :disabled="page >= totalPages" @click="loadRecords(page + 1)">
          Kitas →
        </button>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.care-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: end;
  gap: 16px;
  margin: 28px 0;
}

.care-filters input,
.care-filters select {
  width: 100%;
  min-width: 0;
  min-height: 48px;
}

.filter-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.care-records-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.care-entry {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  border: 1px solid #dce5d9;
  border-left: 4px solid #527b54;
  border-radius: 16px;
  background: #fff;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.care-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgb(32 62 48 / 8%);
}

.care-entry-heading h2 {
  margin: 10px 0;
  font-size: 21px;
}

.care-entry-heading time {
  color: #526354;
  font-size: 13px;
}

.care-entry-notes {
  margin: 20px 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.7;
}

.profile-link {
  margin-top: auto;
}

@media (max-width: 768px) {

  .care-filters,
  .care-records-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .care-entry {
    transition: none;
  }

  .care-entry:hover {
    transform: none;
  }
}
</style>