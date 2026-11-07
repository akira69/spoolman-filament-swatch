<script setup lang="ts">
import {computed} from 'vue';
import {hexToRgb} from '@/lib/colorUtils';
const props=defineProps<{colorHex:string}>();
const rgb=computed(()=>hexToRgb(props.colorHex));
const channels=['r','g','b'] as const;
</script>
<template>
 <span class="rgb-readout" role="group" :aria-label="`R: ${rgb.r} G: ${rgb.g} B: ${rgb.b}`">
  <span v-for="channel in channels" :key="channel" class="rgb-channel"><span class="rgb-label">{{ channel.toUpperCase() }}: </span><span class="rgb-value">{{ rgb[channel] }}</span></span>
 </span>
</template>
<style scoped>
.rgb-readout {display:inline-flex;gap:6px;white-space:nowrap;}
.rgb-channel {display:inline-flex;gap:2px;}
.rgb-label {color:rgb(var(--text-muted));}
.rgb-value {color:rgb(var(--text));}
</style>
