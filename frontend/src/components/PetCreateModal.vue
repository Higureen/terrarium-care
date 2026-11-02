<script setup>
import { onMounted, reactive, ref } from "vue";
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
const saving = ref(false);
const error = ref("");

const form = reactive({
  name: props.pet?.name ?? "",
  species: props.pet?.species ?? "",
  arrival_date: props.pet?.arrival_date?.slice(0, 10) ?? "",
  notes: props.pet?.notes ?? "",
});

onMounted(() => {
  dialog.value.showModal();
});

function close() {
  if (!saving.value) {
    dialog.value.close();
  }
}

async function submit() {
  if (saving.value) return;

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
        terrarium_id: props.terrariumId,
        name: form.name.trim(),
        species: form.species.trim(),
        arrival_date: form.arrival_date,
        notes: form.notes.trim(),
      }),
    });

    if (response.status === 401) {
      emit("unauthorized");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Nepavyko išsaugoti augintinio."
      );
    }

    emit(props.pet ? "updated" : "created", data);
  } catch (err) {
    error.value =
      err instanceof TypeError
        ? "Nepavyko susisiekti su serveriu. Bandykite dar kartą."
        : err.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="modal"
    aria-labelledby="pet-form-title"
    @cancel.prevent="close"
    @close="emit('close')"
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

    <form
      class="auth-form"
      :aria-busy="saving"
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
            autofocus
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