import naics
d=dict(naics.NAICS_CODES)
SECT={"11":"11","21":"21","22":"22","23":"23","31":"31-33","32":"31-33","33":"31-33","42":"42","44":"44-45","45":"44-45","48":"48-49","49":"48-49","51":"51","52":"52","53":"53","54":"54","55":"55","56":"56","61":"61","62":"62","71":"71","72":"72","81":"81","92":"92"}
RANGES={"31-33":"Manufacturing","44-45":"Retail Trade","48-49":"Transportation and Warehousing"}
LEG={"333249":"Other Industrial Machinery Manufacturing","333911":"Pump and Pumping Equipment Manufacturing","333999":"All Other Miscellaneous General Purpose Machinery Manufacturing","454110":"Electronic Shopping and Mail-Order Houses"}
def sec(c): return SECT.get(c[:2],"")
def par(c):
    L=len(c)
    if L<=2: return None
    if L==3: return sec(c)
    return c[:-1]
rows=[]
for rc,rt in RANGES.items(): rows.append((rc,2,rt,None,rc,"2022"))
for c,t in d.items():
    if '-' in c: continue
    rows.append((c,len(c),t,par(c),sec(c),"2022"))
for c,t in LEG.items(): rows.append((c,len(c),t,par(c),sec(c),"2017"))
def q(s): return "null" if s is None else "'"+str(s).replace("'","''")+"'"
COLS="naics_code,level,title,parent_code,sector_code,naics_year"
B=750; n=0
for i in range(0,len(rows),B):
    n+=1
    ch=rows[i:i+B]
    v=",".join("("+",".join([q(c),str(l),q(t),q(p),q(sc),q(y)])+")" for (c,l,t,p,sc,y) in ch)
    open(f"/tmp/nb_{n}.sql","w").write(f"INSERT INTO public.apollo_naics ({COLS}) VALUES {v} ON CONFLICT (naics_code) DO NOTHING;")
print("rows",len(rows),"batches",n,[__import__('os').path.getsize(f'/tmp/nb_{i+1}.sql') for i in range(n)])
