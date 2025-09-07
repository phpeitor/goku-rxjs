const $ = document.querySelector.bind(document);
const sprite = $('#sprite');
const meterContainer = $('#meter-container');
const meter = $('#meter');
const brand = document.querySelector('.brand');   
const logo  = document.getElementById('logo');    

const LOGOS_BY_STATE = {
  base: './img/logo01.png',
  ssj:  './img/logo02.png',
  ssj3: './img/logo03.png'
};

Object.values(LOGOS_BY_STATE).forEach(src => { const im = new Image(); im.src = src; });

let currentLogoState = null;
function setLogoForState(state) {
  if (!logo) return;
  if (state !== currentLogoState && LOGOS_BY_STATE[state]) {
    logo.src = LOGOS_BY_STATE[state];
    currentLogoState = state;
  }
}

const CONFIG = {
  MAX_LEVEL: 150,
  STEP: 1,         
  DECAY_STEP: 1,      
  DECAY_MS: 500,   
  KEY_STEP_MS: 100,  
  HOLD_MS: 100,      
  LOG_BATCH: 10    
};

const fillMeter = (level) => {
  const containerWidth = meterContainer.offsetWidth;
  const newWidth = (level / CONFIG.MAX_LEVEL) * containerWidth;
  meter.style.width = `${newWidth}px`;
};

