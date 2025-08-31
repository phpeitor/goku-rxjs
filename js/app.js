// ====== Utilidades DOM ======
const $ = document.querySelector.bind(document);
const sprite = $('#sprite');
const meterContainer = $('#meter-container');
const meter = $('#meter');

// ====== Configuración central ======
const CONFIG = {
  MAX_LEVEL: 150,
  STEP: 1,            // incremento base por tick
  DECAY_STEP: 1,      // decremento por tick en decay
  DECAY_MS: 500,      // cada cuánto decae
  KEY_STEP_MS: 100,   // throttling de teclas
  HOLD_MS: 100,       // intervalo de repetición cuando dejas presionado botón
  LOG_BATCH: 10       // cada cuántos eventos imprimir tabla
};

// ====== Medidor ======
const fillMeter = (level) => {
  const containerWidth = meterContainer.offsetWidth;
  const newWidth = (level / CONFIG.MAX_LEVEL) * containerWidth;
  meter.style.width = `${newWidth}px`;
};

// ====== App Principal ======
const main = () => {
  const { fromEvent, interval, merge, BehaviorSubject } = rxjs;
  const {
    filter, map, scan, tap, switchMap, takeUntil,
    distinctUntilChanged, pairwise, throttleTime,
    withLatestFrom, startWith
  } = rxjs.operators;

  // UI dinámica
  let labelContador = document.getElementById('contador');

  // Controles +/-
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

  // Botón Pausa
  const pauseBtn = $('#pause-btn');
  const paused$ = new BehaviorSubject(false);
  fromEvent(pauseBtn, 'click').pipe(
    withLatestFrom(paused$),
    map(([, p]) => !p)
  ).subscribe((newPaused) => {
    paused$.next(newPaused);
    pauseBtn.classList.toggle('active', newPaused);
    pauseBtn.textContent = newPaused ? '▶️ Reanudar' : '⏸️ Pausar';
  });

  // ====== Streams de entrada ======
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

  // Throttle a teclas para no spamear incrementos
  const throttleCfg = { leading: true, trailing: false };
  const incKeys$ = merge(rightKey$, upKey$).pipe(
    throttleTime(CONFIG.KEY_STEP_MS, undefined, throttleCfg),
    map(() => ({ change: +CONFIG.STEP, source: 'key' }))
  );
  const decKeys$ = merge(leftKey$, downKey$).pipe(
    throttleTime(CONFIG.KEY_STEP_MS, undefined, throttleCfg),
    map(() => ({ change: -CONFIG.STEP, source: 'key' }))
  );

  // Click puntual en botones
  const incClick$ = fromEvent(increaseBtn, 'click').pipe(map(() => ({ change: +CONFIG.STEP, source: 'click' })));
  const decClick$ = fromEvent(decreaseBtn, 'click').pipe(map(() => ({ change: -CONFIG.STEP, source: 'click' })));

  // Hold en botones (pointerdown -> interval hasta pointerup/leave)
  const holdStream = (el, delta) =>
    fromEvent(el, 'pointerdown').pipe(
      switchMap(() =>
        interval(CONFIG.HOLD_MS).pipe(
          startWith(0), // emite inmediatamente
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

  // Decay: al soltar cualquier flecha, empieza a decaer hasta que vuelvas a presionar
  const powerDecay$ = keyUp$.pipe(
    switchMap(() =>
      interval(CONFIG.DECAY_MS).pipe(
        takeUntil(keyDown$),
        map(() => ({ change: -CONFIG.DECAY_STEP, source: 'decay' }))
      )
    )
  );

  // Mezcla total de cambios (teclas, clicks, hold, decay)
  const powerChanges$ = merge(
    incKeys$, decKeys$, incClick$, decClick$, incHold$, decHold$, powerDecay$
  ).pipe(
    // Respeta el estado de pausa
    withLatestFrom(paused$),
    filter(([, paused]) => !paused),
    map(([evt]) => evt)
  );

  // ====== Estado de poder (único stream de estado) ======
  const level$ = powerChanges$.pipe(
    scan((acc, { change }) => {
      const next = acc + change;
      return Math.max(0, Math.min(next, CONFIG.MAX_LEVEL));
    }, 0),
    distinctUntilChanged()
  );

  // ====== Lógica de UI y logging (single subscribe) ======
  // Guardaremos logs y mostraremos console.table en batch y en powerups
  const logs = [];
  const powerUpLogs = [];

  level$.pipe(
    pairwise(), // [prev, curr]
    tap(([prev, curr]) => {
      // UI: contador + barra + colores
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
      const increasing = curr > prev;
      // Flag visual de "powerup" cuando sube
      if (increasing) sprite.classList.add('powerup');
      else sprite.classList.remove('powerup');

      // Determinar transformación
      const state = (curr >= 100) ? 'ssj3' : (curr >= 50) ? 'ssj' : 'base';

      // ====== Logging ======
      const row = {
        ts: new Date().toLocaleTimeString(),
        prevLevel: prev,
        currentLevel: curr,
        delta: curr - prev,
        state,
        powerup: increasing ? '✅' : ''
      };
      logs.push(row);
      if (increasing) powerUpLogs.push(row);

      // mostrar tabla cada LOG_BATCH
      if (logs.length % CONFIG.LOG_BATCH === 0) {
        console.clear();
        console.log('📊 Últimos cambios de poder (batch):');
        console.table(logs.slice(-CONFIG.LOG_BATCH));
        if (powerUpLogs.length) {
          console.log('⚡ PowerUps detectados:');
          console.table(powerUpLogs.slice(-CONFIG.LOG_BATCH));
        }
      }

      return state;
    }),
    distinctUntilChanged() // solo cuando cambia base/ssj/ssj3
  ).subscribe((state) => {
    sprite.classList.remove('base', 'ssj', 'ssj3');
    sprite.classList.add(state);
  });

  // Quitar clase powerup cuando se deja de interactuar (mouse/teclas)
  merge(
    fromEvent(document, 'keyup'),
    fromEvent(increaseBtn, 'pointerup'),
    fromEvent(decreaseBtn, 'pointerup'),
    fromEvent(increaseBtn, 'pointerleave'),
    fromEvent(decreaseBtn, 'pointerleave')
  ).subscribe(() => {
    sprite.classList.remove('powerup');
  });

  // Inicializar UI
  fillMeter(0);
};

main();
