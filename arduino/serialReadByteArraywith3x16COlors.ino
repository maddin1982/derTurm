
int led = 13;
byte inData[16]; // Allocate some space for the string
byte inByte=-1; // Where to store the character read
byte index = 0; // Index into array; where to store the character

// the setup routine runs once when you press reset:
void setup() {  
  Serial.begin(115200);
  // initialize the digital pin as an output.
  pinMode(led, OUTPUT);     
}

void readSerial() {
    while (Serial.available() > 0) // Don't read unless there you know there is data
    {
        if(index < 16) // One less than the size of the array
        {
            inByte = Serial.read(); // Read a character
            inData[index] = inByte; // Store it
            index++; // Increment where to write next
            //inData[index] = '\0'; // Null terminate the string
        }
    }
    index=0;
}


// the loop routine runs over and over again forever:
void loop() {
   readSerial();
   if(((int)inData[0])>0)    
      digitalWrite(led, HIGH);   // turn the LED on (HIGH is the voltage level)
   else            
      digitalWrite(led, LOW);    // turn the LED off by making the voltage LOW

}