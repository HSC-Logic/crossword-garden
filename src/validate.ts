import type { Puzzle } from './types';
import { cells,key } from './types';
export function validatePuzzles(puzzles:Puzzle[]) {
 const assert=(ok:unknown,msg:string)=>{if(!ok)throw new Error(msg);};
 assert(puzzles.length===150,'Expected exactly 150 puzzles');
 for(const d of ['Easy','Medium','Hard'])assert(puzzles.filter(p=>p.difficulty===d).length===50,`Expected 50 ${d}`);
 const ids=new Set(),grids=new Set(),sets=new Set();
 for(const p of puzzles){
 const check=(ok:unknown,msg:string)=>assert(ok,`${p.id}: ${msg}`);
 check(!ids.has(p.id)&&/^[a-z0-9-]+$/.test(p.id),'Unique valid ID');ids.add(p.id);
 check(p.version>=1&&!!p.title&&!!p.theme,'Metadata');
 const range=p.difficulty==='Easy'?[7,9]:p.difficulty==='Medium'?[9,11]:[11,13];
 check(p.width>=range[0]&&p.width<=range[1]&&p.height>=range[0]&&p.height<=range[1],'Dimensions');
 check(p.solution.length===p.height&&p.solution.every(r=>r.length===p.width),'Grid bounds');
 const used=new Map<string,number>(),declared=new Set<string>(),answers=new Set();
 const starts=[...new Set(p.entries.map(e=>e.row*p.width+e.col))].sort((a,b)=>a-b);
 check(p.entries.length>=6,'At least six entries');
 for(const e of p.entries){
 check(/^[A-Z]{2,}$/.test(e.answer)&&e.clue.trim().length>=8,'Valid answer and clue');
 check(!answers.has(e.answer),'Repeated answer');answers.add(e.answer);
 check(e.direction==='across'||e.direction==='down','Direction');
 check(Number.isInteger(e.row)&&Number.isInteger(e.col)&&e.row>=0&&e.col>=0,'Coordinates');
 check(e.number===starts.indexOf(e.row*p.width+e.col)+1,'Numbering');
 const signature=e.direction+':'+cells(e).join(';');check(!declared.has(signature),'Duplicate entry');declared.add(signature);
 cells(e).forEach((k,i)=>{const [r,c]=k.split(',').map(Number);check(p.solution[r]?.[c]===e.answer[i],'Crossing or bounds mismatch');used.set(k,(used.get(k)||0)+1);});
 }
 for(const e of p.entries)check(cells(e).some(k=>(used.get(k)||0)>1),'Uncrossed answer');
 for(let r=0;r<p.height;r++)for(let c=0;c<p.width;c++){
 const letter=p.solution[r][c];if(letter===null)continue;
 check(/^[A-Z]$/.test(letter)&&used.has(key(r,c)),'Orphan or invalid cell');
 for(const direction of ['across','down'] as const){
 const dr=direction==='down'?1:0,dc=1-dr;
 if(p.solution[r-dr]?.[c-dc])continue;
 const run=[];let rr=r,cc=c;while(p.solution[rr]?.[cc]){run.push(key(rr,cc));rr+=dr;cc+=dc;}
 if(run.length>=2)check(declared.has(direction+':'+run.join(';')),'Undeclared run');
 }
 }
 const visited=new Set<string>(),queue=[used.keys().next().value!];
 while(queue.length){const k=queue.pop()!;if(visited.has(k))continue;visited.add(k);const [r,c]=k.split(',').map(Number);for(const [rr,cc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]])if(used.has(key(rr,cc))&&!visited.has(key(rr,cc)))queue.push(key(rr,cc));}
 check(visited.size===used.size,'Disconnected grid');
 const grid=JSON.stringify(p.solution),set=[...answers].sort().join(',');
 check(!grids.has(grid)&&!sets.has(set),'Duplicate grid or answer set');grids.add(grid);sets.add(set);
 }
 return {puzzles:puzzles.length,entries:puzzles.reduce((n,p)=>n+p.entries.length,0)};
}
