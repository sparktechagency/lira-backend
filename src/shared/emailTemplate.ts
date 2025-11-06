import { IBlockAccount, IContact, ICreateAccount, ICreateContest, IHelpContact, IHelpReplay, IResetPassword, IResetPasswordByEmail } from '../types/emailTemplate';

const createAccount = (values: ICreateAccount) => {
  const data = {
    to: values.email,
    subject: 'Verify your account',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; border: 1px solid #e1e1e1;">
        <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 30px; width: 150px;" />
        <h2 style="color: #004721; font-size: 30px; font-weight: 700; margin-bottom: 20px;">Dear ${values.name},</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 30px; font-weight: 400;">We received a request to access your account. To proceed, please use the one-time verification code provided below:</p>
        
        <div style="background-color: #004721; width: 150px; padding: 20px; text-align: center; border-radius: 8px; color: #fff; font-size: 36px; letter-spacing: 4px; margin: 25px auto;">
            ${values.otp}
        </div>
        
        <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 30px; font-weight: 400;">Please note, this code will expire in 3 minutes for security purposes.</p>
        
        <p style="color: #777; font-size: 14px; line-height: 1.5; margin-bottom: 30px; font-weight: 400;">If you did not initiate this request, please disregard this email. For further assistance, feel free to contact our support team.</p>
        
        <p style="color: #777; font-size: 14px; line-height: 1.5; font-weight: 400;">Thank you for choosing our services.</p>
        
        <footer style="color: #aaa; font-size: 12px; margin-top: 40px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Lira. All rights reserved.</p>
        </footer>
    </div>
</body>`,
  };
  return data;
};
const contact = (values: IContact) => {
  const data = {
    to: values.email,
    subject: 'We’ve Received Your Message – Thank You!',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">      
      <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <img src="https://res.cloudinary.com/ddhhyc6mr/image/upload/v1742293522/buzzy-box-logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
          <h2 style="color: #277E16; font-size: 24px; margin-bottom: 20px; text-align: center;">Thank You for Contacting Us, ${values.name}!</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5; text-align: center;">
              We have received your message and our team will get back to you as soon as possible.
          </p>
          
          <div style="padding: 15px; background-color: #f4f4f4; border-radius: 8px; margin: 20px 0;">
              <p style="color: #333; font-size: 16px; font-weight: bold;">Your Message Details:</p>
              <p><strong>Name:</strong> ${values.name}</p>
              <p><strong>Email:</strong> ${values.email}</p>
              <p><strong>Subject:</strong> ${values.subject}</p>
              <br/>
              <p><strong>Message:</strong> ${values.message}</p>
          </div>

          <p style="color: #555; font-size: 14px; text-align: center;">
              If your inquiry is urgent, feel free to reach out to us directly at 
              <a href="mailto:support@yourdomain.com" style="color: #277E16; text-decoration: none;">support@yourdomain.com</a>.
          </p>

          <p style="color: #555; font-size: 14px; text-align: center; margin-top: 20px;">
              Best Regards, <br/>
              The [Your Company Name] Team
          </p>
      </div>
  </body>`,
  };
  return data;
};
const resetPassword = (values: IResetPassword) => {
  const data = {
    to: values.email,
    subject: 'Reset your password',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 30px; width: 150px;" />

        <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px; text-align: center;">Your single-use verification code is:</p>
        
        <div style="background-color: #277E16; width: 140px; padding: 15px; text-align: center; border-radius: 8px; color: #fff; font-size: 30px; letter-spacing: 3px; margin: 20px auto;">
            ${values.otp}
        </div>
        
        <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px; text-align: center;">This code is valid for 3 minutes. Please use it within the given time frame to complete your request.</p>

        <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px; text-align: center;">If you did not request this code, you can safely ignore this email. It's possible that someone else entered your email address by mistake.</p>
        
        <footer style="margin-top: 40px; color: #aaa; font-size: 12px; text-align: center;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Lira. All rights reserved.</p>
        </footer>
    </div>
</body>
`,
  };
  return data;
};
const resetPasswordByUrl = (values: IResetPasswordByEmail) => {
  const data = {
    to: values.email,
    subject: 'Reset Your Password',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
      <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${values.resetUrl}" target="_blank" style="display: inline-block; background-color: #277E16; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 18px; margin: 20px auto;">Reset Password</a>
          <p style="color: #555; font-size: 16px; line-height: 1.5; margin-top: 20px;">If you didn’t request this, you can ignore this email.</p>
          <p style="color: #b9b4b4; font-size: 14px;">This link will expire in 10 minutes.</p>
        </div>
      </div>
    </body>`,
  };
  return data;
};

