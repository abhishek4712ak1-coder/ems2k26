import nodemailer from "nodemailer";

const requiredEnv = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "MAIL_FROM_NAME",
  "MAIL_FROM_EMAIL",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.warn(`⚠️ Missing environment variable: ${key}`);
  }
}

// ------------------------------------------------------------
// Create Nodemailer transporter
// ------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
});

// ------------------------------------------------------------
// Verify email server configuration
// ------------------------------------------------------------

export const verifyEmailTransporter = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email transporter is ready");
    return true;
  } catch (error) {
    console.error("❌ Email transporter verification failed:");
    console.error(error.message);
    return false;
  }
};

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ------------------------------------------------------------
// Get email content according to purpose
// ------------------------------------------------------------

const getEmailContent = ({ purpose, otp, userName }) => {
  const safeName = escapeHtml(userName || "Participant");
  const safeOtp = escapeHtml(otp);

  const isRegistration =
    purpose === "register" || purpose === "registration";
  const isReset =
    purpose === "reset-password" || purpose === "forgot-password";

  if (!isRegistration && !isReset) {
    throw new Error(
      "Invalid OTP email purpose. Use 'register' or 'reset-password'."
    );
  }

  if (isRegistration) {
    return {
      subject: "🎉 Verify Your Account — ZET 2K26",
      title: "Welcome to ZET 2K26!",
      heading: "Complete Your Registration",
      message: `
        We're excited to have you join <strong>ZET 2K26</strong> —
        the ultimate college cultural fest experience at
        Shri Ram Murti Smarak College of Engineering &amp; Technology!
      `,
      instruction:
        "Use the verification code below to complete your account registration.",
      securityText:
        "If you did not try to create a ZET 2K26 account, you can safely ignore this email.",
      otp: safeOtp,
      name: safeName,
    };
  }

  // Password reset email
  return {
    subject: "🔐 Reset Your Password — ZET 2K26",
    title: "ZET 2K26 Password Reset",
    heading: "Reset Your Password",
    message: `
      We received a request to reset the password
      associated with your <strong>ZET 2K26</strong> account.
    `,
    instruction:
      "Enter the verification code below to continue resetting your password.",
    securityText:
      "If you did not request a password reset, please ignore this email and make sure your account remains secure.",
    otp: safeOtp,
    name: safeName,
  };
};

// ------------------------------------------------------------
// Generate beautiful bluish ZET 2K26 HTML email
// ------------------------------------------------------------

const createOtpEmailHtml = ({ purpose, otp, userName }) => {
  const content = getEmailContent({ purpose, otp, userName });

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${content.title}</title>

  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    td { font-family: Arial, Helvetica, sans-serif; }
  </style>
  <![endif]-->

  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .content-padding {
        padding: 28px 22px 18px !important;
      }
      .header-padding {
        padding: 32px 20px 26px !important;
      }
      .otp-code {
        font-size: 34px !important;
        letter-spacing: 6px !important;
      }
      .main-heading {
        font-size: 24px !important;
      }
      .footer-padding {
        padding: 24px 18px 30px !important;
      }
    }
  </style>
</head>

