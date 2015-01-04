#include <SPI.h>
#include <Ethernet.h>
#include <EthernetUdp.h>
#include "FastLED.h"
#define UDP_TX_PACKET_MAX_SIZE 860

#define DATA_PIN 3
#define CLOCK_PIN 13
#define NUM_LEDS 16
// Define the array of leds
CRGB leds[NUM_LEDS];

byte arduinoMac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress arduinoIP(192, 168, 2, 20); // desired IP for Arduino
unsigned int arduinoPort = 8888;      // port of Arduino

char packetBuffer[UDP_TX_PACKET_MAX_SIZE]; //buffer to hold incoming packet

EthernetUDP Udp;

void setup() {
  Serial.begin(9600);
  pinMode(9, INPUT_PULLUP);
  pinMode(6, OUTPUT);
  FastLED.addLeds<WS2811, DATA_PIN, RGB>(leds, NUM_LEDS);
  Ethernet.begin(arduinoMac,arduinoIP);
  Udp.begin(arduinoPort);
}

void loop() {
 readMessage();
 delay(10);
}

void readMessage(){
  int packetSize = Udp.parsePacket();
  int r,g,b,endPosition,startPosition,startPositionComma,endPositionComma=0;
  if(packetSize)
  {
    Udp.read(packetBuffer,UDP_TX_PACKET_MAX_SIZE);
    
    String stringOne = (String)packetBuffer;
   
    startPosition=0;  
    for(int i = 0; i < NUM_LEDS; i++) {  
      //parse message
      endPosition = stringOne.indexOf('|',startPosition); 
      String color=stringOne.substring(startPosition,endPosition);
      startPosition=endPosition+1;


       //parse rgb
      startPositionComma=0; 
      endPositionComma = color.indexOf(',',startPositionComma); 
      r=(color.substring(startPositionComma,endPositionComma)).toInt()*0.2;
      startPositionComma=endPositionComma+1;
      endPositionComma = color.indexOf(',',startPositionComma); 
      g=(color.substring(startPositionComma,endPositionComma)).toInt()*0.2;
      startPositionComma=endPositionComma+1;
      endPositionComma = color.indexOf(',',startPositionComma); 
      b=(color.substring(startPositionComma,endPositionComma)).toInt()*0.2;
      
      //somehow rgb is mixed up with fastled
      // r=g
      // g=r
      leds[i] = CRGB(g,r,b);
      FastLED.show();
    }
  }
}



