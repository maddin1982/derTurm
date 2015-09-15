/**
 * Übergangslösung für Echtzeit-App ohne LightKeeper
 */


var util = require('util');

// Einstellungen
var config = {
    
    // Verbindung zu Server
    tube: {
        host: '37.187.39.90',
        port: 4889,
        reconnectAlways: true,
        reconnectDelay: 100,
    },
    
    // Mindestintervall für DMX-Ausgabe [ms]
    minInterval: 1000,
    
    // Frames protokollieren?
    log: process.argv[2] == 'log',
    
}

console.log( '\n' );
util.log( "Starten…" );
config.log && util.log( "Ausführliche Meldungen aktiviert." );

// DMX-Steuerung
var DMX = require('dmxhost');
DMX.relayPath = 'node_modules/dmxhost/'+DMX.relayPath;
DMX.relayResponseTimeout = 2000;
DMX.log = true;
DMX.spawn();

// Server-Verbindung
var Tube = require('tubemail').connect( config.tube, forwardData );
Tube.logger = function( message, level ) { level <= 2 && util.log( '[tubemail] '+message ); }

// Array für RGBW-Daten
var rgbw = [0];

// letzter Sendezeitpunkt
var lastUpdate = Date.now();

// Daten weiterleiten
function forwardData( error, data )
{
    if ( !error )
    {
        // Array erhalten?
        if ( data instanceof Array )
        {
            // RGB-Werte einfügen
            data.map( function( rgbWindow, index )
            {
                rgbw[ 4*index + 0 ] = Math.min( 255, rgbWindow[0] );
                rgbw[ 4*index + 1 ] = Math.min( 255, rgbWindow[1] );
                rgbw[ 4*index + 2 ] = Math.min( 255, rgbWindow[2] );
                rgbw[ 4*index + 3 ] = 0;
            });
            
            // Werte senden
            send( "Neu:", true );
            
            // Zeitpunkt merken
            lastUpdate = Date.now();
        }
        else
        {
            util.log( "[!] Empfangene Daten sind kein Array:", data );
        }
    }
    else
    {
        util.log( "[!] Fehler:", JSON.stringify(error) );
    }
}

// RGBW-Werte senden
function send( logMessage, showRGBW )
{
    if ( DMX.ready() )
    {
        DMX.send( { data: rgbw } );
        
        config.log && util.log( logMessage + ( showRGBW ? " "+JSON.stringify(rgbw) : '' ) );
    }
    else
    {
        util.log( "[!] Frame ausgelassen, DMX nicht bereit." );
    }
}

// Mindestintervall einhalten
setInterval( function refresh()
{
    if ( Date.now()-lastUpdate > config.minInterval )
    {
        // letzten Frame noch mal senden
        send( "Alter Frame…", false );
        
        // Zeitpunkt merken
        lastUpdate = Date.now();
    }
    
}, config.minInterval/10 );

// dreckige Notfallbehandlung
process.on( 'uncaughtException', function trouble( exception )
{
    util.log( "[!] EXCEPTION:", exception );
});
