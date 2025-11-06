import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, Authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Extract user ID from JWT (Edge Functions verify JWT by default)
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let requesterId: string | null = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      requesterId = payload.sub as string;
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: requesterProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, barangay_id')
      .eq('id', requesterId!)
      .single();

    if (profileError || !requesterProfile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user ID to delete from the request body
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the target user's profile
    const { data: targetProfile, error: targetError } = await supabaseClient
      .from('profiles')
      .select('role, barangay_id')
      .eq('id', userId)
      .single();

    if (targetError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Permission checks
    let canDelete = false;

    if (requesterProfile.role === 'main_admin') {
      // Main admin can delete SK chairmen and kagawads
      if (targetProfile.role === 'sk_chairman' || targetProfile.role === 'kagawad') {
        canDelete = true;
      }
    } else if (requesterProfile.role === 'sk_chairman') {
      // SK chairman can delete kagawads in their barangay
      if (targetProfile.role === 'kagawad' && 
          targetProfile.barangay_id === requesterProfile.barangay_id) {
        canDelete = true;
      }
    }

    if (!canDelete) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to delete this user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent deleting yourself
    if (userId === requesterId) {
      return new Response(
        JSON.stringify({ error: 'You cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, clean up related records before deleting the user
    // Use admin client to bypass RLS and satisfy FK constraints
    const admin = supabaseAdmin;
    const reassignTo = requesterId!;

    // Reassign ownership fields to the requester (avoids NOT NULL and FK issues)
    const updates = [
      admin.from('events').update({ created_by: reassignTo }).eq('created_by', userId),
      admin.from('projects').update({ created_by: reassignTo }).eq('created_by', userId),
      admin.from('documents').update({ created_by: reassignTo }).eq('created_by', userId),
      admin.from('budget_transactions').update({ created_by: reassignTo }).eq('created_by', userId),
      admin.from('survey_insights').update({ created_by: reassignTo }).eq('created_by', userId),
      admin.from('slideshow_images').update({ created_by: reassignTo }).eq('created_by', userId),
      admin.from('homepage_settings').update({ updated_by: reassignTo }).eq('updated_by', userId),
    ];
    const results = await Promise.all(updates);
    for (const r of results) {
      if ((r as any).error) {
        console.error('Cleanup update error:', (r as any).error);
      }
    }

    // Delete the profile explicitly (if FK blocks cascade)
    const { error: profileDelErr } = await admin.from('profiles').delete().eq('id', userId);
    if (profileDelErr) {
      console.warn('Profile delete warning (will continue):', profileDelErr.message);
    }

    // Log the audit trail before deletion (uses requester auth, passes RLS)
    await supabaseClient.from('audit_logs').insert({
      user_id: requesterId!,
      action: 'user_delete',
      table_name: 'profiles',
      record_id: userId,
      barangay_id: targetProfile.barangay_id,
      details: { 
        deleted_role: targetProfile.role,
        deleted_by_role: requesterProfile.role
      },
    });

    // Now delete the user from auth using admin client
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
