<script setup>
import { ref, watch } from "vue";
import { apiFetch } from "../services/auth";

const props = defineProps({
  terrariumId: {
    type: Number,
    required: true,
  },
  lastCleaned: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["updated", "unauthorized"]);

const date = ref("");
const saving = ref(false);
const error = ref("");
const success = ref("");

watch(
  () => props.lastCleaned,
  (value) => {
    date.value = value ? value.slice(0, 10) : "";
  },
  { immediate: true }
);

async function submit() {
  if (saving.value) return;

  error.value = "";
  success.value = "";

  if (!date.value) {
    error.value = "Pasirinkite valymo datą.";
    return;
  }

  saving.value = true;

  try {
    const response = await apiFetch(
      `/terrariums/${props.terrariumId}/last-cleaned`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          last_cleaned: date.value,
        }),
      }
    );

    if (response.status === 401) {
      emit("unauthorized");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Nepavyko atnaujinti valymo datos."
      );
    }

    emit("updated", data.last_cleaned);
    success.value = "Valymo data atnaujinta.";
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
  <section class="cleaning-section" aria-labelledby="cleaning-title">
    <h2 id="cleaning-title">Terariumo valymas</h2>
    <p class="field-hint">
      Pasirinkite datą, kada terariumas buvo paskutinį kartą išvalytas.
    </p>

    <form
      class="search-form"
      :aria-busy="saving"
      @submit.prevent="submit"
    >
      <div class="form-field">
        <label for="cleaning-date">Valymo data *</label>

        <input
          id="cleaning-date"
          v-model="date"
          type="date"
          min="0001-01-01"
          max="9999-12-31"
          required
          :disabled="saving"
        />
      </div>

      <button
        class="primary-button"
        type="submit"
        :disabled="saving"
      >
        {{ saving ? "Saugoma…" : "Išsaugoti datą" }}
      </button>
    </form>

    <p v-if="error" class="form-error" role="alert">
      {{ error }}
    </p>

    <p v-if="success" class="form-success" role="status">
      {{ success }}
    </p>
  </section>
</template>