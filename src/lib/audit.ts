import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Audit log.
 *
 * Written with the service-role key, which bypasses RLS — and there are no
 * INSERT/UPDATE/DELETE policies on admin_logs for anyone. The result is a log
 * that an admin can read but cannot alter from their own session.
 *
 * Never throws: an audit failure must not roll back the operation it describes.
 * A refund that succeeded but failed to log is bad; a refund that was reversed
 * because logging failed is worse.
 */
export async function writeAdminLog(entry: {
  adminId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}) {
  try {
    const admin = createAdminClient();
    await admin.from('admin_logs').insert({
      admin_id: entry.adminId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? {},
      ip_address: entry.ip ?? null,
      user_agent: entry.userAgent?.slice(0, 500) ?? null,
    });
  } catch (error) {
    console.error('[audit] failed to write log entry', entry.action, error);
  }
}
