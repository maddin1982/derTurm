#!/usr/bin/python
#encoding: utf-8

'''
Ein Ersatz für das dmxhost serial relay.
An den Nachrichten und Wartezeiten kann man rumspielen,
um fehlerhaftes Verhalten zu simulieren.
'''

from time import sleep
import sys

# Start
print "ready"
sys.stdout.flush()

while True:

    # Werte lesen
    sys.stdin.readline()

    # Verarbeitungszeit simulieren
    sleep(0.1)

    # (falsche) Bestätigung der gesendeten Daten
    print "OK:8"
    sys.stdout.flush()
