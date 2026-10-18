import {cells,key,type Puzzle,type Progress,type Entry,type Direction} from './types';
export const entryAt=(p:Puzzle,s:Progress):Entry=>p.entries.find(e=>e.direction===s.direction&&cells(e).includes(s.selected))||p.entries.find(e=>cells(e).includes(s.selected))||p.entries[0];
export const complete=(p:Puzzle,s:Progress)=>p.solution.every((row,r)=>row.every((v,c)=>!v||s.letters[key(r,c)]===v));
export function select(p:Puzzle,s:Progress,k:string,direction?:Direction):Progress{
 const available=p.entries.filter(e=>cells(e).includes(k));if(!available.length)return s;
 let dir=direction||s.direction;if(!direction&&k===s.selected&&available.length>1)dir=s.direction==='across'?'down':'across';
 if(!available.some(e=>e.direction===dir))dir=available[0].direction;
 return {...s,selected:k,direction:dir};
}
export function input(p:Puzzle,s:Progress,value:string,pencil=false):Progress{
 const next={...s,letters:{...s.letters},pencil:[...s.pencil],errors:s.errors.filter(k=>k!==s.selected)};
 const word=cells(entryAt(p,s));let index=word.indexOf(s.selected);
 if(value==='Backspace'&&!next.letters[s.selected])index=Math.max(0,index-1);
 const k=value==='Backspace'?word[index]:s.selected;
 if(value==='Backspace'||value==='Delete'){delete next.letters[k];next.pencil=next.pencil.filter(x=>x!==k);next.errors=next.errors.filter(x=>x!==k);next.selected=k;}
 else if(/^[a-z]$/i.test(value)){
 next.letters[k]=value.toUpperCase();next.pencil=next.pencil.filter(x=>x!==k);if(pencil)next.pencil.push(k);
 next.selected=word[Math.min(index+1,word.length-1)];
 }else return s;
 next.completed=complete(p,next);return next;
}
export function hint(p:Puzzle,s:Progress,action:'check'|'reveal',scope:'letter'|'word'|'puzzle'):Progress{
 const targets=scope==='letter'?[s.selected]:scope==='word'?cells(entryAt(p,s)):p.entries.flatMap(cells);
 const next={...s,letters:{...s.letters},errors:s.errors.filter(k=>!targets.includes(k)),pencil:[...s.pencil],revealed:[...s.revealed]};
 if(action==='check'){
 next.checks++;for(const k of new Set(targets)){const [r,c]=k.split(',').map(Number);if(s.letters[k]&&s.letters[k]!==p.solution[r][c])next.errors.push(k);}
 }else{
 next.reveals++;for(const k of new Set(targets)){const [r,c]=k.split(',').map(Number);next.letters[k]=p.solution[r][c]!;if(!next.revealed.includes(k))next.revealed.push(k);next.pencil=next.pencil.filter(x=>x!==k);}
 }
 next.completed=complete(p,next);return next;
}
export function arrow(p:Puzzle,s:Progress,dr:number,dc:number):Progress{
 let [r,c]=s.selected.split(',').map(Number);r+=dr;c+=dc;
 while(r>=0&&r<p.height&&c>=0&&c<p.width){if(p.solution[r][c])return select(p,s,key(r,c),dr?'down':'across');r+=dr;c+=dc;}return s;
}
