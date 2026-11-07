import notes from './release-notes.json';
import upstream from '../../upstream-source.json';
const repository='akira69/filaman-filament-swatch';
export const releaseStorageKey=`filaman-swatch:${repository}:${notes.version}:seen`;
export const getInstalledReleaseNotes=()=>({...notes,repository,upstream,url:`https://github.com/${repository}/releases/tag/filaman-v${notes.version}`});
