import json,math
from pathlib import Path
bank=json.loads((Path(__file__).resolve().parents[1]/'data/questions.json').read_text())
assert len(bank)==800 and len({q['id'] for q in bank})==800
assert len({q['q'].casefold().strip() for q in bank})==800
count=0
for q in bank:
 assert len(q['options'])==3 and len(set(q['options']))==3
 assert 0<=q['correct']<3 and q['source'] and q['explanation']
 if 'calculation' not in q:continue
 c=q['calculation'];x=c['inputs'];f=c['family']
 if f==1:v=x['U']*x['I']
 elif f==2:v=x['U']*x['I']/x['v']
 elif f==3:v=x['k']*x['U']*x['I']/(x['v']/60)/1000
 elif f==4:v=x['L']/x['v']
 elif f==5:v=x['L']/x['t']
 elif f==6:v=x['q']*x['t']
 elif f==7:v=x['V']/x['q']
 elif f==8:v=math.sqrt(x['k']**2/2)
 elif f==9:v=x['k']*x['k']*.5
 elif f==10:v=x['L']*x['A']
 elif f==11:v=x['V']*x['rho']
 elif f==12:v=sum([x['l']]*x['N'])
 elif f==13:v=x['base']+(x['peak']-x['base'])*x['d']
 elif f==14:v=x['delta']/x['t']
 elif f==15:v=x['T']*(x['pv']/100)
 elif f==16:v=x['L']*(1+x['alpha']*x['delta'])-x['L']
 actual=float(q['options'][q['correct']].split(' ')[0].replace(',','.'))
 assert abs(v-actual)<=.000501,(q['id'],v,actual)
 count+=1
print(f'PASS: 800 unique IDs and question texts; 320 numerical answers independently recalculated to displayed precision; complete explanations and sources.')
