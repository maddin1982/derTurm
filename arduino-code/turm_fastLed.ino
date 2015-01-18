/**
 * DMX-Controller f�r den Talking Tower
 *
 * Nick Schwarzenberg,
 * 01/2015, v1.0
 */

#include "FastLED.h"
// DMX-Bibliothek
//#include <LeoDMX.class.h>

// DMX-Instanz erzeugen
//LeoDMX DMX;

// Versionsnummer
#define VERSION "1.0"


#define DATA_PIN 3
#define CLOCK_PIN 13
#define NUM_LEDS 16


CRGB leds[NUM_LEDS];
int r,g,b;

/* :: Einstellungen :: */


// Host-Baudrate
const unsigned long hostBaud = 115200;

// Timeout zwischen DMX-Frames [ms]
const unsigned short hostDataGap = 3;

// auf Host warten?
const bool waitForSerial = false;


// Anzahl der verwendeten Kan�le (16x4)
const int channelCount = 64;


// Timeout f�r Empfang [ms]
// (kommen f�r diese Zeit keine Daten an, l�uft eine Notfallanimation)
const unsigned lastUpdateTimeout = 5000;

// Parameter f�r Notfallanimation
const unsigned char emergencyColorB[4] = { 220, 90, 0, 80 }; // RGBW-Farbcode
const unsigned char emergencyColorA[4] = { 0, 0, 3, 12 };    // RGBW-Farbcode
const unsigned int  emergencyFadeDuration = 5000;            // Blenddauer




/* :: ver�nderliche Werte :: */


// Zeitpunkt letzter empfangener Daten [ms]
unsigned long lastUpdateTime;

// Array f�r Kanaldaten
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
    
    // ung�ltige Werte korrigieren
    if ( factor > 1 )  factor = 1;
    if ( factor < 0 )  factor = 0;
    
    // Faktor umkehren? (f�r Blende in andere Richtung)
    if ( invertFactor )  factor = 1 - factor;
    
    // aktuellen RGBW-Farbwert berechnen (Werte zwischen A und B interpolieren)
    char red   = (unsigned char)( (emergencyColorA[0]-emergencyColorB[0]) * factor + emergencyColorB[0] );
    char green = (unsigned char)( (emergencyColorA[1]-emergencyColorB[1]) * factor + emergencyColorB[1] );
    char blue  = (unsigned char)( (emergencyColorA[2]-emergencyColorB[2]) * factor + emergencyColorB[2] );
    char white = (unsigned char)( (emergencyColorA[3]-emergencyColorB[3]) * factor + emergencyColorB[3] );
    
    // Farbwert f�r alle RGBW-Strahler �bernehmen
    for ( int spot = 0; spot < channelCount/4; spot++ )
    {
        channels[ spot*4 + 0 ] = red;
        channels[ spot*4 + 1 ] = green;
        channels[ spot*4 + 2 ] = blue;
        channels[ spot*4 + 3 ] = white;
    }
    
    // Daten an Strahler senden
    //DMX.send( (unsigned char*) channels, channelCount );
    
    // Ende der Blende
    if ( factor == 0 or factor == 1 )
    {
        // Richtung umkehren
        invertFactor = !invertFactor;
        
        // Startzeit neuer Blende zur�cksetzen
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
    
     pinMode(9, INPUT_PULLUP);
    pinMode(6, OUTPUT);
    FastLED.addLeds<WS2811, DATA_PIN, RGB>(leds, NUM_LEDS);
    
    Serial.setTimeout( hostDataGap );
    
    // Hallo sagen
    Serial.println( "TurmDMX v" VERSION );
    
    // Bereitschaft mit eingebauter LED zeigen
    digitalWrite( 13, HIGH );
    
    // alle Strahler ausschalten
    //DMX.null();
    
    // Zeitpunkt f�r letzte �bertragung initialisieren
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
        //DMX.send( (unsigned char*) channels, count );
        int d=0;
        for(int i=0; i<16; i++) {
          
          r=(int)channels[d];   
          g=(int)channels[d+1];   
          b=(int)channels[d+2];   
          leds[i] = CRGB(g,r,b);
          d = d+4;
        }
        FastLED.show();
        
        // zur�ckmelden, wie viel gesendet wurde
        Serial.print( "OK:" );
        Serial.println( count );
        
        // merken, wann zuletzt etwas gesendet wurde
        lastUpdateTime = millis();
    }
    
    // nichts gelesen
    else
    {
        // pr�fen, ob ein Fehler vorliegt (lange nichts empfangen?)
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
