
#include "FastLED.h"
#define UDP_TX_PACKET_MAX_SIZE 860

#define DATA_PIN 3
#define CLOCK_PIN 13
#define NUM_LEDS 16

char colorValues[NUM_LEDS*3];
byte index = 0;
byte inByte=-1;


// Define the array of leds
CRGB leds[NUM_LEDS];
int r,g,b;

void setup() {
  Serial.begin(115200);
  pinMode(9, INPUT_PULLUP);
  pinMode(6, OUTPUT);
  FastLED.addLeds<WS2811, DATA_PIN, RGB>(leds, NUM_LEDS);
}

void loop() {
 
    if (Serial.available() > 0) {
      // read 3 bytes per LED from serial port
      char bytesRead = Serial.readBytes(colorValues, NUM_LEDS*3);
      // check we got a full complement of bytes
      if (bytesRead < NUM_LEDS*3) {
        // something went wrong, abandon this loop
        return;
      }
      // feed the data to the leds
      for(int i=0; i<NUM_LEDS; i++) {
        int d = i*3;
        r=(int)colorValues[d];   
        g=(int)colorValues[d+1];   
        b=(int)colorValues[d+2];   
        leds[i] = CRGB(g,r,b);
      }
       FastLED.show();
    }
}

