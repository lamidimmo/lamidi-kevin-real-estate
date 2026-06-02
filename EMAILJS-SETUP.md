# Envoi de l'estimation par email — EmailJS (gratuit, sans serveur)

Le site envoie l'estimation au **client** par email (valeurs dans le corps du message),
avec une **copie à toi** (Bcc). Les pièces jointes étant payantes sur EmailJS, on met
l'estimation directement dans le texte de l'email (souvent plus lisible qu'un PDF).

## 1. Compte + connexion Gmail
- Compte sur https://www.emailjs.com (gratuit, 200 emails/mois).
- *Email Services* → *Add New Service* → **Gmail** → *Connect Account* → autoriser.
  → **Service ID** (déjà fait : `service_gwait39`).

## 2. Modèle d'email (Email Templates → Auto-Reply → Create Template)
Champs :
- **To Email** : `{{to_email}}`
- **From Name** : `Kevin Lamidi`
- **Reply To** : `{{to_email}}`
- **Bcc** : ton adresse (pour recevoir une copie de chaque lead)
- **Subject** : `Votre estimation foncière`
- **Content** :
  ```
  Bonjour {{prenom}},

  Merci d'avoir utilisé mon estimateur foncier.

  Votre estimation indicative — {{commune}} :
  • Valeur de marché estimée : {{valeur}}
  • Fourchette : {{fourchette}}

  Estimation indicative et sans engagement ; je me tiens à votre disposition
  pour l'affiner selon les particularités de votre terrain.

  Au plaisir d'en discuter,
  Kevin Lamidi · +41 76 715 50 59

  —
  Coordonnées transmises : {{prenom}} {{nom}} · {{phone}} · {{to_email}}
  ```
- **PAS de pièce jointe** (payant sur EmailJS, inutile ici).
→ *Save*, noter le **Template ID**.

## 3. Clé publique
- *Account → General / API Keys* : copier la **Public Key**.
- *Account → Security* : autoriser le domaine `lamidimmo.github.io`.

## 4. Me transmettre
- **Public Key** et **Template ID** (le Service ID `service_gwait39` est déjà connu).

Je les renseigne dans `app.js` (objet `EMAILJS`) et je pousse. Tant qu'ils sont vides,
le site retombe sur la notification Web3Forms (toi notifié, résultat dévoilé).
