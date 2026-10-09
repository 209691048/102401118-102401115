const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
let items, writes, prompts, confirms, alerts, storage, blocked;
const elements = new Map();
function element(id) {
 if (!elements.has(id)) elements.set(id, {value:'',innerHTML:'',hidden:false,listeners:{},addEventListener(n,f){this.listeners[n]=f},querySelectorAll(){return []},classList:{add(){},remove(){}},reset(){}});
 return elements.get(id);
}
const ctx = vm.createContext({console:{error(){}},crypto:{randomUUID(){return 'generated-owner'}},localStorage:{getItem(k){if(blocked)throw Error('blocked');return storage.get(k)||null},setItem(k,v){if(blocked)throw Error('blocked');storage.set(k,v)}},alert(m){alerts.push(m)},prompt(){return prompts.shift() ?? null},confirm(){confirms++;return true},window:{scrollTo(){}},document:{readyState:'loading',getElementById:element,querySelectorAll(){return []},addEventListener(){}},getItems(){return structuredClone(items)},saveItems(v){items=structuredClone(v);writes++}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8'),ctx);
function reset(){storage=new Map([['campusLostFoundPublisherId','me']]);blocked=false;writes=0;prompts=[];confirms=0;alerts=[];items=[{id:1,publisherId:'me',type:'寻物',title:'本人',date:'2026-10-09',location:'图书馆',description:'描述',contact:'old@example.com',status:'待处理'},{id:2,publisherId:'other',title:'他人',type:'招领'},{id:3,title:'旧数据',type:'寻物'}];}
function editValues(values) {
 ctx.editItem(1);
 ['Title','Location','Description','ContactName','Contact'].forEach((suffix,i)=>element('edit'+suffix).value=values[i]);
 ctx.saveEdit({preventDefault(){}});
}
let passed=0;
function test(name,f){reset();f();passed++;console.log('PASS '+name)}
function publish(contact){for(const [k,v] of Object.entries({itemTitle:'新物品',itemType:'招领',itemLocation:'食堂',itemDate:'2026-10-09',itemDescription:'描述',itemContactName:'同学',itemContact:contact}))element(k).value=v;element('publishForm').listeners.submit({preventDefault(){}})}
test('我的发布仅包含本人',()=>{ctx.renderMine();assert(element('mineList').innerHTML.includes('本人'));assert(!element('mineList').innerHTML.includes('他人'));assert(!element('mineList').innerHTML.includes('旧数据'))});
for(const name of ['editItem','markFound','deleteItem'])for(const id of [2,3,999])test(name+' 拒绝非本人/无归属/不存在 '+id,()=>{ctx[name](id);assert.equal(writes,0);assert.equal(confirms,0)});
test('合法发布记录归属并去除联系方式首尾空格',()=>{publish('  user@example.com  ');assert.equal(items[0].publisherId,'me');assert.equal(items[0].contact,'user@example.com');assert.equal(writes,1)});
for(const value of ['', '   '])test('拒绝空联系方式 '+JSON.stringify(value),()=>{publish(value);assert.equal(writes,0)});
test('编辑联系人与联系方式且保留归属及ID',()=>{editValues(['新名称','地点','描述','新联系人',' new@example.com ']);assert.equal(items[0].contact,'new@example.com');assert.equal(items[0].contactName,'新联系人');assert.equal(items[0].id,1);assert.equal(items[0].publisherId,'me')});
test('编辑空白联系方式不保存任何字段',()=>{editValues(['新名称','地点','描述','联系人','  ']);assert.equal(writes,0);assert.equal(items[0].title,'本人')});
test('取消编辑不保存',()=>{ctx.editItem(1);element('editTitle').value='未保存';ctx.cancelEdit();assert.equal(writes,0)});
test('编辑超长联系方式不保存',()=>{editValues(['名称','地点','描述','联系人','x'.repeat(101)]);assert.equal(writes,0)});
for(const [type,status] of [['寻物','已找到'],['招领','已归还']])test(type+'状态更新及三处展示',()=>{items[0].type=type;ctx.markFound(1);assert.equal(items[0].status,status);ctx.openDetail(1);for(const id of ['itemList','mineList','detailContent'])assert(element(id).innerHTML.includes(status));ctx.markFound(1);assert.equal(writes,1)});
test('本人可以删除',()=>{ctx.deleteItem(1);assert.equal(items.length,2);assert.equal(writes,1)});
test('旧招领完成状态兼容',()=>{items[0].type='招领';items[0].status='已找到';assert.equal(ctx.getItemStatus(items[0]),'已归还')});
test('首次身份生成且持久化',()=>{storage.clear();assert.equal(ctx.getCurrentPublisherId(),'generated-owner');assert.equal(storage.get('campusLostFoundPublisherId'),'generated-owner')});
test('存储不可用时拒绝发布及维护',()=>{blocked=true;publish('a@example.com');ctx.markFound(1);assert.equal(writes,0)});
console.log(`${passed} tests passed. Mock DOM logic tests; not Chrome UI tests.`);

reset();
ctx.renderMine();
ctx.switchPage('mine', '我的发布');
assert.equal(element('minePage').hidden, false);
element('backBtn').listeners.click();
assert.equal(element('homePage').hidden, false);
assert.equal(element('minePage').hidden, true);
assert.equal(element('backBtn').hidden, true);
assert.equal(element('pageTitle').textContent, '校园寻物');
assert(element('itemList').innerHTML.includes('本人'));
console.log('PASS 我的页面返回首页，更新标题、列表与返回按钮可见性');

test('编辑页回填全部字段',()=>{ctx.editItem(1);assert.equal(element('editPage').hidden,false);assert.equal(element('editTitle').value,'本人');assert.equal(element('editContact').value,'old@example.com');assert.equal(element('editDate').value,'2026-10-09')});
test('保存时再次检查归属',()=>{ctx.editItem(1);items[0].publisherId='other';ctx.saveEdit({preventDefault(){}});assert.equal(writes,0);assert.equal(element('editFeedback').hidden,false)});
test('编辑页返回取消修改',()=>{ctx.editItem(1);element('editTitle').value='未保存';element('backBtn').listeners.click();assert.equal(element('minePage').hidden,false);assert.equal(writes,0)});
test('保存保留完成状态和类型',()=>{items[0].status='已找到';editValues(['修改','地点','描述','联系人','user@example.com']);assert.equal(items[0].status,'已找到');assert.equal(items[0].type,'寻物');assert.equal(element('minePage').hidden,false);assert.equal(element('mineFeedback').hidden,false)});
console.log('All edit-page regression tests passed.');
