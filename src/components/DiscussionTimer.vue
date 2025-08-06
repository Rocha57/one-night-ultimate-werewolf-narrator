<template>
  <div class="timer">
    <h2>{{ language === 'en' ? 'Discussion Timer' : 'Temporizador de Discussão' }}</h2>
    <div class="countdown">{{ displayTime }}</div>
    <button v-if="!running" @click="start">{{ language === 'en' ? 'Start Timer' : 'Iniciar Temporizador' }}</button>
    <button v-if="running" @click="pause">{{ language === 'en' ? 'Pause' : 'Pausar' }}</button>
    <button v-if="paused" @click="resume">{{ language === 'en' ? 'Resume' : 'Retomar' }}</button>
    <!-- No Reset button needed -->
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onUnmounted, onMounted, watch } from 'vue';

const props = defineProps<{ seconds: number; language?: 'en' | 'pt-br' }>();
const language = props.language || 'en';
const emit = defineEmits(['finished']);

const timeLeft = ref(props.seconds);
const running = ref(false);
const paused = ref(false);
let interval: number | null = null;
let timeIsUpAudio: HTMLAudioElement | null = null;
let timeIsUpPlayed = false;

const displayTime = computed(() => {
  const min = Math.floor(timeLeft.value / 60).toString().padStart(2, '0');
  const sec = (timeLeft.value % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
});

function playTimeIsUpAudio() {
  if (timeIsUpPlayed) return;
  const lang = props.language || 'en';
  const folder = lang === 'en' ? 'en' : 'br';
  const src = `${import.meta.env.BASE_URL}sounds/${folder}/common/male_everyone_timeisup_321vote.mp3`;
  timeIsUpAudio = new Audio(src);
  timeIsUpAudio.play().catch(() => {});
  timeIsUpPlayed = true;
}

function start() {
  if (running.value) return;
  running.value = true;
  paused.value = false;
  timeIsUpPlayed = false;
  interval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      stop();
      emit('finished');
    }
  }, 1000);
}

// React to language changes for the time is up audio
watch(() => props.language, () => {
  if (timeIsUpAudio) {
    timeIsUpAudio.pause();
    timeIsUpAudio = null;
    timeIsUpPlayed = false;
  }
});

// Expose start for template
defineExpose({ start });

function pause() {
  if (!running.value) return;
  running.value = false;
  paused.value = true;
  if (interval) clearInterval(interval);
  if (timeIsUpAudio) timeIsUpAudio.pause();
}

function resume() {
  if (!paused.value) return;
  start();
  if (timeIsUpAudio && timeIsUpPlayed) timeIsUpAudio.play().catch(() => {});
}

function reset() {
  running.value = false;
  paused.value = false;
  if (interval) clearInterval(interval);
  timeLeft.value = props.seconds;
  timeIsUpPlayed = false;
  if (timeIsUpAudio) {
    timeIsUpAudio.pause();
    timeIsUpAudio.currentTime = 0;
  }
}

function stop() {
  running.value = false;
  paused.value = false;
  if (interval) clearInterval(interval);
  if (timeIsUpAudio) {
    timeIsUpAudio.pause();
    timeIsUpAudio.currentTime = 0;
  }
}

watch(timeLeft, (val) => {
  if (val === 5) {
    playTimeIsUpAudio();
  }
});

onMounted(() => {
  start();
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
  if (timeIsUpAudio) timeIsUpAudio.pause();
});
</script>

<style scoped>
.timer {
  text-align: center;
  margin: 2rem 0;
}
.countdown {
  font-size: 2.5rem;
  margin: 1rem 0;
  font-family: monospace;
}
button {
  margin: 0.5rem;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background: #369870;
}

@media (max-width: 700px) {
  .timer {
    margin: 1rem 0;
  }
  .countdown {
    font-size: 1.7rem;
    margin: 0.7rem 0;
  }
  button {
    font-size: 0.95rem;
    padding: 0.4rem 1rem;
  }
}

@media (max-width: 480px) {
  .timer {
    margin: 0.5rem 0;
  }
  .countdown {
    font-size: 1.2rem;
    margin: 0.3rem 0;
  }
  button {
    font-size: 0.9rem;
    padding: 0.3rem 0.6rem;
  }
}
</style>
