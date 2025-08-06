<template>
  <div class="setup">
    <h1>One Night Ultimate Werewolf</h1>
    <form @submit.prevent="startGame">
      <div>
        <label for="players">
          <span v-if="language === 'en'">Number of players:</span>
          <span v-else>Número de jogadores:</span>
        </label>
        <input id="players" type="number" min="3" v-model.number="players" required />
      </div>
      <div>
        <label>
          <span v-if="language === 'en'">Roles in play:</span>
          <span v-else>Funções em jogo:</span>
        </label>
        <div class="role-sprite-grid">
          <div v-for="role in spriteRoleOptions" :key="role.name" class="role-sprite-group">
            <div class="role-sprite-label">{{ role.name }}</div>
            <div class="role-sprite-row">
              <div
                v-for="idx in role.max"
                :key="role.name + '-' + idx"
                class="role-sprite-select"
                :class="{ selected: selectedSprites[role.name][idx-1] }"
                @click="toggleSprite(role.name, idx-1)"
                tabindex="0"
                :aria-label="role.name + ' ' + idx"
              >
                <img :src="getSpriteSrc(role.name)" :alt="role.name" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <label for="timer">
          <span v-if="language === 'en'">Discussion timer (seconds):</span>
          <span v-else>Tempo de discussão (segundos):</span>
        </label>
        <input id="timer" type="number" min="30" v-model.number="timer" required />
      </div>
      <button type="submit" :disabled="!roleCountValid">
        <span v-if="language === 'en'">Start Game</span>
        <span v-else>Começar Jogo</span>
      </button>
      <div v-if="!roleCountValid" style="color: #e53935; margin-top: 0.5rem; font-weight: 500;">
        <span v-if="language === 'en'">The number of roles selected must be exactly {{ players + 3 }}. Currently selected: {{ totalRolesSelected }}.</span>
        <span v-else>O número de funções selecionadas tem de ser exatamente {{ players + 3 }}. Selecionadas: {{ totalRolesSelected }}.</span>
      </div>
    </form>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
const { language } = defineProps<{ language: 'en' | 'pt-br' }>();
// Load persisted config if available
const savedConfig = localStorage.getItem('werewolf_game_config');
let initialPlayers = 3;
let initialTimer = 300;
let initialRoles: Record<string, number> | null = null;
if (savedConfig) {
  try {
    const parsed = JSON.parse(savedConfig);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.players === 'number') initialPlayers = parsed.players;
      if (typeof parsed.timer === 'number') initialTimer = parsed.timer;
      if (Array.isArray(parsed.roles)) {
        initialRoles = {};
        for (const role of parsed.roles) {
          initialRoles[role] = (initialRoles[role] || 0) + 1;
        }
      }
    }
  } catch {}
}
const players = ref(initialPlayers);
const timer = ref(initialTimer);

// Sprite role options: max = max number of that role allowed (for multi roles)
const spriteRoleOptions = [
  { name: 'Werewolf', max: 2 },
  { name: 'Mason', max: 2 },
  { name: 'Villager', max: 3 },
  { name: 'Doppelganger', max: 1 },
  { name: 'Minion', max: 1 },
  { name: 'Seer', max: 1 },
  { name: 'Robber', max: 1 },
  { name: 'Troublemaker', max: 1 },
  { name: 'Drunk', max: 1 },
  { name: 'Insomniac', max: 1 },
  { name: 'Hunter', max: 1 },
  { name: 'Tanner', max: 1 }
];

// Selected sprites: { role: [bool, ...] } for each slot
const selectedSprites = ref<Record<string, boolean[]>>({});
for (const role of spriteRoleOptions) {
  selectedSprites.value[role.name] = Array(role.max).fill(false);
}
// If persisted config, restore selectedSprites
if (initialRoles) {
  for (const role of spriteRoleOptions) {
    let count = initialRoles[role.name] || 0;
    for (let i = 0; i < role.max; i++) {
      selectedSprites.value[role.name][i] = i < count;
    }
  }
}

function toggleSprite(role: string, idx: number) {
  selectedSprites.value[role][idx] = !selectedSprites.value[role][idx];
}

function getSpriteSrc(role: string) {
  // Lowercase and use the same as in /public/sprites, with correct base path
  return `${import.meta.env.BASE_URL}sprites/${role.toLowerCase()}.png`;
}


import { watch } from 'vue';
watch([players, timer, selectedSprites], () => {
  // Build roles array based on selectedSprites
  const roles: string[] = [];
  for (const role of spriteRoleOptions) {
    for (let i = 0; i < role.max; i++) {
      if (selectedSprites.value[role.name][i]) {
        roles.push(role.name);
      }
    }
  }
  localStorage.setItem('werewolf_game_config', JSON.stringify({
    players: players.value,
    roles,
    timer: timer.value
  }));
}, { deep: true });
const totalRolesSelected = computed(() => {
  let total = 0;
  for (const arr of Object.values(selectedSprites.value)) {
    total += arr.filter(Boolean).length;
  }
  return total;
});
const roleCountValid = computed(() => totalRolesSelected.value === players.value + 3);
const emit = defineEmits(['start']);
function startGame() {
  if (!roleCountValid.value) {
    return;
  }
  // Build roles array based on selectedSprites
  const roles: string[] = [];
  for (const role of spriteRoleOptions) {
    for (let i = 0; i < role.max; i++) {
      if (selectedSprites.value[role.name][i]) {
        roles.push(role.name);
      }
    }
  }
  emit('start', { players: players.value, roles, timer: timer.value });
}
</script>

