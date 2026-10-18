import {test,expect} from '@playwright/test';
import {readFileSync,cpSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import type {Puzzle} from '../../src/types';
const puzzles: Puzzle[]=JSON.parse(readFileSync('public/puzzles.json','utf8'));
test('production subpath: all puzzles offline, exact restored state, mobile and tablet',async({page,context})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./');await expect(page.getByRole('heading',{name:/Let your curiosity/})).toBeVisible();
 await expect(page.getByText('Ready offline',{exact:true})).toBeVisible({timeout:30000});
 await page.setViewportSize({width:390,height:844});
 await page.goto(`./#/play/${puzzles[0].id}`);const cell=page.locator('.cell[tabindex="0"]');await cell.click();await page.keyboard.type('A');
 const chosen=await page.locator('.cell[tabindex="0"]').getAttribute('data-cell');
 await expect(page.locator('.board-caption')).toContainText('1 /');
 await page.getByRole('button',{name:'Pencil',exact:true}).tap();await page.getByRole('button',{name:'Pause timer',exact:true}).tap();
 await expect(page.locator('.save-indicator')).toHaveText('Saved on this device');await context.setOffline(true);await page.reload();await expect(page.locator('.board-caption')).toContainText('1 /');await expect(page.locator('.cell[tabindex="0"]')).toHaveAttribute('data-cell',chosen!);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.getByRole('button',{name:'Pencil',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'Resume puzzle',exact:true})).toBeVisible();await page.getByRole('button',{name:'Resume puzzle',exact:true}).tap();await page.getByRole('button',{name:'Q',exact:true}).tap();await expect(page.locator('.board-caption')).toContainText('2 /');
 await page.locator('summary').filter({hasText:/^Reveal$/}).click();await page.getByRole('button',{name:'Reveal word',exact:true}).click();await expect(page.locator('.hint-counts')).toContainText('1 reveals');
 await page.goto('./#/library');await expect(page.locator('.puzzle-card')).toHaveCount(150);
 for(const p of puzzles){await page.goto(`./#/play/${p.id}`);await expect(page.getByRole('heading',{name:p.theme,exact:true})).toBeVisible();await expect(page.locator('.cell:not(.blocked)')).toHaveCount(p.solution.flat().filter(Boolean).length);}
 const content=await page.evaluate(async()=>await (await fetch('./puzzles.json')).json());expect(content).toHaveLength(150);
 const reopened=await context.newPage();await reopened.goto('http://127.0.0.1:4173/garden/#/library');await expect(reopened.locator('.puzzle-card')).toHaveCount(150);await reopened.close();
 await page.setViewportSize({width:768,height:1024});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto('./#/settings');await page.getByLabel('Appearance',{exact:true}).selectOption('dark');await page.getByLabel('Text size',{exact:true}).selectOption('large');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.setViewportSize({width:1440,height:1000});await page.goto('./');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('user-controlled service worker update preserves progress',async({page})=>{
 await page.goto('./');await expect(page.getByText('Ready offline',{exact:true})).toBeVisible({timeout:30000});
 await page.goto(`./#/play/${puzzles[0].id}`);await page.locator('.cell[tabindex="0"]').click();await page.keyboard.type('B');await expect(page.locator('.board-caption')).toContainText('1 /');
 const original=mkdtempSync(join(tmpdir(),'garden-update-'));cpSync('dist',join(original,'dist'),{recursive:true});
 try{
 execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build'],{env:{...process.env,BASE_PATH:'/garden/',BUILD_ID:`update-test-${Date.now()}`},stdio:'pipe'});
 await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg!.update();});
 await expect(page.getByText('A fresh version is ready.',{exact:false})).toBeVisible({timeout:30000});
 await page.getByRole('button',{name:'Update & reload',exact:true}).click();await expect(page.locator('.board-caption')).toContainText('1 /');await expect(page.getByText('Ready offline',{exact:true})).toBeVisible();
 }finally{rmSync('dist',{recursive:true,force:true});cpSync(join(original,'dist'),'dist',{recursive:true});rmSync(original,{recursive:true,force:true});}
});

test('library filters, backup confirmation, completion and reset',async({page})=>{
 await page.goto('./#/library');await expect(page.locator('.puzzle-card')).toHaveCount(150);
 await page.getByLabel('Search puzzles').fill('Ocean');await expect(page.locator('.puzzle-card')).toHaveCount(15);await page.getByLabel('Search puzzles').fill('');
 await page.goto(`./#/play/${puzzles[0].id}`);
 // Solve via physical keyboard using each declared entry, including shared crossings.
 for(const e of puzzles[0].entries){await page.locator('.clue-panel li button').filter({hasText:e.clue}).click();await page.keyboard.type(e.answer);}
 await expect(page.getByRole('dialog')).toContainText('Every word found');await page.getByRole('button',{name:'Close dialog'}).click();
 await expect(page.locator('.save-indicator')).toHaveText('Saved on this device');
 await page.goto('./#/settings');const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup',exact:true}).click();const downloaded=await downloadEvent;const file=await downloaded.path();expect(file).toBeTruthy();
 await page.getByRole('button',{name:'Clear all local progress',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Clear progress',exact:true}).click();
 await page.locator('input[type=file]').setInputFiles(file!);await expect(page.getByRole('dialog')).toContainText('1 saved puzzles');await page.getByRole('button',{name:'Replace progress',exact:true}).click();
 await page.goto('./#/statistics');await expect(page.locator('.stats-grid article').first()).toContainText('1 / 150');
 await page.goto(`./#/play/${puzzles[0].id}`);await page.getByRole('button',{name:'Reset',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('.board-caption')).toContainText('Complete');
 await page.getByRole('button',{name:'Reset',exact:true}).click();await page.getByRole('button',{name:'Reset puzzle',exact:true}).click();await expect(page.locator('.board-caption')).toContainText('0 /');
});
test('readiness detects and repairs an incomplete precache',async({page})=>{
 await page.goto('./#/settings');await expect(page.getByRole('status').filter({hasText:'Ready offline'})).toBeVisible();
 await page.evaluate(async()=>{for(const name of await caches.keys()){const cache=await caches.open(name);for(const request of await cache.keys())if(request.url.includes('puzzles.json'))await cache.delete(request);}});
 await page.reload();await expect(page.getByRole('status').filter({hasText:'Download incomplete'})).toBeVisible();
 await page.getByRole('button',{name:'Retry / verify download'}).click();await expect(page.getByRole('status').filter({hasText:'Ready offline'})).toBeVisible();
});
