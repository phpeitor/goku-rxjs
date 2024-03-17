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
  const divideBy = level >= 100 ? level : 100;
  const newWidth = (level / divideBy) * containerWidth;

  meter.style.width = `${newWidth}px`;
};

const main = () => {
  const { fromEvent } = rxjs;
  const { filter, map, scan, tap } = rxjs.operators;

  const begin = fromEvent(document, 'keydown');
  const end = fromEvent(document, 'keyup');
  let labelContador = document.getElementById('contador');
  
  begin.pipe(
    scan(acc => acc + 1, 0),
    tap((level) => {
      sprite.classList.add('powerup');
      fillMeter(level);
	 
	  labelContador.textContent = '💪 '+ level;
	  console.log('Power:', level); 
    }),
    map(level => powerLevels[level]),
    filter(level => level && level.next)
	
  )
  
  .subscribe(({ current, next }) => {
    console.log({ current, next });

    sprite.classList.remove(current);
    sprite.classList.add(next);
  });

  end.subscribe(() => {
    sprite.classList.remove('powerup');
  });
};

main();
