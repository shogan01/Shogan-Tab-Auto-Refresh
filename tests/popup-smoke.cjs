const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  const page = await browser.newPage({viewport:{width:380,height:700},colorScheme:'light'});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const base=pathToFileURL(path.resolve('.')+path.sep).href;
  await page.addInitScript(({base})=>{
    let state=null;
    let history=[{url:'https://example.com/live',intervalSeconds:30,autoStart:false}];
    window.reloadCalls=0;
    window.chrome={tabs:{query:async()=>[{id:1,url:'https://example.com/live'}]},runtime:{reload:()=>{window.reloadCalls++;},getURL:p=>base+p,sendMessage:async m=>{
      if(m.type==='GET_STATE')return {state};
      if(m.type==='GET_HISTORY')return {history};
      if(m.type==='START'){state={enabled:true,intervalSeconds:m.intervalSeconds,targetUrl:m.targetUrl,nextRefreshAt:Date.now()+m.intervalSeconds*1000};history=[{url:m.targetUrl,intervalSeconds:m.intervalSeconds,autoStart:m.autoStart!==false}];return {ok:true};}
      if(m.type==='STOP'){state=null;return {ok:true};}
      if(m.type==='SET_HISTORY_AUTOSTART'){history.forEach(x=>{if(x.url===m.targetUrl)x.autoStart=m.autoStart;});return {ok:true};}
      if(m.type==='REMOVE_HISTORY'){history=history.filter(x=>x.url!==m.targetUrl);return {ok:true};}
      if(m.type==='CLEAR_HISTORY'){history=[];return {ok:true};}
    }}};
  },{base});
  await page.goto(base+'editorial.html');
  await page.waitForFunction(()=>document.querySelector('#pageName').textContent==='example.com/live');
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('#autoStart').isChecked(),false);
  assert.equal(await page.locator('#openOnChange').isChecked(),false);
  await page.getByRole('button',{name:'Reload extension',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.reloadCalls),1);
  await page.locator('[data-interval="30"]').click();
  assert.equal(await page.locator('#countdown').textContent(),'00:30');
  await page.locator('#start').click();
  await page.waitForFunction(()=>!document.querySelector('#stop').classList.contains('hidden'));
  assert.equal(await page.locator('#start').isVisible(),false);
  await page.locator('#stop').click();
  await page.locator('[data-interval="custom"]').click();
  await page.locator('#customValue').fill('7');
  await page.locator('#customUnit').selectOption('60');
  assert.equal(await page.locator('#countdown').textContent(),'07:00');
  await page.locator('[data-interval="60"]').click();
  await page.mouse.move(0,0);
  await page.waitForTimeout(200);
  await page.screenshot({path:'dist/editorial-light.png',fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=380));
  await page.emulateMedia({colorScheme:'dark'});
  await page.waitForTimeout(200);
  await page.screenshot({path:'dist/editorial-dark.png',fullPage:true});
  await page.locator('summary').click();
  await page.getByRole('button',{name:'Use',exact:true}).click();
  assert.equal(await page.locator('#intervalLabel').textContent(),'30 sec');
  await page.locator('[data-design="classic"]').click();
  await page.waitForURL('**/classic/popup.html');
  assert(await page.locator('#start').isVisible());
  assert.equal(await page.locator('#openOnChange').isChecked(),false);
  await page.getByRole('button',{name:'Reload extension',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.reloadCalls),1);
  await page.goto(base+'editorial.html');
  await page.waitForURL('**/classic/popup.html');
  await page.locator('[data-design="editorial"]').click();
  await page.waitForURL('**/editorial.html');
  assert.equal(await page.evaluate(()=>localStorage.getItem('popupDesign')),'editorial');
  assert.deepEqual(errors,[]);
  console.log('Passed: presets, timer start/stop, custom minutes, history selection, fonts/layout, persistent classic fallback, return to new design.');
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
