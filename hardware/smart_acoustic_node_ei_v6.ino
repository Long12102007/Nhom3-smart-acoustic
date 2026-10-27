/*
 * Smart Acoustic Node — ESP32 + INMP441 + Edge Impulse + WiFi + Firebase 
 * - Đã tối ưu lại hàm đọc I2S để không bị treo CPU, giúp nút BOOT ăn ngay lập tức.
 */

#define EIDSP_QUANTIZE_FILTERBANK    0

#include <driver/i2s.h>
#include <WiFi.h>
#include <WebServer.h>
#include <EEPROM.h>
#include <FirebaseESP32.h>
#include <time.h>
#include <Baby-cry-detector_inferencing.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ============================================================
// 1. CẤU HÌNH HỆ THỐNG & BIẾN TOÀN CỤC
// ============================================================
#define EEPROM_SIZE 512
WebServer server(80);

String ssid = "";
String password = "";
String DEVICE_ID = "";

#define BOOT_BUTTON_PIN 0

const long gmtOffset_sec = 7 * 3600;
const int  daylightOffset_sec = 0;

#define FIREBASE_HOST   "baby-cry-monitor-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH   ""

FirebaseData   fbdo;
FirebaseAuth   auth;
FirebaseConfig config;

unsigned long lastOnlinePing = 0;
const unsigned long onlineInterval = 3000;
bool isConfigMode = false;

// ============================================================
// 2. CẤU HÌNH MIC I2S (INMP441)
// ============================================================
#define I2S_WS    15
#define I2S_SCK   14
#define I2S_SD    32
#define I2S_PORT  I2S_NUM_0

static float MIC_GAIN = 6.0f;

static const float CRY_ENTER_THRESHOLD = 0.80f;
static const float CRY_EXIT_THRESHOLD  = 0.50f;
static bool isCryingState = false;

static int16_t audio_buffer[EI_CLASSIFIER_RAW_SAMPLE_COUNT];
static bool debug_nn = false;

int microphone_audio_signal_get_data(size_t offset, size_t length, float *out_ptr)
{
    numpy::int16_to_float(&audio_buffer[offset], out_ptr, length);
    return 0;
}

bool record_one_window()
{
    size_t bytes_read = 0;
    size_t total_read = 0;
    const size_t total_bytes = EI_CLASSIFIER_RAW_SAMPLE_COUNT * sizeof(int16_t);

    while (total_read < total_bytes) {
        // Đổi portMAX_DELAY thành pdMS_TO_TICKS(50) để không bị treo CPU, giúp quét nút nhấn mượt mà
        esp_err_t err = i2s_read(I2S_PORT,
                                 (uint8_t *)audio_buffer + total_read,
                                 total_bytes - total_read,
                                 &bytes_read,
                                 pdMS_TO_TICKS(50));
        if (err != ESP_OK) {
            // Nếu lỗi đọc mic tạm thời, cho phép thoát ra để loop kiểm tra nút nhấn
            return false;
        }
        total_read += bytes_read;
    }

    if (MIC_GAIN != 1.0f) {
        for (size_t i = 0; i < EI_CLASSIFIER_RAW_SAMPLE_COUNT; i++) {
            int32_t v = (int32_t)(audio_buffer[i] * MIC_GAIN);
            if (v >  32767) v =  32767;
            if (v < -32768) v = -32768;
            audio_buffer[i] = (int16_t)v;
        }
    }
    return true;
}

void saveEEPROMString(int startAddr, String data) {
    for (int i = 0; i < data.length(); ++i) {
        EEPROM.write(startAddr + i, data[i]);
    }
    EEPROM.write(startAddr + data.length(), '\0');
    EEPROM.commit();
}

String readEEPROMString(int startAddr) {
    String data = "";
    char leitura;
    for (int i = 0; i < 96; ++i) {
        leitura = EEPROM.read(startAddr + i);
        if (leitura == '\0' || leitura == 255) break;
        data += leitura;
    }
    return data;
}

