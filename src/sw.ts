/// <reference lib="webworker" />
import {clientsClaim,cacheNames} from 'workbox-core';
import {precacheAndRoute,createHandlerBoundToURL,matchPrecache,getCacheKeyForURL,cleanupOutdatedCaches} from 'workbox-precaching';
import {registerRoute,NavigationRoute} from 'workbox-routing';
declare const self:ServiceWorkerGlobalScope & {__WB_MANIFEST:Array<{url:string;revision:string|null}>};
const manifest=self.__WB_MANIFEST;
precacheAndRoute(manifest);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));
clientsClaim();
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING'){event.waitUntil(self.skipWaiting());return;}
 if(event.data?.type==='VERIFY_OFFLINE')event.waitUntil((async()=>{
 let cached=0;for(const asset of manifest){
 if(event.data.repair&&!await matchPrecache(asset.url)){try{const response=await fetch(new URL(asset.url,self.location.href),{cache:'reload'});const cacheKey=getCacheKeyForURL(asset.url);if(response.ok&&cacheKey){const cache=await caches.open(cacheNames.precache);await cache.put(cacheKey,response);}}catch{/* Missing files remain unready until a successful retry. */}}
 if(await matchPrecache(asset.url))cached++;
 }
 event.ports[0]?.postMessage({type:'OFFLINE_STATUS',version:__BUILD_ID__,cached,total:manifest.length,ready:manifest.length>0&&cached===manifest.length});
 })());
});
