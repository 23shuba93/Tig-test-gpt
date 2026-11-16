"""Build the offline bank. Python standard library only. Run from this directory."""
import json, math, hashlib
from pathlib import Path
root=Path(__file__).parent
bank=[]
for line in (root/'data/theory.txt').read_text().splitlines():
    if not line: continue
    if line.startswith('# '):
        topic,source=line[2:].split('|'); continue
    q,a,b,c,e=line.split('|')
    bank.append(dict(id=f'T{len(bank)+1:04}',kind='theory',topic=topic,q=q,options=[a,b,c],correct=0,explanation=e,source=source,checked='2026-11-16'))
assert len(bank)==480

def fmt(x):
    return f'{x:.3f}'.rstrip('0').rstrip('.').replace('.',',')

def add(family,n,topic,q,value,unit,explanation,formula,inputs):
    # Distinct rounded distractors; answers all share precision and units.
    candidates=[value,value*1.5,value*.5]
    vals=[round(v,3) for v in candidates]
    assert len(set(vals))==3
    bank.append(dict(id=f'C{family:02}{n:02}',kind='calculation',topic=topic,q=q,
        options=[f'{fmt(v)} {unit}' for v in vals],correct=0,
        explanation=explanation+' Учебная модель: результат не назначает производственный режим.',
        source='Расчёт по явно заданной формуле: '+formula,checked='2026-11-16',
        calculation=dict(family=family,inputs=inputs,expected=round(value,3),unit=unit)))
