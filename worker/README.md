# Envoi du PDF d'estimation par email (Brevo + Cloudflare Worker)

Le site génère le PDF de façon invisible et l'envoie à ce Worker, qui :
1. envoie au **client** un email avec le PDF en pièce jointe,
2. envoie à **Kevin** une notification.

La clé API reste secrète (côté Worker), jamais dans le site.

## 1. Brevo (compte gratuit, 300 emails/jour)
1. Créer un compte sur https://www.brevo.com
2. **Vérifier un expéditeur** : Senders, Domains & Dedicated IPs → *Senders* → *Add a sender*
   → mettre l'adresse d'envoi (ex. ton email) → cliquer le lien de validation reçu par email.
3. **Clé API** : menu profil → *SMTP & API* → *API Keys* → *Generate a new API key* (v3). La copier.

## 2. Cloudflare Worker (compte gratuit)
1. Créer un compte sur https://dash.cloudflare.com → *Workers & Pages* → *Create application* → *Create Worker*.
2. *Edit code* → coller tout le contenu de `eval-mailer.js` → *Deploy*.
3. *Settings* → *Variables and Secrets* → ajouter :
   - `BREVO_API_KEY` (type **Secret**) = la clé Brevo
   - `SENDER_EMAIL` = l'adresse expéditeur vérifiée dans Brevo
   - `SENDER_NAME` = `Kevin Lamidi`
   - `NOTIFY_EMAIL` = l'adresse où tu veux recevoir les notifications
   - `ALLOW_ORIGIN` = `https://lamidimmo.github.io`
4. Copier l'URL du Worker (ex. `https://eval-mailer.TON-SOUS-DOMAINE.workers.dev`).

## 3. Brancher le site
Dans `app.js` (racine), renseigner la constante :
```js
var EVAL_WORKER_URL = 'https://eval-mailer.TON-SOUS-DOMAINE.workers.dev';
```
Puis committer/pousser. Tant que cette URL est vide, le site retombe sur la notification
Web3Forms (sans email PDF au client).

## Remarque déliverabilité
Sans domaine vérifié, l'email part « au nom de » une adresse personnelle : il peut arriver
en spam (politiques DMARC d'iCloud/Gmail). Pour une délivrabilité optimale, vérifier un
**domaine** dans Brevo (enregistrements DNS) plutôt qu'un simple expéditeur.
