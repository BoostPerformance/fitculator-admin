// import { NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js';

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// export async function GET() {
//   try {
//     const { data: CoachData, error: CoachDataError } = await supabase
//       .from('admin_users')
//       .select('*')
//       .eq('id', 'admin_002')
//       .single();
//     if (error) {
//       throw error;
//     }

//     return NextResponse.json(response);
//   } catch (error) {
//     console.error('Error fetching Data', error);
//     return NextResponse.json(
//       {
//         error: 'failed to fetch data',
//       },
//       { status: 500 }
//     );
//   }
// }
