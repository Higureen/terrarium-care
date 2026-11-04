<script setup>
import { ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { auth, apiFetch } from "../services/auth";
import CareRecordCreateModal from "../components/CareRecordCreateModal.vue";
import CareRecordDeleteModal from "../components/CareRecordDeleteModal.vue";

const route = useRoute();
const router = useRouter();

const profile = ref(null);
const loading = ref(false);
const error = ref("");
const successMessage = ref("");
const showCareCreate = ref(false);
const editingRecord = ref(null);
const deletingRecord = ref(null);

let requestNumber = 0;

const careTypeNames = {
  feeding: "Maitinimas",
  observation: "Būklės stebėjimas",
  other: "Kita priežiūra",
};

function canModifyRecord(record) {
  const user = auth.user;

  if (!user) return false;

  if (["manager", "admin"].includes(user.role)) {
    return true;
  }

  return (
    user.role === "worker" &&
    record.created_by != null &&
    Number(record.created_by) === Number(user.id)
  );
}

async function loadProfile() {
  const currentRequest = ++requestNumber;
  const id = encodeURIComponent(String(route.params.id));

  loading.value = true;
  error.value = "";
  profile.value = null;

  try {
    const response = await apiFetch(`/pets/${id}/profile`);

    if (currentRequest !== requestNumber) return;

    if (response.status === 401) {
      await router.push("/login");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Nepavyko gauti augintinio profilio."
      );
    }

    if (currentRequest !== requestNumber) return;

    profile.value = data;
  } catch (err) {
    if (currentRequest !== requestNumber) return;

    error.value =
      err instanceof TypeError
        ? "Nepavyko susisiekti su serveriu. Bandykite dar kartą."
        : err.message;
  } finally {
    if (currentRequest === requestNumber) {
      loading.value = false;
    }
  }
}

function openCareCreate() {
  editingRecord.value = null;
  successMessage.value = "";
  showCareCreate.value = true;
}

function openCareEdit(record) {
  editingRecord.value = record;
  successMessage.value = "";
  showCareCreate.value = true;
}

async function handleCareCreated() {
  showCareCreate.value = false;
  successMessage.value = "Priežiūros įrašas sukurtas.";

  await loadProfile();
}

async function handleCareUpdated() {
  showCareCreate.value = false;
  editingRecord.value = null;
  successMessage.value = "Priežiūros įrašas atnaujintas.";

  await loadProfile();
}
function openCareDelete(record) {
  successMessage.value = "";
  deletingRecord.value = record;
}

async function handleCareDeleted() {
  deletingRecord.value = null;
  successMessage.value = "Priežiūros įrašas ištrintas.";

  await loadProfile();
}
function handleUnauthorized() {
  showCareCreate.value = false;
  deletingRecord.value = null;
  router.push("/login");
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : "Nenurodyta";
}

function formatDateTime(value) {
  if (!value) return "Nenurodyta";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Nenurodyta";

  return new Intl.DateTimeFormat("lt-LT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

watch(
  () => route.params.id,
  () => {
    showCareCreate.value = false;
    editingRecord.value = null;
    deletingRecord.value = null;
    successMessage.value = "";
    loadProfile();
  },
  { immediate: true }
);
</script>

<template>
  <section>
    <RouterLink v-if="route.query.from === 'care-records'" class="back-link" to="/care-records">
      ← Priežiūros įrašai
    </RouterLink>

    <RouterLink v-else-if="route.query.from === 'pets'" class="back-link" to="/pets">
      ← Visi augintiniai
    </RouterLink>

    <RouterLink v-else-if="profile" class="back-link" :to="`/terrariums/${profile.terrarium.id}`">
      ← Į terariumą
    </RouterLink>

    <RouterLink v-else class="back-link" to="/terrariums">
      ← Visi terariumai
    </RouterLink>

    <p v-if="loading" class="status-message" role="status">
      Kraunamas augintinio profilis…
    </p>

    <div v-else-if="error" class="form-error" role="alert">
      <p>{{ error }}</p>

      <button class="secondary-button" type="button" @click="loadProfile">
        Bandyti dar kartą
      </button>
    </div>

    <template v-else-if="profile">
      <p class="eyebrow">AUGINTINIO PROFILIS</p>
      <h1>{{ profile.pet.name }}</h1>
      <p class="page-description">{{ profile.pet.species }}</p>

      <div class="details-panel">
        <dl class="conditions details-conditions">
          <div>
            <dt>Atvykimo data</dt>
            <dd>{{ formatDate(profile.pet.arrival_date) }}</dd>
          </div>

          <div>
            <dt>Terariumas</dt>
            <dd>
              <RouterLink :to="{
                name: 'terrarium-details',
                params: { id: profile.terrarium.id },
              }">
                {{ profile.terrarium.name }}
              </RouterLink>
            </dd>
          </div>

          <div>
            <dt>Laikymo sąlygos</dt>
            <dd>
              {{ profile.terrarium.temperature_min }}–{{ profile.terrarium.temperature_max }} °C
              <br />
              {{ profile.terrarium.humidity_min }}–{{ profile.terrarium.humidity_max }} %
              drėgmė
            </dd>
          </div>
        </dl>

        <p v-if="profile.pet.notes" class="card-notes">
          {{ profile.pet.notes }}
        </p>
      </div>

      <div class="page-heading pets-heading">
        <div class="section-heading">
          <h2>Priežiūros istorija</h2>
          <span class="count-badge">
            {{ profile.care_records.length }}
          </span>
        </div>

        <button class="primary-button" type="button" @click="openCareCreate">
          + Priežiūros įrašas
        </button>
      </div>

      <p v-if="successMessage" class="form-success" role="status">
        {{ successMessage }}
      </p>

      <div v-if="profile.care_records.length" class="care-list">
        <article v-for="record in profile.care_records" :key="record.id" class="care-record">
          <div class="care-record-heading">
            <h3>
              {{ careTypeNames[record.care_type] || record.care_type }}
            </h3>

            <time :datetime="record.performed_at">
              {{ formatDateTime(record.performed_at) }}
            </time>
          </div>

          <p>{{ record.notes }}</p>

          <div v-if="canModifyRecord(record)" class="care-record-actions">
            <button class="secondary-button" type="button" @click="openCareEdit(record)">
              Redaguoti
            </button>

            <button class="danger-button" type="button" @click="openCareDelete(record)">
              Ištrinti
            </button>
          </div>

          <div v-else class="empty-state">
            <h2>Priežiūros įrašų dar nėra</h2>
            <p>
              Pridėkite maitinimą, būklės stebėjimą ar kitą priežiūros veiksmą.
            </p>
          </div>
        </article>
      </div>
    </template>

    <CareRecordCreateModal v-if="showCareCreate && profile" :pet-id="Number(profile.pet.id)" :record="editingRecord"
      @close="showCareCreate = false" @created="handleCareCreated" @updated="handleCareUpdated"
      @unauthorized="handleUnauthorized" />
    <CareRecordDeleteModal v-if="deletingRecord" :record="deletingRecord" @close="deletingRecord = null"
      @deleted="handleCareDeleted" @unauthorized="handleUnauthorized" />
  </section>
</template>