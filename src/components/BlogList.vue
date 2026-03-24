<template>
  <section class="blog-list">
    <h2 class="blog-list-title">Últimos blogs</h2>
    <div v-if="blogs.length === 0" class="blog-empty">No hay blogs publicados aún.</div>
    <div v-else class="blog-cards">
      <article v-for="blog in blogs" :key="blog.id" class="blog-card">
        <img v-if="blog.mainImage" :src="blog.mainImage" class="blog-main-img" />
        <h3 class="blog-title">{{ blog.title }}</h3>
        <div class="blog-content" v-html="rendered(blog.content)"></div>
      </article>
    </div>
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

<style scoped>
.blog-list {
  background: #181028;
  border-radius: 14px;
  padding: 32px 18px 24px 18px;
  margin: 32px auto 0 auto;
  max-width: 700px;
  color: #fff;
  box-shadow: 0 2px 24px #a855f722;
}
.blog-list-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: #a855f7;
  margin-bottom: 18px;
  text-align: center;
}
.blog-empty {
  color: #bdb4d8;
  text-align: center;
  padding: 24px 0;
}
.blog-cards {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.blog-card {
  background: #1a0f2e;
  border-radius: 12px;
  padding: 18px 16px;
  box-shadow: 0 2px 12px #a855f733;
}
.blog-main-img {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 12px;
}
.blog-title {
  font-size: 1.18rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 10px;
}
.blog-content {
  color: #e9d5ff;
  font-size: 1rem;
  line-height: 1.7;
}
</style>
