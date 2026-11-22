const $=s=>document.querySelector(s);
const state=JSON.parse(localStorage.getItem('aurora-save')||'null')||{level:12,stars:2,gold:2480,crystals:340,chapter:3,stage:4,team:['Aria','Thorne','Lyra'],won:[1,2,3,4,5,6,7]};
const heroes={
 Aria:{role:'Guerreira',power:3421,skin:'#e4b08a',coat:'#9e3b52',bg:'linear-gradient(135deg,#c14e62,#5a1e2e)'},
 Thorne:{role:'Paladino',power:3188,skin:'#d9b38b',coat:'#5684a0',bg:'linear-gradient(135deg,#6d9caf,#344a67)'},
 Lyra:{role:'Mago',power:3650,skin:'#d6a6b7',coat:'#8d72d4',bg:'linear-gradient(135deg,#b69df0,#574a92)'},
 Kael:{role:'Atirador',power:2944,skin:'#a56f50',coat:'#c49443',bg:'linear-gradient(135deg,#d2a44d,#704d28)'},
 Nox:{role:'Assassino',power:3375,skin:'#bea08d',coat:'#4c4d65',bg:'linear-gradient(135deg,#77758d,#303246)'},
 Mira:{role:'Curadora',power:2810,skin:'#e3b8a0',coat:'#5ca98b',bg:'linear-gradient(135deg,#77c49e,#315c55)'},
 Brakka:{role:'Guardião',power:3520,skin:'#8f6751',coat:'#8a633f',bg:'linear-gradient(135deg,#9e7b53,#50392a)'}
};
function save(){localStorage.setItem('aurora-save',JSON.stringify(state))}
function portrait(name,cls='portrait'){const h=heroes[name];return `<div class="${cls}" style="--skin:${h.skin};--coat:${h.coat};--bg:${h.bg}"></div>`}
function render(){
 document.querySelector('#app').innerHTML=`<div class="app-shell">
 <aside class="left"><div class="brand"><h1>AURORA</h1><small>CITADEL</small></div><div class="profile"><div class="avatar"></div><div><b>Comandante</b><div class="level">NÍVEL ${state.level}</div></div></div>
 <nav class="nav"><button class="active"><span>◆</span> Campanha</button><button data-tab="heroes"><span>♟</span> Heróis</button><button><span>▣</span> Inventário</button><button><span>⚔</span> Arena</button><button><span>☰</span> Guilda</button></nav><div class="currency"><div><span>◆ Ouro</span><i>${state.gold.toLocaleString()}</i></div><div><span>✦ Cristais</span><i>${state.crystals}</i></div></div></aside>
 <main class="stage"><div class="map"><div class="topbar"><div class="chapter"><b>Capítulo ${state.chapter} · Vale Sombrio</b><small>${state.won.length-1} / 12 etapas concluídas</small></div><div class="top-actions"><button class="icon-btn">◉</button><button class="icon-btn">⚙</button></div></div><div class="path"></div><div class="camp"><div class="citadel"></div></div>${nodes()}</div><button class="power-btn" id="battleBtn">INICIAR BATALHA</button></main>
 <aside class="right"><div class="right-head"><h3>EQUIPE</h3><button class="icon-btn" id="editTeam">✎</button></div><div class="team">${teamHtml()}</div></aside></div>`;
 $('.power-btn').onclick=()=>battle(); $('#editTeam').onclick=teamModal; document.querySelector('[data-tab="heroes"]').onclick=teamModal;
}
function nodes(){let html='';const pts=[[12,57],[24,44],[36,52],[47,38],[58,48],[68,35],[76,50],[88,40]];
 pts.forEach((p,i)=>{const n=i+1;let cls=n<state.stage?'done':n===state.stage?'active':'locked';html+=`<div class="node ${cls}" style="left:${p[0]}%;top:${p[1]}%" data-node="${n}"><span class="node-num">${n<state.stage?'✓':n}</span></div>`});
 const seg=[[12,57,24,44],[24,44,36,52],[36,52,47,38],[47,38,58,48],[58,48,68,35],[68,35,76,50],[76,50,88,40]];
 seg.forEach((s,i)=>{const ax=s[0],ay=s[1],bx=s[2],by=s[3],dx=bx-ay,dy=by-ay; // screen relative approximate
 const len=Math.sqrt((bx-ax)**2+(by-ay)**2); const ang=Math.atan2(by-ay,bx-ax)*180/Math.PI;html+=`<div class="route ${i<state.stage-1?'done':''}" style="left:${ax}%;top:${ay}%;width:${len}%;transform:rotate(${ang}deg)"></div>`});
 return html}
