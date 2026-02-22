import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
 try {
 const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const session = await getServerSession(authOptions);
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const searchParams = request.nextUrl.searchParams;
 const programId = searchParams.get('programId');

 if (!programId) {
 return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
 }

 const { data, error } = await supabase
 .from('daily_program_cards')
 .select('*')
 .eq('program_id', programId)
 .order('sort_order', { ascending: true });

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 return NextResponse.json(data || []);
 } catch (error) {
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}

export async function POST(request: NextRequest) {
 try {
 const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const session = await getServerSession(authOptions);
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const body = await request.json();
 const {
 program_id, title, body: cardBody, card_type, sort_order,
 coaching_tips, has_check, requires_approval, score_value,
 workout_date_start, workout_date_end, submission_start, submission_end,
 } = body;

 if (!program_id || !title) {
 return NextResponse.json({ error: 'Missing required fields (program_id, title)' }, { status: 400 });
 }

 const { data, error } = await supabase
 .from('daily_program_cards')
 .insert({
 program_id,
 title,
 body: cardBody || null,
 card_type: card_type || 'custom',
 sort_order: sort_order ?? 0,
 coaching_tips: coaching_tips || null,
 has_check: has_check ?? false,
 requires_approval: requires_approval ?? false,
 score_value: score_value ?? 0,
 workout_date_start: workout_date_start || null,
 workout_date_end: workout_date_end || null,
 submission_start: submission_start || null,
 submission_end: submission_end || null,
 })
 .select()
 .single();

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 return NextResponse.json(data);
 } catch (error) {
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}

export async function PUT(request: NextRequest) {
 try {
 const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const session = await getServerSession(authOptions);
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const body = await request.json();
 const { id, ...updateData } = body;

 if (!id) {
 return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
 }

 // Handle 'reorder' action: bulk update sort_order
 if (body.action === 'reorder' && body.card_ids) {
 const updates = (body.card_ids as string[]).map((cardId, index) =>
 supabase
 .from('daily_program_cards')
 .update({ sort_order: index, updated_at: new Date().toISOString() })
 .eq('id', cardId)
 );

 const results = await Promise.all(updates);
 const hasError = results.find(r => r.error);
 if (hasError?.error) {
 return NextResponse.json({ error: hasError.error.message }, { status: 500 });
 }

 return NextResponse.json({ success: true });
 }

 // Single card update
 const { action, card_ids, ...cleanData } = updateData;

 const { data, error } = await supabase
 .from('daily_program_cards')
 .update({
 ...cleanData,
 updated_at: new Date().toISOString(),
 })
 .eq('id', id)
 .select()
 .single();

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 return NextResponse.json(data);
 } catch (error) {
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}

export async function DELETE(request: NextRequest) {
 try {
 const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const session = await getServerSession(authOptions);
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const searchParams = request.nextUrl.searchParams;
 const cardId = searchParams.get('id');

 if (!cardId) {
 return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
 }

 // CASCADE will handle completions
 const { error } = await supabase
 .from('daily_program_cards')
 .delete()
 .eq('id', cardId);

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 return NextResponse.json({ success: true });
 } catch (error) {
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}
