import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { corsHeaders } from '../_shared/cors.ts'

interface PurchaseOrderData {
  po_number: string
  supplier_name: string
  supplier_address?: string
  supplier_contact?: string
  terms_conditions?: string
  delivery_date?: string
  total_amount: number
  items: Array<{
    pr_item_id: string
    quantity: number
    unit_cost: number
    total_cost: number
  }>
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a Supabase client with the user's JWT token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Authenticated user:', user.id, user.email)

    // Create service role client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user has required role (admin or bac)
    const { data: hasAdminRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    })

    const { data: hasBacRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'bac'
    })

    console.log('User roles - admin:', hasAdminRole, 'bac:', hasBacRole)

    if (!hasAdminRole && !hasBacRole) {
      console.error('User does not have required role')
      return new Response(
        JSON.stringify({ error: 'User does not have permission to create purchase orders' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the PO data from request body
    const poData: PurchaseOrderData = await req.json()
    console.log('Creating PO with data:', { po_number: poData.po_number, supplier: poData.supplier_name })

    // Insert the purchase order using service role (bypasses RLS)
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .insert({
        po_number: poData.po_number,
        supplier_name: poData.supplier_name,
        supplier_address: poData.supplier_address,
        supplier_contact: poData.supplier_contact,
        terms_conditions: poData.terms_conditions,
        delivery_date: poData.delivery_date,
        total_amount: poData.total_amount,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single()

    if (poError) {
      console.error('Error creating PO:', poError)
      return new Response(
        JSON.stringify({ error: poError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('PO created successfully:', po.id)

    // Insert PO items
    const poItems = poData.items.map(item => ({
      po_id: po.id,
      pr_item_id: item.pr_item_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      total_cost: item.total_cost,
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('po_items')
      .insert(poItems)

    if (itemsError) {
      console.error('Error creating PO items:', itemsError)
      // Rollback PO creation
      await supabaseAdmin
        .from('purchase_orders')
        .delete()
        .eq('id', po.id)
      
      return new Response(
        JSON.stringify({ error: itemsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('PO items created successfully')

    // Update PR items status to 'ordered'
    const prItemIds = poData.items.map(item => item.pr_item_id)
    
    // Get unique PR IDs from the items
    const { data: prItems } = await supabaseAdmin
      .from('pr_items')
      .select('pr_id')
      .in('id', prItemIds)

    if (prItems && prItems.length > 0) {
      const prIds = [...new Set(prItems.map(item => item.pr_id))]
      
      // Update PR status to 'ordered'
      const { error: prUpdateError } = await supabaseAdmin
        .from('purchase_requests')
        .update({ status: 'ordered' })
        .in('id', prIds)

      if (prUpdateError) {
        console.error('Error updating PR status:', prUpdateError)
      } else {
        console.log('PR status updated to ordered')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        po_id: po.id,
        po_number: po.po_number 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
