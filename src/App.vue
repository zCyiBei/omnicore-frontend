<script setup>
import Navbar from './components/navbar.vue'
import Footer from './components/footer.vue'
</script>

<template>
  <div class="flex flex-col min-h-screen bg-base-200 w-full overflow-x-hidden">
    
    <Navbar />

    <main class="grow pt-24 pb-8 px-4 md:px-8 flex flex-col items-center justify-start">
      <div class="w-full max-w-5xl flex-1 flex flex-col">
        <router-view />
      </div>
      
    </main>

    <Footer />
  </div>
</template>
