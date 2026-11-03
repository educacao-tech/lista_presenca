# 📋 Lista de Presença Conectada ao Google Forms Oficial

Sistema de registro de presença escolar integrado diretamente ao formulário do Google Forms:
[Google Forms Oficial](https://docs.google.com/forms/d/e/1FAIpQLSd7uCn6oryJkV4UGpQdMiRa0a3CUW-gqqPPMlXy2EWx06zEYA/viewform)

---

## 🏫 Escolas Mapeadas
A lista suspensa contém as 7 escolas cadastradas:
1. `ALZIRA ACRA`
2. `ANNA BONAGURA`
3. `BRAGA MORATO`
4. `CAIC`
5. `CÉLIA BUENO`
6. `ESTHER VIANNA`
7. `PADRE BENITO`

---

## ⚙️ Mapeamento de Campos
- **URL de Envio:** `https://docs.google.com/forms/d/e/1FAIpQLSd7uCn6oryJkV4UGpQdMiRa0a3CUW-gqqPPMlXy2EWx06zEYA/formResponse`
- **E-MAIL DO PROFESSOR(A):** `emailAddress` *(Chave única primária)*
- **ESCOLA:** `entry.285930433`
- **NOME COMPLETO:** `entry.278265355`

---

## ✨ Recursos
- **Envio Instantâneo:** Grava diretamente no Google Forms Oficial e na Planilha vinculada.
- **Validação com Chave Única por Encontro:** Bloqueia registros duplicados apenas se forem realizados no mesmo dia (mesmo encontro). Permite que o mesmo docente registre presença normalmente em datas formativas distintas.
- **🎓 Gestão de Presenças Individuais & Atestados (Exclusivo no Painel Admin):**
  - Consulta nominal ou por e-mail com histórico completo de presenças e ausências de qualquer docente em cada encontro formativo.
  - Indicadores individuais de frequência (taxa % de assiduidade e total de horas formativas acumuladas).
  - Emissão e impressão da **Declaração Oficial de Frequência e Carga Horária em PDF** timbrada com autenticidade eletrônica e campos para assinatura funcional.
  - Acesso direto via botões dedicados na tabela de histórico e no cruzamento de auditoria de faltas.
- **📧 Disparo Automático de Comprovante por E-mail:**
  - Envio instantâneo de comprovante timbrado em HTML com dados do registro diretamente para o e-mail do professor via Google Apps Script.
- **Sincronização em Tempo Real (Google Planilhas):** Carrega automaticamente todas as presenças registradas em qualquer dispositivo.
- **Comprovante & Recibo:** Exibe tela de confirmação com e-mail, escola, nome, data e hora após o envio.
- **Área Administrativa & Dashboard Completo:** Acesso protegido por senha (`admin123`) com KPIs em tempo real, contagem de presenças por escola e busca combinada.
  - ✏️ **Edição e Correção de Presenças:** Permite ao administrador editar nome, e-mail, unidade escolar, data e horário de qualquer registro com 1 clique.
  - 🗑️ **Exclusão com Persistência:** Remove registros indesejados ou acidentais garantindo que não sejam reimportados em sincronizações posteriores da planilha.
  - ➕ **Lançamento Manual de Presenças:** Botão *Nova Presença* para lançar presenças avulsas de professores que não conseguiram assinar na hora.
- **Relatório Executivo para a Gestão Escolar (Separado por Dia do Encontro):**
  - 📅 **Agrupamento & Filtro por Encontro:** Separação visual e cronológica de cada dia formativo com total de presenças, horários e relação nominal por dia ou filtro individual.
  - 🖨️ **Impressão / PDF:** Layout timbrado com cabeçalho institucional dinâmico, grupos por encontro e linhas para assinatura da direção/coordenação.
  - 📲 **WhatsApp da Gestão:** Cópia de texto formatado dividido e delimitado por dia do encontro e resumo por escola com um clique.
  - 📊 **Exportação CSV:** Download de relatório com coluna `DiaDoEncontro` consolidado ou filtrado por unidade escolar e data.
- **Configurações Flexíveis:** Ajuste de links e IDs do Google Forms e da Planilha Google diretamente no painel.

---

## 🔄 Como ativar a Sincronização em Tempo Real:
1. Abra a Planilha de Respostas vinculada ao Google Forms no Google Drive.
2. Vá em **Arquivo** > **Compartilhar** > **Publicar na Web**.
3. Escolha **Página Inteira** e formato **Valores separados por vírgula (.csv)** e clique em **Publicar**.
4. Copie o link gerado e cole no Painel do Administrador (⚙️ > aba *Configurações do Forms & Planilha*).

---

## ⚡ Como Ativar o Envio de E-mails Automático via Google Apps Script:
1. Na sua Planilha Google, acesse **Extensões** > **Apps Script**.
2. Copie o código pronto do arquivo [`google_apps_script.js`](./google_apps_script.js) e cole no editor substituindo o código anterior.
3. Clique em **Salvar** (ícone de disquete).
4. Clique em **Implantar** > **Gerenciar implantações** > clique no lápis (Editar):
   - **Versão:** Selecione **Nova versão**.
   - **Quem tem acesso:** **Qualquer pessoa** (Anyone).
5. Clique em **Implantar** e autorize os serviços do Google. A partir deste momento, todo envio feito gravará na planilha e disparará o comprovante no e-mail do professor automaticamente!

