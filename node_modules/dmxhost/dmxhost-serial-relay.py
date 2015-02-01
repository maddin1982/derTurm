#!/usr/bin/python

'''
A minimal script for writing binary data to serial devices.

- writes "ready" to stdout when device is opened
- takes comma-separated decimal values on stdin,
  converts them to bytes and writes them raw to the serial device
  (CSV lines must be terminated with \n)
- responses from the device are dumped to stdout
- runs infinitely until receiving the string "quit" instead of a CSV line

nick@bitfasching.de
01/2015
'''

import sys
from serial import Serial, SerialException

''' Options '''

# arguments given?
if len(sys.argv) >= 3:
    # set options
    (  device, baud ) = ( sys.argv[1], sys.argv[2] )
else:
    # nope, print usage info
    print "Usage:", sys.argv[0], " DEVICE BAUD"
    exit(404)


''' Device '''

try:
    # open serial device with typical 8-bit settings and a tight timeout
    serial = Serial( device, baud, bytesize=8, parity='N', timeout=1 )
except SerialException as exception:
    # report error
    print "error:device"
    sys.stderr.write( str(exception) + "\n" )
    sys.stderr.flush()
    exit(502)

# say hello
print "ready"
sys.stdout.flush()


''' Relay Loop '''

# loop infinitely
while True:
    
    try:
        
        # read next line from stdin
        csv = sys.stdin.readline().strip()
        
        # check if input is a command to quit
        if csv == "quit": break
        
        # get list from csv
        decimals = csv.split( ',' )
        
        # make binary string
        data = ''
        for decimal in decimals: data += chr(int(decimal))
        
        # send to device
        serial.write( data )
        
        # read status
        status = serial.readline().strip()
        
        # print status line to stdout and flush
        print status
        sys.stdout.flush()
        
    except SerialException as exception:
        
        print "SerialException!"
        sys.stderr.write( str(exception) + "\n" )
        sys.stderr.flush()
        exit(500)
