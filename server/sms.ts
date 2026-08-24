import { SMSLog, StoreSettings } from '../src/types/pos';

export interface SMSDispatchResult {
  success: boolean;
  logId: string;
  status: 'sent' | 'delivered' | 'failed';
  error?: string;
}

export function formatSMSMessage(template: string, params: {
  storeName: string;
  invoiceNo: string;
  customerName: string;
  total: string;
  currency: string;
  date: string;
  link: string;
}): string {
  return template
    .replace(/\[STORE NAME\]/gi, params.storeName)
    .replace(/\[INVOICE NO\]/gi, params.invoiceNo)
    .replace(/\[CUSTOMER NAME\]/gi, params.customerName)
    .replace(/\[TOTAL\]/gi, params.total)
    .replace(/\[CURRENCY\]/gi, params.currency)
    .replace(/\[DATE\]/gi, params.date)
    .replace(/\[INVOICE LINK\]/gi, params.link);
}

export async function sendSMSNotification(
  phone: string,
  message: string,
  saleId: string,
  invoiceNumber: string,
  customerName: string,
  settings: StoreSettings,
  addLogCallback: (log: SMSLog) => void,
  updateLogCallback: (id: string, updates: Partial<SMSLog>) => void
): Promise<SMSDispatchResult> {
  const logId = 'sms_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  // Create initial log
  const initialLog: SMSLog = {
    id: logId,
    saleId,
    invoiceNumber,
    recipientPhone: phone,
    customerName: customerName || 'Valued Customer',
    message,
    provider: settings.smsProvider || 'simulator',
    status: 'pending',
    sentAt: now,
    retryCount: 0,
  };

  addLogCallback(initialLog);

  // If phone is missing or invalid
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    updateLogCallback(logId, {
      status: 'failed',
      error: 'Invalid mobile number format',
    });
    return {
      success: false,
      logId,
      status: 'failed',
      error: 'Invalid mobile number format',
    };
  }

  try {
    const provider = settings.smsProvider || process.env.SMS_PROVIDER || 'simulator';

    if (provider === 'fast2sms' && (settings.smsApiKey || process.env.SMS_API_KEY)) {
      const apiKey = settings.smsApiKey || process.env.SMS_API_KEY;
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'dlt',
          sender_id: settings.smsSenderId || process.env.SMS_SENDER_ID || 'RETLSN',
          message: settings.dltTemplateId || process.env.DLT_TEMPLATE_ID,
          variables_values: `${invoiceNumber}|${message}`,
          numbers: cleanPhone.slice(-10),
        }),
      });
      const data = await res.json();
      if (data.return) {
        updateLogCallback(logId, {
          status: 'sent',
          deliveredAt: new Date().toISOString(),
        });
        return { success: true, logId, status: 'sent' };
      } else {
        throw new Error(data.message || 'Fast2SMS dispatch failed');
      }
    } else if (provider === 'twilio' && (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.slice(-10)}`);
      params.append('From', fromNumber || '+15005550006');
      params.append('Body', message);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      const data = await res.json();
      if (res.ok) {
        updateLogCallback(logId, {
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
        });
        return { success: true, logId, status: 'delivered' };
      } else {
        throw new Error(data.message || 'Twilio dispatch failed');
      }
    } else {
      // Default: High-fidelity SMS Simulator with automatic delivery transition
      // Marked as sent immediately, and simulated delivery acknowledgement
      setTimeout(() => {
        updateLogCallback(logId, {
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
        });
      }, 1200);

      updateLogCallback(logId, {
        status: 'sent',
      });

      return { success: true, logId, status: 'sent' };
    }
  } catch (err: any) {
    updateLogCallback(logId, {
      status: 'failed',
      error: err.message || 'Network / Provider error',
    });
    return {
      success: false,
      logId,
      status: 'failed',
      error: err.message,
    };
  }
}
