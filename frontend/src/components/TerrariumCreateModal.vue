<script setup>
import { onMounted, reactive, ref } from "vue";
import { apiFetch } from "../services/auth";

const props = defineProps({
  terrarium: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "created", "updated", "unauthorized"]);

const dialog = ref(null);
const saving = ref(false);
const error = ref("");

const form = reactive({
  name: props.terrarium?.name ?? "",
  temperature_min: Number(props.terrarium?.temperature_min ?? 24),
  temperature_max: Number(props.terrarium?.temperature_max ?? 28),
  humidity_min: Number(props.terrarium?.humidity_min ?? 60),
  humidity_max: Number(props.terrarium?.humidity_max ?? 80),
  last_cleaned: props.terrarium?.last_cleaned?.slice(0, 10) ?? "",
  notes: props.terrarium?.notes ?? "",
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

  if (!form.name.trim()) {
    error.value = "Įrašykite terariumo pavadinimą.";
    return;
  }

  if (
    form.temperature_min > form.temperature_max ||
    form.humidity_min > form.humidity_max
  ) {
    error.value = "Minimali riba negali būti didesnė už maksimalią.";
    return;
  }

  saving.value = true;

  try {
    const path = props.terrarium ? `/terrariums/${props.terrarium.id}` : "/terrariums";

    const response = await apiFetch(path, {
      method: props.terrarium ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        name: form.name.trim(),
        notes: form.notes.trim(),
        last_cleaned: form.last_cleaned || null,
      }),
    });
    if (response.status === 401) {
      emit("unauthorized");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Nepavyko išsaugoti terariumo.");
    }

    emit(props.terrarium ? "updated" : "created", data);
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
    aria-labelledby="create-terrarium-title"
    @cancel.prevent="close"
    @close="emit('close')"
  >
    <div class="modal-heading">
      <h2 id="create-terrarium-title">
        {{ props.terrarium ? "Redaguoti terariumą" : "Naujas terariumas" }}
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

    <form class="auth-form" :aria-busy="saving" @submit.prevent="submit">
      <fieldset class="modal-fields" :disabled="saving">
        <div class="form-field">
          <label for="terrarium-name">Pavadinimas *</label>
          <input id="terrarium-name" v-model="form.name" type="text" required autofocus />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="temperature-min">Min. temperatūra (°C) *</label>
            <input
              id="temperature-min"
              v-model.number="form.temperature_min"
              type="number"
              step="0.1"
              required
            />
          </div>

          <div class="form-field">
            <label for="temperature-max">Maks. temperatūra (°C) *</label>
            <input
              id="temperature-max"
              v-model.number="form.temperature_max"
              type="number"
              step="0.1"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="humidity-min">Min. drėgmė (%) *</label>
            <input
              id="humidity-min"
              v-model.number="form.humidity_min"
              type="number"
              min="0"
              max="100"
              step="0.1"
              required
            />
          </div>

          <div class="form-field">
            <label for="humidity-max">Maks. drėgmė (%) *</label>
            <input
              id="humidity-max"
              v-model.number="form.humidity_max"
              type="number"
              min="0"
              max="100"
              step="0.1"
              required
            />
          </div>
        </div>

        <div class="form-field">
          <label for="last-cleaned">Paskutinio valymo data</label>
          <input id="last-cleaned" v-model="form.last_cleaned" type="date" />
        </div>

        <div class="form-field">
          <label for="terrarium-notes">Pastabos</label>
          <textarea id="terrarium-notes" v-model="form.notes" rows="3"></textarea>
        </div>
      </fieldset>

      <p v-if="error" class="form-error" role="alert">
        {{ error }}
      </p>

      <div class="modal-actions">
        <button class="secondary-button" type="button" :disabled="saving" @click="close">
          Atšaukti
        </button>

        <button class="primary-button" type="submit" :disabled="saving">
          {{ saving ? "Saugoma…" : "Išsaugoti" }}
        </button>
      </div>
    </form>
  </dialog>
</template>
