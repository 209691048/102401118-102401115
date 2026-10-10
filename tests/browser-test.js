"use strict";
(function () {
 const KEY="campusLostFoundItems", OWNER="campusLostFoundPublisherId", TEST_OWNER="browser-test";
 const frame=document.getElementById("appFrame"), run=document.getElementById("runTests"), summary=document.getElementById("summary"), results=document.getElementById("results"), details=document.getElementById("details");
 const oldData=localStorage.getItem(KEY), oldOwner=localStorage.getItem(OWNER);
 const base=[
  {id:1,publisherId:TEST_OWNER,title:"黑色校园卡",type:"寻物",location:"第一教学楼",date:"2026-10-06",description:"遗失黑色校园卡",contact:"test@example.com",status:"待处理"},
  {id:2,publisherId:TEST_OWNER,title:"蓝色水杯",type:"招领",location:"图书馆",date:"2026-10-05",description:"捡到蓝色水杯",contact:"test@example.com",status:"待处理"},
  {id:3,publisherId:"other",title:"黑色钥匙",type:"寻物",location:"学生宿舍区",date:"2026-10-04",description:"遗失一串钥匙",contact:"other@example.com",status:"待处理"},
  {id:4,publisherId:TEST_OWNER,title:"白色耳机",type:"招领",location:"食堂",date:"2026-10-03",description:"捡到耳机",contact:"test@example.com",status:"待处理"}];
 const clone=x=>JSON.parse(JSON.stringify(x)), saved=()=>JSON.parse(localStorage.getItem(KEY)||"[]");
 const assert=(x,m)=>{if(!x)throw Error(m||"断言失败")};
 async function load(items){localStorage.setItem(KEY,JSON.stringify(clone(items)));localStorage.setItem(OWNER,TEST_OWNER);return new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error("加载超时")),10000);frame.onload=()=>{clearTimeout(t);const w=frame.contentWindow;w.alert=()=>{};w.confirm=()=>true;setTimeout(()=>resolve(w),100)};frame.src="../index.html?test="+Date.now()})}
 async function caseRun(name,fn){try{await fn();const li=document.createElement("li");li.className="pass";li.textContent="✅ "+name+"：通过";results.appendChild(li);return true}catch(e){const li=document.createElement("li");li.className="fail";li.textContent="❌ "+name+"："+e.message;results.appendChild(li);details.textContent+=name+"\n"+(e.stack||e.message)+"\n\n";return false}}
 async function all(){run.disabled=true;results.innerHTML="";details.textContent="";let p=0,f=0;const go=async(n,fn)=>{(await caseRun(n,fn))?p++:f++};try{
  await go("测试1：首页显示4条",async()=>{const d=(await load(base)).document;assert(d.querySelectorAll("#itemList .item-card").length===4,"数量错误")});
  await go("测试2：关键词搜索",async()=>{const d=(await load(base)).document;d.getElementById("searchInput").value="图书馆";d.getElementById("searchBtn").click();assert(d.querySelectorAll("#itemList .item-card").length===1,"搜索错误")});
  await go("测试3：招领筛选",async()=>{const d=(await load(base)).document;d.querySelector('[data-type="招领"]').click();assert(d.querySelectorAll("#itemList .item-card").length===2,"筛选错误")});
  await go("测试4：无结果提示",async()=>{const d=(await load(base)).document;d.getElementById("searchInput").value="不存在";d.getElementById("searchBtn").click();assert(d.querySelector(".empty-state"),"缺少提示")});
  await go("测试5：有效发布",async()=>{const d=(await load(base)).document;d.getElementById("publishNavBtn").click();["itemTitle","itemLocation","itemDate","itemDescription","itemContact"].forEach((id,i)=>d.getElementById(id).value=["新物品","图书馆","2026-10-09","描述","new@example.com"][i]);d.getElementById("publishForm").requestSubmit();assert(!d.getElementById("successPage").hidden,"发布失败")});
  await go("测试6：空联系方式禁止发布",async()=>{const d=(await load(base)).document;d.getElementById("publishNavBtn").click();["itemTitle","itemLocation","itemDate","itemDescription","itemContact"].forEach((id,i)=>d.getElementById(id).value=["无联系方式","图书馆","2026-10-09","描述","   "][i]);d.getElementById("publishForm").requestSubmit();assert(d.getElementById("successPage").hidden,"错误发布")});
  await go("测试7：独立编辑页保存",async()=>{const d=(await load(base)).document;d.getElementById("mineNavBtn").click();d.querySelector('[data-action="edit"][data-id="1"]').click();assert(!d.getElementById("editPage").hidden,"编辑页未打开");d.getElementById("editTitle").value="修改校园卡";d.getElementById("editContact").value="updated@example.com";d.getElementById("editForm").requestSubmit();assert(saved()[0].title==="修改校园卡","编辑未保存")});
  await go("测试8：取消编辑不保存",async()=>{const d=(await load(base)).document;d.getElementById("mineNavBtn").click();d.querySelector('[data-action="edit"][data-id="1"]').click();d.getElementById("editTitle").value="不应保存";d.getElementById("cancelEditBtn").click();assert(saved()[0].title==="黑色校园卡","取消仍保存")});
  await go("测试9：状态更新显示独立弹窗",async()=>{const d=(await load(base)).document;d.getElementById("mineNavBtn").click();d.querySelector('[data-action="found"][data-id="1"]').click();assert(saved()[0].status==="已找到","状态错误");const modal=d.getElementById("appModal");assert(!modal.hidden,"状态弹窗未显示");assert(d.getElementById("appModalMessage").textContent.includes("已找到"),"弹窗内容错误");d.getElementById("appModalClose").click();assert(modal.hidden,"确定后弹窗未关闭")});
  await go("测试10：重复标记提示显示独立弹窗",async()=>{const d=(await load(base)).document;d.getElementById("mineNavBtn").click();const button=d.querySelector('[data-action="found"][data-id="2"]');button.click();assert(saved().find(x=>x.id===2).status==="已归还","状态错误");d.getElementById("appModalClose").click();button.click();const modal=d.getElementById("appModal");assert(!modal.hidden,"重复标记弹窗未显示");assert(d.getElementById("appModalTitle").textContent==="状态提示","弹窗标题错误");assert(d.getElementById("appModalMessage").textContent.includes("已归还"),"弹窗内容错误");d.getElementById("appModalClose").click();assert(modal.hidden,"确定后弹窗未关闭")});
  await go("测试11：删除确认使用独立弹窗",async()=>{const d=(await load(base)).document;d.getElementById("mineNavBtn").click();d.querySelector('[data-action="delete"][data-id="1"]').click();const modal=d.getElementById("appModal");assert(!modal.hidden,"删除确认弹窗未显示");assert(d.getElementById("appModalMessage").textContent.includes("删除后无法直接恢复"),"确认文案错误");d.getElementById("appModalCancel").click();assert(modal.hidden,"取消后弹窗未关闭");assert(saved().some(x=>x.id===1),"取消删除后记录消失");d.querySelector('[data-action="delete"][data-id="1"]').click();d.getElementById("appModalClose").click();assert(!saved().some(x=>x.id===1),"确认后记录仍存在");assert(!modal.hidden,"删除成功提示未显示");assert(d.getElementById("appModalTitle").textContent==="删除成功","成功提示标题错误");d.getElementById("appModalClose").click();assert(modal.hidden,"成功提示未关闭")});
  await go("测试12：已归还物品淡化且3分钟内可撤销",async()=>{
   const d=(await load(base)).document;
   d.getElementById("mineNavBtn").click();
   d.querySelector('[data-action="found"][data-id="2"]').click();
   const returned=saved().find(x=>x.id===2);
   assert(returned.status==="已归还" && typeof returned.statusUpdatedAt==="number","未记录归还时间");
   const homeCard=d.querySelector('#itemList .item-card[data-id="2"]');
   assert(homeCard && homeCard.classList.contains("item-completed"),"首页已归还卡片未淡化");
   const undo=d.querySelector('[data-action="undo-completion"][data-id="2"]');
   assert(undo,"未显示撤销按钮");
   assert(undo.closest(".item-card").classList.contains("item-completed"),"已归还卡片未淡化");
   undo.click();
   const restored=saved().find(x=>x.id===2);
   assert(restored.status==="待处理" && !("statusUpdatedAt" in restored),"撤销后状态错误");
   assert(!d.querySelector('[data-action="undo-completion"][data-id="2"]'),"撤销后按钮仍显示");
   assert(!d.querySelector('#itemList .item-card[data-id="2"]').classList.contains("item-completed"),"撤销后首页卡片仍淡化");
  });
  await go("测试13：超过3分钟后隐藏撤销入口",async()=>{
   const expired=clone(base);
   expired[1].status="已归还";
   expired[1].statusUpdatedAt=Date.now()-180001;
   const d=(await load(expired)).document;
   d.getElementById("mineNavBtn").click();
   assert(!d.querySelector('[data-action="undo-completion"][data-id="2"]'),"过期后仍显示撤销按钮");
  });

  await go("测试14：忽略大小写并搜索名称描述地点",async()=>{
   const data=clone(base);data[0].title="Campus Card";data[0].description="Lost near Science Hall";data[0].location="North Library";
   const d=(await load(data)).document, search=d.getElementById("searchInput"), button=d.getElementById("searchBtn");
   for(const keyword of ["cAmPuS","SCIENCE HALL","nOrTh"]){search.value=keyword;button.click();assert(d.querySelectorAll("#itemList .item-card").length===1,"字段或大小写搜索失败："+keyword);assert(d.querySelector("#itemList .item-card").dataset.id==="1","匹配到错误记录")}
   d.querySelector('[data-type="招领"]').click();assert(d.querySelectorAll("#itemList .item-card").length===0,"类型筛选与关键词组合错误");
  });
  await go("测试15：空数据与无匹配分别提示",async()=>{
   const empty=(await load([])).document;assert(empty.querySelector("#itemList .empty-state").textContent.includes("暂时没有物品信息"),"空列表提示错误");
   const noMatch=(await load(base)).document;noMatch.getElementById("searchInput").value="不存在";noMatch.getElementById("searchBtn").click();assert(noMatch.querySelector("#itemList .empty-state").textContent.includes("没有找到相关信息"),"无匹配提示错误");
  });
  await go("测试16：各必填字段空白时不发布",async()=>{
   for(const id of ["itemTitle","itemLocation","itemDate","itemDescription","itemContact"]){
    const d=(await load(base)).document;d.getElementById("publishNavBtn").click();
    const values={itemTitle:"新物品",itemLocation:"图书馆",itemDate:"2026-10-09",itemDescription:"描述",itemContact:"new@example.com"};
    for(const [field,value] of Object.entries(values))d.getElementById(field).value=value;
    d.getElementById(id).value="   ";d.getElementById("publishForm").requestSubmit();
    assert(saved().length===4,"空白字段仍发布："+id);
   }
  });
  await go("测试17：点击过期撤销入口会重新校验",async()=>{
   const data=clone(base);data[1].status="已归还";data[1].statusUpdatedAt=Date.now();
   const d=(await load(data)).document;d.getElementById("mineNavBtn").click();
   const staleButton=d.querySelector('[data-action="undo-completion"][data-id="2"]');assert(staleButton,"未生成有效撤销入口");
   const latest=saved();latest.find(x=>x.id===2).statusUpdatedAt=Date.now()-180001;localStorage.setItem(KEY,JSON.stringify(latest));
   staleButton.click();assert(saved().find(x=>x.id===2).status==="已归还","过期操作改变了状态");
   assert(!d.querySelector('[data-action="undo-completion"][data-id="2"]'),"过期后仍显示撤销入口");
   assert(d.getElementById("appModalTitle").textContent==="无法撤销","缺少过期提示弹窗");
  });
  await go("测试18：他人、无归属与过期记录不提供撤销",async()=>{
   const data=clone(base);data[0].publisherId=undefined;data[0].status="已归还";data[0].statusUpdatedAt=Date.now();
   data[1].publisherId="other";data[1].status="已归还";data[1].statusUpdatedAt=Date.now();
   data[3].status="已归还";data[3].statusUpdatedAt=Date.now()-180001;
   const d=(await load(data)).document;d.getElementById("mineNavBtn").click();
   assert(d.querySelectorAll("#mineList .item-card").length===1,"我的发布归属筛选错误");
   assert(!d.querySelector('[data-action="undo-completion"]'),"无权或过期状态仍有撤销入口");
  });
  await go("测试19：标题按文本显示以防注入HTML",async()=>{
   const data=clone(base);data[0].title='<img src=x onerror="alert(1)">';
   const d=(await load(data)).document, title=d.querySelector('#itemList .item-card[data-id="1"] .item-title');
   assert(title && title.textContent===data[0].title,"特殊字符显示错误");
   assert(!d.querySelector('#itemList .item-card[data-id="1"] img'),"标题被解析为HTML");
  });
  await go("测试20：联系发布者显示独立弹窗",async()=>{
   const d=(await load(base)).document,w=d.defaultView;let nativeAlertCalls=0;w.alert=()=>{nativeAlertCalls++};
   d.querySelector('#itemList .item-card[data-id="3"]').click();
   d.getElementById("contactBtn").click();
   const modal=d.getElementById("appModal");
   assert(!modal.hidden,"联系弹窗未显示");
   assert(d.getElementById("appModalTitle").textContent==="联系发布者","弹窗标题错误");
   assert(d.getElementById("appModalMessage").textContent.includes("other@example.com"),"联系方式未显示");
   assert(nativeAlertCalls===0,"仍调用浏览器原生提示");
   d.getElementById("appModalClose").click();assert(modal.hidden,"弹窗未关闭");
  });
  await go("测试21：缺少联系方式时仍使用独立弹窗",async()=>{
   const data=clone(base);delete data[2].contact;
   const d=(await load(data)).document,w=d.defaultView;let nativeAlertCalls=0;w.alert=()=>{nativeAlertCalls++};
   d.querySelector('#itemList .item-card[data-id="3"]').click();
   d.getElementById("contactBtn").click();
   const modal=d.getElementById("appModal");
   assert(!modal.hidden,"缺少联系方式弹窗未显示");
   assert(d.getElementById("appModalTitle").textContent==="联系发布者","缺少联系方式时弹窗标题错误");
   assert(d.getElementById("appModalMessage").textContent.includes("暂未填写联系方式"),"缺少联系方式提示错误");
   assert(nativeAlertCalls===0,"缺少联系方式时仍调用浏览器原生提示");
   d.getElementById("appModalClose").click();assert(modal.hidden,"弹窗未关闭");
  });
  await go("测试22：已找到状态3分钟内可撤销",async()=>{
   const d=(await load(base)).document;
   d.getElementById("mineNavBtn").click();
   d.querySelector('[data-action="found"][data-id="1"]').click();
   const found=saved().find(x=>x.id===1);
   assert(found.status==="已找到" && typeof found.statusUpdatedAt==="number","已找到状态未记录时间");
   let undo=d.querySelector('[data-action="undo-completion"][data-id="1"]');
   assert(undo && undo.textContent.includes("已找到"),"未显示撤销已找到入口");
   assert(undo.closest(".item-card").classList.contains("item-completed"),"我的发布已找到卡片未淡化");
   assert(d.querySelector('#itemList .item-card[data-id="1"]').classList.contains("item-completed"),"首页已找到卡片未淡化");
   undo.click();
   const restored=saved().find(x=>x.id===1);
   assert(restored.status==="待处理" && !("statusUpdatedAt" in restored),"撤销后状态未恢复");
   assert(!d.querySelector('[data-action="undo-completion"][data-id="1"]'),"撤销后入口仍显示");
   assert(!d.querySelector('#itemList .item-card[data-id="1"]').classList.contains("item-completed"),"撤销后寻物卡片仍淡化");
  });
  await go("测试23：已找到超过3分钟后隐藏撤销入口",async()=>{
   const expired=clone(base);
   expired[0].status="已找到";
   expired[0].statusUpdatedAt=Date.now()-180001;
   const d=(await load(expired)).document;
   d.getElementById("mineNavBtn").click();
   assert(!d.querySelector('[data-action="undo-completion"][data-id="1"]'),"过期后仍显示撤销已找到入口");
  });
  await go("测试24：旧的已找到状态首次打开时获得一次撤销机会",async()=>{
   const legacy=clone(base);
   legacy[0].status="已找到";
   const d=(await load(legacy)).document;
   d.getElementById("mineNavBtn").click();
   const migrated=saved().find(x=>x.id===1);
   assert(typeof migrated.statusUpdatedAt==="number","旧状态未记录兼容时间");
   assert(d.querySelector('[data-action="undo-completion"][data-id="1"]'),"旧的已找到记录没有撤销入口");
  });
  await go("测试25：旧版示例自动补齐演示联系方式",async()=>{
   const legacy=[
    {id:1,title:"黑色校园卡",type:"寻物",location:"第一教学楼",date:"2026-10-06",description:"在第一教学楼附近遗失黑色校园卡，希望有同学捡到后联系。",icon:"💳"},
    {id:2,title:"蓝色水杯",type:"招领",location:"图书馆",date:"2026-10-05",description:"在图书馆自习区发现一个蓝色水杯，请失主联系。",icon:"🥤"},
    {id:3,title:"黑色钥匙",type:"寻物",location:"学生宿舍区",date:"2026-10-04",description:"一串黑色钥匙可能遗失在宿舍区附近。",icon:"🔑"},
    {id:4,title:"白色耳机",type:"招领",location:"食堂",date:"2026-10-03",description:"在食堂座位附近发现白色无线耳机。",icon:"🎧"}
   ];
   await load(legacy);
   const migrated=saved();
   assert(migrated.length===4,"示例条目数量错误");
   assert(migrated.every(item=>String(item.contact||"").trim() && String(item.contactName||"").trim()),"旧版示例仍有空联系方式");
   assert(migrated.every(item=>item.contact.endsWith("@example.com")),"演示邮箱格式不正确");
  });
  await go("测试26：一键复制联系方式并显示成功提示",async()=>{
   const d=(await load(base)).document,w=d.defaultView;let copied="";
   Object.defineProperty(w.navigator,"clipboard",{configurable:true,value:{writeText:async text=>{copied=text}}});
   d.querySelector('#itemList .item-card[data-id="3"]').click();
   const button=d.getElementById("copyContactBtn");assert(button,"详情页没有复制联系方式按钮");button.click();
   await new Promise(resolve=>setTimeout(resolve,0));
   assert(copied==="other@example.com","复制内容错误");
   assert(d.getElementById("appModalTitle").textContent==="复制成功","复制成功提示未显示");
   assert(d.getElementById("appModalMessage").textContent.includes("已复制"),"复制成功提示内容错误");
  });
  await go("测试27：剪贴板权限受限时使用兼容复制",async()=>{
   const d=(await load(base)).document,w=d.defaultView;let copied="";
   Object.defineProperty(w.navigator,"clipboard",{configurable:true,value:{writeText:async()=>{throw Error("permission denied")}}});
   w.document.execCommand=function(command){copied=command==="copy" ? w.document.activeElement.value : "";return command==="copy"};
   d.querySelector('#itemList .item-card[data-id="3"]').click();d.getElementById("copyContactBtn").click();
   await new Promise(resolve=>setTimeout(resolve,0));
   assert(copied==="other@example.com","兼容复制没有复制联系方式");
   assert(d.getElementById("appModalTitle").textContent==="复制成功","兼容复制没有成功提示");
  });
  await go("测试28：复制失败时提供手动复制内容",async()=>{
   const d=(await load(base)).document,w=d.defaultView;
   Object.defineProperty(w.navigator,"clipboard",{configurable:true,value:{writeText:async()=>{throw Error("permission denied")}}});
   w.document.execCommand=()=>false;
   d.querySelector('#itemList .item-card[data-id="3"]').click();d.getElementById("copyContactBtn").click();
   await new Promise(resolve=>setTimeout(resolve,0));
   assert(d.getElementById("appModalTitle").textContent==="复制失败","复制失败没有提示");
   assert(d.getElementById("appModalMessage").textContent.includes("other@example.com"),"没有提供手动复制内容");
  });
 }finally{oldData===null?localStorage.removeItem(KEY):localStorage.setItem(KEY,oldData);oldOwner===null?localStorage.removeItem(OWNER):localStorage.setItem(OWNER,oldOwner);summary.textContent="测试结束：通过 "+p+" 项，失败 "+f+" 项。";run.disabled=false}}
 run.addEventListener("click",all);
})();