<template>
  <section class="blog-wrap">
    <button class="blog-back" @click="$emit('back')">← Volver al inicio</button>

    <div class="blog-header">
      <div class="blog-header-line"></div>
      <span class="blog-header-icon"></span>
      <span class="blog-header-title">Últimas entradas</span>
      <span class="blog-header-icon"></span>
      <div class="blog-header-line blog-header-line--right"></div>
    </div>

    <div v-if="blogs.length === 0" class="blog-empty">
      <p>No hay blogs publicados aún.</p>
    </div>

    <template v-else>
      <!-- Tarjeta destacada (primera entrada) -->
      <div class="blog-card-featured">
        <div class="card-feat-img-wrap">
          <img
            v-if="blogs[0].mainImage"
            :src="blogs[0].mainImage"
            :alt="blogs[0].title"
            class="card-feat-img"
          />
          <div v-else class="card-feat-img-placeholder"></div>
        </div>
        <div class="card-feat-body">
          <div>
            <div class="feat-badge">
              <span class="feat-badge-dot"></span> Destacado
            </div>
            <h2 class="feat-title">{{ blogs[0].title }}</h2>
            <p class="feat-summary">{{ summary(blogs[0].content) }}</p>
          </div>
          <div class="feat-meta">
            <span class="meta-date">🕒 {{ relativeDate(blogs[0].id) }}</span>
            <span class="meta-views">👁 {{ blogs[0].views || 1 }} vista{{ (blogs[0].views || 1) !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Grid de tarjetas secundarias -->
      <div v-if="blogs.length > 1" class="blog-cards-grid">
        <article
          v-for="blog in blogs.slice(1)"
          :key="blog.id"
          class="blog-card-mini"
        >
          <img
            v-if="blog.mainImage"
            :src="blog.mainImage"
            :alt="blog.title"
            class="mini-img"
          />
          <div v-else class="mini-img-placeholder"></div>
          <div class="mini-body">
            <div class="mini-category">Blog</div>
            <h3 class="mini-title">{{ blog.title }}</h3>
            <p class="mini-summary">{{ summary(blog.content) }}</p>
            <div class="mini-meta">
              <span>🕒 {{ relativeDate(blog.id) }}</span>
              <span>👁 {{ blog.views || 1 }}</span>
            </div>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineEmits(['back'])

const blogs = ref([])

function loadBlogs() {
  try {
    blogs.value = JSON.parse(localStorage.getItem('blogs') || '[]')
  } catch {
    blogs.value = []
  }
}

function summary(content) {
  if (!content) return ''
  const plain = content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/[*_`~>]+/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  return plain.length > 200 ? plain.slice(0, 200) + '…' : plain
}

function relativeDate(id) {
  if (!id) return ''
  const diff = Date.now() - id
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Ahora mismo'
  if (mins < 60)  return `Hace ${mins} min`
  if (hours < 24) return `Hace ${hours} h`
  if (days < 7)   return `Hace ${days} día${days > 1 ? 's' : ''}`
  return new Date(id).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

onMounted(() => {
  loadBlogs()
  window.addEventListener('blog-published', loadBlogs)
})

onUnmounted(() => {
  window.removeEventListener('blog-published', loadBlogs)
})
</script>

<style scoped>
.blog-wrap {
  padding: 32px 28px;
  max-width: 960px;
  margin: 40px auto 0;
  color: #fff;
}

/* Botón volver */
.blog-back {
  background: none;
  border: none;
  color: #a78bfa;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 28px;
  padding: 0;
  letter-spacing: 0.5px;
  transition: color 0.2s;
}
.blog-back:hover { color: #fff; }

/* Header */
.blog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}
.blog-header-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #7c3aed44, transparent);
}
.blog-header-line--right {
  background: linear-gradient(90deg, transparent, #7c3aed44);
}
.blog-header-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #c4b5fd;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  white-space: nowrap;
}
.blog-header-icon {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #a855f7;
  flex-shrink: 0;
}

/* Tarjeta destacada */
.blog-card-featured {
  background: #13101f;
  border-radius: 18px;
  border: 1px solid #2a1f4a;
  overflow: hidden;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 280px;
  transition: border-color 0.2s, transform 0.2s;
}
.blog-card-featured:hover {
  border-color: #7c3aed;
  transform: translateY(-2px);
}

.card-feat-img-wrap {
  overflow: hidden;
}
.card-feat-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  min-height: 280px;
}
.card-feat-img-placeholder {
  width: 100%;
  height: 100%;
  min-height: 280px;
  background: linear-gradient(135deg, #1a0f2e, #2d1458);
}

.card-feat-body {
  padding: 30px 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.feat-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #3b0764;
  color: #c4b5fd;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 5px 13px;
  border-radius: 20px;
  margin-bottom: 16px;
  width: fit-content;
  border: 1px solid #7c3aed55;
}
.feat-badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #a855f7;
}

.feat-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.3;
  margin-bottom: 14px;
  letter-spacing: -0.3px;
}

.feat-summary {
  color: #9ca3af;
  font-size: 0.92rem;
  line-height: 1.65;
  margin-bottom: 22px;
  flex: 1;
}

.feat-meta {
  display: flex;
  align-items: center;
  gap: 18px;
}
.meta-date,
.meta-views {
  color: #6b7280;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Grid de tarjetas secundarias */
.blog-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.blog-card-mini {
  background: #13101f;
  border-radius: 14px;
  border: 1px solid #1e1535;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s;
}
.blog-card-mini:hover {
  border-color: #7c3aed;
  transform: translateY(-2px);
}

.mini-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}
.mini-img-placeholder {
  width: 100%;
  height: 150px;
  background: linear-gradient(135deg, #1a0f2e, #2d1458);
}

.mini-body {
  padding: 16px 18px;
}
.mini-category {
  font-size: 10px;
  font-weight: 700;
  color: #a855f7;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.mini-title {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.35;
  margin-bottom: 8px;
}
.mini-summary {
  color: #9ca3af;
  font-size: 0.82rem;
  line-height: 1.5;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mini-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #6b7280;
  font-size: 0.78rem;
}

/* Empty */
.blog-empty {
  text-align: center;
  color: #6b7280;
  padding: 60px 0;
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 700px) {
  .blog-wrap {
    padding: 20px 14px;
    margin-top: 16px;
  }
  .blog-card-featured {
    grid-template-columns: 1fr;
  }
  .card-feat-img {
    min-height: 200px;
  }
  .card-feat-img-placeholder {
    min-height: 200px;
  }
  .card-feat-body {
    padding: 20px 18px;
  }
  .feat-title {
    font-size: 1.2rem;
  }
  .blog-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>