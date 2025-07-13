<template>
    <p v-if="message" class="text-sm text-red-500 mt-1">
        {{ message }}
    </p>
</template>

<script setup lang="ts">
defineProps<{
    message: string | null;
}>();
</script>
