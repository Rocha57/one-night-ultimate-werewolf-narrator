<template>
  <div class="audio-sequence">
    <div>
      <div v-if="currentSprite">
        <img :src="currentSprite" alt="role sprite" class="role-sprite" />
      </div>
      <p v-if="currentAudioLabel">
        {{ language === 'en' ? 'Now playing: ' : 'A reproduzir: ' }}{{ currentAudioLabel }}
      </p>
      <p v-else-if="countdown > 0">
        {{ language === 'en' ? 'Next audio in ' + countdown + '...' : 'Próximo áudio em ' + countdown + '...' }}
      </p>
      <p v-else>
        {{ language === 'en' ? 'Audio sequence finished.' : 'Sequência de áudios terminada.' }}
      </p>
      <div v-if="currentAudioLabel && countdown === 0" style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
        <button v-if="!paused" @click="pauseAudio">{{ language === 'en' ? 'Pause' : 'Pausar' }}</button>
        <button v-else @click="resumeAudio">{{ language === 'en' ? 'Resume' : 'Retomar' }}</button>
        <button @click="stopAudioAndReturn" style="background: #e53935;">{{ language === 'en' ? 'Stop' : 'Parar' }}</button>
      </div>
      <div v-else-if="countdown > 0" style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
        <button disabled>{{ language === 'en' ? 'Pause' : 'Pausar' }}</button>
        <button @click="stopAudioAndReturn" style="background: #e53935;">{{ language === 'en' ? 'Stop' : 'Parar' }}</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onUnmounted, onMounted } from 'vue';
const emit = defineEmits(['stop']);

const props = defineProps<{
  roles: string[];
  onSequenceEnd: () => void;
  language: 'en' | 'pt-br';
}>();

const language = props.language;
const sequenceStarted = ref(false);
const currentAudioLabel = ref<string | null>(null);
const audioQueue = ref<HTMLAudioElement[]>([]);
let currentIdx = 0;
const countdown = ref(0);
const paused = ref(false);
let currentAudio: HTMLAudioElement | null = null;
let stopped = false;

// Map audio label to role key for sprite lookup
const labelToRole: Record<string, string> = {
  'Werewolf Wake Up': 'werewolf',
  'Lone Wolf Option': 'werewolf',
  'Werewolf Close Eyes': 'werewolf',
  'Minion Wake Up': 'minion',
  'Minion Thumb': 'minion',
  'Minion Close Eyes': 'minion',
  'Mason Wake Up': 'mason',
  'Mason Close Eyes': 'mason',
  'Seer Wake Up': 'seer',
  'Seer Close Eyes': 'seer',
  'Robber Wake Up': 'robber',
  'Robber Close Eyes': 'robber',
  'Troublemaker Wake Up': 'troublemaker',
  'Troublemaker Close Eyes': 'troublemaker',
  'Drunk Wake Up': 'drunk',
  'Drunk Close Eyes': 'drunk',
  'Insomniac Wake Up': 'insomniac',
  'Insomniac Close Eyes': 'insomniac',
  'Everyone Wiggle': 'wiggle'
};
const labelToRolePt: Record<string, string> = {
  'Lobisomem, acorde': 'werewolf',
  'Opção Lobo Solitário': 'werewolf',
  'Lobisomem, feche os olhos': 'werewolf',
  'Capanga, acorde': 'minion',
  'Capanga, polegar': 'minion',
  'Capanga, feche os olhos': 'minion',
  'Maçon, acorde': 'mason',
  'Maçon, feche os olhos': 'mason',
  'Vidente, acorde': 'seer',
  'Vidente, feche os olhos': 'seer',
  'Ladrão, acorde': 'robber',
  'Ladrão, feche os olhos': 'robber',
  'Encrenqueiro, acorde': 'troublemaker',
  'Encrenqueiro, feche os olhos': 'troublemaker',
  'Bêbado, acorde': 'drunk',
  'Bêbado, feche os olhos': 'drunk',
  'Insone, acorde': 'insomniac',
  'Insone, feche os olhos': 'insomniac',
  'Todos, mexam-se': 'wiggle'
};

