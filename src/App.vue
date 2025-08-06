
<script setup lang="ts">
import { ref } from 'vue';
import GameSetup from './components/GameSetup.vue';
import AudioSequence from './components/AudioSequence.vue';
import DiscussionTimer from './components/DiscussionTimer.vue';


const phase = ref<'setup' | 'audio' | 'timer' | 'done'>('setup');
const gameConfig = ref<{ players: number; roles: string[]; timer: number } | null>(null);
const language = ref<'en' | 'pt-br'>('en');

// Load persisted config on mount
import { onMounted, watch } from 'vue';
onMounted(() => {
  const savedConfig = localStorage.getItem('werewolf_game_config');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      if (parsed && typeof parsed === 'object') {
        gameConfig.value = parsed;
      }
    } catch {}
  }
  const savedLang = localStorage.getItem('werewolf_language');
  if (savedLang === 'en' || savedLang === 'pt-br') {
    language.value = savedLang;
  }
});

function handleStart(config: { players: number; roles: string[]; timer: number }) {
  gameConfig.value = config;
  localStorage.setItem('werewolf_game_config', JSON.stringify(config));
  phase.value = 'audio';
}

function handleAudioEnd() {
  phase.value = 'timer';
}

function handleTimerEnd() {
  phase.value = 'done';
}

function resetGame() {
  phase.value = 'setup';
  // gameConfig.value = null; // Keep config for persistence
}

watch(language, (val) => {
  localStorage.setItem('werewolf_language', val);
});
</script>

<template>
  <div class="background">
    <img src="/src/assets/gui/background.png" alt="background" class="bg-img" />
    <div class="container">
      <img src="/src/assets/gui/logo_ver_en.png" alt="logo" class="logo-img" />
      <div v-if="phase === 'setup'" style="width:100%;display:flex;justify-content:flex-end;margin-bottom:1rem;">
        <label style="font-weight:500;margin-right:0.5rem;">
          {{ language === 'en' ? 'Language:' : 'Idioma:' }}
        </label>
        <select v-model="language" style="padding:0.3rem 0.7rem;border-radius:6px;">
          <option value="en">English</option>
          <option value="pt-br">Português (Brasil)</option>
        </select>
      </div>
      <GameSetup v-if="phase === 'setup'" @start="handleStart" :language="language" />
      <AudioSequence
        v-else-if="phase === 'audio' && gameConfig"
        :roles="gameConfig.roles"
        :onSequenceEnd="handleAudioEnd"
        @stop="resetGame"
        :language="language"
      />
      <DiscussionTimer
        v-else-if="phase === 'timer' && gameConfig"
        :seconds="gameConfig.timer"
        :language="language"
        @finished="handleTimerEnd"
      />
      <div v-else-if="phase === 'done'">
        <h2>{{ language === 'en' ? 'Discussion time is over!' : 'O tempo de discussão terminou!' }}</h2>
        <button @click="resetGame">{{ language === 'en' ? 'Restart Game' : 'Recomeçar Jogo' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.background {
  min-height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 0;
  overflow: auto;
}
.bg-img {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  z-index: 0;
  opacity: 0.7;
  pointer-events: none;
}
.container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: rgba(249,249,249,0.95);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
  color: #222;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.logo-img {
  width: 180px;
  margin-bottom: 1.5rem;
  margin-top: 0.5rem;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.12));
}
button {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
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
  .container {
    max-width: 98vw;
    margin: 0.5rem auto;
    padding: 1rem;
    border-radius: 10px;
  }
  .logo-img {
    width: 120px;
    margin-bottom: 1rem;
    margin-top: 0.5rem;
  }
}

@media (max-width: 480px) {
  .container {
    max-width: 100vw;
    padding: 0.5rem;
    border-radius: 0;
    box-shadow: none;
  }
  .logo-img {
    width: 80px;
    margin-bottom: 0.7rem;
    margin-top: 0.3rem;
  }
  button {
    font-size: 1rem;
    padding: 0.6rem 1.2rem;
  }
}
</style>
