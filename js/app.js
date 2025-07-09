const $ = document.querySelector.bind(document);
const sprite = $('#sprite');
const meterContainer = $('#meter-container');
const meter = $('#meter');

const powerLevels = {
  50: {
    current: 'base',
    previous: null,
    next: 'ssj'
  },
  100: {
    current: 'ssj',
    previous: 'base',
    next: 'ssj3'
  },
  150: {
    current: 'ssj3',
    previous: 'base',
    next: null
  }
};

const fillMeter = (level) => {
  const containerWidth = meterContainer.offsetWidth;
  const maxLevel = 150;
  const newWidth = (level / maxLevel) * containerWidth;
  meter.style.width = `${newWidth}px`;
};

const main = () => {
  const { fromEvent, interval, merge } = rxjs;
  const { filter, map, scan, tap, switchMap, takeUntil, distinctUntilChanged, pairwise } = rxjs.operators;

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

  const keyDown$ = fromEvent(document, 'keydown').pipe(
    filter(event => 
      event.key === 'ArrowRight' || 
      event.key === 'ArrowLeft' || 
      event.key === 'ArrowUp' || 
      event.key === 'ArrowDown'
    )
  );
  
  const keyUp$ = fromEvent(document, 'keyup').pipe(
    filter(event => 
      event.key === 'ArrowRight' || 
      event.key === 'ArrowLeft' || 
      event.key === 'ArrowUp' || 
      event.key === 'ArrowDown'
    )
  );
  
  const rightKey$ = keyDown$.pipe(filter(event => event.key === 'ArrowRight'));
  const leftKey$ = keyDown$.pipe(filter(event => event.key === 'ArrowLeft'));
  const upKey$ = keyDown$.pipe(filter(event => event.key === 'ArrowUp'));
  const downKey$ = keyDown$.pipe(filter(event => event.key === 'ArrowDown'));

  const increase$ = merge(
    fromEvent(increaseBtn, 'click'),
    rightKey$,
    upKey$
  ).pipe(map(() => ({change: 1, isIncrease: true})));

  const decrease$ = merge(
    fromEvent(decreaseBtn, 'click'),
    leftKey$,
    downKey$
  ).pipe(map(() => ({change: -1, isIncrease: false})));

  const powerDecay$ = keyUp$.pipe(
    switchMap(() => interval(500).pipe(
      takeUntil(keyDown$),
      map(() => ({change: -1, isIncrease: false}))
    ))
  );

  const powerChanges$ = merge(
    increase$,
    decrease$,
    powerDecay$
  );

  powerChanges$.pipe(
    scan((acc, {change}) => {
      const newLevel = acc + change;
      return Math.max(0, Math.min(newLevel, 150));
    }, 0),
    distinctUntilChanged(),
    pairwise(),
    tap(([prevLevel, currentLevel]) => {
      labelContador.textContent = '💪 '+ currentLevel;
      fillMeter(currentLevel);
      
      if(currentLevel >= 100) {
        meter.style.backgroundColor = '#ff0000';
        meter.style.boxShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
      } else if(currentLevel >= 50) {
        meter.style.backgroundColor = '#ff9900';
        meter.style.boxShadow = '0 0 8px #ffcc00';
      } else {
        meter.style.backgroundColor = '#00ff00';
        meter.style.boxShadow = '0 0 5px #00ff88';
      }
    }),
    map(([prevLevel, currentLevel]) => ({prevLevel, currentLevel})),
    map(({prevLevel, currentLevel}) => {
      if (currentLevel > prevLevel) {
        sprite.classList.add('powerup');
      } else {
        sprite.classList.remove('powerup');
      }
      
      if (currentLevel >= 100) return 'ssj3';
      if (currentLevel >= 50) return 'ssj';
      return 'base';
    }),
    distinctUntilChanged()
  ).subscribe(transformation => {
    sprite.classList.remove('base', 'ssj', 'ssj3');
    sprite.classList.add(transformation);
  });

  merge(
    keyUp$,
    fromEvent(increaseBtn, 'mouseup'),
    fromEvent(decreaseBtn, 'mouseup')
  ).subscribe(() => {
    sprite.classList.remove('powerup');
  });
};

main();