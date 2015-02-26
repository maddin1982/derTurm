/**
 * DMX-Controller für den Talking Tower
 * – wartet mit Betrieb auf Verbindung zur seriellen Schnittstelle
 * – erlaubt dem Host bis zu 20 Sekunden Ruhe, dann feuert der Timeout
 * – schaltet bei Timeout Pin 3 auf HIGH und hängt sich unwiderruflich auf
 *
 * nick@bitfasching.de
 * 01/2015, v2.0
 */


// DMX-Bibliothek
#include <LeoDMX.class.h>

// DMX-Instanz erzeugen
LeoDMX DMX;

// Versionsnummer
#define VERSION "2.0"




/* :: Einstellungen :: */


// Host-Baudrate
const unsigned long hostBaud = 115200;

// Timeout zwischen DMX-Frames [ms]
const unsigned short hostDataGap = 3;

// auf Host warten?
const bool waitForSerial = true;


// Anzahl der verwendeten Kanäle (16x4)
const int channelCount = 64;


// Timeout für Empfang [ms]
const unsigned lastUpdateTimeout = 20000;


// Pin für Notschalter
const int emergencyPin = 3;




/* :: veränderliche Werte :: */


// Zeitpunkt letzter empfangener Daten [ms]
unsigned long lastUpdateTime;

// Array für Kanaldaten
char channels[ channelCount ] = {0};




/* :: Arduino-Standardfunktionen :: */


// Hostverbindung aufbauen
void setup()
{
    // auf Schnittstelle warten
    while ( waitForSerial and !Serial );
    
    // Verbindung aufbauen
    Serial.begin( hostBaud );
    Serial.setTimeout( hostDataGap );
    
    // Hallo sagen
    Serial.println( "TurmDMX v" VERSION );
    Serial.print( lastUpdateTimeout/1000 );
    Serial.println( " seconds until timeout." );
    
    // alle Strahler ausschalten
    DMX.null();
    
    // Notfallschalter zurücksetzen
    digitalWrite( emergencyPin, LOW );
    pinMode( emergencyPin, OUTPUT );
    
    // Zeitpunkt für letzte Übertragung initialisieren
    lastUpdateTime = millis();
}


// auf Kanaldaten warten und weiterleiten
void loop()
{
    // versuchen, alle Kanalbytes zu lesen
    short count = Serial.readBytes( channels, channelCount );
    
    // falls Daten gelesen wurden
    if ( count > 0 )
    {
        // Daten weiterleiten
        DMX.send( (unsigned char*) channels, count );
        
        // zurückmelden, wie viel gesendet wurde
        Serial.print( "OK:" );
        Serial.println( count );
        
        // merken, wann zuletzt etwas gesendet wurde
        lastUpdateTime = millis();
    }
    
    // nichts gelesen
    else
    {
        // prüfen, ob ein Fehler vorliegt (lange nichts empfangen?)
        if ( millis()-lastUpdateTime > lastUpdateTimeout )
        {
            // Bescheid geben
            Serial.println( "Timeout!" );
            
            // Notschalter betätigen
            digitalWrite( emergencyPin, HIGH );
            
            // Zeitpunkt des Fehlers merken
            unsigned long errorTime = millis();
            
            // in Endlosschleife aufhängen
            while (true)
            {
                for ( int i = 0; i < 5; i++ )
                {
                    // mit interner LED bei 1 Hz blinken
                    blinkLED( 13, 1000 );
                }
                
                // alle 5 Sekunden anzeigen, wie lange der Fehler schon besteht
                Serial.print( "Locked since timeout " );
                Serial.print( (millis()-errorTime)/1000 );
                Serial.println( " seconds ago." );
            }
        }
    }
}




/* :: Helfer :: */


// LED an gegebenem Pin für übergebene Zyklusdauer ein- & ausschalten
void blinkLED( short pin, unsigned int cycleDuration )
{
    // für halben Zyklus einschalten
    digitalWrite( pin, HIGH );
    delay( cycleDuration / 2 );
    
    // für halben Zyklus ausschalten
    digitalWrite( pin, LOW );
    delay( cycleDuration / 2 );
}
