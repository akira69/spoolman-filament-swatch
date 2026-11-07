<template>
  <RouterView v-if="hostContext.userId !== null" />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import {hostContext} from './filaman/context';
</script>
