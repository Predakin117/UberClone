// AI-assisted: see docs/AI_LOG.md #9
// Textos de la app en español e inglés. Las claves son iguales en los dos idiomas
// (lo comprueba strings.test.js). Los validadores devuelven claves "errors.*".
import { MAX_NAME_LENGTH, MIN_DRIVER_AGE } from "../validation/personalInfo";

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

    // Login ({count}, {min} and {max} are replaced by LoginScreen)
    "login.title": "Inicia sesión",
    "login.subtitle": "Ingresa tu número de celular para continuar",
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
    "errors.documentIdInvalid": "El documento debe tener entre 6 y 10 dígitos",
    "errors.phoneRequired": "El número de celular es obligatorio",
    "errors.phoneInvalid": "El celular debe tener 10 dígitos",
    "errors.birthDateRequired": "La fecha de nacimiento es obligatoria",
    "errors.birthDateInvalid": "La fecha de nacimiento no es válida",
    "errors.birthDateUnderage": `Debes tener al menos ${MIN_DRIVER_AGE} años`,
    "errors.genderRequired": "Selecciona el género",
    "errors.emailRequired": "El correo electrónico es obligatorio",
    "errors.emailInvalid":
      "Ingresa un correo válido, por ejemplo nombre@dominio.com",
    "errors.languageRequired": "Selecciona el idioma",
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
    "login.subtitle": "Enter your mobile number to continue",
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
    "errors.documentIdInvalid": "ID number must have 6 to 10 digits",
    "errors.phoneRequired": "Mobile number is required",
    "errors.phoneInvalid": "Mobile number must have 10 digits",
    "errors.birthDateRequired": "Date of birth is required",
    "errors.birthDateInvalid": "Date of birth is not valid",
    "errors.birthDateUnderage": `You must be at least ${MIN_DRIVER_AGE} years old`,
    "errors.genderRequired": "Select your gender",
    "errors.emailRequired": "Email is required",
    "errors.emailInvalid": "Enter a valid email, for example name@domain.com",
    "errors.languageRequired": "Select your language",
  },
};

// Si la clave no existe se devuelve tal cual. Así los mensajes que todavía están
// escritos directamente en español (pestañas 2 y 3) se siguen mostrando.
export const translate = (language, key) => {
  if (key == null) return key;
  return strings[language]?.[key] ?? strings[DEFAULT_LANGUAGE][key] ?? key;
};
