/**
 * DMX-Controller für den Talking Tower
 *
 * Nick Schwarzenberg,
 * 01/2015, v1.0
 */


// DMX-Bibliothek
#include <LeoDMX.class.h>

// DMX-Instanz erzeugen
LeoDMX DMX;

// Versionsnummer
#define VERSION "1.0"




/* :: Einstellungen :: */


// Host-Baudrate
const unsigned long hostBaud = 115200;

// Timeout zwischen DMX-Frames [ms]
const unsigned short hostDataGap = 3;

// auf Host warten?
const bool waitForSerial = false;


// Anzahl der verwendeten Kanäle (16x4)
const int channelCount = 64;


// Timeout für Empfang [ms]
// (kommen für diese Zeit keine Daten an, läuft eine Notfallanimation)
const unsigned lastUpdateTimeout = 5000;

// Parameter für Notfallanimation
const unsigned char emergencyColorB[4] = { 220, 90, 0, 80 }; // RGBW-Farbcode
const unsigned char emergencyColorA[4] = { 0, 0, 3, 12 };    // RGBW-Farbcode
const unsigned int  emergencyFadeDuration = 5000;            // Blenddauer




/* :: veränderliche Werte :: */


// Zeitpunkt letzter empfangener Daten [ms]
unsigned long lastUpdateTime;

// Array für Kanaldaten
char channels[ channelCount ] = {0};

// Notfallmodus aktiv?
bool emergency = false;




/* :: Animation :: */


// schnell & dreckig: Notfallanimation
// (zyklisches Blenden zwischen zwei Farben)
void emergencyAnimation()
{
    // bleibende Variablen: Blendstartzeit und Invertierung
    static unsigned long fadeStartTime = 0;
    static bool          invertFactor  = false;
    
    // aktuellen Punkt in Blende linear bestimmen
    float factor = (float)( millis()-fadeStartTime ) / (float)emergencyFadeDuration;
    
    // ungültige Werte korrigieren
    if ( factor > 1 )  factor = 1;
    if ( factor < 0 )  factor = 0;
    
    // Faktor umkehren? (für Blende in andere Richtung)
    if ( invertFactor )  factor = 1 - factor;
    
    // aktuellen RGBW-Farbwert berechnen (Werte zwischen A und B interpolieren)
    char red   = (unsigned char)( (emergencyColorA[0]-emergencyColorB[0]) * factor + emergencyColorB[0] );
    char green = (unsigned char)( (emergencyColorA[1]-emergencyColorB[1]) * factor + emergencyColorB[1] );
    char blue  = (unsigned char)( (emergencyColorA[2]-emergencyColorB[2]) * factor + emergencyColorB[2] );
    char white = (unsigned char)( (emergencyColorA[3]-emergencyColorB[3]) * factor + emergencyColorB[3] );
    
    // Farbwert für alle RGBW-Strahler übernehmen
    for ( int spot = 0; spot < channelCount/4; spot++ )
    {
        channels[ spot*4 + 0 ] = red;
        channels[ spot*4 + 1 ] = green;
        channels[ spot*4 + 2 ] = blue;
        channels[ spot*4 + 3 ] = white;
    }
    
    // Daten an Strahler senden
    DMX.send( (unsigned char*) channels, channelCount );
    
    // Ende der Blende
    if ( factor == 0 or factor == 1 )
    {
        // Richtung umkehren
        invertFactor = !invertFactor;
        
        // Startzeit neuer Blende zurücksetzen
        fadeStartTime = millis();
    }
}




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
    
    // Bereitschaft mit eingebauter LED zeigen
    digitalWrite( 13, HIGH );
    
    // alle Strahler ausschalten
    DMX.null();
    
    // Zeitpunkt für letzte Übertragung initialisieren
    lastUpdateTime = millis();
}


// auf Kanaldaten warten und weiterleiten
void loop()
{
    // versuchen, alle Kanalbytes lesen
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
            // wenn noch nicht geschehen, Notfall einleiten!
            if ( !emergency )
            {
                // Bescheid geben
                Serial.println( "Timeout!" );
                
                // Status aktualisieren
                emergency = true;
            }
            else
            {
                // weiter abspielen
                emergencyAnimation();
            }
        }
        else
        {
            // (noch) kein Notfall
            emergency = false;
        }
    }
}