import { computed } from 'vue';
const currentSprite = computed(() => {
  // Show sprite if currentAudioLabel is set (audio playing) or during countdown (show just-finished audio's sprite)
  let label = currentAudioLabel.value;
  if (!label && countdown.value > 0 && currentIdx < audioLabels.length) {
    // During countdown, use the label of the audio that just finished (currentIdx, because playNext increments only after countdown)
    label = audioLabels[currentIdx];
  }
  if (!label) return null;
  let roleKey = null;
  if (language === 'en') {
    roleKey = labelToRole[label];
  } else {
    roleKey = labelToRolePt[label];
  }
  if (roleKey) {
    return `${import.meta.env.BASE_URL}sprites/${roleKey}.png`;
  }
  return null;
});

function getAudioSequenceAndLabels(lang: 'en' | 'pt-br', roles: string[]) {
  const folder = lang === 'en' ? 'en' : 'br';
  const base = import.meta.env.BASE_URL;
  const roleCounts: Record<string, number> = {};
  for (const role of roles) {
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  }
  const sequence: string[] = [];
  const labels: string[] = [];
  sequence.push(`${base}sounds/${folder}/common/male_everyone_close.mp3`);
  labels.push(lang === 'en' ? 'Everyone Close Eyes' : 'Todos, fechem os olhos');
  if (roleCounts['Werewolf'] && roleCounts['Werewolf'] > 0) {
    sequence.push(`${base}sounds/${folder}/werewolf/male_werewolf_wake.mp3`);
    labels.push(lang === 'en' ? 'Werewolf Wake Up' : 'Lobisomem, acorde');
    sequence.push(`${base}sounds/${folder}/werewolf/male_werewolf_lonewolf_option.mp3`);
    labels.push(lang === 'en' ? 'Lone Wolf Option' : 'Opção Lobo Solitário');
    sequence.push(`${base}sounds/${folder}/werewolf/male_werewolf_close.mp3`);
    labels.push(lang === 'en' ? 'Werewolf Close Eyes' : 'Lobisomem, feche os olhos');
  }
  if (roleCounts['Minion'] && roleCounts['Minion'] > 0) {
    sequence.push(`${base}sounds/${folder}/minion/male_minion_wake.mp3`);
    labels.push(lang === 'en' ? 'Minion Wake Up' : 'Capanga, acorde');
    sequence.push(`${base}sounds/${folder}/minion/male_minion_thumb.mp3`);
    labels.push(lang === 'en' ? 'Minion Thumb' : 'Capanga, polegar');
    sequence.push(`${base}sounds/${folder}/minion/male_minion_close.mp3`);
    labels.push(lang === 'en' ? 'Minion Close Eyes' : 'Capanga, feche os olhos');
  }
  if (roleCounts['Mason'] && roleCounts['Mason'] > 0) {
    sequence.push(`${base}sounds/${folder}/mason/male_mason_wake.mp3`);
    labels.push(lang === 'en' ? 'Mason Wake Up' : 'Maçon, acorde');
    sequence.push(`${base}sounds/${folder}/mason/male_mason_close.mp3`);
    labels.push(lang === 'en' ? 'Mason Close Eyes' : 'Maçon, feche os olhos');
  }
  if (roleCounts['Seer'] && roleCounts['Seer'] > 0) {
    sequence.push(`${base}sounds/${folder}/seer/male_seer_wake.mp3`);
    labels.push(lang === 'en' ? 'Seer Wake Up' : 'Vidente, acorde');
    sequence.push(`${base}sounds/${folder}/seer/male_seer_close.mp3`);
    labels.push(lang === 'en' ? 'Seer Close Eyes' : 'Vidente, feche os olhos');
  }
  if (roleCounts['Robber'] && roleCounts['Robber'] > 0) {
    sequence.push(`${base}sounds/${folder}/robber/male_robber_wake.mp3`);
    labels.push(lang === 'en' ? 'Robber Wake Up' : 'Ladrão, acorde');
    sequence.push(`${base}sounds/${folder}/robber/male_robber_close.mp3`);
    labels.push(lang === 'en' ? 'Robber Close Eyes' : 'Ladrão, feche os olhos');
  }
  if (roleCounts['Troublemaker'] && roleCounts['Troublemaker'] > 0) {
    sequence.push(`${base}sounds/${folder}/troublemaker/male_troublemaker_wake.mp3`);
    labels.push(lang === 'en' ? 'Troublemaker Wake Up' : 'Encrenqueiro, acorde');
    sequence.push(`${base}sounds/${folder}/troublemaker/male_troublemaker_close.mp3`);
    labels.push(lang === 'en' ? 'Troublemaker Close Eyes' : 'Encrenqueiro, feche os olhos');
  }
  if (roleCounts['Drunk'] && roleCounts['Drunk'] > 0) {
    sequence.push(`${base}sounds/${folder}/drunk/male_drunk_wake.mp3`);
    labels.push(lang === 'en' ? 'Drunk Wake Up' : 'Bêbado, acorde');
    sequence.push(`${base}sounds/${folder}/drunk/male_drunk_close.mp3`);
    labels.push(lang === 'en' ? 'Drunk Close Eyes' : 'Bêbado, feche os olhos');
  }
  if (roleCounts['Insomniac'] && roleCounts['Insomniac'] > 0) {
    sequence.push(`${base}sounds/${folder}/insomniac/male_insomniac_wake.mp3`);
    labels.push(lang === 'en' ? 'Insomniac Wake Up' : 'Insone, acorde');
    sequence.push(`${base}sounds/${folder}/insomniac/male_insomniac_close.mp3`);
    labels.push(lang === 'en' ? 'Insomniac Close Eyes' : 'Insone, feche os olhos');
  }
  sequence.push(`${base}sounds/${folder}/common/male_everyone_wiggle.mp3`);
  labels.push(lang === 'en' ? 'Everyone Wiggle' : 'Todos, mexam-se');
  sequence.push(`${base}sounds/${folder}/common/male_everyone_wake.mp3`);
  labels.push(lang === 'en' ? 'Everyone Wake Up' : 'Todos, acordem');
  return { sequence, labels };
}

