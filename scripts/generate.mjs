import { banks } from './banks.mjs';
import { writeFileSync } from 'node:fs';
let seed=8137;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const shuffle=a=>a.map(x=>[random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const puzzles=[];const sets=new Set();
for(const [theme,raw] of Object.entries(banks)) for(const difficulty of ['Easy','Medium','Hard']) for(let variant=0;variant<5;variant++){
 const size={Easy:9,Medium:11,Hard:13}[difficulty], target={Easy:6,Medium:8,Hard:10}[difficulty];
 const bank=raw.split('\n').map(s=>{const [answer,easy,hard]=s.split('|');return {answer,clue:difficulty==='Easy'?easy:hard};}).filter(e=>e.answer.length<=size && (difficulty!=='Easy'||e.answer.length<=7));
 let result;
 for(let attempt=0;attempt<250&&!result;attempt++){
 const grid=Array.from({length:size},()=>Array(size).fill(null)),entries=[];
 const words=shuffle(bank);const firstIndex=difficulty==='Easy'?0:words.findIndex(e=>e.answer.length>=(difficulty==='Hard'?9:7));const first=words.splice(Math.max(0,firstIndex),1)[0];
 const put=(e,row,col,direction)=>{for(let k=0;k<e.answer.length;k++)grid[row+(direction==='down'?k:0)][col+(direction==='across'?k:0)]=e.answer[k];entries.push({...e,row,col,direction});};
 put(first,Math.floor(size/2),Math.floor((size-first.answer.length)/2),'across');
 for(let pass=0;pass<3&&entries.length<target;pass++)for(const e of words){
 if(entries.some(x=>x.answer===e.answer)||entries.length>=target)continue;
 let options=[];
 for(const direction of ['across','down'])for(let row=0;row<size;row++)for(let col=0;col<size;col++){
 const dr=direction==='down'?1:0,dc=1-dr,len=e.answer.length;
 if(row+dr*(len-1)>=size||col+dc*(len-1)>=size)continue;
 const at=(r,c)=>grid[r]?.[c]??null;
 if(at(row-dr,col-dc)||at(row+dr*len,col+dc*len))continue;
 let crosses=0,valid=true;
 for(let k=0;k<len;k++){
 const r=row+dr*k,c=col+dc*k;
 if(grid[r][c]){
 if(grid[r][c]!==e.answer[k]||entries.some(x=>x.direction===direction&&Array.from({length:x.answer.length},(_,i)=>[x.row+(dr*i),x.col+(dc*i)]).some(([rr,cc])=>rr===r&&cc===c))){valid=false;break;}crosses++;
 }else if(at(r-dc,c-dr)||at(r+dc,c+dr)){valid=false;break;}
 }
 if(valid&&crosses)options.push({row,col,direction,score:crosses*10+random()*5});
 }
 options.sort((a,b)=>b.score-a.score);if(options[0])put(e,options[0].row,options[0].col,options[0].direction);
 }
 const signature=entries.map(x=>x.answer).sort().join(',');
 if(entries.length>=target&&!sets.has(signature)){sets.add(signature);result={grid,entries};}
 }
 if(!result)throw Error(`Could not generate ${theme} ${difficulty} ${variant}`);
 const starts=[...new Set(result.entries.map(e=>e.row*size+e.col))].sort((a,b)=>a-b);
 result.entries.forEach(e=>e.number=starts.indexOf(e.row*size+e.col)+1);
 result.entries.sort((a,b)=>a.number-b.number||a.direction.localeCompare(b.direction));
 const names=['First discoveries','A closer look','Hidden treasures','Little wonders','The winding path'];
 const id=`${theme.toLowerCase().replace(/[^a-z]+/g,'-').replace(/-$/,'')}-${difficulty.toLowerCase()}-${variant+1}`;
 puzzles.push({id,version:1,title:`${theme}: ${names[variant]}`,theme,difficulty,width:size,height:size,solution:result.grid,entries:result.entries});
}
// Interleave themes and difficulty so the library opens with a varied collection.
puzzles.sort((a,b)=>['Easy','Medium','Hard'].indexOf(a.difficulty)-['Easy','Medium','Hard'].indexOf(b.difficulty)||Number(a.id.at(-1))-Number(b.id.at(-1))||a.theme.localeCompare(b.theme));
writeFileSync('public/puzzles.json',JSON.stringify(puzzles));
console.log(`Generated ${puzzles.length} puzzles, ${puzzles.reduce((n,p)=>n+p.entries.length,0)} clued entries.`);
