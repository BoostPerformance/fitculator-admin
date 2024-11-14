import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data: meals, error: mealsError } = await supabase
    .from('Meals')
    .select('*');
  const { data: users, error: usersError } = await supabase
    .from('User')
    .select('id, name');

  if (mealsError || usersError) {
    return NextResponse.json(
      { error: mealsError?.message || usersError?.message },
      { status: 500 }
    );
  }

  if (!meals || meals.length === 0 || !users || users.length === 0) {
    return NextResponse.json({ message: 'No meals found' }, { status: 404 });
  }

  return NextResponse.json({ meals, users });
}
