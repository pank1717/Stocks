# 🚀 Plan d'Améliorations - Niveaux 1 & 2

## 📋 Vue d'ensemble

**10 améliorations majeures** à implémenter sur le code actuel (main).

---

## ✅ NIVEAU 1 - Améliorations RAPIDES (5 fonctionnalités)

### 1. 🔔 Notifications Email Stock Faible
**Durée estimée:** 1-2h

**Fonctionnalités:**
- Configuration SMTP dans l'application
- Email automatique quand stock < seuil
- Template HTML professionnel
- Liste des articles en alerte
- Fréquence configurable (quotidien, hebdo)

**Fichiers à créer:**
- `email-service.js` - Service d'envoi d'emails
- `email-templates/` - Templates HTML
- Route API `/api/settings/email` - Configuration

---

### 2. 📊 Graphique Historique par Article
**Durée estimée:** 1-2h

**Fonctionnalités:**
- Graphique ligne montrant l'évolution du stock
- Période sélectionnable (7j, 30j, 90j, 1an)
- Affichage entrées/sorties
- Tendance prévisionnelle
- Export du graphique en image

**Fichiers à modifier:**
- `script.js` - Ajouter fonction `showItemHistoryChart()`
- `index.html` - Ajouter modal avec graphique Chart.js
- `server.js` - Route `/api/items/:id/history-stats`

---

### 3. 🔍 Filtres Sauvegardés
**Durée estimée:** 1h

**Fonctionnalités:**
- Sauvegarder une recherche/filtre
- Liste des filtres favoris
- Application en 1 clic
- Partage entre utilisateurs (admin)
- Nombre d'utilisations trackées

**Fichiers à modifier:**
- `script.js` - Gestion filtres sauvegardés
- Table BDD `saved_filters`
- Interface bouton "⭐ Sauvegarder ce filtre"

---

### 4. 📱 Export Excel Amélioré
**Durée estimée:** 2h

**Fonctionnalités:**
- Export .xlsx (pas CSV)
- Mise en forme automatique (couleurs, bordures)
- Formules Excel (totaux, moyennes)
- Plusieurs feuilles (Articles, Historique, Stats)
- Graphiques Excel intégrés
- Logo entreprise

**Dépendances:**
- `npm install exceljs`

**Fichiers à créer:**
- `excel-export.js` - Service d'export

---

### 5. 🏷️ Impression Étiquettes en Masse
**Durée estimée:** 2h

**Fonctionnalités:**
- Sélection multiple d'articles
- Format planches A4 (Avery 5160, etc.)
- QR Code + Nom + ID
- Aperçu avant impression
- Format PDF prêt à imprimer
- Configuration taille étiquettes

**Dépendances:**
- `npm install pdfkit` (déjà installé pour QR)

**Fichiers à créer:**
- `label-printer.js` - Génération planches étiquettes

---

## ✅ NIVEAU 2 - Fonctionnalités UTILES (5 fonctionnalités)

### 6. 📦 Gestion Commandes Fournisseurs
**Durée estimée:** 4-5h

**Fonctionnalités:**
- Créer bon de commande
- États: Brouillon, Envoyée, Reçue, Annulée
- Ajouter articles + quantités
- Calcul total automatique
- Réception partielle/complète
- Mise à jour stock automatique à réception
- Historique des commandes
- Export PDF bon de commande
- Recherche/filtrage commandes

**Tables BDD à créer:**
- `purchase_orders` (id, supplier_id, status, total, date, notes)
- `purchase_order_items` (order_id, item_id, quantity, price)

**Fichiers à créer:**
- `purchase-orders.js` - Module gestion commandes
- Routes API `/api/purchase-orders/*`
- Interface complète dans index.html

---

### 7. 🔄 Mouvements Inter-Emplacements
**Durée estimée:** 3h

**Fonctionnalités:**
- Déplacer articles entre emplacements
- Traçabilité complète (qui, quand, pourquoi)
- Génération feuille de transfert PDF
- Historique des transferts
- Validation réception (optionnel)
- Statistiques par emplacement

**Tables BDD:**
- `location_transfers` (id, item_id, from_location, to_location, quantity, user, date, notes)

