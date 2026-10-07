const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const sgMail = require('@sendgrid/mail')

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY')

// Must be a Single Sender you verified in SendGrid, or an address on a domain you authenticated there.
const FROM_EMAIL = 'your-verified-sender@example.com'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

exports.sendPlantsCsvEmail = onCall({ secrets: [SENDGRID_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to email the plant list.')
  }

  const { to, csv } = request.data || {}

  if (typeof to !== 'string' || !EMAIL_RE.test(to)) {
    throw new HttpsError('invalid-argument', 'A valid recipient email address is required.')
  }
  if (typeof csv !== 'string' || !csv.trim()) {
    throw new HttpsError('invalid-argument', 'CSV content is required.')
  }

  sgMail.setApiKey(SENDGRID_API_KEY.value())

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: 'Your GirtByGreen plant list export',
      text: 'Attached is the plant list you exported from GirtByGreen.',
      attachments: [
        {
          content: Buffer.from(csv, 'utf-8').toString('base64'),
          filename: 'plants.csv',
          type: 'text/csv',
          disposition: 'attachment',
        },
      ],
    })
  } catch (err) {
    console.error('SendGrid send failed', err?.response?.body || err)
    throw new HttpsError('internal', 'Failed to send email.')
  }

  return { success: true }
})