<style scoped>
.role-sprite-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin: 1rem 0 1.5rem 0;
}
.role-sprite-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
}
.role-sprite-label {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.3rem;
  color: #444;
}
.role-sprite-row {
  display: flex;
  gap: 0.3rem;
}
.role-sprite-select {
  border: 2.5px solid transparent;
  border-radius: 8px;
  padding: 2px;
  background: #f8fafc;
  cursor: pointer;
  transition: border 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 4px 0 rgba(60,60,60,0.07);
}
.role-sprite-select.selected {
  border: 2.5px solid #42b983;
  background: #e0f7fa;
  box-shadow: 0 2px 8px 0 rgba(60,60,60,0.13);
}
.role-sprite-select img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  user-select: none;
}

@media (max-width: 700px) {
  .role-sprite-grid {
    gap: 0.7rem;
    margin: 0.5rem 0 1rem 0;
  }
  .role-sprite-group {
    min-width: 70px;
  }
  .role-sprite-label {
    font-size: 0.95rem;
    margin-bottom: 0.2rem;
  }
  .role-sprite-select img {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .role-sprite-grid {
    gap: 0.3rem;
    margin: 0.2rem 0 0.7rem 0;
  }
  .role-sprite-group {
    min-width: 54px;
  }
  .role-sprite-label {
    font-size: 0.85rem;
    margin-bottom: 0.1rem;
  }
  .role-sprite-select img {
    width: 28px;
    height: 28px;
  }
}
</style>
.setup {
  max-width: 480px;
  margin: 0 auto;
  padding: 1.2rem 0.7rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(60,60,60,0.09);
}

@media (max-width: 700px) {
  .setup {
    max-width: 100vw;
    padding: 0.7rem 0.2rem;
    min-height: 100vh;
    box-sizing: border-box;
    overflow-y: auto;
  }
}

@media (max-width: 480px) {
  .setup {
    max-width: 100vw;
    padding: 0.3rem 0.1rem;
    min-height: 100vh;
    box-sizing: border-box;
    overflow-y: auto;
  }
}
<style scoped>
.setup form > div {
  margin-bottom: 1.3rem;
}
label {
  font-weight: 500;
  color: #333;
  margin-right: 0.5rem;
}
input[type="number"] {
  width: 80px;
  padding: 0.4rem 0.6rem;
  border: 1.5px solid #b2dfdb;
  border-radius: 6px;
  font-size: 1rem;
  background: #f8fafc;
  color: #222;
  margin-left: 0.5rem;
}
select {
  color: #222;
  background: #f8fafc;
  border: 1.5px solid #b2dfdb;
  border-radius: 6px;
  padding: 0.35rem 0.7rem;
  font-size: 1rem;
  margin-left: 0.5rem;
}
input[type="checkbox"] {
  accent-color: #42b983;
  margin-left: 0.5rem;
  transform: scale(1.2);
}
.setup form > div > div {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}
button {
  width: 100%;
  padding: 0.85rem;
  font-size: 1.1rem;
  background: linear-gradient(90deg, #42b983 60%, #26c6da 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.01em;
  box-shadow: 0 2px 8px 0 rgba(60,60,60,0.08);
  transition: background 0.2s, box-shadow 0.2s;
}
button:hover {
  background: linear-gradient(90deg, #369870 60%, #00bcd4 100%);
  box-shadow: 0 4px 16px 0 rgba(60,60,60,0.12);
}

@media (max-width: 700px) {
  .setup form > div {
    margin-bottom: 0.7rem;
  }
  label {
    font-size: 0.98rem;
    margin-right: 0.3rem;
  }
  input[type="number"] {
    width: 60px;
    padding: 0.3rem 0.4rem;
    font-size: 0.98rem;
  }
  select {
    font-size: 0.98rem;
    padding: 0.25rem 0.5rem;
  }
  button {
    font-size: 1rem;
    padding: 0.7rem;
  }
}

@media (max-width: 480px) {
  .setup form > div {
    margin-bottom: 0.4rem;
  }
  label {
    font-size: 0.92rem;
    margin-right: 0.2rem;
  }
  input[type="number"] {
    width: 44px;
    padding: 0.18rem 0.3rem;
    font-size: 0.92rem;
  }
  select {
    font-size: 0.92rem;
    padding: 0.15rem 0.3rem;
  }
  button {
    font-size: 0.95rem;
    padding: 0.5rem;
  }
}
</style>