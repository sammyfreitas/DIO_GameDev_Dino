const game = document.getElementById('game');
const dino = document.getElementById('dino');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const errorsEl = document.getElementById('errors');
const livesEl = document.getElementById('lives');
const timeEl = document.getElementById('time');
const timeLabel = document.getElementById('timeLabel');
const startOverlay = document.getElementById('startOverlay');
const resultOverlay = document.getElementById('resultOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const finalScore = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const themeToggle = document.getElementById('themeToggle');
const modeButtons = [...document.querySelectorAll('.mode')];

let mode = 'timed';
let running = false, paused = false, jumping = false, invincible = false;
let score = 0, errors = 0, lives = 3, elapsed = 0, remaining = 60;
let speed = 6, spawnTimer = 0, nextSpawn = 1250, lastTime = 0, jumpY = 0, jumpVelocity = 0;
let obstacles = [], animationId = null;
let highScore = Number(localStorage.getItem('dinoRunHighScore') || 0);
highScoreEl.textContent = highScore;

function setTheme(theme){
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('dinoRunTheme', theme);
  themeToggle.innerHTML = `<i class="fa-solid fa-${theme === 'dark' ? 'sun' : 'moon'}"></i>`;
}
setTheme(localStorage.getItem('dinoRunTheme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeToggle.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

document.getElementById('year').textContent = new Date().getFullYear();

modeButtons.forEach(btn=>btn.addEventListener('click',()=>{
  if(running) return;
  mode = btn.dataset.mode;
  modeButtons.forEach(b=>b.classList.toggle('active', b===btn));
  timeLabel.textContent = mode === 'timed' ? 'TEMPO' : 'DURAÇÃO';
  timeEl.textContent = mode === 'timed' ? '60s' : '0s';
}));

function updateHud(){
  scoreEl.textContent = Math.max(0, Math.floor(score));
  errorsEl.textContent = errors;
  livesEl.textContent = Array.from({length:3},(_,i)=>i<lives?'♥':'♡').join(' ');
  timeEl.textContent = `${Math.max(0, Math.ceil(mode==='timed'?remaining:elapsed))}s`;
}

function clearObstacles(){ obstacles.forEach(o=>o.el.remove()); obstacles=[]; }

function startGame(){
  cancelAnimationFrame(animationId); clearObstacles();
  running=true; paused=false; jumping=false; invincible=false; score=0; errors=0; lives=3; elapsed=0; remaining=60; speed=6; spawnTimer=0; nextSpawn=1100; jumpY=0; jumpVelocity=0; lastTime=performance.now();
  dino.style.transform='translateY(0)'; dino.classList.remove('hit');
  startOverlay.classList.add('hidden'); resultOverlay.classList.add('hidden'); pauseOverlay.classList.add('hidden'); game.classList.remove('paused');
  pauseBtn.disabled=false; restartBtn.disabled=false; pauseBtn.innerHTML='<i class="fa-solid fa-pause"></i><span>Pausar</span>';
  modeButtons.forEach(b=>b.disabled=true); updateHud(); game.focus();
  animationId=requestAnimationFrame(loop);
}

function jump(){
  if(!running || paused || jumping) return;
  jumping=true; jumpVelocity=12.8;
}

function spawnObstacle(){
  const el=document.createElement('div'); el.className='cactus'; game.appendChild(el);
  const x=game.clientWidth+30; el.style.left=`${x}px`; obstacles.push({el,x,hit:false});
  nextSpawn=900+Math.random()*900;
}

function collide(o){
  const d={left:70,right:124,bottom:68+jumpY,top:128+jumpY};
  const c={left:o.x+10,right:o.x+50,bottom:68,top:124};
  return d.right>c.left && d.left<c.right && d.bottom<c.top && d.top>c.bottom;
}

function registerHit(o){
  if(invincible || o.hit) return; o.hit=true; invincible=true; errors++; lives--; score=Math.max(0,score-125);
  dino.classList.add('hit'); setTimeout(()=>{invincible=false;dino.classList.remove('hit')},900); updateHud();
  if(lives<=0) finish(false);
}

function loop(now){
  if(!running) return;
  if(paused){ lastTime=now; animationId=requestAnimationFrame(loop); return; }
  const dt=Math.min((now-lastTime)/1000,.035); lastTime=now; elapsed+=dt; if(mode==='timed') remaining-=dt;
  speed=Math.min(12,6+elapsed/18); score+=dt*(10+speed);
  if(mode==='timed' && remaining<=0){ finish(true); return; }
  if(jumping){ jumpY+=jumpVelocity*60*dt; jumpVelocity-=34*dt; if(jumpY<=0){jumpY=0;jumpVelocity=0;jumping=false} dino.style.transform=`translateY(${-jumpY}px)`; }
  spawnTimer+=dt*1000; if(spawnTimer>=nextSpawn){spawnTimer=0;spawnObstacle()}
  obstacles.forEach(o=>{o.x-=speed*60*dt;o.el.style.left=`${o.x}px`;if(collide(o))registerHit(o);if(!o.hit && o.x<25){o.hit=true;score+=75}});
  obstacles.filter(o=>o.x<-80).forEach(o=>o.el.remove()); obstacles=obstacles.filter(o=>o.x>=-80);
  updateHud(); animationId=requestAnimationFrame(loop);
}

function finish(completed){
  running=false; cancelAnimationFrame(animationId); pauseBtn.disabled=true; modeButtons.forEach(b=>b.disabled=false);
  const final=Math.max(0,Math.floor(score)); if(final>highScore){highScore=final;localStorage.setItem('dinoRunHighScore',highScore);highScoreEl.textContent=highScore}
  resultTitle.textContent=completed?'Desafio concluído!':'Fim de jogo';
  resultText.textContent=completed?`Você sobreviveu aos 60 segundos com ${errors} erro${errors===1?'':'s'}.`:`Você correu por ${Math.floor(elapsed)}s e cometeu ${errors} erro${errors===1?'':'s'}.`;
  finalScore.textContent=final; resultOverlay.classList.remove('hidden');
}

function togglePause(){
  if(!running)return; paused=!paused; game.classList.toggle('paused',paused); pauseOverlay.classList.toggle('hidden',!paused);
  pauseBtn.innerHTML=paused?'<i class="fa-solid fa-play"></i><span>Continuar</span>':'<i class="fa-solid fa-pause"></i><span>Pausar</span>';
}

startBtn.addEventListener('click',startGame); playAgainBtn.addEventListener('click',startGame); restartBtn.addEventListener('click',startGame); pauseBtn.addEventListener('click',togglePause);
document.addEventListener('keydown',e=>{if(['Space','ArrowUp'].includes(e.code)){e.preventDefault();jump()} if(e.code==='KeyP')togglePause()});
game.addEventListener('pointerdown',e=>{if(e.target.closest('button,a'))return;jump()});
window.addEventListener('blur',()=>{if(running&&!paused)togglePause()});
updateHud();
