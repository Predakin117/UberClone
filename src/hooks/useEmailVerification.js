// AI-assisted: see docs/AI_LOG.md #13
// Pide y verifica el código que el backend envía al correo del conductor.
// El código vale para un correo: si el conductor lo cambia, hay que pedir otro.
import { useEffect, useState } from "react";
import {
  enviarCodigo,
  MOTIVOS,
  verificarCodigo,
} from "../services/emailVerification";
import {
  describeVerificationError,
  isValidCode,
  RESEND_SECONDS,
} from "../services/verificationErrors";

export const useEmailVerification = ({ email, name }) => {
  const [sentTo, setSentTo] = useState(null);
  const [verifiedFor, setVerifiedFor] = useState(null);
  const [minutes, setMinutes] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  const normalizedEmail = email.trim().toLowerCase();
  const isSent = sentTo === normalizedEmail;
  const isVerified = verifiedFor === normalizedEmail;

  // Cuenta regresiva para "Reenviar código"; la limpieza cancela el segundo pendiente
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(
      () => setCooldown((seconds) => Math.max(seconds - 1, 0)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendCode = async () => {
    if (isSending || cooldown > 0) return;
    setIsSending(true);
    setError(null);
    const result = await enviarCodigo({
      email,
      nombre: name,
      motivo: MOTIVOS.REGISTRO,
    });
    setIsSending(false);

    if (result.ok) {
      setSentTo(normalizedEmail);
      setMinutes(result.minutos);
      setCooldown(RESEND_SECONDS);
      return;
    }
    // "espera": ya hay un código vigente para este correo, así que se puede escribir
    if (result.codigoError === "espera") {
      setSentTo(normalizedEmail);
      setCooldown(result.reintentarEn ?? RESEND_SECONDS);
    }
    setError(describeVerificationError(result));
  };

  // Devuelve true si el código es correcto. Un código solo sirve una vez, por eso
  // se recuerda que el correo ya quedó verificado.
  const verifyCode = async (code) => {
    if (isVerified) return true;
    if (!isValidCode(code)) {
      setError(describeVerificationError({ codigoError: "codigo_invalido" }));
      return false;
    }
    setIsVerifying(true);
    setError(null);
    const result = await verificarCodigo({ email, codigo: code.trim() });
    setIsVerifying(false);

    if (result.ok) {
      setVerifiedFor(normalizedEmail);
      return true;
    }
    setError(describeVerificationError(result));
    return false;
  };

  return {
    isSent,
    isVerified,
    minutes,
    isSending,
    isVerifying,
    error,
    cooldown,
    sendCode,
    verifyCode,
  };
};
