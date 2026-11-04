<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { apiFetch } from "../services/auth";

const props = defineProps({
  terrariumId: {
    type: Number,
    required: true,
  },
  pet: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  "close",
  "created",
  "updated",
  "unauthorized",
]);

const dialog = ref(null);
const loading = ref(Boolean(props.pet));
const loaded = ref(!props.pet);
const saving = ref(false);
const error = ref("");
const loadError = ref("");

let disposed = false;

const form = reactive({
  terrarium_id: props.terrariumId,
  name: "",
  species: "",
  arrival_date: "",
  notes: "",
});

function close() {
  if (saving.value) return;

  dialog.value?.close();
  emit("close");
}

async function loadPet() {
  if (!props.pet) return;

  loading.value = true;
  loaded.value = false;
  loadError.value = "";

  try {
    const response = await apiFetch(`/pets/${props.pet.id}`);

    if (disposed) return;

    if (response.status === 401) {
      emit("unauthorized");
      return;
    }

    const data = await response.json();

    if (disposed) return;

    if (!response.ok) {
      throw new Error(data.error || "Nepavyko gauti augintinio.");
    }

    form.terrarium_id = Number(data.terrarium_id);
    form.name = data.name;
    form.species = data.species;
    form.arrival_date = data.arrival_date
      ? String(data.arrival_date).slice(0, 10)
      : "";
    form.notes = data.notes ?? "";

    loaded.value = true;
  } catch (err) {
    if (disposed) return;

    loadError.value =
      err instanceof TypeError
        ? "Nepavyko susisiekti su serveriu. Bandykite dar kartą."
        : err.message;
  } finally {
    if (!disposed) {
      loading.value = false;
    }
  }
}

async function submit() {
  if (saving.value || loading.value || !loaded.value) return;

  error.value = "";

  if (!form.name.trim() || !form.species.trim()) {
    error.value = "Įrašykite augintinio vardą ir rūšį.";
    return;
  }

  if (!form.arrival_date) {
    error.value = "Pasirinkite atvykimo datą.";
    return;
  }

  saving.value = true;

  try {
    const path = props.pet
      ? `/pets/${props.pet.id}`
      : "/pets";

    const response = await apiFetch(path, {
      method: props.pet ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        terrarium_id: form.terrarium_id,
        name: form.name.trim(),
        species: form.species.trim(),
        arrival_date: form.arrival_date,
        notes: form.notes.trim(),
      }),
    });

    if (disposed) return;

    if (response.status === 401) {
      emit("unauthorized");
      return;
    }

    const data = await response.json();

    if (disposed) return;

    if (!response.ok) {
      throw new Error(data.error || "Nepavyko išsaugoti augintinio.");
    }

    emit(props.pet ? "updated" : "created", data);
  } catch (err) {
    if (disposed) return;

    error.value =
      err instanceof TypeError
        ? "Nepavyko susisiekti su serveriu. Bandykite dar kartą."
        : err.message;
  } finally {
    if (!disposed) {
      saving.value = false;
    }
  }
}

onMounted(() => {
  dialog.value?.showModal();

  if (props.pet) {
    loadPet();
  }
});

onBeforeUnmount(() => {
  disposed = true;
});
</script>

<template>
  <dialog
    ref="dialog"
    class="modal"
    aria-labelledby="pet-form-title"
    :aria-busy="loading || saving"
    @cancel.prevent="close"
  >
    <div class="modal-heading">
      <h2 id="pet-form-title">
        {{ props.pet ? "Redaguoti augintinį" : "Naujas augintinis" }}
      </h2>

      <button
        class="secondary-button"
        type="button"
        aria-label="Uždaryti langą"
        :disabled="saving"
        @click="close"
      >
        ×
      </button>
    </div>

    <p v-if="loading" class="status-message" role="status">
      Kraunama augintinio informacija…
    </p>

    <div v-else-if="loadError" class="form-error" role="alert">
      <p>{{ loadError }}</p>

      <button
        class="secondary-button"
        type="button"
        @click="loadPet"
      >
        Bandyti dar kartą
      </button>
    </div>

    <form
      v-else-if="loaded"
      class="auth-form"
      @submit.prevent="submit"
    >
      <fieldset class="modal-fields" :disabled="saving">
        <div class="form-field">
          <label for="pet-name">Vardas *</label>

          <input
            id="pet-name"
            v-model="form.name"
            type="text"
            required
          />
        </div>

        <div class="form-field">
          <label for="pet-species">Rūšis *</label>

          <input
            id="pet-species"
            v-model="form.species"
            type="text"
            placeholder="Pvz., Litoria caerulea"
            required
          />
        </div>

        <div class="form-field">
          <label for="pet-arrival">Atvykimo data *</label>

          <input
            id="pet-arrival"
            v-model="form.arrival_date"
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            required
          />
        </div>

        <div class="form-field">
          <label for="pet-notes">Pastabos</label>

          <textarea
            id="pet-notes"
            v-model="form.notes"
            rows="3"
          ></textarea>
        </div>
      </fieldset>

      <p v-if="error" class="form-error" role="alert">
        {{ error }}
      </p>

      <div class="modal-actions">
        <button
          class="secondary-button"
          type="button"
          :disabled="saving"
          @click="close"
        >
          Atšaukti
        </button>

        <button
          class="primary-button"
          type="submit"
          :disabled="saving"
        >
          {{ saving ? "Saugoma…" : "Išsaugoti" }}
        </button>
      </div>
    </form>
  </dialog>
</template>