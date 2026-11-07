<script setup lang="ts">
import {ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {getInstalledReleaseNotes,releaseStorageKey} from '@/filaman/release';
import {hostContext} from '@/filaman/context';
import {formatDate} from '@/filaman/format';
const {t}=useI18n();const isOpen=ref(false);const release=getInstalledReleaseNotes();
const open=()=>isOpen.value=true;
const dismiss=()=>{localStorage.setItem(releaseStorageKey,'1');isOpen.value=false;};
defineExpose({open});
</script>
<template><Dialog v-model:open="isOpen"><DialogContent><DialogHeader><DialogTitle>{{ t('changelog.title') }} · {{ release.version }}</DialogTitle><DialogDescription>{{ t('changelog.released',{date:formatDate(release.date)}) }}</DialogDescription></DialogHeader><p>{{ release.body[hostContext.language] ?? release.body.en }}</p><a :href="release.url" target="_blank" rel="noopener noreferrer">{{ t('changelog.viewOnGithub') }}</a><Button @click="dismiss">{{ t('changelog.gotIt') }}</Button></DialogContent></Dialog></template>
