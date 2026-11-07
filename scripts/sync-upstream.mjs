import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';
const git=(repo,...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024}).trimEnd();
const excluded=['.github/workflows','package.json','package-lock.json','upstream-source.json','docs/upstream-adoptions.json'];
export function evaluateUpdate({repo,source,target,pending=false,adoptedPaths=[]}) {
 if(!/^[a-f0-9]{40}$/.test(source)||!/^[a-f0-9]{40}$/.test(target))throw new Error('Expected pinned commit SHAs');
 if(source===target)return {state:'unchanged'};
 if(pending)return {state:'queued'};
 const files=git(repo,'diff','--no-renames','--name-only',source,target).split('\n').filter(Boolean);
 if(files.some(file=>adoptedPaths.includes(file) || ['package.json','package-lock.json'].includes(file)))return {state:'reconcile',files};
 // Never import upstream's deployment or overwrite edition identity/lockfile silently.
 const patch=git(repo,'diff','--binary',source,target,'--','.',...excluded.map(p=>`:(exclude)${p}`))+'\n';
 const scratch=mkdtempSync(path.join(tmpdir(),'filaman-upstream-'));
 try {
  git(scratch,'clone','--quiet','--no-hardlinks',repo,'.');
  git(scratch,'checkout','--quiet',git(repo,'rev-parse','HEAD'));
  const result=patch.trim()?spawnSync('git',['apply','--3way','--index','-'],{cwd:scratch,input:patch,encoding:'utf8'}):{status:0,stderr:''};
  if(result.status!==0)return {state:'conflict',files,details:result.stderr};
  return {state:'ready',patch,files,excluded:files.filter(f=>excluded.some(p=>f===p||f.startsWith(p+'/')))};
 }finally{rmSync(scratch,{recursive:true,force:true});}
}
export function ensureProposal({findBranch,createBranch,findPR,createPR,ensureChecks}) {
 if(!findBranch())createBranch();
 if(!findPR())createPR();
 ensureChecks();
}
async function main() {
 const args=process.argv.slice(2);const dry=args.includes('--dry-run');const fixtureIndex=args.indexOf('--fixtures');
 if(fixtureIndex>=0){const config=JSON.parse(readFileSync(path.join(args[fixtureIndex+1],'scenario.json'),'utf8'));console.log(JSON.stringify(evaluateUpdate(config)));return;}
 const repo=process.cwd();const marker=JSON.parse(readFileSync('upstream-source.json','utf8'));
 if(marker.repository!=='Disane87/spoolman-filament-swatch')throw new Error('Unexpected upstream repository');
 if(git(repo,'status','--porcelain').trim())throw new Error('Updater requires a clean checkout');
 git(repo,'fetch',`https://github.com/${marker.repository}.git`,'main','--tags');
 const target=git(repo,'rev-parse','FETCH_HEAD');
 const gh=(...a)=>execFileSync('gh',a,{cwd:repo,encoding:'utf8'}).trim();
 const prs=JSON.parse(gh('pr','list','--repo','akira69/filaman-filament-swatch','--state','open','--json','headRefName'));
 const ensureChecks=branch=>{
  const sha=gh('api',`repos/akira69/filaman-filament-swatch/git/ref/heads/${branch}`,'--jq','.object.sha');
  for(const workflow of ['hosted-tests.yml','filaman-plugin-tests.yml']) {
   const runs=JSON.parse(gh('run','list','--branch',branch,'--workflow',workflow,'--json','headSha','--limit','20'));
   if(!runs.some(run=>run.headSha===sha))gh('workflow','run',workflow,'--ref',branch);
  }
 };
 const pending=prs.find(p=>p.headRefName.startsWith('chore/upstream-'));
 if(pending){if(!dry)ensureChecks(pending.headRefName);console.log(JSON.stringify({state:'queued',head:pending.headRefName,target}));return;}
 const ledger=JSON.parse(readFileSync('docs/upstream-adoptions.json','utf8'));
 const adoptedPaths=(ledger.adopted??[]).flatMap(entry=>entry.paths??[]);
 const result=evaluateUpdate({repo,source:marker.commit,target,adoptedPaths});
 mkdirSync('_upstream-artifacts',{recursive:true});writeFileSync('_upstream-artifacts/result.json',JSON.stringify({...result,patch:undefined},null,2));
 console.log(JSON.stringify({state:result.state,source:marker.commit,target}));
 if(dry || result.state==='unchanged')return;
 const branch=`chore/upstream-${target.slice(0,12)}`;
 const manual=result.state!=='ready';
 const body=`Review upstream ${marker.commit} → ${target}. ${manual?'Manual reconciliation required; source marker is unchanged.':'Incremental source patch; validation required.'}\n\nSource: https://github.com/${marker.repository}/compare/${marker.commit}...${target}\n\nDependency/lockfile changes and adopted overlaps require explicit reconciliation before advancing upstream-source.json. No automatic merge or release.\n\nChecks are dispatched explicitly because GITHUB_TOKEN-created PR events do not trigger normal checks.`;
 const bodyFile=path.join(tmpdir(),`filaman-upstream-${target.slice(0,12)}.md`);writeFileSync(bodyFile,body);
 try {
  ensureProposal({
   findBranch:()=>Boolean(git(repo,'ls-remote','origin',`refs/heads/${branch}`)),
   createBranch:()=>{
    git(repo,'switch','-c',branch);
    if(manual){mkdirSync('docs/upstream-reviews',{recursive:true});writeFileSync(`docs/upstream-reviews/${target}.md`,body+`\n\nReason: ${result.state}. Changed files: ${(result.files??[]).join(', ')}\n`);git(repo,'add','docs/upstream-reviews');}
    else {
     if(result.patch.trim())execFileSync('git',['apply','--3way','--index','-'],{cwd:repo,input:result.patch});
     const tags=git(repo,'tag','--points-at',target).split('\n').filter(t=>/^v\d+\.\d+\.\d+$/.test(t));
     writeFileSync('upstream-source.json',JSON.stringify({...marker,commit:target,releaseTag:tags[0]??null},null,2)+'\n');git(repo,'add','upstream-source.json');
    }
    git(repo,'commit','-m',`chore: review upstream ${target.slice(0,12)}`);git(repo,'push','origin',branch);
   },
   findPR:()=>JSON.parse(gh('pr','list','--repo','akira69/filaman-filament-swatch','--head',branch,'--state','open','--json','number')).length>0,
   createPR:()=>gh('pr','create','--repo','akira69/filaman-filament-swatch','--base','main','--head',branch,'--title',`chore: review upstream ${target.slice(0,12)}`,'--body-file',bodyFile,...(manual?['--draft']:[])),
   ensureChecks:()=>ensureChecks(branch),
  });
 }finally{rmSync(bodyFile,{force:true});}

}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
