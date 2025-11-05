/**
 * Email Service - Notifications automatiques
 * Envoie des emails pour les alertes de stock faible
 */

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.config = {
            enabled: false,
            host: process.env.SMTP_HOST || '',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            },
            from: process.env.SMTP_FROM || 'stock@example.com',
            alertEmails: (process.env.ALERT_EMAILS || '').split(',').filter(e => e)
        };
    }

    configure(config) {
        this.config = { ...this.config, ...config };

        if (this.config.enabled && this.config.host && this.config.auth.user) {
            this.transporter = nodemailer.createTransporter({
                host: this.config.host,
                port: this.config.port,
                secure: this.config.secure,
                auth: {
                    user: this.config.auth.user,
                    pass: this.config.auth.pass
                }
            });
            console.log('✅ Email service configuré');
        }
    }

    async sendLowStockAlert(lowStockItems) {
        if (!this.config.enabled || !this.transporter) {
            return { sent: false, reason: 'disabled' };
        }

        const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial; background: #f5f5f5; padding: 20px;">
    <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1>⚠️ Alerte Stock Faible</h1>
            <p>${lowStockItems.length} article(s) nécessite(nt) votre attention</p>
        </div>
        <div style="padding: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 12px; text-align: left;">Article</th>
                        <th style="padding: 12px;">Stock</th>
                        <th style="padding: 12px;">Seuil</th>
                        <th style="padding: 12px;">Emplacement</th>
                    </tr>
                </thead>
                <tbody>
                    ${lowStockItems.map(item => `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 12px;"><strong>${item.name}</strong></td>
                            <td style="padding: 12px; text-align: center;">
                                <span style="background: ${item.quantity === 0 ? '#dc3545' : '#ffc107'}; color: white; padding: 4px 12px; border-radius: 12px;">${item.quantity}</span>
                            </td>
                            <td style="padding: 12px; text-align: center;">${item.alert_threshold || 5}</td>
                            <td style="padding: 12px;">${item.location || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
        `;

        try {
            const info = await this.transporter.sendMail({
                from: this.config.from,
                to: this.config.alertEmails.join(', '),
                subject: `⚠️ Alerte Stock Faible - ${lowStockItems.length} article(s)`,
                html: html
            });
            return { sent: true, messageId: info.messageId };
        } catch (error) {
            return { sent: false, error: error.message };
        }
    }

    async sendTestEmail(toEmail) {
        if (!this.transporter) {
            throw new Error('Email service non configuré');
        }

        await this.transporter.sendMail({
            from: this.config.from,
            to: toEmail,
            subject: '✅ Test Email - Gestion Stock IT',
            html: '<h2>Test Email Réussi !</h2><p>La configuration SMTP fonctionne.</p>'
        });

        return { success: true };
    }
}

module.exports = new EmailService();