const main = () => {
  const { fromEvent, interval, merge, BehaviorSubject } = rxjs;
  const {
    filter, map, scan, tap, switchMap, takeUntil,
    distinctUntilChanged, pairwise, throttleTime,
    withLatestFrom, startWith
  } = rxjs.operators;

  let labelContador = document.getElementById('contador');

  const controls = document.createElement('div');
  controls.className = 'power-controls';

  const increaseBtn = document.createElement('button');
  increaseBtn.textContent = '+';
  increaseBtn.className = 'power-btn increase';

  const decreaseBtn = document.createElement('button');
  decreaseBtn.textContent = '-';
  decreaseBtn.className = 'power-btn decrease';

  controls.appendChild(decreaseBtn);
  controls.appendChild(increaseBtn);
  meterContainer.appendChild(controls);

  const pauseBtn = $('#pause-btn');
  const paused$ = new BehaviorSubject(false);
  fromEvent(pauseBtn, 'click')
    .pipe(withLatestFrom(paused$), map(([, p]) => !p))
    .subscribe((newPaused) => {
      paused$.next(newPaused);
      pauseBtn.classList.toggle('active', newPaused);
      pauseBtn.textContent = newPaused ? '▶️ Reanudar' : '⏸️ Pausar';
    });

  const keyDown$ = fromEvent(document, 'keydown').pipe(
    filter(e => ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key))
  );
  const keyUp$ = fromEvent(document, 'keyup').pipe(
    filter(e => ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key))
  );

  const rightKey$ = keyDown$.pipe(filter(e => e.key === 'ArrowRight'));
  const leftKey$  = keyDown$.pipe(filter(e => e.key === 'ArrowLeft'));
  const upKey$    = keyDown$.pipe(filter(e => e.key === 'ArrowUp'));
  const downKey$  = keyDown$.pipe(filter(e => e.key === 'ArrowDown'));
  const throttleCfg = { leading: true, trailing: false };
  const incKeys$ = merge(rightKey$, upKey$).pipe(
    throttleTime(CONFIG.KEY_STEP_MS, undefined, throttleCfg),
    map(() => ({ change: +CONFIG.STEP, source: 'key' }))
  );
  const decKeys$ = merge(leftKey$, downKey$).pipe(
    throttleTime(CONFIG.KEY_STEP_MS, undefined, throttleCfg),
    map(() => ({ change: -CONFIG.STEP, source: 'key' }))
  );

  const incClick$ = fromEvent(increaseBtn, 'click').pipe(map(() => ({ change: +CONFIG.STEP, source: 'click' })));
  const decClick$ = fromEvent(decreaseBtn, 'click').pipe(map(() => ({ change: -CONFIG.STEP, source: 'click' })));

  const holdStream = (el, delta) =>
    fromEvent(el, 'pointerdown').pipe(
      switchMap(() =>
        interval(CONFIG.HOLD_MS).pipe(
          startWith(0),
          map(() => ({ change: delta, source: 'hold' })),
          takeUntil(merge(
            fromEvent(el, 'pointerup'),
            fromEvent(el, 'pointerleave'),
            fromEvent(document, 'pointercancel')
          ))
        )
      )
    );

  const incHold$ = holdStream(increaseBtn, +CONFIG.STEP);
  const decHold$ = holdStream(decreaseBtn, -CONFIG.STEP);

  const powerDecay$ = keyUp$.pipe(
    switchMap(() =>
      interval(CONFIG.DECAY_MS).pipe(
        takeUntil(keyDown$),
        map(() => ({ change: -CONFIG.DECAY_STEP, source: 'decay' }))
      )
    )
  );

  const powerChanges$ = merge(
    incKeys$, decKeys$, incClick$, decClick$, incHold$, decHold$, powerDecay$
  ).pipe(
    withLatestFrom(paused$),
    filter(([, paused]) => !paused),
    map(([evt]) => evt)
  );

  const level$ = powerChanges$.pipe(
    scan((acc, { change }) => {
      const next = acc + change;
      return Math.max(0, Math.min(next, CONFIG.MAX_LEVEL));
    }, 0),
    distinctUntilChanged()
  );

  const logs = [];
  const powerUpLogs = [];
  const powerDownLogs = [];

  level$.pipe(
    pairwise(),
    tap(([prev, curr]) => {
      labelContador.textContent = '💪 ' + curr;
      fillMeter(curr);

      if (curr >= 100) {
        meter.style.backgroundColor = '#ff0000';
        meter.style.boxShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
      } else if (curr >= 50) {
        meter.style.backgroundColor = '#ff9900';
        meter.style.boxShadow = '0 0 8px #ffcc00';
      } else {
        meter.style.backgroundColor = '#00ff00';
        meter.style.boxShadow = '0 0 5px #00ff88';
      }
    }),
    map(([prev, curr]) => {
      const delta = curr - prev;
      const increasing = delta > 0;
      const decreasing = delta < 0;

      if (increasing) sprite.classList.add('powerup');
      else sprite.classList.remove('powerup');

      const state = (curr >= 100) ? 'ssj3' : (curr >= 50) ? 'ssj' : 'base';

      const prevState = (prev >= 100) ? 'ssj3' : (prev >= 50) ? 'ssj' : 'base';
      if (increasing && state !== prevState && brand) {
        brand.classList.remove('pulse');  
        void brand.offsetWidth;            
        brand.classList.add('pulse');
        setTimeout(() => brand.classList.remove('pulse'), 350);
      }

      const row = {
        ts: new Date().toLocaleTimeString(),
        prevLevel: prev,
        currentLevel: curr,
        delta,
        state,
        trend: increasing ? 'UP' : decreasing ? 'DOWN' : 'FLAT'
      };

      logs.push(row);
      if (increasing) powerUpLogs.push(row);
      if (decreasing) powerDownLogs.push(row);

      if (logs.length % CONFIG.LOG_BATCH === 0) {
        console.clear();
        console.log('📊 Últimos cambios (batch):');
        console.table(logs.slice(-CONFIG.LOG_BATCH));

        if (powerUpLogs.length) {
          console.log('⚡ PowerUps detectados:');
          console.table(powerUpLogs.slice(-CONFIG.LOG_BATCH));
        }
        if (powerDownLogs.length) {
          console.log('🧯 PowerDowns detectados:');
          console.table(powerDownLogs.slice(-CONFIG.LOG_BATCH));
        }
      }

      return state;
    }),
    distinctUntilChanged()
  ).subscribe((state) => {
    sprite.classList.remove('base', 'ssj', 'ssj3');
    sprite.classList.add(state);
    setLogoForState(state)
  });

  merge(
    fromEvent(document, 'keyup'),
    fromEvent(increaseBtn, 'pointerup'),
    fromEvent(decreaseBtn, 'pointerup'),
    fromEvent(increaseBtn, 'pointerleave'),
    fromEvent(decreaseBtn, 'pointerleave')
  ).subscribe(() => {
    sprite.classList.remove('powerup');
  });

  fillMeter(0);
};

main();
