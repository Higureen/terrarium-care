<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { apiFetch } from "../services/auth";

const props = defineProps({
  recordId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["close", "unauthorized"]);

const dialog = ref(null);
const record = ref(null);
const loading = ref(false);
const error = ref("");

let disposed = false;

const careTypeNames = {
  feeding: "Maitinimas",
  observation: "Būklės stebėjimas",
  other: "Kita priežiūra",
};

function closeModal() {
  dialog.value?.close();
  emit("close");
}

async function loadRecord() {
  if (loading.value) return;

  loading.value = true;
  error.value = "";

  try {
    const response = await apiFetch(
      `/care-records/${props.recordId}`,
    );

    if (disposed) return;

    if (response.status === 401) {
      emit("unauthorized");
      return;
    }

    const data = await response.json();

    if (disposed) return;

    if (!response.ok) {
      throw new Error(data.error || "Nepavyko gauti priežiūros įrašo.");
    }

    record.value = data;
  } catch (err) {
    if (disposed) return;

    error.value =
      err instanceof TypeError
        ? "Nepavyko susisiekti su serveriu. Bandykite dar kartą."
        : err.message;
  } finally {
    if (!disposed) {
      loading.value = false;
    }
  }
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

onMounted(() => {
  dialog.value?.showModal();
  loadRecord();
});

onBeforeUnmount(() => {
  disposed = true;
});
</script>

<template>
  <dialog
    ref="dialog"
    class="modal"
    aria-labelledby="care-details-title"
    :aria-busy="loading"
    @cancel.prevent="closeModal"
  >
    <div class="modal-heading">
      <h2 id="care-details-title">Priežiūros įrašas</h2>

      <button
        class="secondary-button"
        type="button"
        aria-label="Uždaryti langą"
        autofocus
        @click="closeModal"
      >
        ✕
      </button>
    </div>

    <p v-if="loading" class="status-message" role="status">
      Kraunama įrašo informacija…
    </p>

    <div v-else-if="error" class="form-error" role="alert">
      <p>{{ error }}</p>

      <button
        class="secondary-button"
        type="button"
        @click="loadRecord"
      >
        Bandyti dar kartą
      </button>
    </div>

    <template v-else-if="record">
      <dl class="record-details">
        <div>
          <dt>Priežiūros tipas</dt>
          <dd>
            {{ careTypeNames[record.care_type] || record.care_type }}
          </dd>
        </div>

        <div>
          <dt>Atlikimo laikas</dt>
          <dd>{{ formatDateTime(record.performed_at) }}</dd>
        </div>

        <div>
          <dt>Augintinis</dt>
          <dd>
            <RouterLink
              class="record-pet-link"
              :to="{
                name: 'pet-profile',
                params: { id: record.pet_id },
                query: { from: 'care-records' },
              }"
              @click="closeModal"
            >
              Atidaryti augintinio #{{ record.pet_id }} profilį
            </RouterLink>
          </dd>
        </div>
      </dl>

      <div class="record-notes">
        <h3>Pastabos</h3>
        <p>{{ record.notes || "Pastabų nėra." }}</p>
      </div>
    </template>

    <div class="modal-actions">
      <button
        class="secondary-button"
        type="button"
        @click="closeModal"
      >
        Uždaryti
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.record-details {
  display: grid;
  gap: 20px;
  margin: 24px 0;
}

.record-details dt {
  margin-bottom: 6px;
  color: #526354;
  font-size: 13px;
}

.record-details dd {
  margin: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.record-pet-link {
  color: #275d42;
  text-underline-offset: 4px;
}

.record-notes {
  margin-bottom: 24px;
  padding: 18px;
  border-radius: 12px;
  background: #f3f5ef;
}

.record-notes h3 {
  margin: 0 0 10px;
  font-size: 16px;
}

.record-notes p {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.7;
}
</style>