#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char* ssid = "SEU_WIFI";
const char* password = "SENHA";

const char* server = "http://192.168.1.7:3000/update";

WiFiClient client;

void setup() {
  Serial.begin(9600);

  Serial.println("\nIniciando...");

  WiFi.begin(ssid, password);

  Serial.print("Conectando ao WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("\nEnviando dados...");

    HTTPClient http;

    http.begin(client, server);
    http.addHeader("Content-Type", "application/json");

    String json = "{\"vagas\":[true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false]}";

    Serial.print("JSON enviado: ");
    Serial.println(json);

    int httpCode = http.POST(json);

    Serial.print("HTTP Code: ");
    Serial.println(httpCode);

    if (httpCode > 0) {
      String response = http.getString();
      Serial.print("Resposta servidor: ");
      Serial.println(response);
    }

    http.end();

  } else {
    Serial.println("WiFi desconectado!");
  }

  delay(5000);
}