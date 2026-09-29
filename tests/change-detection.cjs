const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const data={},focus=[],listeners={};let hash='a',fail=false;
const event=key=>({addListener:fn=>listeners[key]=fn});
const chrome={storage:{local:{get:async k=>structuredClone(k?{[k]:data[k]}:data),set:async v=>Object.assign(data,structuredClone(v)),remove:async k=>delete data[k]}},
 runtime:{onMessage:event('message'),onStartup:event('startup'),onInstalled:event('installed')},
 tabs:{get:async()=>({url:'https://example.com/',windowId:2,status:'complete'}),update:async(id,o)=>focus.push(o),onUpdated:event('updated'),onRemoved:event('removed')},
 windows:{update:async(id,o)=>focus.push(o)},
 scripting:{executeScript:async()=>{if(fail)throw Error();return [{result:{url:'https://example.com/',hash}}];}},
 alarms:{create:async()=>{},clear:async()=>{},onAlarm:event('alarm')},
 action:Object.fromEntries(['setBadgeText','setTitle','setBadgeBackgroundColor','setBadgeTextColor'].map(k=>[k,async()=>{}]))};
const ctx=vm.createContext({chrome,crypto:require('node:crypto').webcrypto,URL,console,Set});
vm.runInContext(fs.readFileSync('background.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
(async()=>{
 await new Promise(r=>setImmediate(r));
 data.tab_1={enabled:true,targetUrl:'https://example.com/',intervalSeconds:30};
 await run('checkPageChange(1)');assert.equal(focus.length,0);assert.equal(data.tab_1.pageHash,undefined);
 Object.assign(data.tab_1,{openOnChange:true,watchId:'first'});
 await run('checkPageChange(1)');assert.equal(focus.length,0);assert.equal(data.tab_1.pageHash,'a');
 await run('checkPageChange(1)');assert.equal(focus.length,0);
 hash='b';await run('checkPageChange(1)');assert.equal(focus.length,2);
 await run('checkPageChange(1)');assert.equal(focus.length,2);
 data.tab_1.openOnChange=false;hash='c';await run('checkPageChange(1)');assert.equal(focus.length,2);
 data.tab_1.openOnChange=true;fail=true;await run('checkPageChange(1)');assert.match(data.tab_1.changeCheckError,/unavailable/);
 fail=false;let release;chrome.scripting.executeScript=()=>new Promise(r=>release=r);
 const pending=run('checkPageChange(1)');await new Promise(r=>setImmediate(r));delete data.tab_1;
 release([{result:{url:'https://example.com/',hash:'new'}}]);await pending;assert.equal(data.tab_1,undefined);assert.equal(focus.length,2);
 console.log('Passed: default off, baseline, unchanged, changed focus, no repeat, disabled, restricted page, stop during sample.');
})().catch(e=>{console.error(e);process.exitCode=1;});
