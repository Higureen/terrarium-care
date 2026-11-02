<script setup>
import { ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { auth, apiFetch } from "../services/auth";
import PetCreateModal from "../components/PetCreateModal.vue";
import PetDeleteModal from "../components/PetDeleteModal.vue";

const route = useRoute();
const router = useRouter();

const terrarium = ref(null);
const pets = ref([]);
const loading = ref(false);
const error = ref("");
const showPetCreate = ref(false);
const successMessage = ref("");
const editingPet = ref(null);
const deletingPet = ref(null);

let requestNumber = 0;

function openPetCreate() {
  editingPet.value = null;
  successMessage.value = "";
  showPetCreate.value = true;
}

function openPetEdit(pet) {
  editingPet.value = pet;
  successMessage.value = "";
  showPetCreate.value = true;
}

function openPetDelete(pet) {
  successMessage.value = "";
  deletingPet.value = pet;
}

async function handlePetCreated() {
  showPetCreate.value = false;
  successMessage.value = "Augintinis sėkmingai pridėtas.";

  await loadDetails();
}

async function handlePetUpdated() {
  showPetCreate.value = false;
  editingPet.value = null;
  successMessage.value = "Augintinio informacija atnaujinta.";

  await loadDetails();
}

async function handlePetDeleted() {
  deletingPet.value = null;
  successMessage.value = "Augintinis ištrintas.";

  await loadDetails();
}

function handleUnauthorized() {
  showPetCreate.value = false;
  deletingPet.value = null;
  router.push("/login");
}

async function loadDetails() {
  const currentRequest = ++requestNumber;
  const id = encodeURIComponent(String(route.params.id));

  loading.value = true;
  error.value = "";
  terrarium.value = null;
  pets.value = [];

  try {
    const terrariumResponse = await apiFetch(`/terrariums/${id}`);

    if (currentRequest !== requestNumber) return;

    if (terrariumResponse.status === 401) {
      await router.push("/login");
      return;
    }

    const terrariumData = await terrariumResponse.json();

    if (!terrariumResponse.ok) {
      throw new Error(
        terrariumData.error || "Nepavyko gauti terariumo."
      );
    }

    const petsResponse = await apiFetch(`/terrariums/${id}/pets`);

    if (currentRequest !== requestNumber) return;

    if (petsResponse.status === 401) {
      await router.push("/login");
      return;
    }

    const petsData = await petsResponse.json();

    if (!petsResponse.ok) {
      throw new Error(
        petsData.error || "Nepavyko gauti augintinių."
      );
    }

    if (currentRequest !== requestNumber) return;

    terrarium.value = terrariumData;
    pets.value = petsData;
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

function formatDate(value) {
  if (!value) return "Nenurodyta";

  return String(value).slice(0, 10);
}

watch(() => route.params.id, loadDetails, { immediate: true });
</script>

<template>
  <section>
    <RouterLink class="back-link" to="/terrariums">
      ← Visi terariumai
    </RouterLink>

    <p v-if="loading" class="status-message" role="status">
      Kraunama terariumo informacija…
    </p>

    <div v-else-if="error" class="form-error" role="alert">
      <p>{{ error }}</p>

      <button
        class="secondary-button"
        type="button"
        @click="loadDetails"
      >
        Bandyti dar kartą
      </button>
    </div>

    <template v-else-if="terrarium">
      <p class="eyebrow">TERARIUMO INFORMACIJA</p>
      <h1>{{ terrarium.name }}</h1>

      <div class="details-panel">
        <dl class="conditions details-conditions">
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
      </div>

      <div class="page-heading pets-heading">
        <div class="section-heading">
          <h2>Augintiniai</h2>
          <span class="count-badge">{{ pets.length }}</span>
        </div>

        <button
          v-if="['manager', 'admin'].includes(auth.user?.role)"
          class="primary-button"
          type="button"
          @click="openPetCreate"
        >
          + Naujas augintinis
        </button>
      </div>

      <p v-if="successMessage" class="form-success" role="status">
        {{ successMessage }}
      </p>

      <div v-if="pets.length" class="terrarium-grid">
        <article
          v-for="pet in pets"
          :key="pet.id"
          class="terrarium-card"
        >
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
            <RouterLink
              class="secondary-button button-link"
              :to="{
                name: 'pet-profile',
                params: { id: pet.id },
              }"
            >
              Profilis
            </RouterLink>

            <template
              v-if="['manager', 'admin'].includes(auth.user?.role)"
            >
              <button
                class="secondary-button"
                type="button"
                @click="openPetEdit(pet)"
              >
                Redaguoti
              </button>

              <button
                class="danger-button"
                type="button"
                @click="openPetDelete(pet)"
              >
                Ištrinti
              </button>
            </template>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <h2>Šiame terariume augintinių dar nėra</h2>
        <p>Čia bus rodomi šiam terariumui priskirti augintiniai.</p>
      </div>
    </template>

    <PetCreateModal
      v-if="showPetCreate && terrarium"
      :terrarium-id="Number(terrarium.id)"
      :pet="editingPet"
      @close="showPetCreate = false"
      @created="handlePetCreated"
      @updated="handlePetUpdated"
      @unauthorized="handleUnauthorized"
    />

    <PetDeleteModal
      v-if="deletingPet"
      :pet="deletingPet"
      @close="deletingPet = null"
      @deleted="handlePetDeleted"
      @unauthorized="handleUnauthorized"
    />
  </section>
</template>