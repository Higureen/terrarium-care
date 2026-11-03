<script setup>
import { onMounted, reactive, ref } from "vue";
import { apiFetch } from "../services/auth";

const props = defineProps({
  petId: {
    type: Number,
    required: true,
  },
  record: {
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
  care_type: props.record?.care_type ?? "observation",
  notes: props.record?.notes ?? "",
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

  if (!form.notes.trim()) {
    error.value = "Įrašykite priežiūros pastabas.";
    return;
  }

  saving.value = true;

  try {
    const path = props.record
      ? `/care-records/${props.record.id}`
      : "/care-records";

    const response = await apiFetch(path, {
      method: props.record ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pet_id: props.petId,
        care_type: form.care_type,
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
        data.error || "Nepavyko išsaugoti priežiūros įrašo."
      );
    }

    emit(props.record ? "updated" : "created", data);
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
    aria-labelledby="care-form-title"
    @cancel.prevent="close"
    @close="emit('close')"
  >
    <div class="modal-heading">
      <h2 id="care-form-title">
        {{ props.record ? "Redaguoti įrašą" : "Naujas priežiūros įrašas" }}
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
          <label for="care-type">Priežiūros tipas *</label>

          <select
            id="care-type"
            v-model="form.care_type"
            required
            autofocus
          >
            <option value="observation">Būklės stebėjimas</option>
            <option value="feeding">Maitinimas</option>
            <option value="other">Kita priežiūra</option>
          </select>
        </div>

        <div class="form-field">
          <label for="care-notes">Pastabos *</label>

          <textarea
            id="care-notes"
            v-model="form.notes"
            rows="4"
            placeholder="Aprašykite atliktą veiksmą arba pastebėjimus."
            required
          ></textarea>
        </div>

        <p class="field-hint">
          {{
            props.record
              ? "Redaguojant įrašo data ir autorius nekeičiami."
              : "Įrašo datą ir autorių sistema nustatys automatiškai."
          }}
        </p>
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