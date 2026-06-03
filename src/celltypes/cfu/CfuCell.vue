<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import confetti from 'canvas-confetti';
import type { Cell } from '@schemas/notebook';
import type { Locale } from '@/i18n';
import { RENDERER_LABELS } from '@/i18n';
import { notebookStore } from '@store/notebookStore';
import type { CfuConfig } from './types';

const props = defineProps<{
  cell: Cell;
  locale: Locale | null;
  editMode?: boolean;
}>();

const labels = computed(() => RENDERER_LABELS[props.locale ?? 'en-US']);

const config = ref<CfuConfig | null>(null);
const parseError = ref<string | null>(null);
const localAnswer = ref('');
const hasSubmitted = ref(false);
const isCorrect = ref(false);

// JSON editor state
const isEditing = ref(false);
const editJson = ref('');

watch(() => props.editMode, newVal => {
  if (!newVal && isEditing.value) closeEdit();
});

const displayConfig = computed(() => {
  if (!config.value) return null;
  const override = props.locale ? config.value.i18n?.[props.locale] : undefined;
  return {
    question: override?.question ?? config.value.question,
    options: override?.options ?? config.value.options,
    answer: override?.answer ?? config.value.answer,
  };
});

function parse() {
  try {
    const source = (props.cell.source ?? []).join('').trim();
    if (!source) throw new Error('Empty CFU cell');
    const parsed = JSON.parse(source) as CfuConfig;
    if (!parsed.question_type || !parsed.question || parsed.answer === undefined) {
      throw new Error('CFU cell requires question_type, question, and answer fields');
    }
    config.value = parsed;
    parseError.value = null;

    if (parsed.submitted_answer) {
      localAnswer.value = parsed.submitted_answer;
      hasSubmitted.value = true;
      const effectiveAnswer = (props.locale ? parsed.i18n?.[props.locale]?.answer : undefined) ?? parsed.answer;
      isCorrect.value = parsed.submitted_answer.trim().toLowerCase() === effectiveAnswer.trim().toLowerCase();
    } else {
      localAnswer.value = '';
      hasSubmitted.value = false;
      isCorrect.value = false;
    }
  } catch (err) {
    parseError.value = err instanceof Error ? err.message : 'Invalid CFU configuration';
    config.value = null;
  }
}

function enterEdit() {
  if (!props.editMode) return;
  editJson.value = (props.cell.source ?? []).join('').trim();
  isEditing.value = true;
}

function closeEdit() {
  notebookStore.setSource(props.cell.id, [editJson.value]);
  isEditing.value = false;
  parse();
}

function submit() {
  if (!displayConfig.value || !localAnswer.value.trim()) return;
  const correct = localAnswer.value.trim().toLowerCase() === displayConfig.value.answer.trim().toLowerCase();
  isCorrect.value = correct;
  hasSubmitted.value = true;
  saveAnswer(localAnswer.value);
  if (correct && config.value?.animation !== false) {
    launchConfetti();
  }
}

function reset() {
  localAnswer.value = '';
  hasSubmitted.value = false;
  isCorrect.value = false;
  saveAnswer('');
}

function saveAnswer(answer: string) {
  try {
    const parsed = JSON.parse((props.cell.source ?? []).join('').trim()) as CfuConfig;
    parsed.submitted_answer = answer;
    notebookStore.setSource(props.cell.id, [JSON.stringify(parsed, null, 2)]);
  } catch {
    // source is malformed; parse() will have already surfaced the error
  }
}

function launchConfetti() {
  const end = Date.now() + 1500;
  const colors = ['#ff595e', '#ffca3a', '#6a4c93', '#1982c4', '#8ac926'];

  (function frame() {
    confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  }());
}

onMounted(() => parse());
watch(() => props.locale, () => parse());
</script>

