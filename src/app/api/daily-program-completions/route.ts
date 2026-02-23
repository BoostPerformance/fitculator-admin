import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
 try {
 const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 const session = await getServerSession(authOptions);
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const searchParams = request.nextUrl.searchParams;
 const challengeId = searchParams.get('challengeId');
 const status = searchParams.get('status');
 const groupBy = searchParams.get('groupBy');
 const programId = searchParams.get('programId');
 const startDate = searchParams.get('startDate');
 const endDate = searchParams.get('endDate');

 if (!challengeId) {
 return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
 }

 // If programId is provided, first get card_ids for that program
 let programCardIds: string[] | null = null;
 if (programId) {
 const { data: cards, error: cardsError } = await supabase
 .from('daily_program_cards')
 .select('id')
 .eq('program_id', programId);
 if (cardsError) {
 return NextResponse.json({ error: cardsError.message }, { status: 500 });
 }
 programCardIds = (cards || []).map((c: any) => c.id);
 if (programCardIds.length === 0) {
 return NextResponse.json(groupBy === 'program' ? [] : []);
 }
 }

 let query = supabase
 .from('daily_program_completions')
 .select(`
 *,
 users:user_id(id, name, username, profile_image_url),
 daily_program_cards:card_id(
 id, title, card_type, program_id, sort_order, has_check, requires_approval, score_value,
 workout_date_start, workout_date_end,
 challenge_daily_programs:program_id(id, date, title, status, challenge_id)
 )
 `)
 .not('daily_program_cards', 'is', null);

 if (status) {
 query = query.eq('verification_status', status);
 }

 if (programCardIds) {
 query = query.in('card_id', programCardIds);
 }

 query = query.order('completed_at', { ascending: false });

 const { data, error } = await query;

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 // Filter by challengeId on the client side (nested relation filter)
 let filtered = (data || []).filter((completion: any) => {
 const program = completion.daily_program_cards?.challenge_daily_programs;
 return program?.challenge_id === challengeId;
 });

 // Filter by date range
 if (startDate || endDate) {
 filtered = filtered.filter((completion: any) => {
 const programDate = completion.daily_program_cards?.challenge_daily_programs?.date;
 if (!programDate) return false;
 if (startDate && programDate < startDate) return false;
 if (endDate && programDate > endDate) return false;
 return true;
 });
 }

 // Group by program if requested
 if (groupBy === 'program') {
 const groupMap = new Map<string, any>();

 for (const completion of filtered) {
 const program = completion.daily_program_cards?.challenge_daily_programs;
 if (!program) continue;

 const key = program.id;
 if (!groupMap.has(key)) {
 groupMap.set(key, {
 program_id: program.id,
 program_date: program.date,
 program_title: program.title,
 program_status: program.status,
 total_submissions: 0,
 pending_count: 0,
 approved_count: 0,
 rejected_count: 0,
 auto_approved_count: 0,
 completions: [],
 });
 }

 const group = groupMap.get(key);
 group.total_submissions++;
 if (completion.verification_status === 'pending') group.pending_count++;
 else if (completion.verification_status === 'approved') group.approved_count++;
 else if (completion.verification_status === 'rejected') group.rejected_count++;
 else if (completion.verification_status === 'auto_approved') group.auto_approved_count++;
 group.completions.push(completion);
 }

 // Compute unique submitted members & cards per group
 for (const group of groupMap.values()) {
 const memberSet = new Set<string>();
 const cardSet = new Set<string>();
 for (const c of group.completions) {
 if (c.user_id) memberSet.add(c.user_id);
 if (c.card_id) cardSet.add(c.card_id);
 }
 group.unique_submitted_members = memberSet.size;
 group.cards_with_submissions = cardSet.size;
 }

 // Fetch total target members for this challenge
 const { count: totalMembers } = await supabase
 .from('challenge_participants')
 .select('*', { count: 'exact', head: true })
 .eq('challenge_id', challengeId);

 // Fetch total cards with has_check per program
 const programIds = Array.from(groupMap.keys());
 const { data: checkCards } = await supabase
 .from('daily_program_cards')
 .select('program_id')
 .in('program_id', programIds)
 .eq('has_check', true);

 const cardCountByProgram = new Map<string, number>();
 for (const card of checkCards || []) {
 cardCountByProgram.set(card.program_id, (cardCountByProgram.get(card.program_id) || 0) + 1);
 }

 for (const group of groupMap.values()) {
 group.total_target_members = totalMembers || 0;
 group.total_cards_with_check = cardCountByProgram.get(group.program_id) || 0;
 }

 // Sort by date descending
 const groups = Array.from(groupMap.values()).sort(
 (a: any, b: any) => b.program_date.localeCompare(a.program_date)
 );

 return NextResponse.json(groups);
 }

 return NextResponse.json(filtered);
 } catch (error) {
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}

export async function PUT(request: NextRequest) {
 try {
 const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 const session = await getServerSession(authOptions);
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const body = await request.json();
 const { id, verification_status, verified_by } = body;

 if (!id || !verification_status) {
 return NextResponse.json({ error: 'Missing required fields (id, verification_status)' }, { status: 400 });
 }

 if (!['approved', 'rejected'].includes(verification_status)) {
 return NextResponse.json({ error: 'Invalid status. Must be "approved" or "rejected"' }, { status: 400 });
 }

 const { data, error } = await supabase
 .from('daily_program_completions')
 .update({
 verification_status,
 verified_by: verified_by || null,
 verified_at: new Date().toISOString(),
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
