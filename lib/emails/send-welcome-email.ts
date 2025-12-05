import { Resend } from 'resend'

function getWelcomeEmailHTML(userName: string, siteUrl: string): string {
  const displayName = userName || 'Friend'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Merriweather:wght@300;400;700&family=Cinzel:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #F9F8F4; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F9F8F4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #FFFFFF; border-radius: 4px; box-shadow: 0 2px 8px rgba(44, 44, 44, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #E6E4DE;">
              <div style="font-family: 'Cinzel', serif; font-size: 28px; font-weight: 600; color: #2C2C2C; letter-spacing: 2px; margin-bottom: 8px;">
                BIBLE QUESTIONS
              </div>
              <div style="font-size: 14px; color: #8D7B68; font-family: 'Merriweather', serif; font-style: italic;">
                "Ask, and it will be given to you; seek, and you will find."
              </div>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="font-family: 'Merriweather', serif; font-size: 24px; font-weight: 400; color: #2C2C2C; margin: 0 0 20px 0; line-height: 1.5;">
                Welcome, ${displayName}
              </h1>
              
              <p style="font-family: 'Merriweather', serif; font-size: 16px; line-height: 1.8; color: #2C2C2C; margin: 0 0 24px 0;">
                We're delighted to have you join our community of seekers and scholars. 
                Bible Questions is designed to help you explore the Scriptures with depth, 
                understanding, and reverence.
              </p>
              
              <p style="font-family: 'Merriweather', serif; font-size: 16px; line-height: 1.8; color: #2C2C2C; margin: 0 0 24px 0;">
                Our assistant provides:
              </p>
              
              <ul style="font-family: 'Merriweather', serif; font-size: 16px; line-height: 1.8; color: #2C2C2C; margin: 0 0 24px 0; padding-left: 24px;">
                <li style="margin-bottom: 12px;">Historical context and archaeological insights</li>
                <li style="margin-bottom: 12px;">Original language analysis (Greek/Hebrew)</li>
                <li style="margin-bottom: 12px;">Theological perspectives from Jewish and Christian traditions</li>
                <li style="margin-bottom: 12px;">Word-for-word interlinear breakdowns</li>
              </ul>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${siteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #C5A059; color: #FFFFFF; text-decoration: none; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; border-radius: 4px;">
                  Begin Your Study
                </a>
              </div>
              
              <p style="font-family: 'Merriweather', serif; font-size: 14px; line-height: 1.8; color: #8D7B68; margin: 32px 0 0 0; font-style: italic; text-align: center;">
                May your journey through the Scriptures be blessed with wisdom and understanding.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #E6E4DE; text-align: center; background-color: #F9F8F4;">
              <p style="font-family: 'Inter', sans-serif; font-size: 12px; color: #8D7B68; margin: 0 0 8px 0;">
                Bible Questions
              </p>
              <p style="font-family: 'Inter', sans-serif; font-size: 11px; color: #8D7B68; margin: 0;">
                An ultra-minimalist, focused Bible study assistant
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export async function sendWelcomeEmail(email: string, userName: string | null) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured')
    return { success: false, error: 'Email service not configured' }
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.error('RESEND_FROM_EMAIL is not configured')
    return { success: false, error: 'From email not configured' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bible-questions.vercel.app'
  const displayName = userName || 'Friend'

  try {
    const htmlContent = getWelcomeEmailHTML(displayName, siteUrl)

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'Welcome to Bible Questions',
      html: htmlContent,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('Welcome email sent successfully:', data?.id)
    return { success: true, emailId: data?.id }
  } catch (error: any) {
    console.error('Error sending welcome email:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

