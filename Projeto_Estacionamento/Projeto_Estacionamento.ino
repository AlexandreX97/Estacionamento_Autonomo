#define NUM_VAGAS 20
#define DISTANCIA_OCUPADA 6

int trigPins[NUM_VAGAS] = {
  2,4,6,8,10,12,14,16,44,20,
  22,24,26,28,30,32,34,36,38,40
};

int echoPins[NUM_VAGAS] = {
  3,5,7,9,11,13,15,17,45,21,
  23,25,27,29,31,33,35,37,39,41
};

bool vagas[NUM_VAGAS];

void setup() {
  Serial.begin(9600);

  for(int i=0;i<NUM_VAGAS;i++){
    pinMode(trigPins[i], OUTPUT);
    pinMode(echoPins[i], INPUT);
  }
}

float medir(int trig, int echo){
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  long duracao = pulseIn(echo, HIGH);
  return duracao * 0.034 / 2;
}

void loop() {

  Serial.print("{\"vagas\":[");

  for(int i=0;i<NUM_VAGAS;i++){

    float d = medir(trigPins[i], echoPins[i]);
    vagas[i] = (d < DISTANCIA_OCUPADA);

    Serial.print(vagas[i] ? "true" : "false");

    if(i < NUM_VAGAS-1) Serial.print(",");
  }

  Serial.println("]}");

  delay(1000);
}