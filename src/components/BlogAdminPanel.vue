<template>
  <div class="blog-admin-panel">
    <h2>Publicar nuevo blog</h2>
    <div class="blog-admin-flex">
      <form class="blog-admin-form" @submit.prevent="submitBlog">
        <label>Título</label>
        <input v-model="title" required placeholder="Título del blog" />
        <label>Imagen principal</label>
        <input type="url" v-model="mainImage" placeholder="URL de la imagen principal" />
        <label>Contenido (puedes usar imágenes con ![alt](url))</label>
        <textarea v-model="content" rows="10" required placeholder="Escribe el contenido en formato markdown..."></textarea>
        <div class="blog-admin-btns">
          <button type="button" class="blog-main-btn" @click="showPreview">Preview</button>
          <button type="submit" class="blog-main-btn">Publicar</button>
        </div>
      </form>
      <div v-if="preview" class="blog-preview-panel">
        <div class="blog-preview-header">
          <span>Vista previa</span>
          <button class="close-preview" @click="closePreview" title="Cerrar preview">✕</button>
        </div>
        <div class="blog-card-preview">
          <img v-if="mainImage" :src="mainImage" class="blog-main-img-preview" />
          <h4>{{ title }}</h4>
          <div v-html="renderedContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'

const title = ref('')
const mainImage = ref('')
const content = ref('')
const preview = ref(false)
const renderedContent = computed(() => marked.parse(content.value))

function showPreview() {
  preview.value = true
}
function closePreview() {
  preview.value = false
}
function submitBlog() {
  const blogs = JSON.parse(localStorage.getItem('blogs') || '[]')
  const newBlog = {
    id: Date.now(),
    title: title.value,
    mainImage: mainImage.value,
    content: content.value
  }
  blogs.unshift(newBlog)
  localStorage.setItem('blogs', JSON.stringify(blogs))
  window.dispatchEvent(new CustomEvent('blog-published'))
  // Limpiar formulario y preview
  title.value = ''
  mainImage.value = ''
  content.value = ''
  preview.value = false
}
</script>

<style scoped>
.blog-admin-panel {
  background: #181028;
  border-radius: 12px;
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
  color: #fff;
}
.blog-admin-flex {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}
.blog-admin-form {
  flex: 1;
}
.blog-admin-btns {
  display: flex;
  gap: 16px;
  margin-top: 18px;
}
.blog-preview-panel {
  background: linear-gradient(135deg, #20103a 60%, #a855f7 100%);
  border-radius: 16px;
  padding: 18px 18px 24px 18px;
  min-width: 340px;
  max-width: 420px;
  box-shadow: 0 6px 32px #a855f744, 0 1.5px 8px #0002;
  position: relative;
  color: #fff;
  font-family: var(--font-body, Arial, sans-serif);
}
.blog-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--primary, #a855f7);
}
.close-preview {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.close-preview:hover {
  background: #a855f7;
}
.blog-card-preview {
  background: #232025;
  border-radius: 12px;
  box-shadow: 0 2px 12px #0002;
  padding: 18px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}
.blog-main-img-preview {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px #0004;
}
.blog-card-preview h4 {
  font-size: 1.3rem;
  font-weight: 900;
  color: #fff;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 8px #0002;
}
.blog-card-preview div {
  color: #d1d1d1;
  font-size: 1.08rem;
  line-height: 1.6;
  margin-bottom: 10px;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-line;
}
.blog-admin-panel label {
  display: block;
  margin-top: 12px;
  font-weight: 700;
}
.blog-admin-panel input,
.blog-admin-panel textarea {
  width: 100%;
  margin-top: 4px;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #a855f7;
  background: #231a3a;
  color: #fff;
  font-size: 15px;
}
/* Botón principal para Preview y Publicar */
.blog-main-btn {
  background: linear-gradient(90deg, #a855f7 60%, #7c3aed 100%);
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 0 16px #a855f755;
  margin-top: 0;
  transition: background 0.2s, box-shadow 0.2s;
}
.blog-main-btn:hover {
  background: linear-gradient(90deg, #7c3aed 60%, #a855f7 100%);
  box-shadow: 0 0 24px #a855f799;
}
.blog-preview {
  margin-top: 32px;
  border-radius: 10px;
  padding: 18px;
}
.blog-card {
  background: #1a0f2e;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 12px #a855f733;
}
.blog-main-img {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 12px;
}
</style>
