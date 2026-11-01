import { NextResponse } from 'next/server';
import { serverAuth } from '@/lib/auth/server';
import { checkAuthLimit, siteOrigin } from '@/lib/auth/request-security';
export async function GET(request:Request){
 const url=new URL(request.url);
 try{
  const limit=await checkAuthLimit(request.headers,'confirm');
  if(!limit.allowed)return new NextResponse('Too many attempts. Try again later.',{status:429,headers:{'Retry-After':String(limit.retryAfter),'Cache-Control':'no-store'}});
  const token_hash=url.searchParams.get('token_hash'),type=url.searchParams.get('type');
  if(token_hash&&token_hash.length<=2048&&(type==='signup'||type==='recovery')){
   const client=await serverAuth();const {error}=await client.auth.verifyOtp({token_hash,type});
   if(!error)return NextResponse.redirect(new URL(type==='recovery'?'/reset-password':'/today',siteOrigin(request.url)),{headers:{'Cache-Control':'no-store'}});
  }
 }catch{/* Invalid links and unavailable auth have the same public result. */}
 return NextResponse.redirect(new URL('/login?error=link',url.origin),{headers:{'Cache-Control':'no-store'}});
}
