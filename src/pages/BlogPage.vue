<!-- Eliminado bloque </template> y <script setup> duplicados -->
<template>
  <section class="blog-list">
    <button class="blog-back" @click="$emit('back')">← Volver al inicio</button>
    <div class="blog-header">
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" class="blog-icon">
        <circle cx="19" cy="19" r="19" fill="url(#paint0_radial)"/>
        <text x="50%" y="55%" text-anchor="middle" fill="#fff" font-size="18" font-weight="bold" dy=".3em">📝</text>
        <defs>
          <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(19 19) scale(19)" gradientUnits="userSpaceOnUse">
            <stop stop-color="#a855f7"/>
            <stop offset="1" stop-color="#181028"/>
          </radialGradient>
        </defs>
      </svg>
      <h2 class="blog-list-title">Últimos blogs</h2>
    </div>
    <div v-if="blogs.length === 0" class="blog-empty">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="blog-empty-icon">
        <circle cx="16" cy="16" r="16" fill="#a855f7" fill-opacity="0.12"/>
        <text x="50%" y="55%" text-anchor="middle" fill="#a855f7" font-size="16" font-weight="bold" dy=".3em">😕</text>
      </svg>
      <span>No hay blogs publicados aún.</span>
    </div>
    <div v-else class="blog-cards">
      <article v-for="blog in blogs" :key="blog.id" class="blog-card-horizontal">
        <div class="blog-img-wrap-horizontal" v-if="blog.mainImage">
          <img :src="blog.mainImage" class="blog-main-img-horizontal" />
        </div>
        <div class="blog-info-horizontal">
          <div class="blog-meta-row">
            <span class="blog-date">{{ relativeDate(blog.id) }}</span>
          </div>
          <h3 class="blog-title-horizontal">{{ blog.title }}</h3>
          <div class="blog-summary">{{ summary(blog.content) }}</div>
          <div class="blog-meta-row">
            <span class="blog-views"><span class="blog-views-icon">😊</span> 1</span>
          </div>
        </div>
      </article>
    </div>
<!-- script setup movido fuera del template -->
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { marked } from 'marked'

const blogs = ref([])

function loadBlogs() {
  blogs.value = JSON.parse(localStorage.getItem('blogs') || '[]')
}

function rendered(content) {
  return marked.parse(content || '')
}

window.addEventListener('blog-published', loadBlogs)
loadBlogs()
</script>

.blog-list {
  background: linear-gradient(135deg, #20103a 60%, #a855f7 100%);
  border-radius: 22px;
  padding: 38px 32px 38px 32px;
  margin: 48px auto 0 auto;
  width: 80%;
  max-width: 1100px;
  color: var(--primary, #a855f7);
  box-shadow: 0 6px 32px #a855f744, 0 1.5px 8px #0002;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 340px;
}
.blog-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 18px;
}
.blog-icon {
  flex-shrink: 0;
  margin-right: 2px;
}
.blog-back {
  background: none;
  border: none;
  color: var(--primary, #a855f7);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 10px;
  cursor: pointer;
  transition: color 0.2s;
}
.blog-cards {
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
}
.blog-card-horizontal {
  background: #232025;
  border-radius: 18px;
  box-shadow: 0 4px 24px #0002, 0 1.5px 8px #0002;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  padding: 0;
  overflow: hidden;
  border: 1.5px solid #222;
  min-height: 120px;
}
.blog-img-wrap-horizontal {
  width: 220px;
  min-width: 180px;
  max-width: 260px;
  background: #181028;
  display: flex;
  align-items: center;
  justify-content: center;
}
.blog-main-img-horizontal {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0;
  min-height: 120px;
}
.blog-info-horizontal {
  flex: 1;
  padding: 22px 28px 18px 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.blog-meta-row {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 4px;
}
.blog-date {
  color: #bdbdbd;
  font-size: 1rem;
  font-weight: 400;
}
.blog-title-horizontal {
  font-size: 1.35rem;
  font-weight: 900;
  color: #fff;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 8px #0002;
}
.blog-summary {
  color: #d1d1d1;
  font-size: 1.08rem;
  line-height: 1.6;
  margin-bottom: 10px;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.blog-views {
  color: #bdbdbd;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 4px;
}
.blog-views-icon {
  font-size: 1.1rem;
}
}
