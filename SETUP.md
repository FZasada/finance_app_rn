# Konfigurationsanleitung

## Supabase Setup

### 1. Supabase Projekt erstellen
1. Gehen Sie zu [supabase.com](https://supabase.com)
2. Erstellen Sie ein neues Projekt
3. Warten Sie, bis die Datenbank bereit ist

### 2. Datenbank konfigurieren
1. Gehen Sie zum SQL Editor in Ihrem Supabase Dashboard
2. Kopieren Sie den Inhalt von `supabase_setup.sql`
3. Führen Sie das SQL-Skript aus

### 3. API-Schlüssel konfigurieren
1. Gehen Sie zu Settings > API in Ihrem Supabase Dashboard
2. Kopieren Sie die `Project URL` und `anon public` Schlüssel
3. Öffnen Sie `lib/supabase.ts` in der App
4. Ersetzen Sie:
   ```typescript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```
   Mit Ihren tatsächlichen Werten.

## App starten

```bash
# Abhängigkeiten installieren
npm install

# App im Entwicklungsmodus starten
npm start

# Für spezifische Plattformen:
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web Browser
```

## Erste Schritte

1. **Registrierung**: Erstellen Sie ein neues Konto
2. **Haushalt erstellen**: Erstellen Sie Ihren ersten Haushalt
3. **Budget festlegen**: Setzen Sie Ihr monatliches Budget
4. **Transaktionen hinzufügen**: Beginnen Sie mit der Erfassung Ihrer Ausgaben

## Wichtige Funktionen

### Haushalte
- **Admin**: Kann Haushalte verwalten und löschen
- **Mitglied**: Kann Transaktionen hinzufügen und Budgets einsehen
- **Einladung**: Nutzen Sie die Haushalts-ID als Einladungscode

### Mehrsprachigkeit
Die App unterstützt:
- Deutsch (de)
- Englisch (en) 
- Polnisch (pl)
- Niederländisch (nl)

### Sicherheit
- Row Level Security (RLS) in Supabase
- Benutzer können nur ihre eigenen Daten sehen
- Sichere Authentifizierung mit Supabase Auth

## Troubleshooting

### Häufige Probleme

1. **"Cannot connect to Supabase"**
   - Überprüfen Sie Ihre Supabase URL und API-Schlüssel
   - Stellen Sie sicher, dass Ihr Supabase Projekt läuft

2. **"Authentication failed"**
   - Überprüfen Sie, ob die E-Mail-Bestätigung aktiviert ist
   - Kontrollieren Sie die Authentifizierungs-Einstellungen in Supabase

3. **"No data showing"**
   - Überprüfen Sie die Row Level Security Policies
   - Stellen Sie sicher, dass die Tabellen korrekt erstellt wurden

4. **Charts nicht sichtbar**
   - Installieren Sie react-native-svg: `npm install react-native-svg`
   - Starten Sie die App neu

### Support
Bei weiteren Problemen erstellen Sie bitte ein Issue im Repository oder kontaktieren Sie uns direkt.