<body style="margin:0; padding:0; background-color:#060b18; font-family:Arial, Helvetica, sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

  <!-- Preheader (hidden) -->
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
    Your ZET 2K26 verification code is ready.
  </div>

  <!-- Full-width background -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#060b18;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <!-- Main email container -->
        <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px; width:100%; background-color:#0f172a; border-radius:20px; overflow:hidden; border:1px solid #1e293b; box-shadow:0 12px 40px rgba(0,0,0,0.45);">

          <!-- ========== HEADER ========== -->
          <tr>
            <td class="header-padding" align="center"
              style="padding:40px 28px 32px; background:linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #6366f1 100%);">
              
              <div style="font-size:12px; letter-spacing:3.5px; font-weight:700; color:#e0f2fe; margin-bottom:10px; text-transform:uppercase;">
                College Cultural Fest
              </div>

              <div style="font-size:42px; line-height:1; font-weight:900; color:#ffffff; letter-spacing:-1.5px;">
                ZET <span style="color:#38bdf8;">2K26</span>
              </div>

              <div style="margin-top:10px; font-size:13px; color:#bae6fd; letter-spacing:1px;">
                CREATE • COMPETE • CELEBRATE
              </div>
            </td>
          </tr>

          <!-- ========== CONTENT ========== -->
          <tr>
            <td class="content-padding" style="padding:36px 34px 22px; color:#e2e8f0;">

              <p style="margin:0 0 6px; font-size:13px; color:#7dd3fc; font-weight:700; letter-spacing:0.5px;">
                HELLO ${content.name} 👋
              </p>

              <h1 class="main-heading" style="margin:0 0 16px; font-size:26px; line-height:1.3; color:#f1f5f9; font-weight:800;">
                ${content.heading}
              </h1>

              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#94a3b8;">
                ${content.message}
              </p>

              <p style="margin:0 0 26px; font-size:15px; line-height:1.65; color:#cbd5e1;">
                ${content.instruction}
              </p>

              <!-- ========== OTP CARD ========== -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 26px;">
                <tr>
                  <td align="center"
                    style="padding:26px 18px; background-color:#0b1220; border-radius:16px; border:1px solid #1e3a5f;">
                    
                    <div style="font-size:11px; letter-spacing:2.5px; color:#7dd3fc; font-weight:700; margin-bottom:12px; text-transform:uppercase;">
                      Your Verification Code
                    </div>

                    <div class="otp-code" style="font-size:40px; letter-spacing:8px; font-weight:900; color:#38bdf8; font-family:Arial, Helvetica, sans-serif;">
                      ${content.otp}
                    </div>

                    <div style="margin-top:14px; font-size:12px; color:#64748b;">
                      Valid for <strong style="color:#bae6fd;">5 minutes</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- ========== SECURITY NOTICE ========== -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#0f1c2e; border-left:4px solid #3b82f6; border-radius:10px; padding:16px 18px;">
                    <div style="font-size:13px; line-height:1.6; color:#94a3b8;">
                      <strong style="color:#e0f2fe;">🛡️ Security Notice</strong><br>
                      ${content.securityText}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0; font-size:13px; line-height:1.6; color:#64748b; text-align:center;">
                Never share this OTP with anyone, including someone claiming to be from the ZET 2K26 team.
              </p>
            </td>
          </tr>

          <!-- ========== FOOTER ========== -->
          <tr>
            <td class="footer-padding" align="center"
              style="padding:28px 24px 32px; border-top:1px solid #1e293b; background-color:#0b1220;">

              <div style="font-size:17px; font-weight:800; color:#f1f5f9; margin-bottom:6px;">
                ZET <span style="color:#38bdf8;">2K26</span>
              </div>

              <div style="font-size:12px; color:#7dd3fc; margin-bottom:14px; letter-spacing:0.3px;">
                Your stage. Your talent. Your moment.
              </div>


              <div style="font-size:11px; color:#64748b; line-height:1.5;">
                This is an automated email. Please do not reply to this message.
              </div>
            </td>
          </tr>
        </table>

        <!-- Outside footer -->
        <div style="max-width:600px; padding:18px 12px 8px; text-align:center; font-size:11px; line-height:1.5; color:#475569;">
          © 2026 ZET 2K26 · Cultural Fest of SRMS CET Bareilly
        </div>

      </td>
    </tr>
  </table>
</body>
</html>
`;
};

// ------------------------------------------------------------
// Plain text version
// ------------------------------------------------------------

const createOtpEmailText = ({ purpose, otp, userName }) => {
  const isRegistration =
    purpose === "register" || purpose === "registration";
  const safeName = userName || "Participant";

  if (isRegistration) {
    return `
ZET 2K26 — College Cultural Fest
Shri Ram Murti Smarak College of Engineering & Technology
Bareilly – Nainital Road, Baojipura

Hello ${safeName},

Welcome to ZET 2K26!

Use the following OTP to complete your registration:

OTP: ${otp}

This OTP is valid for 5 minutes.

If you did not try to register for ZET 2K26, you can safely ignore this email.

For your security, never share this OTP with anyone.

© 2026 ZET 2K26
Your stage. Your talent. Your moment.
`;
  }

  return `
ZET 2K26 — College Cultural Fest
Shri Ram Murti Smarak College of Engineering & Technology
Bareilly – Nainital Road, Baojipura

Hello ${safeName},

We received a request to reset your ZET 2K26 account password.

Your password reset OTP is:

OTP: ${otp}

This OTP is valid for 5 minutes.

If you did not request a password reset, please ignore this email.

For your security, never share this OTP with anyone.