for n in range(1,21):
    I=50+5*n;U=10+n%5
    add(1,n,'Расчёты: мощность',f'При постоянных U = {U} В и I = {I} А вычислите мощность дуги P = UI.',U*I,'Вт',f'P = {U} × {I} = {U*I} Вт. Ватт — джоуль в секунду.','P = UI',dict(U=U,I=I))
    v=2+n*.15
    add(2,n,'Расчёты: энергия дуги',f'Учебный режим: U = 12 В, I = {I} А, v = {fmt(v)} мм/с. Найдите энергию дуги E = UI/v в Дж/мм без учёта КПД.',12*I/v,'Дж/мм',f'E = 12 × {I} / {fmt(v)} = {fmt(12*I/v)} Дж/мм.','E = UI/v',dict(U=12,I=I,v=v))
    speed=110+7*n;k=.6
    val=k*12*I*60/(1000*speed)
    add(3,n,'Расчёты: эффективное тепло',f'Для учебной задачи приняты η = 0,6; U = 12 В; I = {I} А; v = {speed} мм/мин. Найдите Q = ηUI·60/(1000v) в кДж/мм.',val,'кДж/мм',f'Q = 0,6 × 12 × {I} × 60 / (1000 × {speed}) = {fmt(val)} кДж/мм. Коэффициент 0,6 задан условием, не универсален.','Q = ηUI·60/(1000v)',dict(k=k,U=12,I=I,v=speed))
    L=100+20*n;v=100+n*5
    add(4,n,'Расчёты: время сварки',f'Длина шва {L} мм, постоянная скорость {v} мм/мин. Найдите время горения дуги t = L/v без пауз.',L/v,'мин',f't = {L} / {v} = {fmt(L/v)} мин. Подготовка и паузы здесь не учитываются.','t = L/v',dict(L=L,v=v))
    L=120+30*n;t=2+n%4
    add(5,n,'Расчёты: скорость',f'Шов длиной {L} мм выполнен за {t} мин непрерывного движения. Найдите среднюю скорость v = L/t.',L/t,'мм/мин',f'v = {L} / {t} = {fmt(L/t)} мм/мин.','v = L/t',dict(L=L,t=t))
    flow=6+n%7;t=2+n*.5
    add(6,n,'Расчёты: объём газа',f'Постоянный расход газа {flow} л/мин в течение {fmt(t)} мин. Найдите объём V = qt; продувки уже входят в это время.',flow*t,'л',f'V = {flow} × {fmt(t)} = {fmt(flow*t)} л.','V = qt',dict(q=flow,t=t))
    volume=200+50*n;flow=5+n%6
    add(7,n,'Расчёты: запас газа',f'Доступно {volume} л газа, приведённых к условиям расходомера. Расход {flow} л/мин. Найдите t = V/q без потерь и резерва.',volume/flow,'мин',f't = {volume} / {flow} = {fmt(volume/flow)} мин. Реальный запас требует учёта резерва и утечек.','t = V/q',dict(V=volume,q=flow))
    leg=2+n*.25
    add(8,n,'Расчёты: высота углового шва',f'Идеальное сечение углового шва — прямоугольный равнобедренный треугольник с катетом k = {fmt(leg)} мм. Без учёта проплавления и выпуклости найдите высоту a = k/√2.',leg/math.sqrt(2),'мм',f'a = {fmt(leg)} / √2 = {fmt(leg/math.sqrt(2))} мм. Геометрическая модель не заменяет расчёт по нормам.','a = k/√2',dict(k=leg))
    leg=2+n*.3
    add(9,n,'Расчёты: площадь шва',f'Для идеального равнокатетного прямоугольного треугольного шва k = {fmt(leg)} мм. Найдите площадь A = k²/2, без усиления и проплавления.',leg**2/2,'мм²',f'A = {fmt(leg)}² / 2 = {fmt(leg**2/2)} мм².','A = k²/2',dict(k=leg))
    A=8+n;L=200+n*20
    add(10,n,'Расчёты: объём наплавки',f'Условно постоянная площадь наплавленного сечения A = {A} мм², длина L = {L} мм. Найдите объём V = AL.',A*L,'мм³',f'V = {A} × {L} = {A*L} мм³.','V = AL',dict(A=A,L=L))
    V=1+n*.5;rho=7.85
    add(11,n,'Расчёты: масса металла',f'Объём стального наплавленного металла {fmt(V)} см³. В задаче плотность принята 7,85 г/см³. Найдите массу m = ρV без потерь.',rho*V,'г',f'm = 7,85 × {fmt(V)} = {fmt(rho*V)} г. Плотность задана, технологические потери не включены.','m = ρV',dict(rho=rho,V=V))
    N=2+n;l=20+n*2
    add(12,n,'Расчёты: длина участков',f'На одной стороне выполнено {N} отдельных участков по {l} мм. Найдите общую длину металла швов L = Nl, без промежутков.',N*l,'мм',f'L = {N} × {l} = {N*l} мм. Промежутки не входят в длину выполненных участков.','L = Nl',dict(N=N,l=l))
    peak=100+5*n;base=20+n;d=.4
    mean=peak*d+base*(1-d)
    add(13,n,'Расчёты: импульсный ток',f'Идеальные прямоугольные импульсы: пик {peak} А занимает 40% периода, база {base} А — 60%. Найдите средний ток Iср = 0,4Iп + 0,6Iб.',mean,'А',f'Iср = 0,4 × {peak} + 0,6 × {base} = {fmt(mean)} А. Это средний, а не действующий ток.','Iср = dIп + (1−d)Iб',dict(peak=peak,base=base,d=d))
    t=5+n
    add(14,n,'Расчёты: охлаждение',f'Точка охлаждается от 800 до 500 °C за {t} с. Найдите модуль средней скорости w = (800−500)/t. Мгновенная скорость может отличаться.',300/t,'°C/с',f'w = 300 / {t} = {fmt(300/t)} °C/с. Это средняя скорость на заданном интервале.','w = ΔT/t',dict(delta=300,t=t))
    period=10;pv=20+2*n
    add(15,n,'Расчёты: ПВ',f'В учебной задаче ПВ = {pv}% при указанном паспортном токе и цикл равен 10 мин. Какое время нагрузки допускается в этом цикле по t = ПВ·T/100?',pv*period/100,'мин',f't = {pv} × 10 / 100 = {fmt(pv*period/100)} мин. ПВ относится к заданному току и паспортным условиям.','t = ПВ·T/100',dict(pv=pv,T=period))
    L=500+50*n;alpha=12e-6;dt=100
    val=alpha*L*dt
    add(16,n,'Расчёты: свободное расширение',f'Свободный стержень длиной {L} мм равномерно нагрет на 100 °C. В задаче α = 12·10⁻⁶ 1/°C, коэффициент постоянен. Найдите ΔL = αLΔT без закрепления и фазовых превращений.',val,'мм',f'ΔL = 12·10⁻⁶ × {L} × 100 = {fmt(val)} мм. Эта модель не вычисляет остаточные деформации сварки.','ΔL = αLΔT',dict(alpha=alpha,L=L,delta=dt))
assert len(bank)==800
assert len({q['q'] for q in bank})==800
assert len({q['id'] for q in bank})==800
assert all(len(set(q['options']))==3 and q['explanation'] and q['source'] for q in bank)
content=json.dumps(bank,ensure_ascii=False,separators=(',',':'))
(root/'questions.js').write_text('window.QUESTION_BANK = '+content+';\n')
(root/'data/questions.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2))
print('Built',len(bank),'questions:',len([q for q in bank if q['kind']=='theory']),'theory/scenarios, 320 calculations across 16 families')
print('SHA256:',hashlib.sha256(content.encode()).hexdigest())
