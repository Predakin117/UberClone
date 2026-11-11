// AI-assisted: see docs/AI_LOG.md #9, #12, #13, #54
// Textos de la app en español e inglés. Las claves son iguales en los dos idiomas
// (lo comprueba strings.test.js). Los validadores devuelven claves "errors.*".
import { MAX_PASSWORD_LENGTH } from "../validation/account";
import { MAX_NAME_LENGTH, MIN_DRIVER_AGE } from "../validation/personalInfo";
import {
  MAX_CAPACITY,
  MAX_VEHICLE_AGE,
  MAX_VEHICLE_NAME_LENGTH,
  MIN_CAPACITY,
  XL_MIN_CAPACITY,
} from "../validation/vehicle";

export const DEFAULT_LANGUAGE = "es";

export const strings = {
  es: {
    // Pestañas del registro
    "tabs.personal": "1. Datos",
    "tabs.vehicle": "2. Vehículo",
    "tabs.documents": "3. Docs",

    // Componentes compartidos
    "common.next": "Siguiente",
    "common.done": "Listo",
    "select.placeholder": "Selecciona una opción",
    "date.placeholder": "Selecciona una fecha",
    "photo.takePhoto": "Tomar foto",
    "photo.chooseFromGallery": "Elegir de galería",
    "photo.permissionDenied": "Debes conceder el permiso para agregar la foto.",
    "photo.pickError": "No se pudo obtener la foto. Inténtalo de nuevo.",

    // Login ({count}, {min} and {max} are replaced by PhoneField)
    "login.title": "Inicia sesión",
    "login.subtitle": "Ingresa con tu celular o tu correo",
    "login.methodPhone": "Celular",
    "login.methodEmail": "Correo",
    "login.email": "Correo electrónico",
    "login.emailPlaceholder": "nombre@ejemplo.com",
    "login.notFoundPhone": "No encontramos una cuenta con este número.",
    "login.notFoundEmail": "No encontramos una cuenta con este correo.",
    "login.noAccount": "¿No tienes cuenta?",
    "login.createAccount": "Crear cuenta",
    "password.title": "Ingresa tu contraseña",
    "password.label": "Contraseña",
    "password.show": "Mostrar",
    "password.hide": "Ocultar",
    "password.signIn": "Iniciar sesión",
    "password.forgot": "¿Olvidaste tu contraseña?",
    "password.resetSent":
      "Te enviamos un correo para restablecer tu contraseña. Revisa también la carpeta de spam.",
    "signup.title": "Crea tu cuenta",
    "signup.subtitle":
      "Después podrás iniciar sesión con tu correo o con tu celular.",
    "signup.confirmPassword": "Confirma la contraseña",
    "signup.passwordHint": "Mínimo 8 caracteres, con letras y números",
    "signup.submit": "Crear cuenta",
    "errors.passwordRequired": "Ingresa la contraseña",
    "errors.passwordTooShort": "La contraseña debe tener mínimo 8 caracteres",
    "errors.confirmPasswordRequired": "Confirma la contraseña",
    "errors.passwordMismatch": "Las contraseñas no coinciden",
    "auth.wrongPassword": "La contraseña no es correcta",
    "auth.tooManyRequests":
      "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
    "auth.network": "No hay conexión. Revisa tu internet e inténtalo de nuevo.",
    "auth.emailInUse": "Ya existe una cuenta con este correo",
    "auth.phoneInUse": "Ya existe una cuenta con este número",
    "auth.notConfigured":
      "La base de datos no está configurada. Revisa el archivo .env.",
    "auth.permissionDenied":
      "La base de datos rechazó la operación. Revisa las reglas de Firestore.",
    "auth.failed": "Algo salió mal. Inténtalo de nuevo.",
    "login.country": "País",
    "login.searchCountry": "Buscar país o código",
    "login.noCountries": "No hay países que coincidan",
    "login.phone": "Número de celular",
    "login.phonePlaceholder": "Número de celular",
    "login.digitsExact": "Debe tener {count} dígitos",
    "login.digitsRange": "Debe tener entre {min} y {max} dígitos",
    "login.continue": "Continuar",
    "errors.countryRequired": "Selecciona el país",
    "errors.loginPhoneRequired": "Ingresa tu número de celular",
    "errors.loginPhoneInvalid": "El número solo puede tener dígitos",
    "errors.loginPhoneLength": "El número no tiene los dígitos del país elegido",

    // Pestaña 1: Datos personales
    "personal.profilePhoto": "Foto de perfil",
    "personal.name": "Nombre completo",
    "personal.namePlaceholder": "Ej. Tamiro Solano",
    "personal.documentId": "Documento de identidad",
    "personal.documentIdPlaceholder": "Entre 6 y 10 dígitos",
    "personal.phone": "Número de celular",
    "personal.phonePlaceholder": "Ej. 3001234567",
    "personal.birthDate": "Fecha de nacimiento",
    "personal.gender": "Género",
    "personal.email": "Correo electrónico",
    "personal.emailPlaceholder": "correo@ejemplo.com",
    "personal.language": "Idioma",

    "gender.female": "Femenino",
    "gender.male": "Masculino",
    "gender.non_binary": "No binario",
    "gender.not_specified": "Prefiero no decirlo",

    "errors.profilePhotoRequired": "La foto de perfil es obligatoria",
    "errors.nameRequired": "El nombre es obligatorio",
    "errors.nameTooLong": `El nombre admite máximo ${MAX_NAME_LENGTH} caracteres`,
    "errors.nameInvalid": "El nombre solo puede tener letras y espacios",
    "errors.documentIdRequired": "El documento de identidad es obligatorio",
    "errors.documentIdInvalid":
      "El documento debe tener entre 6 y 10 dígitos y no empezar por 0",
    "errors.phoneRequired": "El número de celular es obligatorio",
    "errors.phoneInvalid": "El celular debe tener 10 dígitos y empezar por 3",
    "errors.birthDateRequired": "La fecha de nacimiento es obligatoria",
    "errors.birthDateInvalid": "La fecha de nacimiento no es válida",
    "errors.birthDateUnderage": `Debes tener al menos ${MIN_DRIVER_AGE} años`,
    "errors.genderRequired": "Selecciona el género",
    "errors.emailRequired": "El correo electrónico es obligatorio",
    "errors.emailInvalid":
      "Ingresa un correo válido, por ejemplo nombre@dominio.com",
    "errors.languageRequired": "Selecciona el idioma",

    // Pestaña 3: Documentos y pagos ({year}, {percent} y {tabs} los reemplaza
    // DocumentsScreen)
    "documents.licenseSection": "Licencia de conducción",
    "documents.licenseNumber": "Número de licencia",
    "documents.licenseNumberPlaceholder": "Ej. 1234567890",
    "documents.licensePhoto": "Foto de la licencia",
    "documents.licenseExpiry": "Vencimiento de la licencia",
    "documents.soatSection": "SOAT",
    "documents.soatPhoto": "Foto del SOAT",
    "documents.soatExpiry": "Vencimiento del SOAT",
    "documents.techReviewSection": "Revisión técnico-mecánica",
    "documents.techReviewPhoto": "Foto del certificado",
    "documents.techReviewExpiry": "Vencimiento de la revisión",
    "documents.techReviewNotRequired":
      "Tu vehículo es modelo {year}: todavía no necesita revisión técnico-mecánica.",
    "documents.techReviewUnknownYear":
      "Completa el año del vehículo en la pestaña 2 para saber si necesitas revisión técnico-mecánica.",
    "documents.paymentsSection": "Pagos",
    "documents.mercadoPagoEmail": "Correo de tu cuenta de Mercado Pago",
    "documents.mercadoPagoEmailHint":
      "Ahí recibirías tus pagos. La app no guarda cuentas bancarias ni tarjetas.",
    "documents.terms":
      "Acepto los términos y condiciones, incluida la comisión del {percent} % que cobra la plataforma por cada viaje.",
    "documents.submit": "Enviar registro",
    "documents.completeAllTabs": "Completa todas las pestañas",
    "documents.pendingTabs": "Falta completar: {tabs}",
    "documents.showPending": "Ver qué falta en esta pestaña",

    "errors.licenseNumberRequired": "El número de licencia es obligatorio",
    "errors.licenseNumberInvalid":
      "El número de licencia solo puede tener dígitos",
    "errors.licensePhotoRequired": "La foto de la licencia es obligatoria",
    "errors.licenseExpiryRequired":
      "La fecha de vencimiento de la licencia es obligatoria",
    "errors.licenseExpired": "La licencia debe vencer después de hoy",
    "errors.soatPhotoRequired": "La foto del SOAT es obligatoria",
    "errors.soatExpiryRequired":
      "La fecha de vencimiento del SOAT es obligatoria",
    "errors.soatExpired": "El SOAT debe vencer después de hoy",
    "errors.techReviewPhotoRequired":
      "La foto de la revisión técnico-mecánica es obligatoria",
    "errors.techReviewExpiryRequired":
      "La fecha de vencimiento de la revisión es obligatoria",
    "errors.techReviewExpired": "La revisión debe vencer después de hoy",
    "errors.expiryInvalid": "La fecha no es válida",
    "errors.mercadoPagoEmailRequired":
      "El correo de Mercado Pago es obligatorio",
    "errors.mercadoPagoEmailInvalid":
      "Ingresa un correo válido, por ejemplo nombre@dominio.com",
    "errors.termsRequired":
      "Debes aceptar los términos para enviar el registro",

    // Confirmación del correo con código ({email}, {minutes}, {seconds} y
    // {attempts} los reemplaza VerifyEmailScreen)
    "verify.title": "Confirmar correo",
    "verify.heading": "Confirma tu correo electrónico",
    "verify.willSendTo":
      "Para terminar el registro te enviaremos un código de 6 dígitos a {email}.",
    "verify.sentTo": "Enviamos un código de 6 dígitos a {email}.",
    "verify.expiresIn": "Vence en {minutes} minutos.",
    "verify.sendCode": "Enviar código",
    "verify.sending": "Enviando…",
    "verify.code": "Código de verificación",
    "verify.confirm": "Confirmar y enviar registro",
    "verify.verifying": "Verificando…",
    "verify.resend": "Reenviar código",
    "verify.resendIn": "Reenviar código en {seconds} s",
    "verify.changeEmail": "Cambiar el correo",
    "verify.error.email_invalido": "El correo de la pestaña 1 no es válido",
    "verify.error.espera":
      "Espera {seconds} segundos antes de pedir otro código",
    "verify.error.sin_codigo": "Primero pide un código",
    "verify.error.vencido": "El código venció. Pide uno nuevo",
    "verify.error.demasiados_intentos":
      "Demasiados intentos. Pide un código nuevo",
    "verify.error.codigo_incorrecto":
      "El código es incorrecto. Te quedan {attempts} intentos",
    "verify.error.codigo_invalido": "El código debe tener 6 dígitos",
    "verify.error.correo_no_enviado":
      "No se pudo enviar el correo. Inténtalo de nuevo",
    "verify.error.sin_backend":
      "Falta configurar el servidor del código en el .env (EXPO_PUBLIC_BACKEND_API_URL)",
    "verify.error.sin_conexion":
      "No se pudo conectar con el servidor. Revisa que esté encendido y en la misma red Wi-Fi",
    "verify.error.generico": "Ocurrió un error. Inténtalo de nuevo",

    // Código al iniciar sesión (VerifyLoginScreen). Los errores usan verify.error.*
    "verifyLogin.heading": "Confirma que eres tú",
    "verifyLogin.sending": "Estamos enviando un código de 6 dígitos a {email}.",
    "verifyLogin.sentTo":
      "Por seguridad enviamos un código de 6 dígitos a {email}. Escríbelo para entrar.",
    "verifyLogin.notSent": "No pudimos enviar el código a {email}.",
    "verifyLogin.confirm": "Confirmar e ingresar",
    "verifyLogin.checkSpam":
      "¿No te llegó? Revisa la carpeta de spam o de promociones.",

    // Guardado en Firestore
    "save.saving": "Guardando…",
    "save.notConfigured":
      "Falta configurar Firebase o Cloudinary en el archivo .env.",
    "save.photoFailed":
      "No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo.",
    "save.permissionDenied":
      "La base de datos rechazó el guardado. Revisa las reglas de Firestore.",
    "save.failed":
      "No se pudieron guardar los datos. Revisa tu conexión e inténtalo de nuevo.",

    // AI-assisted: see docs/AI_LOG.md #54
    // Limits of the text fields ({count} and {max} are replaced by FormField)
    "form.charCount": "{count}/{max}",
    "form.maxLengthReached": "Llegaste al máximo de {max} caracteres",
    "personal.fromAccount": "Es el de tu cuenta, no se puede cambiar aquí",
    "login.checking": "Verificando…",
    "password.signingIn": "Entrando…",
    "signup.creating": "Creando cuenta…",
    "errors.nameIncomplete": "Escribe tu nombre y tu apellido",
    "errors.documentIdRepeated": "Ese número de documento no es válido",
    "errors.loginPhoneNotMobile":
      "Ese número no es de celular (en Colombia empiezan por 3)",
    "errors.loginPhoneFake": "Ese número no parece real",
    "errors.passwordTooLong": `La contraseña admite máximo ${MAX_PASSWORD_LENGTH} caracteres`,
    "errors.passwordWeak": "Usa letras y números en la contraseña",
    "errors.passwordSpaces":
      "La contraseña no puede empezar ni terminar con espacios",
    "errors.passwordHasEmail": "La contraseña no puede contener tu correo",
    "errors.licenseNumberLength":
      "El número de licencia debe tener entre 6 y 15 dígitos",
    "errors.expiryTooFar": "Esa fecha está demasiado lejos. Revisa el documento.",

    // Tab 2: vehicle
    "vehicle.category": "Categoría",
    "vehicle.plate": "Placa",
    "vehicle.platePlaceholder": "Ej. ABC123",
    "vehicle.make": "Marca",
    "vehicle.makePlaceholder": "Ej. Chevrolet",
    "vehicle.model": "Modelo",
    "vehicle.modelPlaceholder": "Ej. Spark GT",
    "vehicle.year": "Año",
    "vehicle.yearPlaceholder": "Ej. 2020",
    "vehicle.color": "Color",
    "vehicle.capacity": "Capacidad de pasajeros",
    "vehicle.capacityPlaceholder": `Entre ${MIN_CAPACITY} y ${MAX_CAPACITY}`,
    "vehicle.capacityPlaceholderXl": `Entre ${XL_MIN_CAPACITY} y ${MAX_CAPACITY}`,
    "vehicle.photo": "Foto del vehículo (debe verse la placa)",
    "category.economy": "Económico",
    "category.xl": "XL",
    "category.premium": "Premium",
    "color.white": "Blanco",
    "color.black": "Negro",
    "color.gray": "Gris",
    "color.silver": "Plata",
    "color.red": "Rojo",
    "color.blue": "Azul",
    "color.other": "Otro",
    "errors.categoryRequired": "Selecciona la categoría",
    "errors.plateRequired": "La placa es obligatoria",
    "errors.plateInvalid": "La placa debe tener el formato ABC123",
    "errors.vehicleMakeRequired": "La marca es obligatoria",
    "errors.vehicleMakeTooLong": `La marca admite máximo ${MAX_VEHICLE_NAME_LENGTH} caracteres`,
    "errors.vehicleMakeInvalid":
      "La marca solo puede tener letras, espacios y guiones",
    "errors.vehicleModelRequired": "El modelo es obligatorio",
    "errors.vehicleModelTooLong": `El modelo admite máximo ${MAX_VEHICLE_NAME_LENGTH} caracteres`,
    "errors.vehicleModelInvalid":
      "El modelo solo puede tener letras, números, espacios, puntos y guiones",
    "errors.yearRequired": "El año es obligatorio",
    "errors.yearInvalid": "El año debe tener 4 dígitos",
    "errors.yearFuture": "El año no puede ser mayor al actual",
    "errors.yearTooOld": `El vehículo no puede tener más de ${MAX_VEHICLE_AGE} años`,
    "errors.colorRequired": "Selecciona el color",
    "errors.capacityRequired": "La capacidad es obligatoria",
    "errors.capacityInvalid": "La capacidad debe ser un número entero",
    "errors.capacityTooLow": `El vehículo debe tener mínimo ${MIN_CAPACITY} puestos para pasajeros`,
    "errors.capacityTooHigh": `La capacidad máxima es de ${MAX_CAPACITY} pasajeros`,
    "errors.capacityXl": `La categoría XL exige mínimo ${XL_MIN_CAPACITY} pasajeros`,
    "errors.vehiclePhotoRequired": "La foto del vehículo es obligatoria",
  },

  en: {
    "tabs.personal": "1. Personal",
    "tabs.vehicle": "2. Vehicle",
    "tabs.documents": "3. Documents",

    "common.next": "Next",
    "common.done": "Done",
    "select.placeholder": "Select an option",
    "date.placeholder": "Select a date",
    "photo.takePhoto": "Take photo",
    "photo.chooseFromGallery": "Choose from gallery",
    "photo.permissionDenied": "You must grant permission to add the photo.",
    "photo.pickError": "The photo could not be loaded. Please try again.",

    "login.title": "Log in",
    "login.subtitle": "Log in with your mobile number or your email",
    "login.methodPhone": "Phone",
    "login.methodEmail": "Email",
    "login.email": "Email",
    "login.emailPlaceholder": "name@example.com",
    "login.notFoundPhone": "We couldn't find an account with this number.",
    "login.notFoundEmail": "We couldn't find an account with this email.",
    "login.noAccount": "Don't have an account?",
    "login.createAccount": "Create account",
    "password.title": "Enter your password",
    "password.label": "Password",
    "password.show": "Show",
    "password.hide": "Hide",
    "password.signIn": "Log in",
    "password.forgot": "Forgot your password?",
    "password.resetSent":
      "We sent you an email to reset your password. Check your spam folder too.",
    "signup.title": "Create your account",
    "signup.subtitle": "Then you can log in with your email or your phone.",
    "signup.confirmPassword": "Confirm password",
    "signup.passwordHint": "At least 8 characters, with letters and numbers",
    "signup.submit": "Create account",
    "errors.passwordRequired": "Enter the password",
    "errors.passwordTooShort": "The password must have at least 8 characters",
    "errors.confirmPasswordRequired": "Confirm the password",
    "errors.passwordMismatch": "The passwords don't match",
    "auth.wrongPassword": "The password is not correct",
    "auth.tooManyRequests": "Too many attempts. Wait a few minutes and try again.",
    "auth.network": "No connection. Check your internet and try again.",
    "auth.emailInUse": "There is already an account with this email",
    "auth.phoneInUse": "There is already an account with this number",
    "auth.notConfigured": "The database is not set up. Check the .env file.",
    "auth.permissionDenied":
      "The database rejected the request. Check the Firestore rules.",
    "auth.failed": "Something went wrong. Please try again.",
    "login.country": "Country",
    "login.searchCountry": "Search country or code",
    "login.noCountries": "No matching countries",
    "login.phone": "Mobile number",
    "login.phonePlaceholder": "Mobile number",
    "login.digitsExact": "Must have {count} digits",
    "login.digitsRange": "Must have {min} to {max} digits",
    "login.continue": "Continue",
    "errors.countryRequired": "Select your country",
    "errors.loginPhoneRequired": "Enter your mobile number",
    "errors.loginPhoneInvalid": "The number can only contain digits",
    "errors.loginPhoneLength": "The number does not match the selected country",

    "personal.profilePhoto": "Profile photo",
    "personal.name": "Full name",
    "personal.namePlaceholder": "E.g. Tamiro Solano",
    "personal.documentId": "ID number",
    "personal.documentIdPlaceholder": "6 to 10 digits",
    "personal.phone": "Mobile number",
    "personal.phonePlaceholder": "E.g. 3001234567",
    "personal.birthDate": "Date of birth",
    "personal.gender": "Gender",
    "personal.email": "Email",
    "personal.emailPlaceholder": "email@example.com",
    "personal.language": "Language",

    "gender.female": "Female",
    "gender.male": "Male",
    "gender.non_binary": "Non-binary",
    "gender.not_specified": "Prefer not to say",

    "errors.profilePhotoRequired": "A profile photo is required",
    "errors.nameRequired": "Full name is required",
    "errors.nameTooLong": `Name can have at most ${MAX_NAME_LENGTH} characters`,
    "errors.nameInvalid": "Name can only contain letters and spaces",
    "errors.documentIdRequired": "ID number is required",
    "errors.documentIdInvalid":
      "ID number must have 6 to 10 digits and not start with 0",
    "errors.phoneRequired": "Mobile number is required",
    "errors.phoneInvalid": "Mobile number must have 10 digits and start with 3",
    "errors.birthDateRequired": "Date of birth is required",
    "errors.birthDateInvalid": "Date of birth is not valid",
    "errors.birthDateUnderage": `You must be at least ${MIN_DRIVER_AGE} years old`,
    "errors.genderRequired": "Select your gender",
    "errors.emailRequired": "Email is required",
    "errors.emailInvalid": "Enter a valid email, for example name@domain.com",
    "errors.languageRequired": "Select your language",

    "documents.licenseSection": "Driver's license",
    "documents.licenseNumber": "License number",
    "documents.licenseNumberPlaceholder": "E.g. 1234567890",
    "documents.licensePhoto": "Photo of the license",
    "documents.licenseExpiry": "License expiration date",
    "documents.soatSection": "SOAT (mandatory insurance)",
    "documents.soatPhoto": "Photo of the SOAT",
    "documents.soatExpiry": "SOAT expiration date",
    "documents.techReviewSection": "Vehicle inspection",
    "documents.techReviewPhoto": "Photo of the certificate",
    "documents.techReviewExpiry": "Inspection expiration date",
    "documents.techReviewNotRequired":
      "Your vehicle is a {year} model: it does not need an inspection yet.",
    "documents.techReviewUnknownYear":
      "Enter the vehicle year in tab 2 to know whether you need an inspection.",
    "documents.paymentsSection": "Payments",
    "documents.mercadoPagoEmail": "Your Mercado Pago account email",
    "documents.mercadoPagoEmailHint":
      "This is where you would receive your payments. The app does not store bank accounts or cards.",
    "documents.terms":
      "I accept the terms and conditions, including the {percent}% fee the platform charges per trip.",
    "documents.submit": "Submit registration",
    "documents.completeAllTabs": "Complete all tabs",
    "documents.pendingTabs": "Still missing: {tabs}",
    "documents.showPending": "Show what is missing in this tab",

    "errors.licenseNumberRequired": "License number is required",
    "errors.licenseNumberInvalid": "License number can only contain digits",
    "errors.licensePhotoRequired": "A photo of the license is required",
    "errors.licenseExpiryRequired": "License expiration date is required",
    "errors.licenseExpired": "The license must expire after today",
    "errors.soatPhotoRequired": "A photo of the SOAT is required",
    "errors.soatExpiryRequired": "SOAT expiration date is required",
    "errors.soatExpired": "The SOAT must expire after today",
    "errors.techReviewPhotoRequired":
      "A photo of the inspection certificate is required",
    "errors.techReviewExpiryRequired":
      "Inspection expiration date is required",
    "errors.techReviewExpired": "The inspection must expire after today",
    "errors.expiryInvalid": "The date is not valid",
    "errors.mercadoPagoEmailRequired": "Mercado Pago email is required",
    "errors.mercadoPagoEmailInvalid":
      "Enter a valid email, for example name@domain.com",
    "errors.termsRequired": "You must accept the terms to submit",

    "verify.title": "Confirm email",
    "verify.heading": "Confirm your email",
    "verify.willSendTo":
      "To finish your registration we will send a 6-digit code to {email}.",
    "verify.sentTo": "We sent a 6-digit code to {email}.",
    "verify.expiresIn": "It expires in {minutes} minutes.",
    "verify.sendCode": "Send code",
    "verify.sending": "Sending…",
    "verify.code": "Verification code",
    "verify.confirm": "Confirm and submit registration",
    "verify.verifying": "Verifying…",
    "verify.resend": "Resend code",
    "verify.resendIn": "Resend code in {seconds} s",
    "verify.changeEmail": "Change email",
    "verify.error.email_invalido": "The email in tab 1 is not valid",
    "verify.error.espera":
      "Wait {seconds} seconds before requesting another code",
    "verify.error.sin_codigo": "Request a code first",
    "verify.error.vencido": "The code expired. Request a new one",
    "verify.error.demasiados_intentos":
      "Too many attempts. Request a new code",
    "verify.error.codigo_incorrecto":
      "The code is incorrect. You have {attempts} attempts left",
    "verify.error.codigo_invalido": "The code must have 6 digits",
    "verify.error.correo_no_enviado":
      "The email could not be sent. Please try again",
    "verify.error.sin_backend":
      "The code server is not set up in the .env file (EXPO_PUBLIC_BACKEND_API_URL)",
    "verify.error.sin_conexion":
      "Could not reach the server. Check that it is running and on the same Wi-Fi network",
    "verify.error.generico": "Something went wrong. Please try again",

    "verifyLogin.heading": "Confirm it's you",
    "verifyLogin.sending": "We are sending a 6-digit code to {email}.",
    "verifyLogin.sentTo":
      "For your security we sent a 6-digit code to {email}. Enter it to log in.",
    "verifyLogin.notSent": "We could not send the code to {email}.",
    "verifyLogin.confirm": "Confirm and log in",
    "verifyLogin.checkSpam":
      "Didn't get it? Check your spam or promotions folder.",

    "save.saving": "Saving…",
    "save.notConfigured":
      "Firebase or Cloudinary is not set up in the .env file.",
    "save.photoFailed":
      "The photo could not be uploaded. Check your connection and try again.",
    "save.permissionDenied":
      "The database rejected the save. Check the Firestore rules.",
    "save.failed":
      "The data could not be saved. Check your connection and try again.",

    // AI-assisted: see docs/AI_LOG.md #54
    "form.charCount": "{count}/{max}",
    "form.maxLengthReached": "You reached the limit of {max} characters",
    "personal.fromAccount": "It's the one on your account, it can't be changed here",
    "login.checking": "Checking…",
    "password.signingIn": "Logging in…",
    "signup.creating": "Creating account…",
    "errors.nameIncomplete": "Enter your first and last name",
    "errors.documentIdRepeated": "That ID number is not valid",
    "errors.loginPhoneNotMobile":
      "That is not a mobile number (in Colombia they start with 3)",
    "errors.loginPhoneFake": "That number doesn't look real",
    "errors.passwordTooLong": `The password can have at most ${MAX_PASSWORD_LENGTH} characters`,
    "errors.passwordWeak": "Use letters and numbers in the password",
    "errors.passwordSpaces": "The password can't start or end with spaces",
    "errors.passwordHasEmail": "The password can't contain your email",
    "errors.licenseNumberLength": "License number must have 6 to 15 digits",
    "errors.expiryTooFar": "That date is too far away. Check the document.",

    // Tab 2: vehicle
    "vehicle.category": "Category",
    "vehicle.plate": "License plate",
    "vehicle.platePlaceholder": "E.g. ABC123",
    "vehicle.make": "Make",
    "vehicle.makePlaceholder": "E.g. Chevrolet",
    "vehicle.model": "Model",
    "vehicle.modelPlaceholder": "E.g. Spark GT",
    "vehicle.year": "Year",
    "vehicle.yearPlaceholder": "E.g. 2020",
    "vehicle.color": "Color",
    "vehicle.capacity": "Passenger capacity",
    "vehicle.capacityPlaceholder": `${MIN_CAPACITY} to ${MAX_CAPACITY}`,
    "vehicle.capacityPlaceholderXl": `${XL_MIN_CAPACITY} to ${MAX_CAPACITY}`,
    "vehicle.photo": "Vehicle photo (the plate must be visible)",
    "category.economy": "Economy",
    "category.xl": "XL",
    "category.premium": "Premium",
    "color.white": "White",
    "color.black": "Black",
    "color.gray": "Gray",
    "color.silver": "Silver",
    "color.red": "Red",
    "color.blue": "Blue",
    "color.other": "Other",
    "errors.categoryRequired": "Select the category",
    "errors.plateRequired": "License plate is required",
    "errors.plateInvalid": "The plate must have the format ABC123",
    "errors.vehicleMakeRequired": "Make is required",
    "errors.vehicleMakeTooLong": `Make can have at most ${MAX_VEHICLE_NAME_LENGTH} characters`,
    "errors.vehicleMakeInvalid": "Make can only contain letters, spaces and hyphens",
    "errors.vehicleModelRequired": "Model is required",
    "errors.vehicleModelTooLong": `Model can have at most ${MAX_VEHICLE_NAME_LENGTH} characters`,
    "errors.vehicleModelInvalid":
      "Model can only contain letters, numbers, spaces, dots and hyphens",
    "errors.yearRequired": "Year is required",
    "errors.yearInvalid": "Year must have 4 digits",
    "errors.yearFuture": "Year can't be later than the current one",
    "errors.yearTooOld": `The vehicle can't be more than ${MAX_VEHICLE_AGE} years old`,
    "errors.colorRequired": "Select the color",
    "errors.capacityRequired": "Capacity is required",
    "errors.capacityInvalid": "Capacity must be a whole number",
    "errors.capacityTooLow": `The vehicle must have at least ${MIN_CAPACITY} passenger seats`,
    "errors.capacityTooHigh": `The maximum capacity is ${MAX_CAPACITY} passengers`,
    "errors.capacityXl": `XL requires at least ${XL_MIN_CAPACITY} passengers`,
    "errors.vehiclePhotoRequired": "A vehicle photo is required",
  },
};

// Si la clave no existe se devuelve tal cual (texto que no es una clave).
export const translate = (language, key) => {
  if (key == null) return key;
  return strings[language]?.[key] ?? strings[DEFAULT_LANGUAGE][key] ?? key;
};
