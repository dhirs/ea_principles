import naics
d = dict(naics.NAICS_CODES)

# Canonical 20 sectors (range-aware)
SECTORS = {
 "11":("11","Agriculture, Forestry, Fishing and Hunting"),
 "21":("21","Mining, Quarrying, and Oil and Gas Extraction"),
 "22":("22","Utilities"),
 "23":("23","Construction"),
 "31":("31-33","Manufacturing"),"32":("31-33","Manufacturing"),"33":("31-33","Manufacturing"),
 "42":("42","Wholesale Trade"),
 "44":("44-45","Retail Trade"),"45":("44-45","Retail Trade"),
 "48":("48-49","Transportation and Warehousing"),"49":("48-49","Transportation and Warehousing"),
 "51":("51","Information"),
 "52":("52","Finance and Insurance"),
 "53":("53","Real Estate and Rental and Leasing"),
 "54":("54","Professional, Scientific, and Technical Services"),
 "55":("55","Management of Companies and Enterprises"),
 "56":("56","Administrative and Support and Waste Management and Remediation Services"),
 "61":("61","Educational Services"),
 "62":("62","Health Care and Social Assistance"),
 "71":("71","Arts, Entertainment, and Recreation"),
 "72":("72","Accommodation and Food Services"),
 "81":("81","Other Services (except Public Administration)"),
 "92":("92","Public Administration"),
}
# add 3 range sector rows (level 2) not in package
RANGE_SECTORS = {"31-33":"Manufacturing","44-45":"Retail Trade","48-49":"Transportation and Warehousing"}

# 4 legacy 2017 codes Apollo still returns
LEGACY = {
 "333249":"Other Industrial Machinery Manufacturing",
 "333911":"Pump and Pumping Equipment Manufacturing",
 "333999":"All Other Miscellaneous General Purpose Machinery Manufacturing",
 "454110":"Electronic Shopping and Mail-Order Houses",
}

def sector_of(code):
    f2 = code[:2]
    return SECTORS.get(f2,("",""))

def parent_of(code):
    L=len(code)
    if L<=2: return None
    if L==3:
        sc,_=sector_of(code); return sc
    return code[:-1]

rows=[]  # (code, level, title, parent, sector_code, sector_title, year)
# range sectors first
for rc,rt in RANGE_SECTORS.items():
    rows.append((rc,2,rt,None,rc,rt,"2022"))
# package codes
for code,title in d.items():
    L=len(code)
    sc,st=sector_of(code)
    rows.append((code,L,title,parent_of(code),sc,st,"2022"))
# legacy
for code,title in LEGACY.items():
    L=len(code); sc,st=sector_of(code)
    rows.append((code,L,title,parent_of(code),sc,st,"2017"))

def q(s):
    if s is None: return "null"
    return "'"+str(s).replace("'","''")+"'"

COLS="naics_code,level,title,parent_code,sector_code,sector_title,naics_year"
BATCH=500
nb=0
for i in range(0,len(rows),BATCH):
    nb+=1
    chunk=rows[i:i+BATCH]
    vals=",\n".join("("+",".join([q(c),str(lv),q(t),q(p),q(sc),q(st),q(y)])+")" for (c,lv,t,p,sc,st,y) in chunk)
    sql=f"INSERT INTO public.apollo_naics ({COLS}) VALUES\n{vals}\nON CONFLICT (naics_code) DO NOTHING;"
    open(f"/tmp/naics_batch_{nb:02d}.sql","w").write(sql)
print("total rows:",len(rows),"batches:",nb)
from collections import Counter
print("by level:",dict(sorted(Counter(r[1] for r in rows).items())))
print("legacy tagged:",sum(1 for r in rows if r[6]=='2017'))
