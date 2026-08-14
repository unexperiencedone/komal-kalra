import { issueRefund } from '@/lib/payments/refunds';
import { requireAdminForApi } from '@/lib/auth/api-guards';
import { refundSchema } from '@/lib/validation/schemas';
import { rupeesToPaise } from '@/lib/money';
import { ok, fail, fromZodError, fromUnknownError } from '@/lib/api';
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit';

/**
 * Admin refunds.
 *
 * Authorisation is re-read from the database here, not inherited from the fact
 * that the caller loaded an /admin page. A crafted POST to this endpoint from a
 * signed-in client account is the exact attack this guard exists for.
 *
 * Every call — success or failure — writes an admin_logs entry inside
 * issueRefund(), including the actor, the amount, the reason and the prior
 * state.
 */
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const auth = await requireAdminForApi();
    if (!auth.ok) return auth.response;

    const ip = clientIp(request.headers);
    const limit = rateLimit(`refund:${auth.profile.id}`, LIMITS.adminMutation.limit, LIMITS.adminMutation.windowMs);
    if (!limit.allowed) return fail('rate_limited', 'Too many requests.', 429);

    const parsed = refundSchema.safeParse(await request.json());
    if (!parsed.success) return fromZodError(parsed.error);

    const result = await issueRefund({
      paymentId: parsed.data.paymentId,
      // Rupees in the form, paise everywhere else. This is the conversion point.
      amountPaise: parsed.data.amountRupees !== undefined
        ? rupeesToPaise(parsed.data.amountRupees)
        : undefined,
      reason: parsed.data.reason,
      adminId: auth.profile.id,
      ip,
      userAgent: request.headers.get('user-agent'),
    });

    if (!result.ok) {
      return fail(result.code ?? 'refund_failed', result.message, 400);
    }
    return ok({ message: result.message, refundId: result.refundId, refundedPaise: result.refundedPaise });
  } catch (error) {
    return fromUnknownError(error, 'admin/refund');
  }
}