function teamHtml(){return state.team.map(name=>{const h=heroes[name];return `<div class="slot">${portrait(name)}<div class="hero-info"><b>${name}</b><small>${h.role}</small></div><div class="power">✦ ${h.power}</div></div>`}).join('')}
function teamModal(){const modal=document.createElement('div');modal.className='modal-back';modal.innerHTML=`<div class="modal"><h2>Selecionar equipe</h2><div class="heroes-grid">${Object.entries(heroes).map(([name,h])=>`<button class="hero-card ${state.team.includes(name)?'selected':''}" data-name="${name}">${portrait(name)}<b>${name}</b><small>${h.role} · ${h.power}</small></button>`).join('')}</div></div>`;document.body.append(modal);modal.onclick=e=>{if(e.target===modal)modal.remove();const card=e.target.closest('.hero-card');if(card){const name=card.dataset.name;if(state.team.includes(name)){if(state.team.length>1)state.team=state.team.filter(n=>n!==name)}else if(state.team.length<3)state.team.push(name);else {state.team.shift();state.team.push(name)}save();render();modal.remove();teamModal()}}}
function battle(){const stage=document.query('.stage')||document.querySelector('.stage');const old=stage.innerHTML;const enemies=['Nox','Brakka','Kael'].slice(0,Math.min(3,state.stage>8?3:2));
 stage.innerHTML=`<div class="battle"><div class="battle-top"><b>Vale Sombrio · Etapa ${state.stage}</b></div><div class="fighters"><div class="team-side">${state.team.map((n,i)=>`<div class="fighter ally" data-i="${i}" style="--skin:${heroes[n].skin};--coat:${heroes[n].coat};--bg:${heroes[n].bg}"><div class="hp"><i style="width:100%"></i></div></div>`).join('')}</div><div class="team-side enemy">${enemies.map((n,i)=>`<div class="fighter foe" data-i="${i}" style="--skin:${heroes[n].skin};--coat:${heroes[n].coat};--bg:${heroes[n].bg}"><div class="hp"><i style="width:100%"></i></div></div>`).join('')}</div></div><div class="battle-log"><b>Preparando...</b><span>Os campeões entram na arena</span></div></div>`;
 let rounds=0,allyHp=[100,100,100].slice(0,state.team.length),enemyHp=[100,100].slice(0,enemies.length);const log=$('.battle-log');
 const timer=setInterval(()=>{rounds++;const ai=$('.fighter.ally:not(.dead)'),ei=$('.fighter.foe:not(.dead)');if(!ai||!ei){clearInterval(timer);finish((ei&&ei.classList.contains('foe'))?false:true);return}const enemyAlive=[...document.queryAll('.fighter.foe:not(.dead)')];const allyAlive=[...document.queryAll('.fighter.ally:not(.dead)')];
 const a=allyAlive[Math.floor(Math.random()*allyAlive.length)],e=enemyAlive[Math.floor(Math.random()*enemyAlive.length)];
 if(!a||!e)return;const damage=15+Math.floor(Math.random()*22);const hp=e.querySelector('.hp i');let val=Math.max(0,parseInt(hp.style.width)-damage);hp.style.width=val+'%';e.classList.add('hit');setTimeout(()=>e.classList.remove('hit'),220);if(val===0)e.classList.add('dead');log.innerHTML=`<b>Golpe crítico!</b><span>${state.team[Number(a.dataset.i)]} inflige ${damage} de dano</span>`;
 if(rounds%2===0){const ed=enemyAlive[Math.floor(Math.random()*enemyAlive.length)]?.getAttribute('data-i');if(ed!=null&&allyAlive.length){const target=allyAlive[Math.floor(Math.random()*allyAlive.length)];const ahp=target.querySelector('.hp i');const val2=Math.max(0,parseInt(ahp.style.width)-12-Math.floor(Math.random()*14));ahp.style.width=val2+'%';target.classList.add('hit');setTimeout(()=>target.classList.remove('hit'),220);if(val2===0)target.classList.add('dead')}}
 if(rounds>14){clearInterval(timer);finish([...document.queryAll('.fighter.foe:not(.dead)')].length===0)}},900);
 function finish(win){setTimeout(()=>{const reward=win?{gold:180,crystals:12}:{};if(win){state.gold+=180;state.crystals+=12;if(!state.won.includes(state.stage))state.won.push(state.stage);state.stage=Math.min(12,state.stage+1)}save();stage.innerHTML=`<div class="battle"><div class="modal-back" style="background:#090d18aa"><div class="modal"><h2>${win?'Vitória':'Derrota'}</h2><p>${win?'A estrada está segura. Novas recompensas desbloqueadas.':'Sua equipe precisa ficar mais forte.'}</p><div class="reward"><div class="reward-row">${win?'<div class="reward-box">◆ 180 Ouro</div><div class="reward-box">✦ 12 Cristais</div>':'<div class="reward-box">Treine e tente novamente</div>'}</div></div><button class="power-btn" id="backMap" style="position:static;transform:none;width:100%;margin-top:16px">CONTINUAR</button></div></div></div>`;$('#backMap').onclick=render},700)}
}
document.querySelectorAll; 
// small compatibility helpers
Document.prototype.query=function(s){return this.querySelector(s)};Document.prototype.queryAll=function(s){return this.querySelectorAll(s)};
Element.prototype.queryAll=function(s){return this.querySelectorAll(s)};
render();