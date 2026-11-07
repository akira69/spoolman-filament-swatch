import assert from 'node:assert/strict';import {test} from 'node:test';import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {evaluateUpdate,ensureProposal} from './sync-upstream.mjs';
const git=(repo,...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
test('upstream updates are incremental, reviewable, atomic and adoption-aware',()=>{
 const repo=mkdtempSync(path.join(tmpdir(),'swatch-sync-'));try{
 git(repo,'init','-b','main');git(repo,'config','user.name','Test');git(repo,'config','user.email','test@example.invalid');writeFileSync(path.join(repo,'shared.txt'),'base\n');git(repo,'add','.');git(repo,'commit','-m','base');const base=git(repo,'rev-parse','HEAD');
 assert.equal(evaluateUpdate({repo,source:base,target:base}).state,'unchanged');
 git(repo,'checkout','-b','upstream');writeFileSync(path.join(repo,'shared.txt'),'upstream\n');git(repo,'commit','-am','upstream');const target=git(repo,'rev-parse','HEAD');git(repo,'checkout','main');writeFileSync(path.join(repo,'local.txt'),'native\n');git(repo,'add','.');git(repo,'commit','-m','native');const head=git(repo,'rev-parse','HEAD');
 let result=evaluateUpdate({repo,source:base,target});assert.equal(result.state,'ready');assert.match(result.patch,/upstream/);assert.equal(git(repo,'rev-parse','HEAD'),head);assert.equal(readFileSync(path.join(repo,'shared.txt'),'utf8'),'base\n');
 assert.equal(evaluateUpdate({repo,source:base,target,pending:true}).state,'queued');
 assert.equal(evaluateUpdate({repo,source:base,target,adoptedPaths:['shared.txt']}).state,'reconcile');
 writeFileSync(path.join(repo,'shared.txt'),'conflict\n');git(repo,'commit','-am','local shared change');assert.equal(evaluateUpdate({repo,source:base,target}).state,'conflict');assert.equal(readFileSync(path.join(repo,'shared.txt'),'utf8'),'conflict\n');
 writeFileSync(path.join(repo,'package-lock.json'),'{}');git(repo,'add','.');git(repo,'commit','-m','dependency');const dependency=git(repo,'rev-parse','HEAD');assert.equal(evaluateUpdate({repo,source:target,target:dependency}).state,'reconcile');
 // A squash-integrated previous delta uses the pinned upstream SHA, not local ancestry.
 writeFileSync(path.join(repo,'shared.txt'),'upstream\n');git(repo,'commit','-am','squash previous');git(repo,'checkout','upstream');writeFileSync(path.join(repo,'next.txt'),'next\n');git(repo,'add','.');git(repo,'commit','-m','next');const next=git(repo,'rev-parse','HEAD');git(repo,'checkout','main');result=evaluateUpdate({repo,source:target,target:next});assert.equal(result.state,'ready');assert.match(result.patch,/next.txt/);assert.doesNotMatch(result.patch,/diff --git a\/shared/);
 }finally{rmSync(repo,{recursive:true,force:true});}
});

test('publication resumes after branch, PR or dispatch failure without rewriting a published head',()=>{
 for(const fail of ['pr','checks']) {
  let branch=false,pr=false,checks=false,creates=0,broken=true;
  const callbacks={findBranch:()=>branch,createBranch:()=>{branch=true;creates++;},findPR:()=>pr,createPR:()=>{if(fail==='pr'&&broken)throw new Error('network');pr=true;},ensureChecks:()=>{if(fail==='checks'&&broken)throw new Error('dispatch');checks=true;}};
  assert.throws(()=>ensureProposal(callbacks));broken=false;ensureProposal(callbacks);assert.equal(creates,1);assert.ok(branch&&pr&&checks);
 }
});
