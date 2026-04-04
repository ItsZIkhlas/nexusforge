import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'

export const config = { api: { bodyParser: false } }

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const service = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const orgId = session.metadata?.org_id
      const planId = session.metadata?.plan_id

      if (orgId) {
        await service
          .from('organizations')
          .update({
            stripe_subscription_id: session.subscription,
            subscription_status: 'active',
            plan_id: planId ?? 'starter',
          })
          .eq('id', orgId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      const orgId = sub.metadata?.org_id

      if (orgId) {
        const planId = sub.metadata?.plan_id ?? 'starter'
        await service
          .from('organizations')
          .update({
            subscription_status: sub.status,
            plan_id: planId,
          })
          .eq('id', orgId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const orgId = sub.metadata?.org_id

      if (orgId) {
        await service
          .from('organizations')
          .update({ subscription_status: 'canceled' })
          .eq('id', orgId)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription)
        const orgId = sub.metadata?.org_id
        if (orgId) {
          await service
            .from('organizations')
            .update({ subscription_status: 'past_due' })
            .eq('id', orgId)
        }
      }
      break
    }
  }

  return Response.json({ received: true })
}