// ============================================================
// 3. GIAO DIỆN WEB SERVER CẤU HÌNH
// ============================================================
void handleRoot() {
    String html = "<html lang='vi'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
    html += "<title>Cấu hình ESP32</title>";
    html += "<style>body{font-family:Arial;background:#f4f5f7;padding:20px;text-align:center;}";
    html += ".card{background:#fff;padding:20px;border-radius:16px;max-width:360px;margin:auto;box-shadow:0 4px 10px rgba(0,0,0,0.1);text-align:left;}";
    html += "input{width:100%;padding:10px;margin:8px 0 16px 0;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;}";
    html += "button{width:100%;padding:12px;background:#21335b;color:#fff;border:none;border-radius:8px;font-weight:bold;font-size:15px;cursor:pointer;}";
    html += "h2{color:#21335b;text-align:center;margin-bottom:20px;}</style></head><body>";
    html += "<div class='card'><h2>Cài đặt ESP32</h2>";
    html += "<form action='/save' method='POST'>";
    html += "<label><b>Tên WiFi (SSID):</b></label><input type='text' name='ssid' required>";
    html += "<label><b>Mật khẩu WiFi:</b></label><input type='password' name='password'>";
    html += "<label><b>Node ID (vd: node_01):</b></label><input type='text' name='nodeid' placeholder='Nhập mã node...' required>";
    html += "<button type='submit'>Lưu & Kết nối</button>";
    html += "</form></div></body></html>";
    
    server.send(200, "text/html", html);
}

void handleSave() {
    ssid = server.arg("ssid");
    password = server.arg("password");
    DEVICE_ID = server.arg("nodeid");

    saveEEPROMString(0, ssid);
    saveEEPROMString(100, password);
    saveEEPROMString(200, DEVICE_ID);

    String html = "<html lang='vi'><head><meta charset='UTF-8'><title>Đã lưu</title>";
    html += "<style>body{font-family:Arial;background:#f4f5f7;padding:40px;text-align:center;}";
    html += ".card{background:#fff;padding:30px;border-radius:16px;max-width:360px;margin:auto;box-shadow:0 4px 10px rgba(0,0,0,0.1);}</style></head><body>";
    html += "<div class='card'><h2 style='color:#4caf50;'>Thành công!</h2>";
    html += "<p>Đã lưu cấu hình. Thiết bị đang khởi động lại...</p></div></body></html>";
    
    server.send(200, "text/html", html);
    delay(2000); 
    ESP.restart(); 
}

// ============================================================
// 4. SETUP
// ============================================================
void setup()
{
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

    Serial.begin(115200);
    delay(500);

    pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);

    EEPROM.begin(EEPROM_SIZE);

    ssid = readEEPROMString(0);
    password = readEEPROMString(100);
    DEVICE_ID = readEEPROMString(200);

    if (ssid == "" || DEVICE_ID == "") {
        isConfigMode = true;
        WiFi.softAP("BabyMonitor_Config", "12345678"); 
        IPAddress IP = WiFi.softAPIP();
        Serial.print("AP IP address: ");
        Serial.println(IP);

        server.on("/", handleRoot);
        server.on("/save", HTTP_POST, handleSave);
        server.begin();
        return;
    }

    WiFi.begin(ssid.c_str(), password.c_str());
    int retryWifi = 0;
    while (WiFi.status() != WL_CONNECTED && retryWifi < 30) {
        delay(500);
        Serial.print(".");
        retryWifi++;
    }

    if (WiFi.status() != WL_CONNECTED) {
        for (int i = 0; i < EEPROM_SIZE; ++i) EEPROM.write(i, 0);
        EEPROM.commit();
        ESP.restart();
    }
    Serial.println("\nWiFi connected!");

    configTime(gmtOffset_sec, daylightOffset_sec, "pool.ntp.org", "time.nist.gov");
    while (time(nullptr) < 1000000000) {
        delay(500);
    }

    config.database_url = FIREBASE_HOST;
    config.signer.test_mode = true;
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    const i2s_config_t i2s_config = {
        .mode = i2s_mode_t(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = EI_CLASSIFIER_FREQUENCY,
        .bits_per_sample = i2s_bits_per_sample_t(16),
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT, 
        .communication_format = i2s_comm_format_t(I2S_COMM_FORMAT_I2S | I2S_COMM_FORMAT_I2S_MSB),
        .intr_alloc_flags = 0,
        .dma_buf_count = 8,
        .dma_buf_len = 512,
        .use_apll = false
    };

    const i2s_pin_config_t pin_config = {
        .bck_io_num   = I2S_SCK,
        .ws_io_num    = I2S_WS,
        .data_out_num = -1,
        .data_in_num  = I2S_SD
    };

    i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_PORT, &pin_config);
}

