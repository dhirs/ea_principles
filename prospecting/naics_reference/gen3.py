import naics
d=dict(naics.NAICS_CODES)
LEG={"333249":"Other Industrial Machinery Manufacturing","333911":"Pump and Pumping Equipment Manufacturing","333999":"All Other Miscellaneous General Purpose Machinery Manufacturing","454110":"Electronic Shopping and Mail-Order Houses"}
def q(s): return "'"+str(s).replace("'","''")+"'"
# non-2-digit codes only (2-digit sectors loaded separately)
body=[]
for c,t in d.items():
    if '-' in c or len(c)==2: continue
    body.append((c,t,"2022"))
for c,t in LEG.items(): body.append((c,t,"2017"))
B=530; n=0
for i in range(0,len(body),B):
    n+=1
    ch=body[i:i+B]
    lines="\n".join("("+q(c)+","+q(t)+","+q(y)+")," for (c,t,y) in ch)
    lines=lines.rstrip(",")
    open(f"/tmp/body_{n}.sql","w").write(lines)
print("body rows",len(body),"batches",n,[__import__('os').path.getsize(f'/tmp/body_{i+1}.sql') for i in range(n)])
