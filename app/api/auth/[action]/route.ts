import { NextResponse } from 'next/server';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { serverAuth, authConfigured } from '@/lib/auth/server';
import { checkAuthLimit, siteOrigin } from '@/lib/auth/request-security';
import { validateAuthInput, safeNext, isSameOrigin, type AuthAction } from '@/lib/auth/validation';
export const runtime = 'nodejs';
const json = (body: object, status = 200, extra: Record<string,string> = {}) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
 try {
  const { action: rawAction } = await params;
  if (!['login','signup','forgot','reset','resend','logout'].includes(rawAction)) return json({message:'Not found.'},404);
  const action = rawAction as AuthAction;
  const origin = siteOrigin(request.url);
  if (!isSameOrigin(request.headers.get('origin'),origin)) return json({message:'This request could not be verified. Refresh the page and try again.'},403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({message:'Expected a JSON request.'},415);
  // Bound the stream, rather than trusting a user-controlled Content-Length header.
  const reader=request.body?.getReader();let text='';let bytes=0;const decoder=new TextDecoder();
  if(reader) { while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>8192){await reader.cancel();return json({message:'Request too large.'},413);}text+=decoder.decode(value,{stream:true});}text+=decoder.decode(); }
  let input: Record<string,unknown>;
  try { input=JSON.parse(text); if(!input||typeof input!=='object'||Array.isArray(input))throw new Error(); } catch { return json({message:'Invalid request.'},400); }
  const {email,password,name,errors}=validateAuthInput(action,input);
  const limit=await checkAuthLimit(request.headers,action,email || undefined);
  if(!limit.allowed)return json({message:`Too many attempts. Try again in ${Math.ceil(limit.retryAfter/60)} minute(s).`},429,{'Retry-After':String(limit.retryAfter)});
  if(Object.keys(errors).length)return json({message:'Check the highlighted fields.',errors},400);
  if(!authConfigured())return json({message:'Account access is not available yet. Please try again later.'},503);
  const client=await serverAuth();
  if(action==='logout'){
   const {error}=await client.auth.signOut({scope:'local'});
   if(error)return json({message:'Could not sign out. Please try again.'},503);
   return json({redirect:'/login'});
  }
  if(action==='login'){
   const {data,error}=await client.auth.signInWithPassword({email,password});
   if(error||!data.user?.email_confirmed_at){if(data.session)await client.auth.signOut({scope:'local'});return json({message:'Unable to log in. Check your email and password, and make sure your email is verified.'},401);}
   return json({redirect:safeNext(input.next)});
  }
  if(action==='signup'){
   const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:`${origin}/auth/callback`}});
   // Confirmation must be enabled in Supabase. Never grant access to an unverified account.
   if(data.session)await client.auth.signOut({scope:'local'});
   if(error && !['user_already_exists','email_exists'].includes(error.code ?? ''))return json({message:'Unable to create an account right now. Please try again later.'},error.status===429?429:503);
   return json({message:'Check your email for the next step.'});
  }
  if(action==='forgot'){
   const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${origin}/auth/callback?next=/reset-password`});
   if(error)return json({message:'Unable to send a reset link right now. Please try again later.'},error.status===429?429:503);
   return json({message:'If an account exists, a reset link will be sent.'});
  }
  if(action==='resend'){
   await client.auth.resend({type:'signup',email,options:{emailRedirectTo:`${origin}/auth/callback`}});
   return json({message:'If verification is needed, a new link will be sent.'});
  }
  const {data:userData,error:identityError}=await client.auth.getUser();
  if(identityError||!userData.user?.email_confirmed_at)return json({message:'Your session has expired. Request a new password reset link.'},401);
  const resetLimit=await consumeRateLimit(`auth:password:${userData.user.id}`,10,900);
  if(!resetLimit.allowed)return json({message:'Too many password changes. Please try again later.'},429,{'Retry-After':String(resetLimit.retryAfter)});
  const {error}=await client.auth.updateUser({password});
  if(error)return json({message:'Could not update your password. Choose a different passphrase or request a new reset link.'},400);
  await client.auth.signOut({scope:'global'});
  return json({redirect:'/login'});
 } catch {return json({message:'Account access is temporarily unavailable. Please try again shortly.'},503);}
}
