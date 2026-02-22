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
 const challengeId = searchParams.get('challengeId');
 const startDate = searchParams.get('startDate');
 const endDate = searchParams.get('endDate');
 const programId = searchParams.get('id');

 // Single program fetch with full details
 if (programId) {
 const { data, error } = await supabase
 .from('challenge_daily_programs')
 .select(`
 *,
 daily_program_cards(*) ,
 daily_program_target_groups(group_id)
 `)
 .eq('id', programId)
 .single();

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 // Sort cards by sort_order
 if (data?.daily_program_cards) {
 data.daily_program_cards.sort((a: { sort_order: number }, b: { sort_order: number }) =>
 a.sort_order - b.sort_order
 );
 }

 return NextResponse.json(data);
 }

 // Date range fetch for calendar view
 if (!challengeId) {
 return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
 }

 let query = supabase
 .from('challenge_daily_programs')
 .select(`
 *,
 daily_program_cards(id, title, card_type, sort_order, has_check, requires_approval, score_value, body, coaching_tips),
 daily_program_target_groups(group_id)
 `)
 .eq('challenge_id', challengeId);

 if (startDate) {
 query = query.gte('date', startDate);
 }
 if (endDate) {
 query = query.lte('date', endDate);
 }

 query = query.order('date', { ascending: true });

 const { data, error } = await query;

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 // Sort cards within each program
 if (data) {
 for (const program of data) {
 if (program.daily_program_cards) {
 program.daily_program_cards.sort((a: { sort_order: number }, b: { sort_order: number }) =>
 a.sort_order - b.sort_order
 );
 }
 }
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
 const { challenge_id, date, title, description, status, show_on_main, target_group_ids } = body;

 if (!challenge_id || !date) {
 return NextResponse.json({ error: 'Missing required fields (challenge_id, date)' }, { status: 400 });
 }

 const { data, error } = await supabase
 .from('challenge_daily_programs')
 .insert({
 challenge_id,
 date,
 title: title || null,
 description: description || null,
 show_on_main: show_on_main ?? true,
 status: status || 'draft',
 })
 .select()
 .single();

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 // Save target groups
 if (target_group_ids && Array.isArray(target_group_ids) && target_group_ids.length > 0) {
 const inserts = target_group_ids.map((groupId: string) => ({
 program_id: data.id,
 group_id: groupId,
 }));

 const { error: targetError } = await supabase
 .from('daily_program_target_groups')
 .insert(inserts);

 if (targetError) {
 // Rollback program creation
 await supabase.from('challenge_daily_programs').delete().eq('id', data.id);
 return NextResponse.json({ error: 'Failed to save target groups' }, { status: 500 });
 }
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
 const { id, target_group_ids, ...updateData } = body;

 if (!id) {
 return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
 }

 const { data, error } = await supabase
 .from('challenge_daily_programs')
 .update({
 ...updateData,
 updated_at: new Date().toISOString(),
 })
 .eq('id', id)
 .select()
 .single();

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 // Update target groups (delete all, re-insert)
 if (target_group_ids !== undefined) {
 const { error: deleteError } = await supabase
 .from('daily_program_target_groups')
 .delete()
 .eq('program_id', id);

 if (deleteError) {
 return NextResponse.json({ error: 'Failed to update target groups' }, { status: 500 });
 }

 if (Array.isArray(target_group_ids) && target_group_ids.length > 0) {
 const inserts = target_group_ids.map((groupId: string) => ({
 program_id: id,
 group_id: groupId,
 }));

 const { error: targetError } = await supabase
 .from('daily_program_target_groups')
 .insert(inserts);

 if (targetError) {
 return NextResponse.json({ error: 'Failed to save target groups' }, { status: 500 });
 }
 }
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
 const programId = searchParams.get('id');

 if (!programId) {
 return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
 }

 // CASCADE will handle cards, target_groups, completions
 const { error } = await supabase
 .from('challenge_daily_programs')
 .delete()
 .eq('id', programId);

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 return NextResponse.json({ success: true });
 } catch (error) {
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}
