# Envoi du PDF d'estimation par email — EmailJS (sans serveur)

Le site génère le PDF de façon invisible et l'envoie via **EmailJS** :
le **client** reçoit l'email avec le PDF en pièce jointe, et **toi** une copie (Bcc).

## 1. Compte + connexion de ta boîte mail
1. Créer un compte sur https://www.emailjs.com (gratuit, 200 emails/mois).
2. **Email Services** → *Add New Service* → choisir ton fournisseur (Gmail, Outlook, iCloud…)
   → autoriser en 1 clic. Noter le **Service ID** (ex. `service_xxx`).

## 2. Modèle d'email (le point important)
**Email Templates** → *Create New Template*. Configurer :
- **To Email** : `{{to_email}}`
- **From Name** : `Kevin Lamidi`
- **Bcc** : ton adresse (pour recevoir une copie de chaque envoi)
- **Reply To** : `{{to_email}}`
- **Subject** : `Votre estimation foncière`
- **Content** (corps) :
  ```
  Bonjour {{prenom}},

  Merci d'avoir utilisé mon estimateur foncier. Vous trouverez votre
  estimation indicative en pièce jointe (PDF).

  Récapitulatif : {{commune}} — {{estimation}}

  Je reste à votre disposition pour en discuter.
  Kevin Lamidi · +41 76 715 50 59
  ```
- **Attachments** → *Add Attachment* → type **Variable Attachment** :
  - *Parameter Name* : `content`
  - *Filename* : `evaluation-terrain.pdf`

Enregistrer. Noter le **Template ID** (ex. `template_xxx`).

## 3. Clé publique + sécurité
- **Account → General / API Keys** : copier la **Public Key**.
- **Account → Security** : ajouter le domaine autorisé `lamidimmo.github.io`
  (empêche l'usage de ta clé ailleurs).

## 4. Me transmettre 3 identifiants
- **Public Key**
- **Service ID**
- **Template ID**

Je les renseigne dans `app.js` (objet `EMAILJS`) et je pousse. Tant qu'ils sont vides,
le site retombe sur la notification Web3Forms (sans PDF au client).
