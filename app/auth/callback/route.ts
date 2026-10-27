import { NextResponse } from 'next/server';
import { serverAuth } from '@/lib/auth/server';
import { checkAuthLimit, siteOrigin } from '@/lib/auth/request-security';
export async function GET(request:Request){
 const url=new URL(request.url);
 try{
  const limit=await checkAuthLimit(request.headers,'callback');
  if(!limit.allowed)return new NextResponse('Too many attempts. Try again later.',{status:429,headers:{'Retry-After':String(limit.retryAfter),'Cache-Control':'no-store'}});
  const code=url.searchParams.get('code');
  if(code&&code.length<=2048){const client=await serverAuth();const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(url.searchParams.get('next')==='/reset-password'?'/reset-password':'/today',siteOrigin(request.url)),{headers:{'Cache-Control':'no-store'}});}
 }catch{/* Fail closed without exposing provider details. */}
 return NextResponse.redirect(new URL('/login?error=link',url.origin),{headers:{'Cache-Control':'no-store'}});
}
