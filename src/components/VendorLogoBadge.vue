<script setup lang="ts">
import {ref,watch} from 'vue';
const props=withDefaults(defineProps<{vendorName:string;logoUrl?:string|null;variant?:'compact'|'detail'}>(),{variant:'compact'});
const failed=ref(false);watch(()=>props.logoUrl,()=>failed.value=false);
</script>
<template>
 <span class="vendor-badge" :class="`vendor-${variant}`">
  <span v-if="logoUrl && !failed" class="vendor-logo"><img :src="logoUrl" alt="" @error="failed=true" /></span>
  <span class="vendor-identity"><span>{{ vendorName }}</span><slot /></span>
 </span>
</template>
<style scoped>
.vendor-badge {display:inline-flex;align-items:center;gap:8px;min-width:0;vertical-align:middle;}
.vendor-logo {display:flex;align-items:center;justify-content:center;flex-shrink:0;width:56px;height:28px;padding:3px 5px;background:color-mix(in srgb, white 30%, var(--muted) 70%);border:1px solid color-mix(in srgb, white 22%, var(--border) 78%);border-radius:6px;}
.vendor-logo img {display:block;width:100%;height:100%;object-fit:contain;}
.vendor-identity {min-width:0;line-height:1.4;overflow-wrap:anywhere;}
.vendor-detail {display:flex;gap:12px;}
.vendor-detail .vendor-logo {width:112px;height:44px;padding:5px 10px;border-radius:8px;}
</style>
