/**
 * ============================================================================
 * GOOGLE APPS SCRIPT — LISTA DE PRESENÇA EDM
 * Secretaria Municipal de Educação de Batatais
 * ============================================================================
 * 
 * Este script faz duas funções vitais:
 * 1. Grava a presença diretamente na Planilha Google Vinculada (sem travas do Google Forms).
 * 2. Envia AUTOMATICAMENTE um Comprovante Timbrado Oficial para o e-mail do professor.
 * 
 * INSTRUÇÕES DE INSTALAÇÃO:
 * 1. Na Planilha de Respostas do Google Sheets, clique em:
 *    Extensões > Apps Script
 * 2. Apague todo o código existente lá e cole este arquivo na íntegra.
 * 3. Clique no ícone de disquete (Salvar).
 * 4. Clique no botão azul "Implantar" (Deploy) > "Gerenciar Implantações" (Manage Deployments).
 * 5. Clique no lápis (Editar) da implantação ativa:
 *    - Versão: Nova versão (New Version)
 *    - Quem tem acesso: Qualquer pessoa (Anyone)
 * 6. Clique em "Implantar" (Deploy) e confirme as permissões do Google.
 * ============================================================================
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Nenhum dado recebido no payload POST." 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    
    var email = (data.email || '').trim().toLowerCase();
    var escola = (data.escola || '').trim().toUpperCase();
    var professor = (data.professor || '').trim().toUpperCase();
    
    // Formata carimbo de data e hora
    var now = new Date();
    var timestampStr = data.timestamp || Utilities.formatDate(now, "America/Sao_Paulo", "dd/MM/yyyy 'às' HH:mm");
    
    // 1. Obtém a planilha ativa vinculada
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss ? ss.getActiveSheet() : SpreadsheetApp.getActiveSheet();
    
    if (!sheet) {
      throw new Error("Não foi possível acessar a planilha ativa. Verifique o vínculo do Apps Script com o arquivo Google Sheets.");
    }
    
    // 2. REGRA DE SEGURANÇA: Bloqueia duplicidade no mesmo dia diretamente na Planilha
    var lastRow = sheet.getLastRow();
    var todayStr = Utilities.formatDate(now, "America/Sao_Paulo", "dd/MM/yyyy");
    var alreadyExists = false;

    if (lastRow > 1) {
      var values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
      for (var i = 0; i < values.length; i++) {
        var rowDateVal = values[i][0];
        var rowEmailVal = (values[i][1] || '').toString().trim().toLowerCase();
        var rowProfVal = (values[i][3] || '').toString().trim().toUpperCase();

        var rowDateStr = "";
        if (rowDateVal instanceof Date) {
          rowDateStr = Utilities.formatDate(rowDateVal, "America/Sao_Paulo", "dd/MM/yyyy");
        } else if (rowDateVal) {
          var match = rowDateVal.toString().match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
          if (match) {
            var parts = match[1].split('/');
            var d = parts[0].length === 1 ? '0' + parts[0] : parts[0];
            var m = parts[1].length === 1 ? '0' + parts[1] : parts[1];
            rowDateStr = d + '/' + m + '/' + parts[2];
          }
        }

        // Se for no mesmo dia, verifica e-mail ou nome
        if (rowDateStr === todayStr) {
          if (email && rowEmailVal && email === rowEmailVal) {
            alreadyExists = true;
            break;
          }
          if (professor && rowProfVal && professor === rowProfVal) {
            alreadyExists = true;
            break;
          }
        }
      }
    }

    if (alreadyExists) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "duplicate",
        message: "Presença já confirmada hoje para este docente."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Ordem oficial das colunas da Planilha do Google Forms:
    // [Carimbo de data/hora, Endereço de e-mail, ESCOLA, NOME COMPLETO:]
    sheet.appendRow([now, email, escola, professor]);
    
    // 4. Disparo do Comprovante Timbrado por E-mail (se e-mail for válido)
    var emailSent = false;
    var emailError = null;
    
    if (email && email.indexOf('@') !== -1 && email.indexOf('.') !== -1) {
      try {
        enviarComprovantePorEmail(email, professor, escola, timestampStr);
        emailSent = true;
      } catch (mailErr) {
        emailError = mailErr.toString();
        Logger.log("Aviso ao enviar e-mail: " + mailErr);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      emailSent: emailSent,
      emailError: emailError,
      recordedAt: timestampStr
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    Logger.log("Erro geral no doPost: " + err);
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Monta e envia o e-mail em HTML com design profissional timbrado
 */
