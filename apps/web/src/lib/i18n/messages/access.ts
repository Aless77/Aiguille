const fr = {
  configurationError:
    "La configuration administrateur est incomplète : identifiant et mot de passe requis, secret de session d’au moins 32 caractères. Hors développement local, le mot de passe doit comporter au moins 16 caractères. Après modification du fichier .env, recréez le service web Docker.",
  title: "Demander l’accès à Aiguille",
  privacyDetails:
    "L’accès au site nécessite une validation manuelle. Nous conservons vos motivations, votre provenance déclarée, les marques qui vous intéressent et la décision jusqu’à la suppression de votre compte. Ces réponses sont visibles uniquement par l’administrateur. Les avis et listes partagés sont visibles uniquement des membres approuvés. L’administration utilise un cookie de session de 8 heures et un compteur de tentatives de connexion par fenêtre de 15 minutes.",
  intro:
    "Aiguille est un espace privé et gratuit. Connectez-vous puis présentez votre demande : l’administrateur décidera de votre accès au site.",
  signIn: "Se connecter pour demander un accès",
  motivation: "Pourquoi souhaitez-vous accéder à Aiguille ?",
  motivationHint: "Entre 20 et 2 000 caractères. Ne communiquez aucune information sensible.",
  origin: "D’où venez-vous et comment avez-vous découvert Aiguille ?",
  brands: "Quelles marques vous intéressent ?",
  submit: "Envoyer ma demande",
  pending:
    "Votre demande est en attente de validation. Revenez sur cette page pour connaître la décision ; aucun e-mail automatique n’est envoyé.",
  rejected: "Votre demande n’a pas été acceptée. L’administrateur pourra réexaminer sa décision.",
  approved: "Votre accès est accepté.",
  enter: "Entrer sur le site",
  privacy:
    "Vos réponses sont visibles uniquement par l’administrateur. Elles sont supprimées avec votre compte.",
  account: "Gérer ou supprimer mon compte",
  admin: "Administration des accès",
  adminIntro:
    "Connectez-vous avec les identifiants administrateur définis dans la configuration privée du site.",
  username: "Identifiant",
  password: "Mot de passe",
  login: "Se connecter",
  logout: "Se déconnecter de l’administration",
  error:
    "La demande n’a pas abouti. Vérifiez les champs ou les identifiants. Après trop de tentatives, patientez 15 minutes.",
  empty: "Aucune demande pour le moment.",
  approve: "Accepter l’accès",
  reject: "Refuser / retirer l’accès",
  pendingLabel: "En attente",
  approvedLabel: "Accepté",
  rejectedLabel: "Refusé",
};
type Messages = { [K in keyof typeof fr]: string };
const en: Messages = {
  configurationError:
    "Administrator configuration is incomplete: username and password are required, with a session secret of at least 32 characters. Outside local development, the password must be at least 16 characters. Recreate the Docker web service after editing .env.",
  title: "Request access to Aiguille",
  privacyDetails:
    "Access requires manual approval. Your motivation, stated origin, brands of interest and the decision are stored until you delete your account. Only the administrator can see these answers. Shared reviews and lists are visible only to approved members. Administration uses an 8-hour session cookie and a login attempt counter with a 15-minute window.",
  intro:
    "Aiguille is a free private space. Sign in and submit your request for administrator approval.",
  signIn: "Sign in to request access",
  motivation: "Why would you like access to Aiguille?",
  motivationHint: "20–2,000 characters. Do not share sensitive information.",
  origin: "Where are you from and how did you discover Aiguille?",
  brands: "Which brands interest you?",
  submit: "Submit my request",
  pending:
    "Your request is awaiting approval. Return here to check the decision; no automatic email is sent.",
  rejected: "Your request was declined. The administrator can reconsider the decision.",
  approved: "Your access has been approved.",
  enter: "Enter the site",
  privacy: "Only the administrator can see your answers. They are deleted with your account.",
  account: "Manage or delete my account",
  admin: "Access administration",
  adminIntro: "Sign in using the administrator credentials set in the private site configuration.",
  username: "Username",
  password: "Password",
  login: "Sign in",
  logout: "Sign out of administration",
  error:
    "Unable to complete the request. Check your fields or credentials. After too many attempts, wait 15 minutes.",
  empty: "No requests yet.",
  approve: "Approve access",
  reject: "Decline / revoke access",
  pendingLabel: "Pending",
  approvedLabel: "Approved",
  rejectedLabel: "Declined",
};
export const access = {
  fr,
  en,
  de: {
    configurationError:
      "Die Administratorkonfiguration ist unvollständig: Benutzername, Passwort und ein Sitzungsschlüssel mit mindestens 32 Zeichen sind erforderlich. Außerhalb der lokalen Entwicklung muss das Passwort mindestens 16 Zeichen haben. Nach Änderungen an .env den Docker-Webdienst neu erstellen.",
    privacyDetails:
      "Der Zugang erfordert eine manuelle Genehmigung. Motivation, Herkunft, interessierende Marken und Entscheidung bleiben bis zur Kontolöschung gespeichert und sind nur für den Administrator sichtbar. Geteilte Bewertungen und Listen sind nur für zugelassene Mitglieder sichtbar. Die Verwaltung verwendet ein Sitzungscookie für 8 Stunden und einen Versuchszähler mit einem Zeitfenster von 15 Minuten.",
    intro:
      "Aiguille ist ein kostenloser privater Bereich. Melden Sie sich an und stellen Sie einen Zugangsantrag zur Prüfung durch den Administrator.",
    motivationHint: "20 bis 2.000 Zeichen. Geben Sie keine sensiblen Informationen an.",
    pending:
      "Ihr Antrag wartet auf Prüfung. Besuchen Sie diese Seite erneut, um die Entscheidung zu sehen; es wird keine automatische E-Mail versendet.",
    rejected: "Ihr Antrag wurde abgelehnt. Der Administrator kann die Entscheidung erneut prüfen.",
    approved: "Ihr Zugang wurde genehmigt.",
    privacy:
      "Nur der Administrator kann Ihre Antworten sehen. Sie werden mit Ihrem Konto gelöscht.",
    account: "Mein Konto verwalten oder löschen",
    admin: "Zugangsverwaltung",
    adminIntro:
      "Melden Sie sich mit den in der privaten Website-Konfiguration festgelegten Administrator-Zugangsdaten an.",
    logout: "Von der Verwaltung abmelden",
    error:
      "Der Vorgang ist fehlgeschlagen. Prüfen Sie Ihre Angaben oder Zugangsdaten. Warten Sie nach zu vielen Versuchen 15 Minuten.",
    empty: "Noch keine Anträge.",
    approve: "Zugang genehmigen",
    reject: "Zugang ablehnen / entziehen",
    title: "Zugang zu Aiguille beantragen",
    signIn: "Anmelden und Zugang beantragen",
    motivation: "Warum möchten Sie Aiguille nutzen?",
    origin: "Woher kommen Sie und wie haben Sie Aiguille entdeckt?",
    brands: "Welche Marken interessieren Sie?",
    submit: "Antrag senden",
    enter: "Website öffnen",
    username: "Benutzername",
    password: "Passwort",
    login: "Anmelden",
    pendingLabel: "Ausstehend",
    approvedLabel: "Genehmigt",
    rejectedLabel: "Abgelehnt",
  },
  it: {
    configurationError:
      "Configurazione amministratore incompleta: servono nome utente, password e un segreto di sessione di almeno 32 caratteri. Fuori dallo sviluppo locale la password deve avere almeno 16 caratteri. Ricrea il servizio web Docker dopo aver modificato .env.",
    privacyDetails:
      "L’accesso richiede approvazione manuale. Motivazioni, provenienza, marchi e decisione sono conservati fino all’eliminazione dell’account e visibili solo all’amministratore. Recensioni e liste condivise sono visibili solo ai membri approvati. L’amministrazione usa un cookie di sessione di 8 ore e un contatore dei tentativi con una finestra di 15 minuti.",
    intro:
      "Aiguille è uno spazio privato e gratuito. Accedi e presenta la tua richiesta all’amministratore.",
    motivationHint: "Da 20 a 2.000 caratteri. Non comunicare informazioni sensibili.",
    pending:
      "La richiesta è in attesa di approvazione. Torna su questa pagina per conoscere la decisione; non viene inviata alcuna e-mail automatica.",
    rejected: "La richiesta non è stata accettata. L’amministratore può rivedere la decisione.",
    approved: "Il tuo accesso è stato approvato.",
    privacy: "Solo l’amministratore può vedere le risposte. Sono eliminate insieme all’account.",
    account: "Gestisci o elimina il mio account",
    admin: "Amministrazione degli accessi",
    adminIntro:
      "Accedi con le credenziali amministratore definite nella configurazione privata del sito.",
    logout: "Esci dall’amministrazione",
    error:
      "Operazione non riuscita. Verifica i campi o le credenziali. Dopo troppi tentativi, attendi 15 minuti.",
    empty: "Nessuna richiesta al momento.",
    approve: "Approva l’accesso",
    reject: "Rifiuta / revoca l’accesso",
    title: "Richiedi l’accesso ad Aiguille",
    signIn: "Accedi per richiedere l’accesso",
    motivation: "Perché desideri accedere ad Aiguille?",
    origin: "Da dove vieni e come hai scoperto Aiguille?",
    brands: "Quali marchi ti interessano?",
    submit: "Invia la richiesta",
    enter: "Entra nel sito",
    username: "Nome utente",
    password: "Password",
    login: "Accedi",
    pendingLabel: "In attesa",
    approvedLabel: "Approvato",
    rejectedLabel: "Rifiutato",
  },
  es: {
    configurationError:
      "Configuración de administrador incompleta: se necesitan usuario, contraseña y un secreto de sesión de al menos 32 caracteres. Fuera del desarrollo local la contraseña debe tener al menos 16 caracteres. Recrea el servicio web de Docker después de modificar .env.",
    privacyDetails:
      "El acceso requiere aprobación manual. Motivación, procedencia, marcas y decisión se conservan hasta eliminar la cuenta y solo son visibles para el administrador. Opiniones y listas compartidas solo son visibles para miembros aprobados. La administración utiliza una cookie de sesión de 8 horas y un contador de intentos con una ventana de 15 minutos.",
    intro:
      "Aiguille es un espacio privado y gratuito. Inicia sesión y presenta tu solicitud al administrador.",
    motivationHint: "De 20 a 2.000 caracteres. No compartas información sensible.",
    pending:
      "Tu solicitud está pendiente de aprobación. Vuelve aquí para consultar la decisión; no se envía ningún correo automático.",
    rejected: "Tu solicitud no ha sido aceptada. El administrador puede reconsiderar la decisión.",
    approved: "Tu acceso ha sido aprobado.",
    privacy: "Solo el administrador puede ver tus respuestas. Se eliminan con tu cuenta.",
    account: "Gestionar o eliminar mi cuenta",
    admin: "Administración de accesos",
    adminIntro:
      "Inicia sesión con las credenciales de administrador definidas en la configuración privada del sitio.",
    logout: "Cerrar sesión de administración",
    error:
      "No se pudo completar la solicitud. Comprueba los campos o las credenciales. Tras demasiados intentos, espera 15 minutos.",
    empty: "Todavía no hay solicitudes.",
    approve: "Aprobar acceso",
    reject: "Rechazar / revocar acceso",
    title: "Solicitar acceso a Aiguille",
    signIn: "Inicia sesión para solicitar acceso",
    motivation: "¿Por qué deseas acceder a Aiguille?",
    origin: "¿De dónde eres y cómo descubriste Aiguille?",
    brands: "¿Qué marcas te interesan?",
    submit: "Enviar solicitud",
    enter: "Entrar en el sitio",
    username: "Usuario",
    password: "Contraseña",
    login: "Iniciar sesión",
    pendingLabel: "Pendiente",
    approvedLabel: "Aprobado",
    rejectedLabel: "Rechazado",
  },
} satisfies Record<string, Messages>;
