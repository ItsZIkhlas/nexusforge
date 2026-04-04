import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe, PLANS } from '@/lib/stripe'

export async function POST(request) {
  const { planId, trial = false } = await request.json()

  const plan = PLANS[planId]
  if (!plan) return Response.json({ error: 'Invalid plan' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: org } = await service
    .from('organizations')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  // Reuse existing Stripe customer if they have one
  let customerId = org.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: org.name,
      metadata: { org_id: org.id, user_id: user.id },
    })
    customerId = customer.id

    await service
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', org.id)
  }

  if (!plan.priceId) {
    return Response.json(
      { error: `STRIPE_PRICE_${planId.toUpperCase()} is not set in your environment variables.` },
      { status: 500 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?subscribed=1`,
      cancel_url: `${appUrl}/settings`,
      metadata: { org_id: org.id, plan_id: planId },
      subscription_data: {
        metadata: { org_id: org.id, plan_id: planId },
        ...(planId === 'starter' && trial ? { trial_period_days: 14 } : {}),
      },
    })

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