**Fichiers:**
- Module `transfers.js`
- Routes `/api/transfers/*`
- Interface modale

---

### 8. 👤 Réservations d'Équipement
**Durée estimée:** 4h

**Fonctionnalités:**
- Calendrier de disponibilité
- Réserver pour date future
- Gestion conflits (même article, même période)
- Notifications rappel (email)
- États: Réservé, En cours, Terminé, Annulé
- Historique réservations
- Vue calendrier mensuel

**Tables BDD:**
- `reservations` (id, item_id, user, start_date, end_date, status, notes)

**Dépendances:**
- Interface calendrier (FullCalendar ou custom)

**Fichiers:**
- Module `reservations.js`
- Routes `/api/reservations/*`
- Vue calendrier

---

### 9. 📈 Dashboard Personnalisable
**Durée estimée:** 4h

**Fonctionnalités:**
- Widgets déplaçables (drag & drop)
- Bibliothèque de widgets:
  - Stats KPIs
  - Graphiques (camembert, ligne, barre)
  - Listes (alertes, derniers mouvements)
  - Calendrier maintenances
  - Top articles
- Sauvegarder layouts
- Plusieurs dashboards (perso, équipe, direction)
- Export PDF dashboard
- Refresh automatique

**Dépendances:**
- `gridstack.js` ou `muuri` pour drag & drop

**Fichiers:**
- Module `dashboard-builder.js`
- Table `dashboard_layouts`

---

### 10. 🔔 Centre Notifications Amélioré
**Durée estimée:** 3h

**Fonctionnalités:**
- Notifications intelligentes:
  - Stock faible
  - Retour prêt en retard
  - Maintenance à venir
  - Garantie expire bientôt
  - Commande reçue
  - Réservation confirmée
- Priorités (info, warning, critical)
- Marquage lu/non lu
- Filtrage par type
- Son/vibration (optionnel)
- Persistence en BDD
- Badge compteur temps réel

**Tables BDD:**
- `notifications` (id, user_id, type, title, message, priority, read, created_at)

**Fichiers:**
- Module `notification-center.js`
- Service background qui génère notifications

---

## 📊 Progression Estimée

```
NIVEAU 1 (5 amélioration) : 7-9 heures
NIVEAU 2 (5 fonctionnalités): 18-21 heures

TOTAL: 25-30 heures de développement
```

## 🎯 Plan d'Exécution

### Phase 1 - Préparation (30 min)
- [x] Installer dépendances (nodemailer, exceljs, etc.)
- [ ] Créer structure de dossiers
- [ ] Mise à jour BDD (nouvelles tables)

### Phase 2 - Niveau 1 (8h)
1. [ ] Notifications Email (2h)
2. [ ] Graphiques Historique (2h)
3. [ ] Filtres Sauvegardés (1h)
4. [ ] Export Excel (2h)
5. [ ] Étiquettes Masse (2h)

### Phase 3 - Niveau 2 (20h)
6. [ ] Commandes Fournisseurs (5h)
7. [ ] Mouvements Inter-Emplacements (3h)
8. [ ] Réservations (4h)
9. [ ] Dashboard Personnalisable (4h)
10. [ ] Notifications Améliorées (3h)

### Phase 4 - Finalisation (2h)
- [ ] Tests complets
- [ ] Documentation
- [ ] Commit & Push

---

## 📦 Dépendances à installer

```bash
npm install nodemailer exceljs pdfkit
```

---

## 🗂️ Nouvelles Tables BDD

```sql
-- Commandes fournisseurs
CREATE TABLE purchase_orders (...)
CREATE TABLE purchase_order_items (...)

-- Transferts
CREATE TABLE location_transfers (...)

-- Réservations
CREATE TABLE reservations (...)

-- Filtres sauvegardés
CREATE TABLE saved_filters (...)

-- Notifications
CREATE TABLE notifications (...)

-- Dashboards
CREATE TABLE dashboard_layouts (...)
```

---

## 📝 Documentation

Chaque fonctionnalité aura :
- Guide utilisateur (screenshots)
- Documentation technique
- Exemples d'utilisation

---

**Début de l'implémentation : Maintenant !** 🚀
