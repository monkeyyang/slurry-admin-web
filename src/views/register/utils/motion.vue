<script setup lang="ts">
import { useMotion } from "@vueuse/motion";
import { ref, onMounted } from "vue";

defineProps({
  delay: {
    type: Number,
    default: 50
  }
});

const motionRef = ref(null);

onMounted(() => {
  useMotion(motionRef, {
    initial: {
      opacity: 0,
      y: 100
    },
    enter: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 50
      }
    }
  });
});
</script>

<template>
  <div ref="motionRef">
    <slot />
  </div>
</template>
