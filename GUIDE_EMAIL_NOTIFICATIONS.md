# 📧 Guide - Notifications Email Stock Faible

## ✅ Ce qui a été implémenté

**Service Email complet** pour recevoir des alertes automatiques quand le stock est faible.

---

## 🚀 Comment utiliser

### **Étape 1 : Configurer votre SMTP**

#### Option A : Gmail (recommandé pour test)

1. Créer un mot de passe d'application Gmail :
   - Allez sur https://myaccount.google.com/apppasswords
   - Générez un mot de passe d'application

2. Configurer via API :

```bash
# Dans PowerShell ou terminal
curl -X POST http://localhost:3000/api/settings/email \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "user": "votre.email@gmail.com",
    "pass": "votre-mot-de-passe-app",
    "from": "stock@votreentreprise.com",
    "alertEmails": ["destinataire@example.com"]
  }'
```

#### Option B : Outlook/Office365

```bash
curl -X POST http://localhost:3000/api/settings/email \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "host": "smtp.office365.com",
    "port": 587,
    "user": "votre.email@outlook.com",
    "pass": "votre-mot-de-passe",
    "from": "stock@votreentreprise.com",
    "alertEmails": ["destinataire@example.com"]
  }'
```

#### Option C : SMTP Custom

```bash
curl -X POST http://localhost:3000/api/settings/email \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "host": "smtp.votreserveur.com",
    "port": 587,
    "user": "votre-user",
    "pass": "votre-pass",
    "from": "stock@example.com",
    "alertEmails": ["admin@example.com", "manager@example.com"]
  }'
```

---

### **Étape 2 : Tester la configuration**

```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"toEmail": "votre@email.com"}'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Email de test envoyé",
  "result": { "messageId": "..." }
}
```

Vérifiez votre boîte mail !

---

### **Étape 3 : Envoyer une alerte de stock faible**

```bash
curl -X POST http://localhost:3000/api/email/send-alert
```

**Résultat :**
```json
{
  "sent": true,
  "messageId": "...",
  "itemsCount": 3
}
```

Vous recevez un email avec :
- Tableau des articles en alerte
- Stock actuel vs seuil
- Statistiques (total alertes, stock épuisé, etc.)
- Lien vers l'application

---

## 📧 Exemple d'email reçu

```
⚠️ Alerte Stock Faible
3 article(s) nécessite(nt) votre attention

┌─────────────────────┬──────────┬────────┬──────────────┐
│ Article             │ Stock    │ Seuil  │ Emplacement  │
├─────────────────────┼──────────┼────────┼──────────────┤
│ iPhone 15 Pro       │    2     │   5    │ Armoire A    │
│ Switch Netgear      │    0     │   5    │ Bureau IT    │
│ ThinkPad X1         │    3     │   5    │ Armoire B    │
└─────────────────────┴──────────┴────────┴──────────────┘

📊 Résumé
- Articles en alerte: 3
- Stock épuisé: 1
- Stock faible: 2

[📦 Accéder à l'application]
```

---

## 🔧 Configuration avancée

### Variables d'environnement (optionnel)

Créer un fichier `.env` :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@email.com
SMTP_PASS=votre-mot-de-passe-app
SMTP_FROM=stock@example.com
ALERT_EMAILS=admin@example.com,manager@example.com
```

Le service les lira automatiquement au démarrage.

---

## ⚙️ Automatisation (à implémenter)

### Envoi quotidien automatique

À ajouter dans `server.js` :

```javascript
const cron = require('node-cron');

// Tous les jours à 8h
cron.schedule('0 8 * * *', async () => {
    const items = await getLowStockItems();
    if (items.length > 0) {
        await emailService.sendLowStockAlert(items);
    }
});
```

### Envoi hebdomadaire (lundi 9h)

```javascript
cron.schedule('0 9 * * 1', async () => {
    // Envoi hebdo
});
```

---

## 🐛 Dépannage

### Erreur : "Email service non configuré"

➜ Appelez d'abord `/api/settings/email`

### Erreur : "Authentication failed"

➜ Vérifiez vos identifiants SMTP  
➜ Gmail : utilisez un mot de passe d'application

### Erreur : "Connection timeout"

➜ Vérifiez le host et port  
➜ Vérifiez votre pare-feu

### Pas d'email reçu

➜ Vérifiez les spams  
➜ Testez avec `/api/email/test` d'abord

---

## 📝 TODO Interface utilisateur

À ajouter dans `index.html` :

- Modal "Paramètres Email"
- Formulaire de configuration SMTP
- Bouton "Tester"
- Bouton "Envoyer alerte maintenant"
- Planification automatique

---

## 🎯 Prochaines fonctionnalités

1. ✅ Notifications Email (fait)
2. ⏳ Export Excel amélioré
3. ⏳ Filtres sauvegardés
4. ⏳ Graphiques historique
5. ⏳ Étiquettes masse
6. ⏳ Commandes fournisseurs
7. ⏳ Transferts inter-emplacements
8. ⏳ Réservations
9. ⏳ Dashboard personnalisable
10. ⏳ Centre notifications

**1/10 terminé (10%)** 🎉
