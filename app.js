import {selectProducts,money,emptyState} from './logic.mjs?v=15';
const $=id=>document.getElementById(id);
const isEvaluation=false; // Public demo never loads simulated evaluation data.
const stateKey='carta-ghpages-demo-v1-state';
const allergens=[['gluten','Gluten','🌾'],['crustaceos','Crustáceos','🦐'],['huevos','Huevos','🥚'],['pescado','Pescado','🐟'],['cacahuetes','Cacahuetes','🥜'],['soja','Soja','🫘'],['lacteos','Lácteos','🥛'],['frutos','Frutos de cáscara','🌰'],['apio','Apio','🌿'],['mostaza','Mostaza','🟡'],['sesamo','Sésamo','◌'],['sulfitos','Sulfitos','🍇'],['altramuces','Altramuces','🫘'],['moluscos','Moluscos','🐚']];
let data,state={category:'all',query:'',excluded:[],scroll:0},draft=[],lastFocus,lockedScroll=0,priorSearch=null;
const productDialog=$('product-dialog'),filterDialog=$('filter-dialog'),categoryDialog=$('category-dialog');
const simulation=()=>false;
function save(){try{sessionStorage.setItem(stateKey,JSON.stringify({...state,scroll:window.scrollY}));}catch{}}
function lock(){lockedScroll=window.scrollY;document.body.style.position='fixed';document.body.style.top=`-${lockedScroll}px`;document.body.style.width='100%';}
function unlock(){document.body.style.position='';document.body.style.top='';document.body.style.width='';window.scrollTo(0,lockedScroll);}
function openDialog(d){
 lastFocus=document.activeElement;lock();
 history.pushState({...history.state,cartaDialog:d.id},'',location.href);
 d.showModal();
}
function closeDialog(d){
 if(history.state?.cartaDialog===d.id)history.back();else d.close();
}
window.addEventListener('popstate',event=>{
 const expected=event.state?.cartaDialog;
 for(const d of [productDialog,filterDialog,categoryDialog])if(d.open&&d.id!==expected)d.close();
 const target=expected&&document.getElementById(expected);
 if(target instanceof HTMLDialogElement&&!target.open){lastFocus=document.activeElement;lock();target.showModal();}
});
for(const d of [productDialog,filterDialog,categoryDialog]){
 d.addEventListener('cancel',event=>{event.preventDefault();closeDialog(d);});
 d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d);}});
 d.addEventListener('close',()=>{if(history.state?.cartaDialog===d.id)history.back();if(d===categoryDialog)$('category-button').setAttribute('aria-expanded','false');unlock();lastFocus?.focus({preventScroll:true});save();});
}
function chip(id){const a=allergens.find(a=>a[0]===id);const el=document.createElement('span');el.className='allergen-chip';const icon=document.createElement('span');icon.textContent=a?.[2]||'·';icon.setAttribute('aria-hidden','true');const name=document.createElement('span');name.textContent=a?.[1]||id;el.append(icon,name);return el;}
function priceMarkup(prices){return prices.map(p=>`<span><span class="price-label">${p.label}</span>${money(p.amount)}</span>`).join('<span class="price-separator">·</span>');}
function openProduct(p){
 $('modal-image').src=p.image;$('modal-image').alt=p.name;
 $('modal-category').textContent=data.categories.find(c=>c[0]===p.category)[1];$('modal-title').textContent=p.name;$('modal-description').textContent=p.detail;
 $('ingredients-section').hidden=!p.ingredients?.length;$('modal-ingredients').textContent=(p.ingredients||[]).join(', ');
 $('modal-prices').replaceChildren();
 for(const price of p.prices){const el=document.createElement('div');el.className='modal-price';const label=document.createElement('small');label.textContent=price.label;const amount=document.createElement('strong');amount.textContent=money(price.amount);el.append(label,amount);$('modal-prices').append(el);}
 $('modal-allergens').replaceChildren(...p.allergens.slice(0,3).map(chip));$('extra-allergens').replaceChildren(...p.allergens.slice(3).map(chip));$('more-allergens').hidden=p.allergens.length<=3;$('more-allergens').open=false;
 if(!p.allergens.length){const text=document.createElement('p');text.textContent=simulation()?'Sin alérgenos asignados en estos datos simulados.':p.allergensConfirmed?'Sin alérgenos declarados. Consulta al personal sobre posibles trazas.':'Información pendiente de confirmar. Consulta al personal.';$('modal-allergens').append(text);}
 openDialog(productDialog);productDialog.scrollTop=0;
}
function card(p){
 const button=document.createElement('button');button.className='product-card';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-label',`Ver ${p.name}`);
 button.innerHTML=`<img class="product-image" src="${p.thumbnail||p.image}" alt="" loading="lazy" decoding="async" width="102" height="106"><span class="product-info"><span class="product-name">${p.name}</span><span class="product-description">${p.description}</span><span class="card-bottom"><span class="card-prices">${priceMarkup(p.prices)}</span><span class="card-arrow" aria-hidden="true">›</span></span></span>`;
 button.addEventListener('click',()=>openProduct(p));return button;
}
function renderActiveFilters(){
 $('active-filters').replaceChildren();
 for(const id of state.excluded){const name=allergens.find(a=>a[0]===id)?.[1]||id;const b=document.createElement('button');b.className='active-filter-chip';b.textContent=name+' ×';b.setAttribute('aria-label',`Quitar filtro de ${name}`);b.addEventListener('click',()=>{state.excluded=state.excluded.filter(a=>a!==id);render();});$('active-filters').append(b);}
 $('active-note').hidden=!state.excluded.length;
}
function render(){
 const searching=!!state.query.trim(),found=selectProducts(data.products,state.category,state.query,state.excluded,simulation());
 $('products').replaceChildren();
 for(const [id,name] of data.categories){const group=found.filter(p=>p.category===id);if(!group.length)continue;const section=document.createElement('section');section.setAttribute('aria-label',name);if(state.category==='all'||searching){const h=document.createElement('h3');h.className='section-title';h.textContent=name;section.append(h);}const grid=document.createElement('div');grid.className='product-grid';grid.append(...group.map(card));section.append(grid);$('products').append(section);}
 $('result-title').textContent=searching?'Resultados':state.category==='all'?'Toda la carta':data.categories.find(c=>c[0]===state.category)?.[1]||'Toda la carta';
 $('search-scope').hidden=!searching;
 $('result-count').textContent=`${found.length} ${found.length===1?'producto':'productos'}`;
 $('empty').hidden=found.length>0;
 const empty=emptyState(data.products,state.category,state.query,state.excluded,simulation());
 $('empty-title').textContent=empty.title;$('empty-description').textContent=empty.description;$('empty-action').textContent=empty.action;$('empty-action').dataset.kind=empty.kind;
 renderActiveFilters();
 $('filter-button').setAttribute('aria-pressed',String(!!state.excluded.length));$('filter-button').setAttribute('aria-label',state.excluded.length?'Filtrar por alérgenos, filtro activo':'Filtrar por alérgenos');$('clear-search').hidden=!state.query;
 for(const b of $('categories').children)b.setAttribute('aria-pressed',String(b.dataset.category===(searching?'all':state.category)));
 save();
}
function anchorY(){return $('controls-anchor').getBoundingClientRect().top+window.scrollY;}
function moveToList(){window.scrollTo({top:Math.max(0,anchorY()),behavior:'instant'});}
function centerCategory(id){const b=Array.from($('categories').children).find(b=>b.dataset.category===id);if(b){const nav=$('categories');nav.scrollTo({left:b.offsetLeft-nav.offsetLeft-(nav.clientWidth-b.offsetWidth)/2,behavior:'smooth'});}}
function setCategory(id){const targetY=Math.min(window.scrollY,anchorY());window.scrollTo({top:targetY,behavior:'instant'});state.category=id;state.query='';priorSearch=null;$('search').value='';render();window.scrollTo({top:targetY,behavior:'instant'});centerCategory(id);save();}
function clearSearch(){state.query='';$('search').value='';if(priorSearch){state.category=priorSearch.category;const previousScroll=priorSearch.scroll;priorSearch=null;render();window.scrollTo(0,previousScroll);}else render();centerCategory(state.category);}
function captureSearchContext(){if(!state.query)priorSearch={category:state.category,scroll:window.scrollY};}
$('search').addEventListener('pointerdown',captureSearchContext);
$('search').addEventListener('focus',captureSearchContext);
$('search').addEventListener('input',e=>{
 const startY=Math.min(window.scrollY,anchorY());
 if(!state.query&&e.target.value){if(!priorSearch)priorSearch={category:state.category,scroll:window.scrollY};centerCategory('all');}
 state.query=e.target.value;
 if(!state.query){clearSearch();return;}
 render();window.scrollTo({top:startY,behavior:'instant'});
});
$('clear-search').addEventListener('click',()=>{clearSearch();$('search').focus({preventScroll:true});});
$('search-form').addEventListener('submit',event=>{event.preventDefault();state.query=$('search').value;render();$('search').blur();requestAnimationFrame(()=>{moveToList();save();});});
$('filter-button').addEventListener('click',()=>{}); // Inert and hidden in demo.
$('clear-draft').addEventListener('click',()=>{draft=[];for(const input of $('filter-options').querySelectorAll('input'))input.checked=false;});
$('apply-filters').addEventListener('click',()=>{state.excluded=[...draft];render();closeDialog(filterDialog);});
$('reset-filters').addEventListener('click',()=>{state.excluded=[];render();});
$('empty-action').addEventListener('click',()=>{const kind=$('empty-action').dataset.kind;if(kind==='filters'){state.excluded=[];render();}else if(kind==='search'){clearSearch();}else{setCategory('all');}});
function showCategoryPicker(){
 $('category-options').replaceChildren();
 for(const [id,name] of [['all','Todos'],...data.categories]){
  const count=selectProducts(data.products,id,'',state.excluded,simulation()).length;
  const b=document.createElement('button');b.className='category-option';b.setAttribute('aria-pressed',String(!state.query.trim()&&id===state.category));
  const title=document.createElement('span');title.textContent=name;const total=document.createElement('span');total.className='category-total';total.textContent=String(count);b.append(title,total);
  b.addEventListener('click',()=>{categoryDialog.addEventListener('close',()=>setCategory(id),{once:true});closeDialog(categoryDialog);});$('category-options').append(b);
 }
 $('category-button').setAttribute('aria-expanded','true');openDialog(categoryDialog);
}
$('category-button').addEventListener('click',showCategoryPicker);
document.querySelector('.close-modal').addEventListener('click',()=>closeDialog(productDialog));document.querySelector('.close-filter').addEventListener('click',()=>closeDialog(filterDialog));document.querySelector('.close-categories').addEventListener('click',()=>closeDialog(categoryDialog));
for(const [id,name,icon] of allergens){const label=document.createElement('label');label.className='filter-option';const input=document.createElement('input');input.type='checkbox';input.value=id;input.addEventListener('change',()=>{draft=Array.from($('filter-options').querySelectorAll('input:checked'),i=>i.value);});const symbol=document.createElement('span');symbol.className='allergen-icon';symbol.textContent=icon;symbol.setAttribute('aria-hidden','true');const text=document.createElement('span');text.textContent=name;label.append(input,symbol,text);$('filter-options').append(label);}
if(isEvaluation){const banner=document.createElement('aside');banner.className='evaluation-banner';banner.textContent='Ingredientes y alérgenos simulados · No usar para decisiones alimentarias.';document.body.prepend(banner);const label=document.createElement('span');label.textContent='Datos simulados';document.querySelector('.allergen-header').append(label);document.querySelector('#filter-dialog .food-warning').textContent='Estos filtros usan datos sintéticos para comprobar la navegación. No describen las recetas del restaurante.';document.querySelector('#product-dialog .food-warning').textContent='Ingredientes y alérgenos simulados. No utilizar esta información para decidir sobre alergias.';}
let seen=false;try{seen=sessionStorage.getItem('carta-intro-seen-v5')==='yes';if(seen){const saved=JSON.parse(sessionStorage.getItem(stateKey)||'null');if(saved&&typeof saved.query==='string'&&Array.isArray(saved.excluded))state={...saved,excluded:[]};}}catch{}
const navigationType=performance.getEntriesByType('navigation')[0]?.type;
if(navigationType==='reload'||new URLSearchParams(location.search).has('replay')){seen=false;state={category:'all',query:'',excluded:[],scroll:0};window.scrollTo(0,0);}
if(seen)$('intro').remove();else{import('./intro.js?v=10').then(({playIntro})=>playIntro($('intro'))).catch(()=>{setTimeout(()=>$('intro')?.remove(),1000);});}
try{
 const response=await fetch('menu.json?v=21');if(!response.ok)throw new Error('load');data=await response.json();
 if(!data.categories.some(c=>c[0]===state.category)&&state.category!=='all')state.category='all';state.excluded=[];
 for(const [id,name] of [['all','Todos'],...data.categories]){const b=document.createElement('button');b.textContent=name;b.dataset.category=id;b.addEventListener('click',()=>setCategory(id));$('categories').append(b);}
 const restoredScroll=state.scroll||0;$('search').value=state.query;render();if(seen)requestAnimationFrame(()=>window.scrollTo(0,restoredScroll));
}catch(error){$('load-error').hidden=false;}
let scrollTimer;window.addEventListener('scroll',()=>{if(document.body.style.position==='fixed')return;clearTimeout(scrollTimer);scrollTimer=setTimeout(save,120);},{passive:true});window.addEventListener('pagehide',save);
