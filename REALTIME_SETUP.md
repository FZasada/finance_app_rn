# Real-time Updates und Push Notifications Setup

## Benötigte Pakete installieren

```bash
npx expo install expo-notifications
```

## 1. Datenbankeinrichtung

Führen Sie die SQL Migration aus:
```sql
-- Führen Sie den Inhalt von migrations/create_push_tokens_table.sql in Ihrer Supabase Datenbank aus
```

## 2. Real-time Features aktivieren

In Supabase:
1. Gehen Sie zu Database > Replication
2. Stellen Sie sicher, dass Real-time für folgende Tabellen aktiviert ist:
   - `transactions`
   - `budgets`
   - `user_push_tokens`

## 3. App-Funktionen

### Live Updates
- Automatische Aktualisierung des Dashboards und der Transaktionsliste
- Verwendung von Supabase Real-time für sofortige Updates
- Funktioniert für alle Benutzer im gleichen Haushalt
- Transactions Tab lädt automatisch nach dem Hinzufügen neuer Transaktionen

### Push Notifications
- Lokale Benachrichtigungen wenn andere Haushaltsmitglieder Transaktionen hinzufügen/ändern
- Benachrichtigungen für Budget-Änderungen
- Funktioniert auch wenn die App im Hintergrund läuft

### Automatische Synchronisation
- Dashboard lädt automatisch neue Daten bei Änderungen
- Transaktionsliste aktualisiert sich live
- Budget-Tracking in Echtzeit

## 4. Verwendung

Die Real-time Features sind automatisch aktiviert:

```tsx
// Dashboard und Transactions verwenden bereits den useRealtimeUpdates Hook
const { isConnected, activeSubscriptions } = useRealtimeUpdates({
  onTransactionUpdate: () => loadData(),
  onBudgetUpdate: () => loadData(),
  enableNotifications: true,
});
```

## 5. Features entfernt

- Budget Tab wurde aus der Navigation entfernt
- Budget-Verwaltung ist jetzt direkt im Dashboard integriert