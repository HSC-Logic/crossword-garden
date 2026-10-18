import {useEffect,useState} from 'react';
export function useOffline(){
 const [attempt,setAttempt]=useState(0);
 const [status,setStatus]=useState('Preparing offline…'),[ready,setReady]=useState(false),[update,setUpdate]=useState<ServiceWorker|null>(null),[registration,setRegistration]=useState<ServiceWorkerRegistration|null>(null);
 async function verify(worker?:ServiceWorker|null,repair=false){
 const active=worker||navigator.serviceWorker?.controller;if(!active)return;
 try{const result=await new Promise<{ready:boolean;version:string;cached:number;total:number}>((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>reject(Error('Offline verification timed out')),10000);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};active.postMessage({type:'VERIFY_OFFLINE',repair},[channel.port2]);});
 const valid=result.ready&&result.version===__BUILD_ID__;setReady(valid);setStatus(valid?'Ready offline · all 150 puzzles':result.version!==__BUILD_ID__?'Update ready · reload to prepare':'Download incomplete · retry');
 }catch{setReady(false);setStatus('Offline preparation failed · retry');}
 }
 useEffect(()=>{
 if(!('serviceWorker'in navigator)||!import.meta.env.PROD){setStatus(import.meta.env.DEV?'Offline available in production build':'Offline unavailable in this browser');return;}
 let disposed=false;
 const changed=()=>{void verify();};navigator.serviceWorker.addEventListener('controllerchange',changed);
 navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL}).then(reg=>{
 if(disposed)return;setRegistration(reg);if(reg.waiting)setUpdate(reg.waiting);
 const watch=(w:ServiceWorker)=>w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)setUpdate(w);if(w.state==='redundant')setStatus('Offline preparation failed · retry');});
 if(reg.installing)watch(reg.installing);reg.addEventListener('updatefound',()=>{if(reg.installing)watch(reg.installing);});
 void navigator.serviceWorker.ready.then(r=>{if(!disposed)void verify(r.active);});
 }).catch(()=>setStatus('Offline preparation failed · retry'));
 return()=>{disposed=true;navigator.serviceWorker.removeEventListener('controllerchange',changed);};
 },[attempt]);
 return {status,ready,update,retry:async()=>{if(!import.meta.env.PROD||!('serviceWorker'in navigator)){setStatus('Offline requires a production build and a supported browser');return;}setStatus('Checking offline download…');if(!registration?.active){setAttempt(n=>n+1);return;}try{await registration.update();await verify(registration.active,true);}catch{setStatus('Offline preparation failed · retry');}},applyUpdate:()=>{if(update){navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});update.postMessage({type:'SKIP_WAITING'});}else location.reload();}};
}
