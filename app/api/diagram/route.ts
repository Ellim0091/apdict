const cache = new Map<string,{until:number;bytes:Uint8Array}>();
const pending = new Map<string,Promise<Uint8Array>>();
let active = 0;
async function load(cid:string) {
  const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?record_type=2d&image_size=600x450`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/png')) throw new Error('Structure image unavailable');
  if (Number(response.headers.get('content-length')) > 2000000) throw new Error('Structure image too large');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > 2000000 || ![137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value)) throw new Error('Invalid structure image');
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  cache.set(cid,{until:Date.now()+3600000,bytes});
  return bytes;
}
export async function GET(request:Request) {
  const cid = new URL(request.url).searchParams.get('cid') ?? '';
  if (!/^[1-9]\d{0,9}$/.test(cid)) return Response.json({error:'A valid compound ID is required.'},{status:400});
  try {
    const cached = cache.get(cid);
    let bytes: Uint8Array;
    if (cached && cached.until > Date.now()) bytes = cached.bytes;
    else {
      if(cached) cache.delete(cid);
      let task = pending.get(cid);
      if(!task) {
        if(active>=3) return Response.json({error:'Image service busy. Please retry.'},{status:429,headers:{'Retry-After':'1'}});
        active++;
        task=load(cid).finally(()=>{active--;pending.delete(cid);});
        pending.set(cid,task);
      }
      bytes=await task;
    }
    return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
  } catch {return Response.json({error:'Structure diagram unavailable. Please retry.'},{status:502});}
}
