<script setup>
import { onMounted, ref } from "vue";
import { apiFetch } from "../services/auth";

const props = defineProps({
  record: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "deleted", "unauthorized"]);

const dialog = ref(null);
const deleting = ref(false);
const error = ref("");

onMounted(() => {
  dialog.value.showModal();
});

function close() {
  if (!deleting.value) {
    dialog.value.close();
  }
}

async function remove() {
  if (deleting.value) return;

  deleting.value = true;
  error.value = "";

  try {
    const response = await apiFetch(`/care-records/${props.record.id}`, {
      method: "DELETE",
    });

    if (response.status === 401) {
      emit("unauthorized");
      return;
    }

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Nepavyko ištrinti priežiūros įrašo.");
    }

    emit("deleted");
  } catch (err) {
    error.value =
      err instanceof TypeError
        ? "Nepavyko susisiekti su serveriu. Bandykite dar kartą."
        : err.message;
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="modal"
    aria-labelledby="delete-care-title"
    aria-describedby="delete-care-description"
    @cancel.prevent="close"
    @close="emit('close')"
  >
    <div class="modal-heading">
      <h2 id="delete-care-title">Ištrinti priežiūros įrašą?</h2>
    </div>

    <p id="delete-care-description">
      Įrašas bus pašalintas iš augintinio priežiūros istorijos.
      Šio veiksmo atšaukti negalėsite.
    </p>

    <blockquote class="record-preview">
      {{ props.record.notes }}
    </blockquote>

    <p v-if="error" class="form-error" role="alert">
      {{ error }}
    </p>

    <div class="modal-actions delete-actions">
      <button
        class="secondary-button"
        type="button"
        autofocus
        :disabled="deleting"
        @click="close"
      >
        Atšaukti
      </button>

      <button
        class="danger-button"
        type="button"
        :disabled="deleting"
        @click="remove"
      >
        {{ deleting ? "Trinama…" : "Ištrinti" }}
      </button>
    </div>
  </dialog>
</template>