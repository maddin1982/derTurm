/**
 * Einfacher Test für dmxhost.js.
 * Vom übergeordneten Verzeichnis aufrufen: nodejs test/test.js
 * oder den Pfad für DMX.relayPath anpassen.
 */

var DMX = require('../dmxhost.js');
DMX.log = true;
//DMX.relayPath = 'test/simulate.py';

console.log( "DMX.spawn()" );

DMX.spawn( null, function( error )
{
    if ( error )
    {
        console.log( "Error:", error );
        return;
    }
    console.log( "Relay spawned." );
    
    var data = [ 255, 255, 255, 255, 0, 0, 0, 0 ];
    
    console.log( "DMX.send() (8 bytes)" );
    
    DMX.send( {data: data}, function ( error )
    {
        !error && console.log( "Test data successfully sent." );
         error && console.log( "Error:", error );
        
        console.log( "Try to kill the relay! (Waiting for 20 secs.)" );
        
        setTimeout( function()
        {
            console.log( "DMX.quit()" );
            
            DMX.quit( null, function( error )
            {
                !error && console.log( "Done." );
                 error && console.log( "Error:", error );
            });
            
        }, 20000 );
    });
});