© 2026 ZET 2K26
Your stage. Your talent. Your moment.
`;
};

// ------------------------------------------------------------
// Send OTP Email
// ------------------------------------------------------------

export const sendOTPEmail = async ({
  to,
  otp,
  purpose,
  userName = "Participant",
}) => {
  try {
    if (!to) {
      throw new Error("Recipient email is required.");
    }

    if (!otp) {
      throw new Error("OTP is required.");
    }

    if (!purpose) {
      throw new Error("OTP purpose is required.");
    }

    const validPurposes = [
      "register",
      "registration",
      "reset-password",
      "forgot-password",
    ];

    if (!validPurposes.includes(purpose)) {
      throw new Error("Invalid OTP purpose.");
    }

    const html = createOtpEmailHtml({
      purpose,
      otp,
      userName,
    });

    const text = createOtpEmailText({
      purpose,
      otp,
      userName,
    });

    const content = getEmailContent({
      purpose,
      otp,
      userName,
    });

    const info = await transporter.sendMail({
      from: {
        name: process.env.MAIL_FROM_NAME,
        address: process.env.MAIL_FROM_EMAIL,
      },
      to,
      subject: content.subject,
      text,
      html,
      headers: {
        "X-Mailer": "ZET 2K26 Event Management System",
      },
    });

    console.log(`📧 OTP email sent successfully to ${to}`);
    console.log(`📨 Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.log(`error in sendOTPEmail ${error}`);
    throw new Error("Unable to send OTP email. Please try again later.");
  }
};

// ------------------------------------------------------------
// Registration OTP
// ------------------------------------------------------------

export const sendRegistrationOTP = async ({ to, otp, userName }) => {
  return sendOTPEmail({
    to,
    otp,
    userName,
    purpose: "register",
  });
};

// ------------------------------------------------------------
// Password Reset OTP
// ------------------------------------------------------------

export const sendPasswordResetOTP = async ({ to, otp, userName }) => {
  return sendOTPEmail({
    to,
    otp,
    userName,
    purpose: "reset-password",
  });
};

export const sendStudentVerificationEmail = async ({
  student,
  idCardPath,
  idCardName,
}) => {
  const adminEmail =
    process.env.ADMIN_EMAIL || process.env.MAIL_FROM_EMAIL;

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL is not configured.");
  }

  const rows = [
    ["Participant ID", student.pid],
    ["Name", student.name],
    ["Email", student.email],
    ["Student ID / Roll No", student.rollno],
    ["Phone", student.phone],
    ["Gender", student.gender],
    ["Accommodation", student.accomodation],
    ["College", student.college],
    ["Branch", student.branch],
    ["Year", student.year],
    ["Address", student.address],
  ];

  const detailsHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px; color:#7dd3fc; font-size:13px; width:42%; border-bottom:1px solid #1e293b;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:10px 12px; color:#e2e8f0; font-size:13px; border-bottom:1px solid #1e293b;">
            ${escapeHtml(value)}
          </td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#060b18; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#060b18; padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:640px; background:#0f172a; border:1px solid #1e293b; border-radius:16px; overflow:hidden;">
          <tr>
            <td style="padding:28px; background:linear-gradient(135deg, #1e40af, #6366f1); color:#fff;">
              <div style="font-size:12px; letter-spacing:2px; text-transform:uppercase;">ZEST Admin Verification</div>
              <h1 style="margin:8px 0 0; font-size:24px;">New student profile submitted</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px; color:#cbd5e1;">
              <p style="margin:0 0 18px; font-size:15px; line-height:1.6;">
                A student has created their ZET 2K26 profile. Please verify the details against the attached student ID card photo.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220; border-radius:12px; overflow:hidden;">
                ${detailsHtml}
              </table>
              <p style="margin:18px 0 0; font-size:13px; color:#94a3b8;">
                The student ID card image is attached to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = rows
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

  const info = await transporter.sendMail({
    from: {
      name: process.env.MAIL_FROM_NAME,
      address: process.env.MAIL_FROM_EMAIL,
    },
    to: adminEmail,
    subject: `Student verification — ${student.name} (${student.pid})`,
    text: `A new ZET 2K26 student profile needs verification.\n\n${text}\n`,
    html,
    attachments: idCardPath
      ? [
          {
            filename: idCardName || "student-id-card.jpg",
            path: idCardPath,
          },
        ]
      : [],
  });

  return {
    success: true,
    messageId: info.messageId,
  };
};

export default transporter;