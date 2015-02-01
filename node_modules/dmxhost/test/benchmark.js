/**
 * Geschwindigkeitstest
 */

var DMX = require('../dmxhost.js');
DMX.log = true;
DMX.relayResponseTimeout = 100;

console.log( "[dmxhost benchmark]" );

DMX.spawn( null, function( error )
{
    if (error)
    {
        console.log( "Error:", error.code );
        return;
    }
    
    console.log( "Sending continously frames of 64 bytes, press Ctrl+C to abort..." );
    
    var white = Array.apply( null, new Array(64) ).map( function() { return 255; } );
    
    var start, counter;
    
    function next()
    {
        DMX.send( {data: white}, function( error )
        {
            if ( error )
            {
                console.log( "Error:", error.code );
                DMX.quit( null, function()
                {
                    process.exit();
                });
                return;
            }
            
            if ( counter % 8 == 0 )
            {
                var elapsed = (Date.now()-start) / 8;
                process.stdout.write( "\rFrame #" + pad( counter, 5 ) + " sent within " + pad( elapsed.toFixed(1), 4 ) + " ms (" + pad( Math.round( (1000/elapsed) ), 3 ) + " fps) " );
                start = Date.now();
            }
            
            counter++;
            setTimeout( next, 0 );
        });
    }
    
    start = Date.now();
    counter = 0;
    next();
    
    function pad( number, digits )
    {
        return ( number.toString().length >= digits ) ? number : pad( "0"+number, digits );
    }
});
