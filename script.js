let posts=[];
try{
  const storedPosts=localStorage.getItem('receta_posts');
  posts=storedPosts?JSON.parse(storedPosts):[];
}catch(error){
  console.warn('No se pudieron leer las recetas guardadas.',error);
}
if(!Array.isArray(posts)||!posts.length)posts=[
{id:1,type:'Comedor Comunitario',author:'Comedor San José (CDMX)',title:'Sopa de Verduras de Temporada',desc:'Ingredientes: Calabacita, zanahoria, jitomate y papa.\
Pasos: 1. Lavar ingredientes. 2. Picar en dados pequeños. 3. Hervir durante 20 minutos con una pizca de sal.',image:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',favorite:false,illustrated:false,illustrationRequested:false},
{id:2,type:'Ilustrador Voluntario',author:'Ana Gómez (Ilustradora)',title:'Guía Visual de Higiene en la Cocina',desc:'Lámina informativa de 3 pasos: lavado de manos, desinfección de superficies y uso de trapos limpios.',image:'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',favorite:false,illustrated:true,illustrationRequested:false}
];

// Determina el estado real de una receta.
// También reconoce ilustraciones guardadas con versiones anteriores.
function isIllustrated(post){
  return post.illustrated === true ||
         !!post.illustrationImage ||
         !!post.illustratorName ||
         !!post.illustratedAt;
}

function normalizePosts(){
  let changed=false;

  posts=posts.map(post=>{
    const illustrated=isIllustrated(post);
    const normalized={...post};

    if(normalized.illustrated !== illustrated){
      normalized.illustrated=illustrated;
      changed=true;
    }

    if(illustrated && normalized.illustrationRequested){
      normalized.illustrationRequested=false;
      changed=true;
    }

    return normalized;
  });

  if(changed)savePosts();
}

function renderPosts(){
const grid=document.getElementById('requestsGrid'),query=document.getElementById('searchInput').value.toLowerCase(),cat=document.getElementById('categoryFilter').value;
const filtered=posts.filter(p=>(!cat||p.type===cat)&&(`${p.title} ${p.author} ${p.desc}`.toLowerCase().includes(query)));
updateStats();
if(!filtered.length){grid.innerHTML='<p style="grid-column:1/-1;text-align:center;color:var(--muted)">No se encontraron publicaciones.</p>';return}
grid.innerHTML=filtered.map(p=>{
const illustrated=isIllustrated(p);
return `<article class="card" data-recipe-id="${p.id}">${p.image?`<img src="${p.image}" alt="${escapeHtml(p.title)}" class="card-img">`:''}
<span class="card-badge">${escapeHtml(p.type)}</span>
<h3>${escapeHtml(p.title)}</h3>
<small style="color:var(--muted);font-weight:600">Por: ${escapeHtml(p.author)}</small>
<p>${escapeHtml(p.desc)}</p>
<div><span class="illustration-status ${illustrated?'':'pending'}">${illustrated?'✓ Ilustrada':(p.illustrationRequested?'⏳ Ilustración solicitada':'🎨 Aún sin ilustrar')}</span></div>
<div class="card-actions">
<button class="favorite" aria-label="Marcar favorito" onclick="toggleFavorite(${p.id})">${p.favorite?'❤️':'♡'}</button>
${!illustrated&&!p.illustrationRequested?`<button class="small-btn" onclick="openIllustrationModal(${p.id})">🎨 Yo la ilustro</button>`:''}
</div></article>`;
}).join('');
}
function showRandomResult(message){
 const result=document.getElementById('randomResult');
 result.textContent=message;
 result.classList.remove('empty');
}
function highlightRecipe(id){
 const card=document.querySelector(`[data-recipe-id="${id}"]`);
 if(!card)return;
 card.classList.remove('random-highlight');
 void card.offsetWidth;
 card.classList.add('random-highlight');
 card.scrollIntoView({behavior:'smooth',block:'center'});
 setTimeout(()=>card.classList.remove('random-highlight'),2600);
}
function recetaRandom(){
 if(!posts.length){showRandomResult('📭 Todavía no hay recetas para descubrir.');return;}
 const receta=posts[Math.floor(Math.random()*posts.length)];
 showRandomResult(`🍲 Hoy descubriste: ${receta.title} · Por ${receta.author}`);
 highlightRecipe(receta.id);
}
function ilustracionRandom(){
 const pendientes=posts.filter(p=>!p.illustrated&&!p.illustrationRequested);
 if(!pendientes.length){showRandomResult('🎉 No hay recetas pendientes de ilustrar. ¡Todas están ilustradas o ya tienen una solicitud!');return;}
 const receta=pendientes[Math.floor(Math.random()*pendientes.length)];
 showRandomResult(`🎨 La suerte eligió: ${receta.title}. ¡Puedes convertirla en una guía visual!`);
 highlightRecipe(receta.id);
 setTimeout(()=>openIllustrationModal(receta.id),900);
}
function favoritoRandom(){
 const favoritos=posts.filter(p=>p.favorite);
 if(!favoritos.length){showRandomResult('❤️ Aún no tienes favoritos. Esta vez descubriremos una receta al azar.');recetaRandom();return;}
 const receta=favoritos[Math.floor(Math.random()*favoritos.length)];
 showRandomResult(`❤️ Tu favorito al azar es: ${receta.title}`);
 highlightRecipe(receta.id);
}
function randomDiscover(){
 const funciones=[recetaRandom,ilustracionRandom,favoritoRandom];
 const funcionAleatoria=funciones[Math.floor(Math.random()*funciones.length)];
 funcionAleatoria();
}

function updateStats(){
const total=document.getElementById('totalRecipes');
if(!total)return;
document.getElementById('totalRecipes').textContent=posts.length;
document.getElementById('illustratedRecipes').textContent=posts.filter(isIllustrated).length;
document.getElementById('pendingIllustrations').textContent=posts.filter(p=>!isIllustrated(p)).length;
document.getElementById('contributors').textContent=new Set(posts.map(p=>p.author.trim().toLowerCase())).size;
}
function savePosts(){
  try{
    localStorage.setItem('receta_posts',JSON.stringify(posts));
  }catch(error){
    alert('No se pudo guardar la receta. La imagen podría ser demasiado grande para el almacenamiento del navegador.');
    console.error(error);
  }
}
function escapeHtml(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toggleFavorite(id){const p=posts.find(x=>x.id===id);if(p)p.favorite=!p.favorite;savePosts();renderPosts()}
let selectedIllustrationId=null;
function openIllustrationModal(id){
selectedIllustrationId=id;
const p=posts.find(x=>x.id===id);
if(!p)return;
document.getElementById('illustrationTarget').textContent=`Propuesta para: ${p.title}. Tu apoyo ayudará a convertir esta receta en una guía visual accesible.`;
document.getElementById('illustrationModal').style.display='flex';
document.getElementById('illustratorName').focus();
}
function closeIllustrationModal(){document.getElementById('illustrationModal').style.display='none';selectedIllustrationId=null}
function submitIllustration(e){
e.preventDefault();
const p=posts.find(x=>x.id===selectedIllustrationId);
const file=document.getElementById('illustrationFile').files[0];
const name=document.getElementById('illustratorName').value.trim();
const note=document.getElementById('illustrationNote').value.trim();

if(!p||!file)return;
if(!file.type.startsWith('image/')){
alert('Selecciona un archivo de imagen válido.');
return;
}

const reader=new FileReader();
reader.onload=()=>{
// Guardamos la ilustración por separado y también como imagen visible.
p.illustrationImage=reader.result;
p.image=reader.result;
p.illustrated=true;
p.illustrationRequested=false;
p.illustratorName=name;
p.illustrationNote=note;
p.illustratedAt=new Date().toISOString();

savePosts();
renderPosts();
e.target.reset();
closeIllustrationModal();
alert('¡Listo! La receta ahora aparece como ilustrada. 🎨');
};
reader.readAsDataURL(file);
}
function switchTab(evt,id){document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.view-content').forEach(v=>v.classList.remove('active'));evt.currentTarget.classList.add('active');document.getElementById(id).classList.add('active')}
function openModal(){document.getElementById('modal').style.display='flex';document.getElementById('authorInput').focus()}
function closeModal(){document.getElementById('modal').style.display='none'}
function handleFormSubmit(e){e.preventDefault();const file=document.getElementById('imageInput').files[0];const save=image=>{posts.unshift({id:Date.now(),type:userType.value,author:authorInput.value,title:titleInput.value,desc:descInput.value,image,favorite:false,illustrated:false,illustrationRequested:false});savePosts();renderPosts();closeModal();e.target.reset()};if(file){const reader=new FileReader();reader.onload=()=>save(reader.result);reader.readAsDataURL(file)}else save('')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

/* ===== Partículas al mover el cursor ===== */
(function initCursorParticles(){
  const canvas=document.getElementById('cursorParticles');
  if(!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx=canvas.getContext('2d');
  const particles=[];
  let mouseX=-100, mouseY=-100, lastX=-100, lastY=-100;
  let width=0,height=0,dpr=1;
  const maxParticles=140;

  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    width=window.innerWidth; height=window.innerHeight;
    canvas.width=width*dpr; canvas.height=height*dpr;
    canvas.style.width=width+'px'; canvas.style.height=height+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function addParticle(x,y){
    if(particles.length>=maxParticles) particles.splice(0,particles.length-maxParticles+1);
    const angle=Math.random()*Math.PI*2;
    const speed=.35+Math.random()*1.5;
    particles.push({
      x:x+(Math.random()-.5)*5,
      y:y+(Math.random()-.5)*5,
      vx:Math.cos(angle)*speed,
      vy:Math.sin(angle)*speed-.35,
      size:1.5+Math.random()*3.5,
      life:1,
      decay:.012+Math.random()*.018,
      color:['#f4511e','#ffb300','#388e3c','#8bc34a'][Math.floor(Math.random()*4)]
    });
  }

  function move(e){
    mouseX=e.clientX; mouseY=e.clientY;
    const dx=mouseX-lastX, dy=mouseY-lastY;
    const distance=Math.hypot(dx,dy);
    const amount=Math.min(5,Math.max(1,Math.floor(distance/8)));
    for(let i=0;i<amount;i++) addParticle(mouseX,mouseY);
    lastX=mouseX; lastY=mouseY;
  }

  function animate(){
    ctx.clearRect(0,0,width,height);
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.x+=p.vx; p.y+=p.vy; p.vy+=.012; p.life-=p.decay; p.size*=.997;
      if(p.life<=0 || p.size<.4){particles.splice(i,1);continue}
      ctx.globalAlpha=Math.max(0,p.life);
      ctx.fillStyle=p.color;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha=1;
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize',resize);
  window.addEventListener('pointermove',move,{passive:true});
  animate();
})();

normalizePosts();
renderPosts();
