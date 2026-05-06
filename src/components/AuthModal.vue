<script setup>
import { computed, ref, watch } from 'vue'
import { loginUser, registerUser } from '../services/mockAuthDb'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'login'
  }
})

const emit = defineEmits(['close', 'authenticated'])
const activeTab = ref(props.mode === 'register' ? 'register' : 'login')
const name = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

watch(
  () => props.mode,
  (value) => {
    activeTab.value = value === 'register' ? 'register' : 'login'
  }
)

const title = computed(() =>
  activeTab.value === 'register' ? 'Crear cuenta gratis' : 'Bienvenido de nuevo'
)

function closeModal() {
  emit('close')
}

function switchTab(tab) {
  activeTab.value = tab
  errorMessage.value = ''
}

function resetForm() {
  name.value = ''
  email.value = ''
  password.value = ''
  errorMessage.value = ''
}

watch(
  () => props.open,
  (value) => {
    if (value) {
      resetForm()
    }
  }
)

async function submitAuth() {
  errorMessage.value = ''

  if (activeTab.value === 'register' && name.value.trim().length < 3) {
    errorMessage.value = 'El nombre debe tener al menos 3 caracteres.'
    return
  }

  if (!email.value.trim() || !email.value.includes('@')) {
    errorMessage.value = 'Introduce un email valido.'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'La contrasena debe tener al menos 6 caracteres.'
    return
  }

  loading.value = true

  const result = await (activeTab.value === 'register'
    ? registerUser({ name: name.value, email: email.value, password: password.value })
    : loginUser({ email: email.value, password: password.value }))

  loading.value = false

  if (!result.ok) {
    if (result.error === 'EMAIL_EXISTS') {
      errorMessage.value = 'Ese email ya esta registrado.'
      return
    }

    if (result.error === 'INVALID_CREDENTIALS') {
      errorMessage.value = 'Email o contrasena incorrectos.'
      return
    }

    errorMessage.value = 'No se pudo completar la accion.'
    return
  }

  emit('authenticated', result.user)
  emit('close')
}
</script>

<template>
  <div
    id="authModal"
    role="dialog"
    aria-modal="true"
    aria-label="Autenticación"
    :class="{ open }"
    @click.self="closeModal"
  >
    <div class="auth-box">
      <button class="auth-close" aria-label="Cerrar" @click="closeModal">✕</button>

      <div class="auth-tabs">
        <button
          class="auth-tab"
          :class="{ on: activeTab === 'login' }"
          @click="switchTab('login')"
        >
          Iniciar sesión
        </button>
        <button
          class="auth-tab"
          :class="{ on: activeTab === 'register' }"
          @click="switchTab('register')"
        >
          Crear cuenta
        </button>
      </div>

      <div class="auth-body">
        <div class="auth-title">{{ title }}</div>
        <div class="auth-sub">
          {{ activeTab === 'register' ? 'Guarda favoritos, crea alertas y mucho más' : 'Accede a tus alertas, favoritos e historial' }}
        </div>

        <div class="auth-field" v-if="activeTab === 'register'">
          <label for="authName">Nombre de usuario</label>
          <input id="authName" v-model="name" type="text" placeholder="Ej: GamerPro99" autocomplete="username">
        </div>

        <div class="auth-field">
          <label for="authEmail">Email</label>
          <input id="authEmail" v-model="email" type="email" placeholder="tu@email.com" autocomplete="email">
        </div>

        <div class="auth-field">
          <label for="authPass">Contraseña</label>
          <input id="authPass" v-model="password" type="password" placeholder="••••••••" autocomplete="current-password" @keydown.enter="submitAuth">
        </div>

        <div v-if="errorMessage" class="auth-err show">{{ errorMessage }}</div>

        <button class="auth-submit" :disabled="loading" @click="submitAuth">
          {{ activeTab === 'register' ? 'Crear cuenta' : 'Entrar' }}
        </button>

        <div style="text-align:center;margin-top:12px;font-size:12px;color:var(--text-faint);">
          {{ activeTab === 'register' ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?' }}
          <span
            class="auth-link"
            @click="switchTab(activeTab === 'register' ? 'login' : 'register')"
          >
            {{ activeTab === 'register' ? 'Inicia sesión' : 'Regístrate gratis' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
