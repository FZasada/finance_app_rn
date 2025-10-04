# Finanzen App

Eine React Native App zur Verwaltung von persönlichen Finanzen mit Mehrbenutzer-Haushaltsfunktionen.

## Features

- 🌍 **Mehrsprachigkeit**: Unterstützung für Deutsch, Englisch, Polnisch und Niederländisch
- 💰 **Budget-Tracking**: Monatliche Budgets festlegen und überwachen
- 📊 **Dashboard**: Übersicht über Ausgaben, Einkommen und Ersparnisse
- 🏠 **Haushalte**: Gemeinsame Finanzverwaltung für mehrere Benutzer
- 📱 **Push-Benachrichtigungen**: Warnungen bei Budgetüberschreitungen
- 📈 **Visualisierungen**: Charts und Grafiken zur Ausgabenanalyse
- 🔐 **Sicherheit**: Benutzerauthentifizierung mit Supabase

## Technologien

- **Frontend**: React Native mit Expo
- **Backend**: Supabase (Datenbank + Authentifizierung)
- **Navigation**: Expo Router
- **Internationalisierung**: react-i18next
- **Charts**: react-native-chart-kit
- **UI**: React Native Komponenten

## Setup

### Voraussetzungen

- Node.js (Version 18 oder höher)
- npm oder yarn
- Expo CLI
- Supabase Account

### Installation

1. **Repository klonen und Abhängigkeiten installieren:**
   ```bash
   git clone <repository-url>
   cd finanzen-app
   npm install
   ```

2. **Supabase Setup:**
   - Erstellen Sie ein neues Projekt auf [supabase.com](https://supabase.com)
   - Gehen Sie zu den Projekteinstellungen > API
   - Kopieren Sie die Project URL und anon public key
   - Führen Sie das SQL-Script aus: 
     - Gehen Sie zu SQL Editor in Supabase
     - Kopieren Sie den Inhalt von `supabase_setup.sql` und führen Sie ihn aus

3. **Umgebungsvariablen konfigurieren:**
   - Öffnen Sie `lib/supabase.ts`
   - Ersetzen Sie `YOUR_SUPABASE_URL` mit Ihrer Project URL
   - Ersetzen Sie `YOUR_SUPABASE_ANON_KEY` mit Ihrem anon public key

4. **App starten:**
   ```bash
   npm start
   ```

### Development

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web
npm run web
```

## Projektstruktur

```
finanzen-app/
├── app/                    # App Router Screens
│   ├── (tabs)/            # Tab Navigation
│   │   ├── index.tsx      # Dashboard
│   │   ├── transactions.tsx
│   │   ├── budget.tsx
│   │   ├── household.tsx
│   │   └── settings.tsx
│   ├── auth/              # Authentifizierung
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── _layout.tsx
├── contexts/              # React Contexts
│   ├── AuthContext.tsx
│   └── HouseholdContext.tsx
├── lib/                   # Utilities
│   ├── supabase.ts       # Supabase Konfiguration
│   ├── i18n.ts           # Internationalisierung
│   └── translations/     # Übersetzungsdateien
├── components/           # Wiederverwendbare Komponenten
└── assets/              # Bilder und Fonts
```

## Datenbank Schema

### Tabellen

- **households**: Haushaltsinformationen
- **household_members**: Benutzer-Haushalt-Zuordnungen
- **budgets**: Monatliche Budgets pro Haushalt
- **transactions**: Ein- und Ausgaben
- **categories**: Kategorien für Transaktionen

### Row Level Security

Die Datenbank nutzt Supabase RLS (Row Level Security) um sicherzustellen, dass Benutzer nur auf ihre eigenen Daten zugreifen können.

## Verwendung

### Erste Schritte

1. **Registrierung**: Erstellen Sie ein neues Benutzerkonto
2. **Haushalt erstellen**: Erstellen Sie einen neuen Haushalt oder treten Sie einem bestehenden bei
3. **Budget festlegen**: Legen Sie Ihr monatliches Budget fest
4. **Transaktionen hinzufügen**: Erfassen Sie Ihre Einnahmen und Ausgaben
5. **Dashboard nutzen**: Überwachen Sie Ihre Finanzen im Dashboard

### Haushalte

- **Admin-Rolle**: Kann Haushalt verwalten und löschen
- **Mitglied-Rolle**: Kann Transaktionen hinzufügen und Budget einsehen
- **Einladungen**: Nutzen Sie die Haushalts-ID als Einladungscode

### Mehrsprachigkeit

- Sprachwechsel in den Einstellungen
- Unterstützte Sprachen: Deutsch, Englisch, Polnisch, Niederländisch
- Automatische Erkennung der Gerätesprache

## Zukünftige Features

- [ ] Erweiterte Kategorieverwaltung
- [ ] Ausgaben-Erinnerungen
- [ ] Export-Funktionen (PDF, CSV)
- [ ] Erweiterte Analytics
- [ ] Dunkles Theme
- [ ] Biometrische Authentifizierung
- [ ] Offline-Synchronisation

## Beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit Ihre Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffnen Sie einen Pull Request

## Lizenz

Dieses Projekt ist unter der MIT Lizenz lizenziert - siehe die [LICENSE](LICENSE) Datei für Details.

## Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im Repository oder kontaktieren Sie uns direkt.