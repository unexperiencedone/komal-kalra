import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Uniform API envelope, so client code has exactly one shape to handle.
 *
 * `code` is a stable machine-readable string; `message` is safe to show a user
 * verbatim. Internal detail never crosses this boundary — a Postgres error
 * string can leak schema information, so it is logged and replaced.
 */
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; code: string; message: string; fields?: Record<string, string> };
export type ApiResult<T> = ApiOk<T> | ApiErr;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, init);
}

export function fail(
  code: string,
  message: string,
  status = 400,
  fields?: Record<string, string>,
) {
  return NextResponse.json<ApiErr>({ ok: false, code, message, fields }, { status });
}

export function fromZodError(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fail('validation_error', 'Please check the highlighted fields.', 422, fields);
}

/**
 * Last-resort handler. Logs the real error server-side and returns something
 * generic, because an unexpected exception message is exactly the kind of thing
 * that leaks table names and constraint definitions.
 */
export function fromUnknownError(error: unknown, context: string) {
  console.error(`[api:${context}]`, error);
  return fail('internal_error', 'Something went wrong on our side. Please try again.', 500);
}

/** Postgres error shape as surfaced by supabase-js. */
export interface PgError { code?: string; message?: string; details?: string; hint?: string }

/**
 * Maps the database errors we deliberately raise into user-facing messages.
 * Anything unrecognised is treated as internal and hidden.
 */
export function fromPgError(error: PgError, context: string) {
  // Codes raised by our own PL/pgSQL: P0001 (raise exception) carries a message
  // that was written for humans, so it is safe to pass through.
  if (error.code === 'P0001' && error.message) {
    return fail('conflict', error.message, 409);
  }
  if (error.code === 'P0002') {
    return fail('not_found', 'That item could not be found.', 404);
  }
  if (error.code === '23P01') {
    return fail('slot_taken', 'That time was just booked. Please choose another slot.', 409);
  }
  if (error.code === '23505') {
    return fail('duplicate', 'That has already been recorded.', 409);
  }
  if (error.code === '42501') {
    return fail('forbidden', 'You do not have permission to do that.', 403);
  }
  return fromUnknownError(error, context);
}
