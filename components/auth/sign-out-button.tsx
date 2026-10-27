'use client';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
export function SignOutButton(){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <><button type="button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const response=await fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!response.ok)throw new Error();window.location.replace('/login');}catch{setError('Could not sign out. Please try again.');setBusy(false);}}}><LogOut size={15}/>{busy?'Signing out…':'Sign out'}</button>{error&&<p role="alert" className="form-error">{error}</p>}</>;
}
