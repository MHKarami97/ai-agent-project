// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
    }

    getTheme() {
        return this.currentTheme;
    }
}

const themeManager = new ThemeManager();

// Listen to tool-wrapper theme changes
window.addEventListener('themeChanged', (e) => {
    themeManager.currentTheme = e.detail;
    themeManager.applyTheme();
});

// Listen to tool-wrapper language changes
window.addEventListener('languageChanged', (e) => {
    const newLang = e.detail;
    localStorage.setItem('lang', newLang);
    // Reload page to apply language changes
    location.reload();
});


(function(){
  // App bundle (non-module) — starts empty (no seed data)
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
  function createMember(data){ return { id: data.id, name: data.name, color: data.color || null }; }
  function createExpense(data){ return { id: data.id, title: data.title, amount: data.amount, date: data.date, payerId: data.payerId, participantIds: data.participantIds || [], splitMode: data.splitMode || 'equal', customShares: data.customShares || null }; }

  // Simple IndexedDB wrapper
  var DB_NAME = 'cost-divider-db'; var DB_VERSION = 1; var STORES = ['groups','members','expenses'];
  function openDb(){ return new Promise(function(resolve,reject){ var r = indexedDB.open(DB_NAME, DB_VERSION); r.onupgradeneeded = function(e){ var db=e.target.result; STORES.forEach(function(s){ if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:'id'}); }); }; r.onsuccess = function(){ resolve(r.result); }; r.onerror=function(){ reject(r.error); }; }); }
  function idbPut(store,obj){ return openDb().then(function(db){ return new Promise(function(res,rej){ var tx=db.transaction(store,'readwrite'); var st=tx.objectStore(store); var rq=st.put(obj); rq.onsuccess=function(){ res(rq.result); }; rq.onerror=function(){ rej(rq.error); }; }); }); }
  function idbListAll(store){ return openDb().then(function(db){ return new Promise(function(res,rej){ var tx=db.transaction(store,'readonly'); var st=tx.objectStore(store); var rq=st.getAll(); rq.onsuccess=function(){ res(rq.result||[]); }; rq.onerror=function(){ rej(rq.error); }; }); }); }
  function idbDelete(store,id){ return openDb().then(function(db){ return new Promise(function(res,rej){ var tx=db.transaction(store,'readwrite'); var st=tx.objectStore(store); var rq=st.delete(id); rq.onsuccess=function(){ res(); }; rq.onerror=function(){ rej(rq.error); }; }); }); }

  var Repo = { addMember:function(m){return idbPut('members',m);}, listMembers:function(){return idbListAll('members');}, addExpense:function(e){return idbPut('expenses',e);}, listExpenses:function(){return idbListAll('expenses');}, deleteExpense:function(id){return idbDelete('expenses',id);}, clearAll:function(){ return openDb().then(function(db){ return new Promise(function(res,rej){ var tx=db.transaction(['groups','members','expenses'],'readwrite'); STORES.forEach(function(s){ tx.objectStore(s).clear(); }); tx.oncomplete=function(){ res(); }; tx.onerror=function(){ rej(tx.error); }; }); }); }};

  // Settlement algorithm (same as before)
  function roundToUnit(amount, unit){ unit = unit || 100; return Math.round(amount / unit) * unit; }
  function computeSettlements(members, expenses, roundingUnit){ roundingUnit = roundingUnit || 100; var nets = new Map(); members.forEach(function(m){ nets.set(m.id,0); }); expenses.forEach(function(e){ var amt = Number(e.amount)||0; var parts = (e.participantIds && e.participantIds.length)? e.participantIds : members.map(function(m){return m.id}); if(e.splitMode === 'custom' && e.customShares){ e.customShares.forEach(function(s){ var a=Number(s.amount)||0; nets.set(s.memberId,(nets.get(s.memberId)||0)-a); }); } else { var per = Math.floor(amt / parts.length); parts.forEach(function(pid){ nets.set(pid,(nets.get(pid)||0)-per); }); nets.set(e.payerId,(nets.get(e.payerId)||0)+amt); } }); var rounded=[]; nets.forEach(function(v,k){ rounded.push({id:k,net:roundToUnit(v,roundingUnit)}); }); var total = rounded.reduce(function(s,r){return s+r.net},0); if(total!==0){ var idx=0; for(var k=1;k<rounded.length;k++){ if(Math.abs(rounded[k].net)>Math.abs(rounded[idx].net)) idx=k; } rounded[idx].net -= total; } var debtors = rounded.filter(function(r){return r.net<0}).map(function(r){return {id:r.id,amount:-r.net}}).sort(function(a,b){return b.amount-a.amount}); var creditors = rounded.filter(function(r){return r.net>0}).map(function(r){return {id:r.id,amount:r.net}}).sort(function(a,b){return b.amount-a.amount}); var txs=[]; var i=0,j=0; while(i<debtors.length && j<creditors.length){ var d=debtors[i], c=creditors[j]; var p=Math.min(d.amount,c.amount); if(p>0){ txs.push({from:d.id,to:c.id,amount:p}); d.amount-=p; c.amount-=p; } if(d.amount===0)i++; if(c.amount===0)j++; } return txs; }

  // UI helpers
  function el(tag,attrs,children){ var e=document.createElement(tag); if(attrs){ Object.keys(attrs).forEach(function(k){ if(k==='html') e.innerHTML = attrs[k]; else e.setAttribute(k,attrs[k]); }); } if(children){ children.forEach(function(c){ e.appendChild(c); }); } return e; }

  function renderHeader(){ var h = el('div',{class:'header card'}); var t = el('div',{class:'h-title'}); t.textContent = 'تقسیم‌کننده هزینه گروهی'; var btn = el('button',{class:'btn',id:'btn-add-exp'}); btn.textContent = 'هزینه جدید'; h.appendChild(t); h.appendChild(btn); return h; }

  function renderMemberList(members){ var c = el('div',{class:'card'}); var row = el('div',{style:'display:flex;justify-content:space-between;align-items:center'}); var title = el('strong'); title.textContent = 'اعضا'; var add = el('button',{class:'btn',id:'btn-add-member'}); add.textContent = 'افزودن'; row.appendChild(title); row.appendChild(add); c.appendChild(row); var cont = el('div',{id:'members-container'}); members.forEach(function(m){ var badge = el('div',{class:'member-badge'}); badge.textContent = m.name; cont.appendChild(badge); }); c.appendChild(cont); return c; }

  function renderExpenseForm(members){ var c = el('div',{class:'card'}); var title = el('div'); title.innerHTML = '<strong>ثبت هزینه جدید</strong>'; c.appendChild(title); var form = el('form',{class:'form-row'});
    var inputTitle = el('input',{class:'input',name:'title',placeholder:'عنوان'});
    var inputAmount = el('input',{class:'input',name:'amount',placeholder:'مبلغ (ریال)',inputmode:'numeric',type:'number',min:'0',step:'1'});
    var payer = el('select',{class:'input',name:'payer'});
    // placeholder option
    var ph = el('option',{value:'',disabled:true,selected:true}); ph.textContent = 'پرداخت‌کننده را انتخاب کنید'; payer.appendChild(ph);
    if(!members || members.length===0){ payer.disabled = true; } else { members.forEach(function(m){ var o = el('option'); o.value=m.id; o.textContent = m.name; payer.appendChild(o); }); }
    var submit = el('button',{class:'btn',type:'submit'}); submit.textContent='ذخیره';
    // disable submit until valid
    submit.disabled = true;
    function updateSubmit(){ var ok = (inputTitle.value && inputTitle.value.trim().length>0) && (Number(inputAmount.value) > 0) && (!!payer.value);
      submit.disabled = !ok;
    }
    inputTitle.addEventListener('input', updateSubmit);
    inputAmount.addEventListener('input', updateSubmit);
    payer.addEventListener('change', updateSubmit);
    form.appendChild(inputTitle); form.appendChild(inputAmount); form.appendChild(payer); form.appendChild(submit); c.appendChild(form);
    form.addEventListener('submit',function(ev){ ev.preventDefault(); if(submit.disabled) return; var expense = createExpense({ id: uid(), title: inputTitle.value || 'بدون عنوان', amount: Number(inputAmount.value)||0, date: Date.now(), payerId: payer.value, participantIds: members.map(function(m){return m.id}) }); Repo.addExpense(expense).then(function(){ loadAndRender(); }); }); return c; }

  function renderBalances(members, expenses){ var c = el('div',{class:'card'}); var top = el('div',{style:'display:flex;justify-content:space-between;align-items:center'}); var t = el('strong'); t.textContent = 'خلاصه'; var btnSettle = el('button',{class:'btn',id:'btn-settle'}); btnSettle.textContent = 'محاسبه تسویه'; top.appendChild(t); top.appendChild(btnSettle); c.appendChild(top);
    var list = el('div',{id:'balances-list'});
    // compute nets
    var nets = new Map(); members.forEach(function(m){ nets.set(m.id,0); }); expenses.forEach(function(e){ var amt=Number(e.amount)||0; var parts=(e.participantIds && e.participantIds.length)? e.participantIds : members.map(function(m){return m.id}); var per = Math.floor(amt/parts.length); parts.forEach(function(pid){ nets.set(pid, (nets.get(pid)||0) - per); }); nets.set(e.payerId, (nets.get(e.payerId)||0) + amt); });
    // balances list
    expenses.forEach(function(e){ var row = el('div',{class:'expense-row'}); var left = el('div'); left.innerHTML = '<div><strong>'+ (e.title||'بدون عنوان') +'</strong><div class="small">پرداخت‌کننده: '+ (members.find(function(m){return m.id===e.payerId})||{name:e.payerId}).name +' — '+ (Number(e.amount)||0).toLocaleString('fa-IR') +' ریال</div></div>'; var actions = el('div',{class:'expense-actions'});
      var btnEdit = el('button',{class:'btn-action'}); btnEdit.textContent='ویرایش'; var btnDel = el('button',{class:'btn-action'}); btnDel.textContent='حذف'; actions.appendChild(btnEdit); actions.appendChild(btnDel); row.appendChild(left); row.appendChild(actions); list.appendChild(row);
      btnDel.addEventListener('click', function(){ if(confirm('آیا مایل به حذف این هزینه هستید؟')){ Repo.deleteExpense(e.id).then(function(){ loadAndRender(); }); } });
      btnEdit.addEventListener('click', function(){ // simple inline edit prompt
        var newTitle = prompt('عنوان', e.title); if(newTitle===null) return; var newAmount = prompt('مبلغ (ریال)', e.amount); if(newAmount===null) return; e.title = newTitle; e.amount = Number(newAmount)||0; Repo.addExpense(e).then(function(){ loadAndRender(); }); });
    });

    c.appendChild(list);
    btnSettle.addEventListener('click', function(){ var txs = computeSettlements(members, expenses, 100); if(txs.length===0) return alert('چیزی برای تسویه وجود ندارد'); var lines = txs.map(function(t){ var from = (members.find(function(m){return m.id===t.from})||{name:t.from}).name; var to = (members.find(function(m){return m.id===t.to})||{name:t.to}).name; return from + ' => ' + to + ' : ' + t.amount.toLocaleString('fa-IR') + ' ریال'; }); alert(lines.join('\n')); });
    return c;
  }

  function clearAllData(){ if(!confirm('آیا می‌خواهید تمام داده‌ها پاک شود؟')) return; Repo.clearAll().then(function(){ loadAndRender(); }); }

  function loadAndRender(){ Promise.all([Repo.listMembers(), Repo.listExpenses()]).then(function(results){ var members = results[0]||[]; var expenses = results[1]||[]; var root = document.getElementById('app'); root.innerHTML=''; root.appendChild(renderHeader()); root.appendChild(renderMemberList(members)); root.appendChild(renderExpenseForm(members)); root.appendChild(renderBalances(members, expenses)); document.getElementById('btn-add-member').addEventListener('click', function(){ var name = prompt('نام عضو را وارد کنید'); if(!name) return; var id = uid(); Repo.addMember(createMember({id:id,name:name})).then(function(){ loadAndRender(); }); }); document.getElementById('btn-add-exp').addEventListener('click', function(){ // clear everything as requested
      clearAllData(); });
  }).catch(function(err){ var el=document.getElementById('app-error'); el.style.display='block'; el.innerText = 'خطا: '+ (err && err.message?err.message:String(err)); }); }

  document.addEventListener('DOMContentLoaded', function(){ loadAndRender(); });

})();