// ============================================================
// 5. LOOP
// ============================================================
void loop()
{
    // Kiểm tra nút BOOT liên tục để reset cứng
    if (digitalRead(BOOT_BUTTON_PIN) == LOW) {
        unsigned long pressTime = millis();
        while (digitalRead(BOOT_BUTTON_PIN) == LOW) {
            if (millis() - pressTime > 3000) {
                Serial.println("\n[RESET] Dang xoa sach EEPROM...");
                for (int i = 0; i < EEPROM_SIZE; ++i) {
                    EEPROM.write(i, 0);
                }
                EEPROM.commit();
                delay(1000);
                ESP.restart();
            }
            delay(100);
        }
    }

    if (isConfigMode) {
        server.handleClient();
        return;
    }

    if (millis() - lastOnlinePing > onlineInterval) {
        lastOnlinePing = millis();
        if (WiFi.status() == WL_CONNECTED) {
            String statusPath = String("/devices/") + DEVICE_ID + "/status";
            String seenPath   = String("/devices/") + DEVICE_ID + "/lastSeen";

            if (Firebase.ready() && Firebase.getInt(fbdo, seenPath)) {
                time_t nowSeconds;
                time(&nowSeconds);
                Firebase.setString(fbdo, statusPath, "Online");
                Firebase.setInt(fbdo, seenPath, (int)nowSeconds);
            }
        }
    }

    if (!record_one_window()) {
        delay(50);
        return;
    }

    signal_t signal;
    signal.total_length = EI_CLASSIFIER_RAW_SAMPLE_COUNT;
    signal.get_data     = &microphone_audio_signal_get_data;

    ei_impulse_result_t result = { 0 };
    EI_IMPULSE_ERROR r = run_classifier(&signal, &result, debug_nn);

    if (r != EI_IMPULSE_OK) return;

    float crying_score = 0.0f;
    for (size_t ix = 0; ix < EI_CLASSIFIER_LABEL_COUNT; ix++) {
        if (strcmp(result.classification[ix].label, "crying") == 0) {
            crying_score = result.classification[ix].value;
        }
    }

    if (!isCryingState) {
        if (crying_score >= CRY_ENTER_THRESHOLD) {
            isCryingState = true;
            Firebase.setString(fbdo, "/system_status/baby_state", "ĐANG KHÓC!");

            struct tm timeinfo;
            String timeString = "Khong xac dinh";
            if (getLocalTime(&timeinfo)) {
                char timeBuf[64];
                strftime(timeBuf, sizeof(timeBuf), "%H:%M:%S - %d/%m/%Y", &timeinfo);
                timeString = String(timeBuf);
            }

            FirebaseJson json;
            json.set("nodeId", String("Thiết bị: ") + DEVICE_ID);
            json.set("confidence", String(crying_score * 100.0f, 1) + "%");
            json.set("detail", "Model: Edge Impulse (Baby-cry-detector)");
            json.set("time", timeString);
            Firebase.pushJSON(fbdo, "/crying_history", json);
        }
    } else {
        if (crying_score < CRY_EXIT_THRESHOLD) {
            isCryingState = false;
            Firebase.setString(fbdo, "/system_status/baby_state", "YÊN BÌNH");
        }
    }
}