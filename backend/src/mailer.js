// AI-assisted: see docs/AI_LOG.md #11
// Arma el correo desde la plantilla HTML y lo envía con Nodemailer (Gmail).
const fs = require("node:fs");
const path = require("node:path");

const plantilla = fs.readFileSync(
  path.join(__dirname, "templates", "verificacion-codigo.html"),
  "utf8",
);

const TEXTOS = {
  registro: {
    asunto: (c) => `${c} es tu código para confirmar tu cuenta de UberClone`,
    titulo: "Confirmá tu cuenta de conductor",
    intro:
      "Ya casi terminás tu registro. Para confirmar que este correo es tuyo, ingresá este código en la app:",
    detalles: "Detalles del registro",
  },
  login: {
    asunto: (c) => `${c} es tu código de inicio de sesión de UberClone`,
    titulo: "Confirmá que sos vos",
    intro:
      "Detectamos un intento de inicio de sesión en tu cuenta de conductor. Para continuar, ingresá este código en la app:",
    detalles: "Detalles del inicio de sesión",
  },
};

const escaparHtml = (txt) =>
  String(txt ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);

function renderCorreo({ motivo, nombre, codigo, minutos, ip, dispositivo, fecha }) {
  const t = TEXTOS[motivo] ?? TEXTOS.login;
  const datos = {
    TITULO: t.titulo,
    INTRO: t.intro,
    DETALLES: t.detalles,
    NOMBRE: escaparHtml(nombre || "conductor"),
    CODIGO: codigo,
    MINUTOS: minutos,
    IP: escaparHtml(ip || "Desconocida"),
    DISPOSITIVO: escaparHtml(dispositivo || "Desconocido"),
    FECHA: escaparHtml(fecha),
  };
  return {
    asunto: t.asunto(codigo),
    html: plantilla.replace(/{{(\w+)}}/g, (_, k) => String(datos[k] ?? "")),
    texto: `${t.titulo}\n\nTu código es ${codigo}. Vence en ${minutos} minutos. No lo compartas con nadie.`,
  };
}

function createGmailSender({ user, pass }) {
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return async ({ to, asunto, html, texto }) => {
    await transporter.sendMail({
      from: `"UberClone Conductor" <${user}>`,
      to,
      subject: asunto,
      html,
      text: texto,
    });
  };
}

module.exports = { renderCorreo, createGmailSender, TEXTOS };