const contactFormTemplate = (values: IHelpContact) => {
  const data = {
    to: values.email,
    subject: 'Thank you for reaching out to us',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hello ${values.name},</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Thank you for reaching out to us. We have received your message:</p>
            <div style="background-color: #f1f1f1; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;">
                <p style="color: #555; font-size: 16px; line-height: 1.5;">"${values.message}"</p>
            </div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">We will get back to you as soon as possible. Below are the details you provided:</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 10px;">Email: ${values.email}</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 10px;">Phone: ${values.phone}</p>
            <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">If you need immediate assistance, please feel free to contact us directly at our support number.</p>
        </div>
    </div>
</body>`,
  };
  return data;
};
const helpReplyTemplate = (values: IHelpReplay, adminMessage: string) => {
  const data = {
    to: values.email,
    subject: 'Response to Your Help Request',
    html: `<body style="font-family: 'Roboto', sans-serif; background-color: #f3f3f3; margin: 0; padding: 0; color: #333;">
  <div style="max-width: 650px; margin: 40px auto; background-color: #fff; border-radius: 8px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1); padding: 25px; color: #333;">
    <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width: 150px;" />
    
    <div style="text-align: left; padding: 0 20px;">
      <p style="font-size: 18px; color: #555; line-height: 1.6; margin-bottom: 15px;">Hello ${values.name},</p>
      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 20px;">Thank you for reaching out! We’ve received your message and our team is working on it. Below are the details:</p>

      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196F3;">
        <p style="font-size: 16px; color: #333; font-weight: bold; margin-bottom: 10px;">Your Message:</p>
        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">"${values.message}"</p>
      </div>

      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #388e3c;">
        <p style="font-size: 16px; color: #333; font-weight: bold; margin-bottom: 10px;">Our Response:</p>
        <p style="font-size: 16px; color: #388e3c; line-height: 1.6;">"${adminMessage}"</p>
      </div>

      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 20px;">If you have further questions or need additional assistance, feel free to reach out. We're here to help.</p>
      
      <div style="border-top: 1px solid #f1f1f1; padding-top: 20px; text-align: center;">
        <p style="font-size: 14px; color: #888;">Best regards,</p>
        <p style="font-size: 16px; font-weight: bold; color: #333;">Support Team</p>
        <p style="font-size: 14px; color: #888;">${new Date().getFullYear()} Lira | <a href="https://www.companywebsite.com" style="color: #2196F3; text-decoration: none;">www.companywebsite.com</a></p>
      </div>
    </div>
  </div>
</body>`,
  };
  return data;
};
const blockAccountTemplate = (values: IBlockAccount) => {
  const data = {
    to: values.email,
    subject: 'Account Blocked Notification',
    html: `<body style="font-family: 'Roboto', sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; color: #333;">
  <div style="max-width: 650px; margin: 40px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); padding: 35px; color: #333;">
    <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 30px; width: 160px;" />
    
    <div style="text-align: left; padding: 0 20px;">
      <p style="font-size: 20px; color: #444; line-height: 1.6; margin-bottom: 20px;">Dear ${values.name},</p>
      <p style="font-size: 16px; color: #555; line-height: 1.8; margin-bottom: 25px;">We regret to inform you that your account has been blocked due to a violation of our Terms of Service. Please find the details below:</p>
      
      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 25px;">If you believe this action was taken in error or wish to appeal the decision, please do not hesitate to contact us. Our team is happy to assist you further.</p>
      
      <div style="border-top: 2px solid #f1f1f1; padding-top: 30px; text-align: center;">
        <p style="font-size: 14px; color: #888; margin: 0;">Best regards,</p>
        <p style="font-size: 16px; font-weight: bold; color: #333;">Support Team</p>
        <p style="font-size: 14px; color: #888; margin-top: 5px;">Lira | <a href="https://www.companywebsite.com" style="color: #2196F3; text-decoration: none;">www.companywebsite.com</a></p>
      </div>
    </div>
  </div>
</body>`,
  };
  return data;
};
const createNewContest = (values: ICreateContest) => {
  const data = {
    to: values.email,
    subject: 'New Contest Created Notification',
    html: `<body style="font-family: 'Roboto', sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; color: #333;">
  <div style="max-width: 650px; margin: 40px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); padding: 35px; color: #333;">
    <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 30px; width: 160px;" />
    
    <div style="text-align: left; padding: 0 20px;">
      <p style="font-size: 20px; color: #444; line-height: 1.6; margin-bottom: 20px;">Hello ${values.userName},</p>
      <p style="font-size: 16px; color: #555; line-height: 1.8; margin-bottom: 25px;">We are excited to inform you that a new contest has been successfully added to the platform. Below are the details:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <tr style="border-bottom: 1px solid #f1f1f1;">
          <td style="font-size: 16px; color: #444; padding: 8px; font-weight: bold;">Contest Name:</td>
          <td style="font-size: 16px; color: #555; padding: 8px;">${values.contestName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f1f1;">
          <td style="font-size: 16px; color: #444; padding: 8px; font-weight: bold;">Category:</td>
          <td style="font-size: 16px; color: #555; padding: 8px;">${values.category}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f1f1;">
          <td style="font-size: 16px; color: #444; padding: 8px; font-weight: bold;">Start Date:</td>
          <td style="font-size: 16px; color: #555; padding: 8px;">${values.startDate}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f1f1;">
          <td style="font-size: 16px; color: #444; padding: 8px; font-weight: bold;">End Date:</td>
          <td style="font-size: 16px; color: #555; padding: 8px;">${values.endDate}</td>
        </tr>
      </table>

      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 25px;">Please ensure to review the contest details and make any necessary adjustments before publishing.</p>
      
      <div style="border-top: 2px solid #f1f1f1; padding-top: 30px; text-align: center;">
        <p style="font-size: 14px; color: #888; margin: 0;">Best regards,</p>
        <p style="font-size: 16px; font-weight: bold; color: #333;">The Contest Team</p>
        <p style="font-size: 14px; color: #888; margin-top: 5px;">Lira | <a href="https://www.companywebsite.com" style="color: #2196F3; text-decoration: none;">www.companywebsite.com</a></p>
      </div>
    </div>
  </div>
</body>`
  };
  return data;
};

const contestReminder = (value: any) => {
  const data = {
    to: value.email,
    subject: 'Contest Reminder Notification',
    html: `<body style="font-family: 'Roboto', sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; color: #333;">
  <div style="max-width: 650px; margin: 40px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); padding: 35px; color: #333;">
    <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 30px; width: 160px;" />
    
    <div style="text-align: left; padding: 0 20px;">
      <p style="font-size: 20px; color: #444; line-height: 1.6; margin-bottom: 20px;">Hello ${value.userName},</p>
      <p style="font-size: 16px; color: #555; line-height: 1.8; margin-bottom: 25px;">This is a friendly reminder that your contest <strong>${value.contestName}</strong> is nearing its end. You have <strong>${value.hoursLeft} hours</strong> left to participate before it ends on <strong>${value.endDate}</strong>.</p>

      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 25px;">Don't miss out! Make sure you submit your entry before the deadline to ensure your participation.</p>
      
      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 25px;">If you need any help or have any questions, feel free to reach out to us at any time.</p>
      
      <div style="border-top: 2px solid #f1f1f1; padding-top: 30px; text-align: center;">
        <p style="font-size: 14px; color: #888; margin: 0;">Best regards,</p>
        <p style="font-size: 16px; font-weight: bold; color: #333;">The Contest Team</p>
        <p style="font-size: 14px; color: #888; margin-top: 5px;">Lira | <a href="https://www.companywebsite.com" style="color: #2196F3; text-decoration: none;">www.companywebsite.com</a></p>
      </div>
    </div>
  </div>
</body>
`
  };
  return data;
};
const weeklySummary = (value: any) => {
  const data = {
    to: value.email,
    subject: `📊 Your Weekly Contest Summary (${value.weekStart} - ${value.weekEnd})`,
    html: `<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>📊 Your Weekly Summary</h1>
            <p>${value.weekStart} - ${value.weekEnd}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="font-size: 20px; color: #444;">Hi ${value.userName}! 👋</h2>
            <p style="font-size: 16px; color: #555;">Here's how you did this week:</p>
            
            <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea;">
                <h3 style="margin-bottom: 20px;">📈 Activity Overview</h3>
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <span style="font-weight: bold; color: #666;">Total Entries:</span>
                    <span style="font-size: 20px; font-weight: bold; color: #667eea;">${value.stats.totalEntries}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <span style="font-weight: bold; color: #666;">Contests Completed:</span>
                    <span style="font-size: 20px; font-weight: bold; color: #667eea;">${value.stats.completedContests}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <span style="font-weight: bold; color: #666;">Active Contests:</span>
                    <span style="font-size: 20px; font-weight: bold; color: #667eea;">${value.stats.activeContests}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <span style="font-weight: bold; color: #666;">Win Rate:</span>
                    <span style="font-size: 20px; font-weight: bold; color: #667eea;">${value.stats.winRate}%</span>
                </div>
            </div>
            
            <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea;">
                <h3 style="margin-bottom: 20px;">💰 Financial Summary</h3>
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <span style="font-weight: bold; color: #666;">Total Spent:</span>
                    <span style="font-size: 20px; font-weight: bold; color: #667eea;">$${value.stats.totalSpent.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <span style="font-weight: bold; color: #666;">Total Winnings:</span>
                    <span style="font-size: 20px; font-weight: bold; color: #10b981;">$${value.stats.totalWinnings.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <span style="font-weight: bold; color: #666;">Net Profit/Loss:</span>
                    <span style="font-size: 20px; font-weight: bold; color: ${value.stats.netProfit >= 0 ? '#10b981' : '#ef4444'};">
                        ${value.stats.netProfit >= 0 ? '+' : ''}$${value.stats.netProfit.toFixed(2)}
                    </span>
                </div>
            </div>
            
            ${value.stats.bestEntry ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3>🏆 Best Performance</h3>
                <p><strong>${value.stats.bestEntry.contestName}</strong></p>
                <p>Prize Won: <strong class="positive">$${value.stats.bestEntry.prizeAmount.toFixed(2)}</strong></p>
            </div>
            ` : ''}
            
            <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea;">
                <h3 style="margin-bottom: 20px;">📊 Insights</h3>
                <p style="font-size: 16px; color: #555;"><strong>Favorite Category:</strong> ${value.stats.favoriteCategory}</p>
                <p style="font-size: 16px; color: #555;"><strong>Contests Won:</strong> ${value.stats.wonContests}</p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
                <p>Keep predicting, keep winning! 🎯</p>
                <p>You're receiving this because you subscribed to weekly summaries.</p>
                        <p style="font-size: 14px; color: #888; margin-top: 5px;">Lira | <a href="https://www.companywebsite.com" style="color: #2196F3; text-decoration: none;">www.companywebsite.com</a></p>

            </div>
        </div>
    </div>
</body>`
  }
  return data;
};

export const emailTemplate = {
  createAccount,
  resetPassword,
  resetPasswordByUrl,
  contactFormTemplate,
  contact,
  helpReplyTemplate,
  blockAccountTemplate,
  createNewContest,
  contestReminder,
  weeklySummary,
};
