export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Direction = 'across' | 'down';
export interface Entry {number:number; row:number; col:number; direction:Direction; answer:string; clue:string}
export interface Puzzle {id:string; version:number; title:string; theme:string; difficulty:Difficulty; width:number; height:number; solution:(string|null)[][]; entries:Entry[]}
export interface Progress {id:string; version:number; letters:Record<string,string>; pencil:string[]; pencilMode:boolean; paused:boolean; errors:string[]; revealed:string[]; checks:number; reveals:number; elapsed:number; completed:boolean; favorite:boolean; selected:string; direction:Direction; updated:number}
export interface Settings {theme:'light'|'dark'|'system'; textSize:'normal'|'large'; keyboard:boolean}
export interface Saved {progress:Record<string,Progress>; settings:Settings}
export const defaults:Settings={theme:'system',textSize:'normal',keyboard:true};
export const key=(r:number,c:number)=>`${r},${c}`;
export const cells=(e:Entry)=>Array.from({length:e.answer.length},(_,i)=>key(e.row+(e.direction==='down'?i:0),e.col+(e.direction==='across'?i:0)));
export const fresh=(p:Puzzle):Progress=>({id:p.id,version:p.version,letters:{},pencil:[],pencilMode:false,paused:false,errors:[],revealed:[],checks:0,reveals:0,elapsed:0,completed:false,favorite:false,selected:cells(p.entries[0])[0],direction:p.entries[0].direction,updated:0});