<template>
  <v-card max-width="800" class="cfu-card ma-auto my-2" variant="outlined">

    <!-- JSON editor (edit mode) -->
    <template v-if="isEditing">
      <v-card-text>
        <v-textarea
          v-model="editJson"
          auto-grow
          variant="outlined"
          hide-details
          rows="6"
          autofocus
          density="compact"
          class="cfu-json-editor"
        />
      </v-card-text>
      <v-card-actions class="pt-0 px-4 pb-3">
        <v-spacer />
        <v-btn variant="tonal" size="small" @click="closeEdit">{{ labels.close }}</v-btn>
      </v-card-actions>
    </template>

    <!-- Normal CFU widget -->
    <template v-else>
      <!-- Edit icon (visible in edit mode) -->
      <v-icon
        v-if="editMode"
        class="cfu-edit-icon"
        size="small"
        @click.stop="enterEdit"
      >
        mdi-pencil-outline
      </v-icon>

      <v-alert
        v-if="parseError"
        type="error"
        variant="tonal"
        :text="parseError"
        class="ma-4"
      />

      <template v-else-if="config && displayConfig">
        <v-card-text class="cfu-question">
          <v-icon size="18" class="cfu-icon mr-2">mdi-help-circle-outline</v-icon>
          <span class="text-body-1 font-weight-medium">{{ displayConfig.question }}</span>
        </v-card-text>

        <v-divider />

        <v-card-text class="pb-0">
          <!-- Freeform -->
          <v-text-field
            v-if="config.question_type === 'freeform'"
            v-model="localAnswer"
            :disabled="hasSubmitted"
            variant="outlined"
            density="compact"
            hide-details
            @keyup.enter="!hasSubmitted && submit()"
          />

          <!-- Multiple choice -->
          <v-radio-group
            v-else-if="config.question_type === 'multiple_choice'"
            v-model="localAnswer"
            :disabled="hasSubmitted"
            hide-details
            class="mt-0"
          >
            <v-radio
              v-for="opt in displayConfig.options"
              :key="opt.key"
              :label="`${opt.key.toUpperCase()}. ${opt.text}`"
              :value="opt.key"
            />
          </v-radio-group>

          <!-- True / False -->
          <v-radio-group
            v-else-if="config.question_type === 'true_false'"
            v-model="localAnswer"
            :disabled="hasSubmitted"
            hide-details
            class="mt-0"
          >
            <v-radio :label="labels.cfuTrue" value="True" />
            <v-radio :label="labels.cfuFalse" value="False" />
          </v-radio-group>
        </v-card-text>

        <!-- Result feedback -->
        <v-card-text v-if="hasSubmitted" class="pt-3 pb-0">
          <v-alert
            v-if="isCorrect"
            type="success"
            variant="tonal"
            :text="labels.cfuCorrect"
            density="compact"
          />
          <v-alert
            v-else
            type="error"
            variant="tonal"
            density="compact"
          >
            {{ labels.cfuIncorrect }}&nbsp;
            {{ labels.cfuCorrectAnswer }}:
            <strong>{{ displayConfig.answer }}</strong>
          </v-alert>
        </v-card-text>

        <!-- Actions -->
        <v-card-actions class="px-4 pb-4 pt-3">
          <v-btn
            v-if="!hasSubmitted"
            color="primary"
            variant="elevated"
            size="small"
            :disabled="!localAnswer.trim()"
            @click="submit"
          >
            {{ labels.cfuSubmit }}
          </v-btn>
          <v-btn
            v-else
            variant="tonal"
            size="small"
            @click="reset"
          >
            {{ labels.cfuReset }}
          </v-btn>
        </v-card-actions>
      </template>
    </template>
  </v-card>
</template>

<style scoped>
.cfu-card {
  border-color: rgba(var(--v-theme-primary), 0.3);
  border-left: 4px solid rgb(var(--v-theme-primary));
  position: relative;
}

.cfu-question {
  display: flex;
  align-items: flex-start;
  padding-top: 16px;
  padding-bottom: 14px;
}

.cfu-icon {
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
  margin-top: 2px;
}

.cfu-edit-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0.4;
  transition: opacity 0.15s;
  color: rgba(var(--v-theme-on-surface), 0.6);
  cursor: pointer;
  z-index: 1;
}

.cfu-card:hover .cfu-edit-icon {
  opacity: 0.8;
}

.cfu-json-editor :deep(textarea) {
  font-family: monospace;
  font-size: 0.85rem;
}
</style>