function enviarComprovantePorEmail(email, professor, escola, timestampStr) {
  var subject = "📋 Comprovante Oficial de Presença EDM — " + escola;
  
  var htmlBody = ""
    + "<!DOCTYPE html>"
    + "<html>"
    + "<head><meta charset='UTF-8'></head>"
    + "<body style='margin:0; padding:20px; background-color:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>"
    + "  <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.06);'>"
    + "    <!-- Top Banner -->"
    + "    <div style='background: linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%); padding: 26px 20px; text-align: center; color: #ffffff;'>"
    + "      <div style='display: inline-block; background: rgba(255,255,255,0.18); padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; text-transform: uppercase;'>"
    + "        Secretaria Municipal de Educação de Batatais"
    + "      </div>"
    + "      <h1 style='margin: 0; font-size: 21px; font-weight: 700; letter-spacing: -0.2px;'>COMPROVANTE OFICIAL DE PRESENÇA</h1>"
    + "      <p style='margin: 6px 0 0; font-size: 13px; opacity: 0.9;'>EDM — Educação Digital e Midiática • Formação Continuada 2026</p>"
    + "    </div>"
    + "    <!-- Conteúdo -->"
    + "    <div style='padding: 28px 24px; color: #334155; line-height: 1.6;'>"
    + "      <p style='font-size: 16px; margin: 0 0 12px; color: #0f172a;'>Olá, <strong>" + professor + "</strong>!</p>"
    + "      <p style='font-size: 14px; margin: 0 0 18px; color: #475569;'>"
    + "        Sua presença no encontro formativo presencial foi registrada e computada com sucesso na lista oficial da Secretaria Municipal de Educação."
    + "      </p>"
    + "      <!-- Caixa do Comprovante -->"
    + "      <div style='background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #10b981; border-radius: 8px; padding: 18px; margin: 20px 0;'>"
    + "        <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>"
    + "          <tr>"
    + "            <td style='padding: 6px 0; color: #64748b; width: 35%;'>Docente:</td>"
    + "            <td style='padding: 6px 0; font-weight: 700; color: #0f172a;'>" + professor + "</td>"
    + "          </tr>"
    + "          <tr>"
    + "            <td style='padding: 6px 0; color: #64748b;'>E-mail:</td>"
    + "            <td style='padding: 6px 0; font-weight: 600; color: #0f172a;'>" + email + "</td>"
    + "          </tr>"
    + "          <tr>"
    + "            <td style='padding: 6px 0; color: #64748b;'>Unidade Escolar:</td>"
    + "            <td style='padding: 6px 0; font-weight: 700; color: #0284c7;'>" + escola + "</td>"
    + "          </tr>"
    + "          <tr>"
    + "            <td style='padding: 6px 0; color: #64748b;'>Data e Horário:</td>"
    + "            <td style='padding: 6px 0; font-weight: 600; color: #0f172a;'>" + timestampStr + "</td>"
    + "          </tr>"
    + "          <tr>"
    + "            <td style='padding: 6px 0; color: #64748b;'>Situação:</td>"
    + "            <td style='padding: 6px 0;'>"
    + "              <span style='background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; display: inline-block;'>"
    + "                ✔ Presença Confirmada"
    + "              </span>"
    + "            </td>"
    + "          </tr>"
    + "        </table>"
    + "      </div>"
    + "      <p style='font-size: 12px; color: #94a3b8; margin: 18px 0 0;'>"
    + "        💡 Guarde este e-mail como comprovante individual de sua participação para cômputo de frequência, evolução funcional e emissão de declarações de carga horária."
    + "      </p>"
    + "    </div>"
    + "    <!-- Rodapé -->"
    + "    <div style='background: #f8fafc; padding: 14px 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;'>"
    + "      Secretaria Municipal de Educação de Batatais • Formação EDM<br>"
    + "      Documento eletrônico oficial gerado automaticamente pelo Sistema de Presença."
    + "    </div>"
    + "  </div>"
    + "</body>"
    + "</html>";

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

