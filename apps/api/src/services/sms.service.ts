// =============================================================================
// @sms/api/src/services/sms.service.ts - SMS gateway abstraction (Sparrow SMS)
// Abstracted so it can be swapped later. In dev mode (SMS_MOCK_MODE=true),
// OTPs are logged to console instead of being sent.
// =============================================================================
import { env } from "@config/env";
import { logSms } from "@utils/logger";

export interface SmsProvider {
  send(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Sparrow SMS provider (Nepal). Real implementation hits Sparrow API.
 */
class SparrowSmsProvider implements SmsProvider {
  async send(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // TODO: Integrate actual Sparrow SMS HTTP API here.
      // Example: POST https://api.sparrowsms.com/v2/sms/ with API key, sender, to, text
      const res = await fetch("https://api.sparrowsms.com/v2/sms/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.SPARROW_SMS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender_id: env.SPARROW_SMS_SENDER_ID,
          to,
          text: body,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Sparrow SMS HTTP ${res.status}: ${text}`);
      }
      const data = (await res.json()) as { message_id?: string };
      return { success: true, messageId: data.message_id };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}

/**
 * Mock provider for development — logs OTP to console.
 */
class MockSmsProvider implements SmsProvider {
  async send(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`[MOCK SMS] to=${to} body="${body}"`);
    return { success: true, messageId: `mock-${Date.now()}` };
  }
}

const provider: SmsProvider = env.SMS_MOCK_MODE ? new MockSmsProvider() : new SparrowSmsProvider();

export async function sendSms(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const result = await provider.send(to, body);
  logSms(to, body, result.success, result.messageId, result.error);
  return result;
}

export default { sendSms };
