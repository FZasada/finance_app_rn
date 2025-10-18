# Daily Expense Reminder Feature

## Übersicht

Diese neue Funktion ermöglicht es Benutzern, tägliche Erinnerungen zu erhalten, um das Eintragen von Ausgaben und Einnahmen nicht zu vergessen.

## Implementierte Funktionen

### 1. NotificationService Erweiterung (`lib/notificationService.ts`)
- **Neue Interfaces:**
  - `DailyReminderSettings`: Einstellungen für tägliche Erinnerungen
  - Erweiterte `NotificationData` um `daily_reminder` Type

- **Neue Methoden:**
  - `scheduleDailyReminder()`: Planen täglicher Erinnerungen
  - `cancelDailyReminder()`: Abbrechen der täglichen Erinnerungen
  - `getDailyReminderSettings()`: Laden der Einstellungen aus AsyncStorage
  - `saveDailyReminderSettings()`: Speichern der Einstellungen

### 2. UI-Komponente (`components/DailyReminderSettings.tsx`)
- **Features:**
  - Ein/Ausschalten der täglichen Erinnerungen
  - Zeitauswahl für Erinnerungen (DateTimePicker)
  - Theme-kompatibles Design
  - Automatische Berechtigungsanfrage für Notifications

### 3. Mehrsprachige Unterstützung
- **Sprachen:** Deutsch, Englisch, Niederländisch, Polnisch
- **Neue Übersetzungskeys:**
  - `dailyReminder.title`
  - `dailyReminder.description`
  - `dailyReminder.enableReminders`
  - `dailyReminder.reminderTime`
  - `dailyReminder.defaultMessages[]`

### 4. AuthContext Integration (`contexts/AuthContext.tsx`)
- **Automatische Initialisierung:** Erinnerungen werden beim Login aktiviert
- **Automatische Bereinigung:** Erinnerungen werden beim Logout deaktiviert

### 5. Settings-Integration (`app/(tabs)/settings.tsx`)
- Neue Sektion für tägliche Erinnerungen in den Einstellungen
- Direkte Integration der DailyReminderSettings-Komponente

## Technische Details

### Abhängigkeiten
- `@react-native-community/datetimepicker`: Für die Zeitauswahl
- `expo-notifications`: Für lokale Benachrichtigungen
- `@react-native-async-storage/async-storage`: Für persistente Speicherung

### Notification-Zeitplanung
- Verwendet `Notifications.CalendarTriggerInput` für wiederholende tägliche Benachrichtigungen
- Standardzeit: 20:00 Uhr
- Benutzerdefinierte Zeitauswahl möglich

### Nachrichtenvarianten
Die App wählt zufällig aus verschiedenen freundlichen Erinnerungsnachrichten:
- "Vergiss nicht, deine heutigen Ausgaben einzutragen! 📝"
- "Hast du heute schon alle Transaktionen erfasst? 💸"
- "Zeit für einen kurzen Finanz-Check! 🔍"
- "Denk daran, deine Einkäufe zu dokumentieren! 🛒"
- "Kurze Erinnerung: Ausgaben des Tages eintragen! ✨"

### Datenspeicherung
- Einstellungen werden lokal in AsyncStorage gespeichert
- Key: `daily_reminder_settings`
- Format: JSON mit enabled, time und messages Feldern

## Benutzerworkflow

1. **Aktivierung:** Benutzer geht zu Einstellungen → Daily Reminders
2. **Einrichtung:** Schaltet Erinnerungen ein, wählt gewünschte Zeit
3. **Berechtigung:** App fragt automatisch nach Notification-Berechtigung
4. **Planung:** Erinnerung wird für die gewählte Zeit geplant
5. **Erhalt:** Benutzer erhält täglich zur gewählten Zeit eine freundliche Erinnerung

## Zukünftige Erweiterungen

Mögliche Verbesserungen:
- Wochenend-Optionen (nur Wochentage vs. täglich)
- Anpassbare Erinnerungsnachrichten
- Mehrere Erinnerungen pro Tag
- Smart Reminders basierend auf letzter Transaktion
- Erinnerungen für spezifische Kategorien