package com.storepricetrack.store_price_track.modules.auth.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.mail.from:noreply@storepricetrack.com}")
    private String mailFrom;

    @Value("${app.mail.sender-name:Store Price Track}")
    private String senderName;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    public void sendPasswordResetEmail(String toEmail, String recipientName, String resetUrl) {
        boolean hasSmtpConfigured = mailSender != null && mailUsername != null && !mailUsername.isBlank();

        if (hasSmtpConfigured) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(
                        message,
                        MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                        StandardCharsets.UTF_8.name()
                );

                helper.setFrom(new InternetAddress(mailFrom, senderName));
                helper.setTo(toEmail);
                helper.setSubject("Recuperação de Senha - Store Price Track");
                helper.setText(buildResetPasswordHtml(recipientName, resetUrl), true);

                mailSender.send(message);
                log.info("E-mail de recuperação de senha enviado com sucesso para: {}", toEmail);
                return;
            } catch (Exception e) {
                log.warn("Falha no disparo via SMTP para {}. Acionando fallback no console. Causa: {}", toEmail, e.getMessage());
            }
        }

        // Modo Dev-Friendly / Resiliente: exibe link destacado no console para testes locais imediatos
        logDevFallbackMessage(toEmail, recipientName, resetUrl);
    }

    private void logDevFallbackMessage(String toEmail, String recipientName, String resetUrl) {
        String separator = "=".repeat(75);
        log.info("\n{}\n[DEV EMAIL FALLBACK] RECUPERAÇÃO DE SENHA\nDestinatário: {} ({})\nLink para redefinição (válido por 15 minutos):\n{}\n{}",
                separator, toEmail, recipientName != null ? recipientName : "Usuário", resetUrl, separator);
    }

    private String buildResetPasswordHtml(String recipientName, String resetUrl) {
        String displayName = (recipientName != null && !recipientName.isBlank()) ? recipientName : "Usuário";
        return """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
                .card { max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
                .logo { font-size: 20px; font-weight: 700; color: #38bdf8; margin-bottom: 24px; }
                h1 { font-size: 22px; color: #ffffff; margin-bottom: 12px; }
                p { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px; }
                .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #0ea5e9, #2563eb); color: #ffffff !important; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 8px; margin: 12px 0 24px 0; }
                .note { font-size: 12px; color: #94a3b8; border-top: 1px solid #334155; padding-top: 16px; }
                .url-break { word-break: break-all; color: #38bdf8; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="logo">🛒 Store Price Track</div>
                <h1>Recuperação de Senha</h1>
                <p>Olá, <strong>%s</strong>!</p>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta no Store Price Track. Clique no botão abaixo para criar uma nova senha:</p>
                <div style="text-align: center;">
                  <a href="%s" class="btn" target="_blank">Redefinir Minha Senha</a>
                </div>
                <p>Ou se preferir, copie e cole o link a seguir no seu navegador:</p>
                <p class="url-break"><a href="%s" style="color: #38bdf8;">%s</a></p>
                <div class="note">
                  <p>⏳ Este link é válido por <strong>15 minutos</strong> e de uso único.</p>
                  <p>Se você não solicitou a recuperação de senha, nenhuma ação é necessária. Sua senha atual permanecerá segura.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(displayName, resetUrl, resetUrl, resetUrl);
    }
}
