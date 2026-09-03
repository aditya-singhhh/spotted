import { NextRequest, NextResponse } from 'next/server';
import { ensureProfile, getUserFromRequest } from '@/lib/apiAuth';
import { withTimeout } from '@/lib/requestTimeout';

// Creates the app-level profile immediately after Firebase Authentication.
// This is what enables the optional ADMIN_BOOTSTRAP_EMAIL local setup.
export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  try {
    const profile = await withTimeout(ensureProfile(decoded.uid, { phone: decoded.phone_number, email: decoded.email }));
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: 'Profile setup is temporarily unavailable.' }, { status: 503 });
  }
}
