<script setup>
const props = defineProps({
  selected: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['select'])

const tabs = [
  { key: 'all', label: '🏠 Inicio' },
  { key: 'steam', label: '🖥️ PC Steam' },
  { key: 'epic', label: '🔵 Epic Games' },
  { key: 'ps5', label: '🎮 PlayStation 5' },
  { key: 'ps4', label: '🎮 PlayStation 4' },
  { key: 'xbox', label: '🟩 Xbox' },
  { key: 'switch', label: '🔴 Nintendo Switch' }
]

function selectPlatform(key) {
  emit('select', key)
}
</script>

<template>
  <div class="subnav" role="navigation" aria-label="Plataformas">
    <div class="subnav-inner" id="subnav">
      <a
        v-for="tab in tabs"
        :key="tab.key"
        href="#"
        :class="{ active: props.selected === tab.key }"
        :data-plat="tab.key"
        @click.prevent="selectPlatform(tab.key)"
      >
        {{ tab.label }}
      </a>
    </div>
  </div>
</template>