let { sequence: audioSequence, labels: audioLabels } = getAudioSequenceAndLabels(props.language, props.roles);


function playSequence() {
  sequenceStarted.value = true;
  stopped = false;
  const result = getAudioSequenceAndLabels(props.language, props.roles);
  audioSequence = result.sequence;
  audioLabels.splice(0, audioLabels.length, ...result.labels);
  audioQueue.value = audioSequence.map(src => new Audio(src));
  currentIdx = 0;
  playNext();
}

onMounted(() => {
  playSequence();
});

watch(() => props.language, (newLang, oldLang) => {
  if (newLang !== oldLang) {
    playSequence();
  }
});

function playNext() {
  if (stopped) return;
  if (currentIdx >= audioQueue.value.length) {
    currentAudioLabel.value = null;
    countdown.value = 0;
    setTimeout(() => {
      if (!stopped) props.onSequenceEnd();
    }, 500);
    return;
  }
  currentAudioLabel.value = audioLabels[currentIdx] || '';
  currentAudio = audioQueue.value[currentIdx];
  currentAudio.play().catch((err) => {
    console.error('Audio play() failed:', err);
  });
  currentAudio.onended = () => {
    let seconds = 5;
    countdown.value = seconds;
    currentAudioLabel.value = null;
    const interval = setInterval(() => {
      seconds--;
      countdown.value = seconds;
      if (seconds <= 0) {
        clearInterval(interval);
        currentIdx++;
        playNext();
      }
    }, 1000);
  };
}

function pauseAudio() {
  if (currentAudio) {
    currentAudio.pause();
    paused.value = true;
  }
}

function resumeAudio() {
  if (currentAudio) {
    currentAudio.play();
    paused.value = false;
  }
}

function stopAudio() {
  stopped = true;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.onended = null;
  }
  audioQueue.value.forEach(a => {
    a.pause();
    a.currentTime = 0;
    a.onended = null;
  });
  paused.value = false;
  currentIdx = audioQueue.value.length;
}

function stopAudioAndReturn() {
  stopAudio();
  emit('stop');
}

onUnmounted(() => {
  audioQueue.value.forEach(a => a.pause());
});
</script>
