import {defaults,fresh,type Saved,type Puzzle,type Progress} from './types';
let database:Promise<IDBDatabase>|undefined;
function db(){return database??=new Promise((resolve,reject)=>{const req=indexedDB.open('crossword-garden',1);req.onupgradeneeded=()=>req.result.createObjectStore('state');req.onsuccess=()=>resolve(req.result);req.onerror=()=>{database=undefined;reject(req.error);};});}
export async function load():Promise<Saved>{const d=await db();return new Promise((resolve,reject)=>{const req=d.transaction('state').objectStore('state').get('saved');req.onsuccess=()=>resolve(req.result??{progress:{},settings:defaults});req.onerror=()=>reject(req.error);});}
// Serialize writes so a backup replacement cannot race an earlier autosave.
let writes=Promise.resolve();
export function save(data:Saved):Promise<void>{const snapshot=structuredClone(data);const next=writes.catch(()=>{}).then(async()=>{const d=await db();await new Promise<void>((resolve,reject)=>{const tx=d.transaction('state','readwrite');tx.objectStore('state').put(snapshot,'saved');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new Error('Storage transaction aborted'));});});writes=next;return next;}
export function backup(data:Saved){return JSON.stringify({format:'crossword-garden',version:1,exportedAt:new Date().toISOString(),...data},null,2);}
export function parseBackup(text:string,puzzles:Puzzle[]):Saved{
 if(text.length>5_000_000)throw Error('Backup is too large (maximum 5 MB).');
 const x=JSON.parse(text);const fail=()=>{throw Error('Invalid or incompatible backup. No data was changed.');};
 if(!x||x.format!=='crossword-garden'||x.version!==1||!x.progress||typeof x.progress!=='object'||Array.isArray(x.progress)||!x.settings) return fail();
 const settings=x.settings;
 if(!['light','dark','system'].includes(settings.theme)||!['normal','large'].includes(settings.textSize)||typeof settings.keyboard!=='boolean')return fail();
 const progress:Record<string,Progress>={};
 for(const [id,value] of Object.entries(x.progress)){
 const p=puzzles.find(p=>p.id===id);if(!p||!value||typeof value!=='object')return fail();
 const s=value as Progress;const validCells=new Set(p.entries.flatMap(e=>Array.from({length:e.answer.length},(_,i)=>`${e.row+(e.direction==='down'?i:0)},${e.col+(e.direction==='across'?i:0)}`)));
 if(s.id!==id||s.version!==p.version||!s.letters||typeof s.letters!=='object'||Array.isArray(s.letters)||!Object.entries(s.letters).every(([k,v])=>validCells.has(k)&&typeof v==='string'&&/^[A-Z]$/.test(v)))return fail();
 if(!['pencil','errors','revealed'].every(k=>Array.isArray(s[k as keyof Progress])&&(s[k as 'pencil'] as string[]).every(v=>typeof v==='string'&&validCells.has(v))))return fail();
 if(!['checks','reveals','elapsed','updated'].every(k=>Number.isSafeInteger(s[k as keyof Progress])&&(s[k as 'elapsed'] as number)>=0)||s.elapsed>315360000||!validCells.has(s.selected)||!['across','down'].includes(s.direction)||typeof s.completed!=='boolean'||typeof s.favorite!=='boolean'||typeof s.pencilMode!=='boolean'||typeof s.paused!=='boolean')return fail();
 const completed=p.solution.every((row,r)=>row.every((v,c)=>!v||s.letters[`${r},${c}`]===v));
 if(completed!==s.completed)return fail();
 progress[id]={...fresh(p),letters:{...s.letters},pencil:[...new Set(s.pencil)],pencilMode:s.pencilMode,paused:s.paused,errors:[...new Set(s.errors)],revealed:[...new Set(s.revealed)],checks:s.checks,reveals:s.reveals,elapsed:s.elapsed,updated:s.updated,selected:s.selected,direction:s.direction,completed:s.completed,favorite:s.favorite};
 }
 return {settings:{theme:settings.theme,textSize:settings.textSize,keyboard:settings.keyboard},progress};
}
