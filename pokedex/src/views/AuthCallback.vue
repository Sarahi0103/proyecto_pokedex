<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../api'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const token = route.query.token
  const userStr = route.query.user
  
  if (token && userStr) {
    try {
      const user = JSON.parse(decodeURIComponent(userStr))
      login(token, user)
      router.push('/')
    } catch (e) {
      console.error('Error parsing user data:', e)
      router.push('/login')
    }
  } else {
    router.push('/login')
  }
})
</script>

<template>
  <div class="loading">
    <div style="font-size:2rem">⚡</div>
    Completando inicio de sesión con Google...
  </div>
</template>
