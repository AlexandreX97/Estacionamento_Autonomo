// CONFIGURAÇÃO
#define NUM_VAGAS 20
#define DISTANCIA_OCUPADA 6
#define AMOSTRAS 3  // quantidade de leituras para média

int trigPins[NUM_VAGAS] = {
  2,4,6,8,10,12,14,48,44,20,
  22,24,26,28,30,32,34,36,38,40
};

int echoPins[NUM_VAGAS] = {
  3,5,7,9,11,13,15,49,45,21,
  23,25,27,29,31,33,35,37,39,41
};

bool vagas[NUM_VAGAS];



// SETUP
void setup() {
  Serial.begin(9600);

  for(int i=0;i<NUM_VAGAS;i++){
    pinMode(trigPins[i], OUTPUT);
    pinMode(echoPins[i], INPUT);
  }
}

// FUNÇÃO DE MEDIÇÃO COM MÉDIA
float medirMedia(int trig, int echo){
  float soma = 0;

  for(int i=0; i<AMOSTRAS; i++){
    digitalWrite(trig, LOW);
    delayMicroseconds(2);
    digitalWrite(trig, HIGH);
    delayMicroseconds(10);
    digitalWrite(trig, LOW);

    long duracao = pulseIn(echo, HIGH, 30000); // timeout 30ms

    if(duracao == 0) continue; // ignora erro

    float distancia = duracao * 0.034 / 2;
    soma += distancia;

    delay(5);
  }

  return soma / AMOSTRAS;
}



// LOOP PRINCIPAL
void loop() {

  Serial.print("{\"vagas\":[");

  for(int i=0;i<NUM_VAGAS;i++){

    float d = medirMedia(trigPins[i], echoPins[i]);

    // DEBUG (opcional)
    // Serial.print("D"); Serial.print(i); Serial.print(":"); Serial.println(d);

    // lógica de ocupação mais estável
    if(d > 0 && d < DISTANCIA_OCUPADA){
      vagas[i] = true;
    } else {
      vagas[i] = false;
    }

    Serial.print(vagas[i] ? "true" : "false");

    if(i < NUM_VAGAS-1) Serial.print(",");
  }

  Serial.println("]}");

  delay(1000);
}